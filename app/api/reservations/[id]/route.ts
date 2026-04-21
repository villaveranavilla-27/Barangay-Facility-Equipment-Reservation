import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { EquipmentReturnStatus, ReservationStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationAdminActionSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/mail";
import {
  buildUserReservationApprovedEmail,
  buildUserReservationDeniedEmail,
} from "@/lib/reservation-emails";
import { getEquipmentReturnStatus, serializeReservation } from "@/lib/reservations";

const reservationInclude = {
  user: {
    select: { userId: true, name: true, email: true, contactNumber: true },
  },
  facility: true,
  equipment: true,
  admin: { select: { adminId: true, name: true } },
} as const;

type ReservationReader = Pick<typeof prisma, "reservation">;

class ReservationActionError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ReservationActionError";
  }
}

async function getReservationById(
  tx: ReservationReader,
  reservationId: number
) {
  return tx.reservation.findUnique({
    where: { reservationId },
    include: reservationInclude,
  });
}

function getPendingActionErrorMessage(status: ReservationStatus) {
  return status === ReservationStatus.PENDING
    ? "This reservation is no longer pending."
    : `This reservation is already ${status.toLowerCase()}.`;
}

function getReturnActionErrorMessage(
  reservation:
    | Awaited<ReturnType<typeof getReservationById>>
    | null
) {
  if (!reservation) {
    return "Reservation not found";
  }

  if (!reservation.equipmentId) {
    return "Only equipment reservations can be returned";
  }

  const currentReturnStatus = getEquipmentReturnStatus(reservation);

  if (currentReturnStatus === "RETURNED") {
    return "This equipment reservation is already marked as returned";
  }

  if (currentReturnStatus !== "BORROWED") {
    return "Only borrowed equipment can be returned";
  }

  return "This reservation is no longer in a returnable state.";
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservation = await prisma.reservation.findFirst({
    where:
      session.user.role === "ADMIN"
        ? { reservationId: Number(params.id) }
        : {
            reservationId: Number(params.id),
            userId: Number(session.user.id),
          },
    include: reservationInclude,
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeReservation(reservation));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reservationAdminActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const reservationId = Number(params.id);
  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    return NextResponse.json({ error: "Invalid reservation id" }, { status: 400 });
  }

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const existing = await getReservationById(tx, reservationId);

      if (!existing) {
        throw new ReservationActionError(404, "Reservation not found");
      }

      if (parsed.data.status === "RETURNED") {
        if (!existing.equipmentId) {
          throw new ReservationActionError(400, "Only equipment reservations can be returned");
        }

        const currentReturnStatus = getEquipmentReturnStatus(existing);
        if (currentReturnStatus === "RETURNED") {
          throw new ReservationActionError(
            400,
            "This equipment reservation is already marked as returned"
          );
        }

        if (currentReturnStatus !== "BORROWED") {
          throw new ReservationActionError(400, "Only borrowed equipment can be returned");
        }

        if (!existing.equipmentQuantity) {
          throw new ReservationActionError(400, "The requested quantity is missing");
        }

        const equipment = await tx.equipment.findUnique({
          where: { equipmentId: existing.equipmentId },
          select: { equipmentId: true, quantity: true },
        });

        if (!equipment) {
          throw new ReservationActionError(404, "Equipment not found");
        }

        const updatedReservation = await tx.reservation.updateMany({
          where: {
            reservationId,
            equipmentId: { not: null },
            returnedAt: null,
            OR: [
              { returnStatus: EquipmentReturnStatus.BORROWED },
              { returnStatus: null, status: ReservationStatus.APPROVED },
            ],
          },
          data: {
            adminId: Number(session.user.id),
            returnStatus: EquipmentReturnStatus.RETURNED,
            returnedAt: new Date(),
          },
        });

        if (updatedReservation.count === 0) {
          const latest = await getReservationById(tx, reservationId);
          throw new ReservationActionError(400, getReturnActionErrorMessage(latest));
        }

        if (equipment.quantity !== null) {
          await tx.equipment.update({
            where: { equipmentId: existing.equipmentId },
            data: {
              quantity: {
                increment: existing.equipmentQuantity,
              },
            },
          });
        }

        const updated = await getReservationById(tx, reservationId);
        if (!updated) {
          throw new ReservationActionError(404, "Reservation not found");
        }

        return updated;
      }

      if (existing.status !== ReservationStatus.PENDING) {
        throw new ReservationActionError(
          400,
          getPendingActionErrorMessage(existing.status)
        );
      }

      if (parsed.data.status === ReservationStatus.APPROVED && existing.equipmentId) {
        if (!existing.equipmentQuantity) {
          throw new ReservationActionError(400, "The requested quantity is missing");
        }

        const equipment = await tx.equipment.findUnique({
          where: { equipmentId: existing.equipmentId },
          select: { equipmentId: true, quantity: true },
        });

        if (!equipment) {
          throw new ReservationActionError(404, "Equipment not found");
        }

        if (equipment.quantity !== null) {
          const updatedEquipment = await tx.equipment.updateMany({
            where: {
              equipmentId: existing.equipmentId,
              quantity: { gte: existing.equipmentQuantity },
            },
            data: {
              quantity: {
                decrement: existing.equipmentQuantity,
              },
            },
          });

          if (updatedEquipment.count === 0) {
            throw new ReservationActionError(
              400,
              "Requested quantity exceeds the available quantity"
            );
          }
        }
      }

      const updatedReservation = await tx.reservation.updateMany({
        where: { reservationId, status: ReservationStatus.PENDING },
        data: {
          adminId: Number(session.user.id),
          status: parsed.data.status,
          approvedAt: parsed.data.status === ReservationStatus.APPROVED ? new Date() : null,
          adminNotes:
            parsed.data.status === ReservationStatus.DENIED
              ? parsed.data.adminNotes?.trim() ?? null
              : null,
          returnStatus:
            parsed.data.status === ReservationStatus.APPROVED && existing.equipmentId
              ? EquipmentReturnStatus.BORROWED
              : null,
          returnedAt: null,
        },
      });

      if (updatedReservation.count === 0) {
        const latest = await getReservationById(tx, reservationId);
        throw new ReservationActionError(
          400,
          latest
            ? getPendingActionErrorMessage(latest.status)
            : "Reservation not found"
        );
      }

      const updated = await getReservationById(tx, reservationId);
      if (!updated) {
        throw new ReservationActionError(404, "Reservation not found");
      }

      return updated;
    });

    if (parsed.data.status !== "RETURNED") {
      const message =
        parsed.data.status === ReservationStatus.APPROVED
          ? buildUserReservationApprovedEmail(reservation)
          : buildUserReservationDeniedEmail(reservation);

      await sendMail(message.subject, message.html, reservation.user.email);
    }

    return NextResponse.json(serializeReservation(reservation));
  } catch (error) {
    if (error instanceof ReservationActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
