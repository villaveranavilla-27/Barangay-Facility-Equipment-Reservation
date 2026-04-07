import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    where: { status: "APPROVED" },
    include: { facility: true, equipment: true, user: { select: { userId: true, fullName: true, email: true, contactInfo: true } } },
    orderBy: { startDateTime: "asc" }
  });

  const events = reservations.map((r) => ({
    id: String(r.reservationId),
    title: `${r.itemType === "FACILITY" ? r.facility?.itemName : r.equipment?.itemName} • ${r.user.fullName}`,
    start: r.startDateTime,
    end: r.endDateTime,
    extendedProps: {
      status: r.status,
      purpose: r.purpose,
      expectedAttendees: r.expectedAttendees,
      residentName: r.user.fullName,
      itemType: r.itemType,
      itemName: r.itemType === "FACILITY" ? r.facility?.itemName : r.equipment?.itemName
    }
  }));

  return NextResponse.json(events);
}
