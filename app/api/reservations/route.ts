import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isActiveAdmin, isInactiveAdmin } from "@/lib/access";
import {
  handleApiRouteError,
  isRecord,
  jsonError,
  jsonMethodNotAllowed,
  readJsonBody,
} from "@/lib/api-route";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/schemas";
import { sendEmail } from "@/lib/mail";
import { buildAdminReservationRequestEmail } from "@/lib/reservation-emails";
import { serializeReservation } from "@/lib/reservations";

const reservationInclude = {
  user: {
    select: { userId: true, name: true, email: true, contactNumber: true },
  },
  facility: true,
  equipment: true,
  admin: { select: { adminId: true, name: true } },
} as const;

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

function isReservationDuplicateError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    if (isInactiveAdmin(session.user)) {
      return jsonError("Unauthorized", 401);
    }

    const where = isActiveAdmin(session.user) ? {} : { userId: Number(session.user.id) };

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { reservationId: "desc" },
      include: reservationInclude,
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "USER") {
      return jsonError("Unauthorized", 401);
    }

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
      reservation = await prisma.reservation.create({
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
    }

    let mailWarning: string | null = null;

    if (!duplicateSubmission) {
      const adminRecipients = await prisma.admin.findMany({
        where: { isActive: true },
        select: { email: true },
      });

      const seenEmails = new Set<string>();
      const uniqueAdminEmails = adminRecipients
        .map((admin) => admin.email.trim())
        .filter((email) => {
          if (!email) {
            return false;
          }

          const normalizedEmail = email.toLowerCase();
          if (seenEmails.has(normalizedEmail)) {
            return false;
          }

          seenEmails.add(normalizedEmail);
          return true;
        });

      if (uniqueAdminEmails.length > 0) {
        const message = buildAdminReservationRequestEmail(reservation);
        const results = await Promise.all(
          uniqueAdminEmails.map((email) =>
            sendEmail({
              to: email,
              subject: message.subject,
              html: message.html,
            })
          )
        );

        const failedResults = results.filter(
          (result): result is { ok: false; error: string } => !result.ok
        );

        if (failedResults.length > 0) {
          mailWarning = `Reservation submitted, but ${failedResults.length} admin email notification${
            failedResults.length === 1 ? "" : "s"
          } failed. Check the server logs and mail environment variables.`;

          console.error("[/api/reservations] POST", {
            warning: mailWarning,
            errors: failedResults.map((result) => result.error),
          });
        }
      }
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
