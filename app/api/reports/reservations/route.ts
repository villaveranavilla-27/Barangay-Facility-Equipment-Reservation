import { NextResponse } from "next/server";
import { database as prisma } from "@/lib/database";
import { type ReservationWithRelations } from "@/lib/database-types";
import { requireRouteSession } from "@/lib/session";
import { fmtDate } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where =
    from && to
      ? { startDateTime: { gte: new Date(from), lte: new Date(to) } }
      : {};

  const reservations = (await prisma.reservation.findMany({
    where,
    include: { user: true, facility: true, equipment: true },
    orderBy: { reservationId: "desc" },
  })) as ReservationWithRelations[];

  const rows = reservations.map((reservation) => ({
    id: reservation.reservationId,
    name: reservation.user.name,
    item: reservation.facilityId
      ? reservation.facility?.itemName ?? ""
      : reservation.equipment?.itemName ?? "",
    status: reservation.status,
    date: fmtDate(reservation.startDateTime),
  }));

  const revenue = reservations
    .filter((reservation) => reservation.status === "APPROVED")
    .reduce(
      (sum, reservation) =>
        sum +
        (reservation.facilityId
          ? reservation.facility?.pricePerDay ?? 0
          : Number(reservation.equipment?.price ?? 0)),
      0
    );

  const topUsers = Object.values(
    reservations.reduce<Record<string, { name: string; count: number }>>((acc, reservation) => {
      acc[reservation.user.name] = acc[reservation.user.name] || {
        name: reservation.user.name,
        count: 0,
      };
      if (reservation.status === "APPROVED") {
        acc[reservation.user.name].count += 1;
      }
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    range: { from, to },
    rows,
    revenue,
    topUsers,
  });
}
