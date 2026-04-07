import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

export async function getReservationDetails(id: number) {
  const reservation = await prisma.reservation.findUnique({
    where: { reservationId: id },
    include: { user: true, facility: true, equipment: true }
  });
  if (!reservation) return null;
  const itemName = reservation.itemType === "FACILITY" ? reservation.facility?.itemName : reservation.equipment?.itemName;
  const price =
    reservation.itemType === "FACILITY"
      ? reservation.facility?.pricePerDay ?? 0
      : reservation.equipment?.price ?? 0;
  return { reservation, itemName, price };
}

export async function listEnrichedReservations(where?: Parameters<typeof prisma.reservation.findMany>[0]["where"]) {
  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { reservationId: "desc" },
    include: { user: true, facility: true, equipment: true }
  });

  return reservations.map((r) => ({
    ...r,
    itemName: r.itemType === "FACILITY" ? r.facility?.itemName ?? "" : r.equipment?.itemName ?? "",
    residentName: r.user.fullName
  }));
}

export function statusTone(status: ReservationStatus | string) {
  if (status === "APPROVED") return "green";
  if (status === "PENDING") return "yellow";
  if (status === "DENIED" || status === "CANCELLED") return "red";
  return "neutral";
}
