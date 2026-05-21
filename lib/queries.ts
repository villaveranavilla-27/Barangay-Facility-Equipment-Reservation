import { database as prisma } from "@/lib/database";
import {
  type ReservationWithRelations,
  ReservationStatus,
} from "@/lib/database-types";

export async function getReservationDetails(id: number) {
  const reservation = await prisma.reservation.findUnique({
    where: { reservationId: id },
    include: { user: true, facility: true, equipment: true },
  });

  if (!reservation) {
    return null;
  }

  const itemName = reservation.facilityId
    ? reservation.facility?.itemName
    : reservation.equipment?.itemName;
  const price = reservation.facilityId
    ? reservation.facility?.pricePerDay ?? 0
    : Number(reservation.equipment?.price ?? 0);

  return { reservation, itemName, price };
}

export async function listEnrichedReservations(where?: Record<string, unknown>) {
  const reservations = (await prisma.reservation.findMany({
    where,
    orderBy: { reservationId: "desc" },
    include: { user: true, facility: true, equipment: true },
  })) as ReservationWithRelations[];

  return reservations.map((reservation) => ({
    ...reservation,
    itemType: reservation.facilityId ? "FACILITY" : "EQUIPMENT",
    itemName: reservation.facilityId
      ? reservation.facility?.itemName ?? ""
      : reservation.equipment?.itemName ?? "",
    residentName: reservation.user.name,
  }));
}

export function statusTone(status: string) {
  if (status === "APPROVED") return "green";
  if (status === "PENDING") return "yellow";
  if (status === "DENIED" || status === "CANCELLED") return "red";
  return "neutral";
}
