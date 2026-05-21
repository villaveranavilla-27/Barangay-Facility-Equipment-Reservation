import { NextResponse } from "next/server";
import {
  handleApiRouteError,
  isRecord,
  jsonError,
  jsonMethodNotAllowed,
  readJsonBody,
} from "@/lib/api-route";
import { schedulePendingReservationAdminNotification } from "@/lib/admin-booking-notifications";
import { database as prisma } from "@/lib/database";
import {
  DatabaseClientKnownRequestError,
  type ReservationWithRelations,
} from "@/lib/database-types";
import { reservationSchema } from "@/lib/schemas";
import { serializeReservation } from "@/lib/reservations";
import { requireRouteSession } from "@/lib/session";

const reservationInclude = {
  user: {
    select: { userId: true, name: true, email: true, contactNumber: true },
  },
  facility: true,
  equipment: true,
  admin: { select: { adminId: true, name: true } },
} as const;

function isReservationDuplicateError(error: unknown) {
  return error instanceof DatabaseClientKnownRequestError && error.code === "P2002";
}

export async function GET(_request: Request) {
  try {
    const auth = await requireRouteSession(_request);
    if (!auth.ok) {
      return auth.response;
    }

    const session = auth.session;

    const where = session.user.role === "ADMIN" ? {} : { userId: Number(session.user.id) };

    const reservations = (await prisma.reservation.findMany({
      where,
      orderBy: { reservationId: "desc" },
      include: reservationInclude,
    })) as ReservationWithRelations[];

    const data = reservations.map((reservation) => serializeReservation(reservation));

    return NextResponse.json(data);
  } catch (error) {
    return handleApiRouteError(
      error,
      "[/api/reservations] GET",
      "Failed to fetch reservations."
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRouteSession(request, "USER");
    if (!auth.ok) {
      return auth.response;
    }
    const session = auth.session;

    const body = await readJsonBody<unknown>(request);
    if (!isRecord(body)) {
      return jsonError("Invalid data", 400);
    }

    const parsed = reservationSchema.safeParse({
      ...body,
      userId: Number(session.user.id),
    });

    if (!parsed.success) {
      return jsonError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const startDateTime = new Date(data.startDateTime);
    const endDateTime = new Date(data.endDateTime);
    const requestedItemId =
      data.itemType === "FACILITY" ? Number(data.facilityId) : Number(data.equipmentId);

    console.info("[/api/reservations] POST received", {
      userId: Number(session.user.id),
      itemType: data.itemType,
      requestedItemId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    });

    const reservationLookup = {
      userId: Number(session.user.id),
      facilityId: data.itemType === "FACILITY" ? Number(data.facilityId) : null,
      equipmentId: data.itemType === "EQUIPMENT" ? Number(data.equipmentId) : null,
      startDateTime,
      endDateTime,
    };

    if (data.itemType === "FACILITY") {
      const facility = await prisma.facility.findUnique({
        where: { facilityId: Number(data.facilityId) },
        select: { facilityId: true, status: true },
      });

      if (!facility) {
        return jsonError("Facility not found", 404);
      }

      if (facility.status !== "AVAILABLE") {
        return jsonError("Facility is not available for reservation", 400);
      }
    }

    if (data.itemType === "EQUIPMENT") {
      const equipment = await prisma.equipment.findUnique({
        where: { equipmentId: Number(data.equipmentId) },
        select: { equipmentId: true, quantity: true },
      });

      if (!equipment) {
        return jsonError("Equipment not found", 404);
      }

      if (
        equipment.quantity !== null &&
        data.equipmentQuantity &&
        data.equipmentQuantity > equipment.quantity
      ) {
        return jsonError("Requested quantity exceeds the available quantity", 400);
      }
    }

    let reservation: ReservationWithRelations | null = null;
    let duplicateSubmission = false;

    try {
      const createdReservation = (await prisma.reservation.create({
        data: {
          userId: Number(session.user.id),
          facilityId: data.itemType === "FACILITY" ? Number(data.facilityId) : null,
          equipmentId: data.itemType === "EQUIPMENT" ? Number(data.equipmentId) : null,
          adminId: null,
          startDateTime,
          endDateTime,
          purpose: data.purpose,
          expectedAttendees: data.expectedAttendees ?? null,
          equipmentQuantity:
            data.itemType === "EQUIPMENT" ? data.equipmentQuantity ?? null : null,
          adminNotes: null,
        },
        include: reservationInclude,
      })) as ReservationWithRelations;

      reservation = createdReservation;

      console.info("[/api/reservations] reservation created successfully", {
        reservationId: createdReservation.reservationId,
        userId: createdReservation.user.userId,
        userEmail: createdReservation.user.email,
        itemType: data.itemType,
      });
    } catch (error) {
      if (!isReservationDuplicateError(error)) {
        throw error;
      }

      duplicateSubmission = true;
      reservation = await prisma.reservation.findFirst({
        where: reservationLookup,
        include: reservationInclude,
        orderBy: { reservationId: "asc" },
      });

      if (!reservation) {
        return NextResponse.json(
          {
            ok: true,
            duplicate: true,
            message: "This reservation was already submitted.",
          },
          { status: 200 }
        );
      }

      console.info("[/api/reservations] duplicate reservation detected", {
        userId: Number(session.user.id),
        reservationId: reservation.reservationId,
      });
    }

    if (!reservation) {
      return jsonError("Failed to load reservation after submission.", 500);
    }

    const mailWarning: string | null = null;

    if (!duplicateSubmission && reservation.status === "PENDING") {
      schedulePendingReservationAdminNotification(reservation);
    }

    return NextResponse.json({
      ok: true,
      duplicate: duplicateSubmission,
      message: duplicateSubmission
        ? "This reservation was already submitted."
        : "Reservation submitted.",
      mailWarning,
      ...serializeReservation(reservation),
    });
  } catch (error) {
    return handleApiRouteError(
      error,
      "[/api/reservations] POST",
      "Failed to submit reservation."
    );
  }
}

export const PATCH = () => jsonMethodNotAllowed(["GET", "POST"]);
export const PUT = () => jsonMethodNotAllowed(["GET", "POST"]);
export const DELETE = () => jsonMethodNotAllowed(["GET", "POST"]);
