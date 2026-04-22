import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeAllReservations =
    searchParams.get("scope") === "all" && session.user.role === "ADMIN";

  const reservations = await prisma.reservation.findMany({
    where: includeAllReservations
      ? { status: { in: [ReservationStatus.APPROVED, ReservationStatus.PENDING] } }
      : { status: ReservationStatus.APPROVED },
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
