import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    where: { status: "APPROVED" },
    include: {
      facility: true,
      equipment: true,
      user: { select: { userId: true, name: true, email: true, contactNumber: true } },
    },
    orderBy: { startDateTime: "asc" },
  });

  const events = reservations.map((reservation) => {
    const itemType = reservation.facilityId ? "FACILITY" : "EQUIPMENT";
    const itemName = reservation.facilityId
      ? reservation.facility?.itemName
      : reservation.equipment?.itemName;

    return {
      id: String(reservation.reservationId),
      title: `${itemName} - ${reservation.user.name}`,
      start: reservation.startDateTime,
      end: reservation.endDateTime,
      extendedProps: {
        status: reservation.status,
        purpose: reservation.purpose,
        expectedAttendees: reservation.expectedAttendees,
        residentName: reservation.user.name,
        itemType,
        itemName,
      },
    };
  });

  return NextResponse.json(events);
}
