import { NextResponse } from "next/server";
import {
  ApiRouteError,
  handleApiRouteError,
  jsonError,
  jsonMethodNotAllowed,
  parseRouteParamId,
} from "@/lib/api-route";
import { database as prisma } from "@/lib/database";
import {
  EquipmentReturnStatus,
  ReservationStatus,
} from "@/lib/database-types";
import {
  getReservationCancellationErrorMessage,
  serializeReservation,
} from "@/lib/reservations";
import { requireRouteSession } from "@/lib/session";

const reservationInclude = {
  user: {
    select: { userId: true, name: true, email: true, contactNumber: true },
  },
  facility: true,
  equipment: true,
  admin: { select: { adminId: true, name: true } },
} as const;

type ReservationReader = Pick<typeof prisma, "reservation">;

class ReservationCancellationError extends ApiRouteError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "ReservationCancellationError";
  }
}

async function getReservationById(
  tx: ReservationReader,
  reservationId: number,
  userId: number
) {
  return tx.reservation.findFirst({
    where: { reservationId, userId },
    include: reservationInclude,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRouteSession(_request, "USER");
    if (!auth.ok) {
      return auth.response;
    }
    const session = auth.session;

    if (session.user.role !== "USER") {
      return jsonError("Only residents can cancel reservations", 403);
    }

    const reservationId = parseRouteParamId(params.id, "reservation id");
    const userId = Number(session.user.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await getReservationById(tx, reservationId, userId);

      if (!existing) {
        throw new ReservationCancellationError(404, "Reservation not found");
      }

      if (existing.status === ReservationStatus.CANCELLED) {
        return {
          reservation: existing,
          alreadyCancelled: true,
          message: "This reservation was already cancelled.",
        };
      }

      const cancellationError = getReservationCancellationErrorMessage(existing, now);
      if (cancellationError) {
        throw new ReservationCancellationError(400, cancellationError);
      }

      const updatedReservation = await tx.reservation.updateMany({
        where: {
          reservationId,
          userId,
          status: ReservationStatus.PENDING,
          startDateTime: { gt: now },
          endDateTime: { gt: now },
          returnedAt: null,
          NOT: {
            returnStatus: EquipmentReturnStatus.RETURNED,
          },
        },
        data: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: now,
          returnStatus: null,
          returnedAt: null,
        },
      });

      if (updatedReservation.count === 0) {
        const latest = await getReservationById(tx, reservationId, userId);

        if (!latest) {
          throw new ReservationCancellationError(404, "Reservation not found");
        }

        if (latest.status === ReservationStatus.CANCELLED) {
          return {
            reservation: latest,
            alreadyCancelled: true,
            message: "This reservation was already cancelled.",
          };
        }

        throw new ReservationCancellationError(
          400,
          getReservationCancellationErrorMessage(latest, now) ??
            "This reservation can no longer be cancelled."
        );
      }

      const updated = await getReservationById(tx, reservationId, userId);
      if (!updated) {
        throw new ReservationCancellationError(404, "Reservation not found");
      }

      return {
        reservation: updated,
        alreadyCancelled: false,
        message: "Reservation cancelled successfully.",
      };
    });

    return NextResponse.json({
      ok: true,
      alreadyCancelled: result.alreadyCancelled,
      message: result.message,
      ...serializeReservation(result.reservation),
    });
  } catch (error) {
    return handleApiRouteError(
      error,
      `[/api/reservations/${params.id}/cancel] POST`,
      "Failed to cancel reservation."
    );
  }
}

export const GET = () => jsonMethodNotAllowed(["POST"]);
export const PATCH = () => jsonMethodNotAllowed(["POST"]);
export const PUT = () => jsonMethodNotAllowed(["POST"]);
export const DELETE = () => jsonMethodNotAllowed(["POST"]);
