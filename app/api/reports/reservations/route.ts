import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = from && to
    ? { startDateTime: { gte: new Date(from), lte: new Date(to) } }
    : {};

  const reservations = await prisma.reservation.findMany({
    where,
    include: { user: true, facility: true, equipment: true },
    orderBy: { reservationId: "desc" }
  });

  const rows = reservations.map((r) => ({
    id: r.reservationId,
    name: r.user.fullName,
    item: r.itemType === "FACILITY" ? r.facility?.itemName ?? "" : r.equipment?.itemName ?? "",
    status: r.status,
    date: fmtDate(r.startDateTime)
  }));

  const revenue = reservations
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + (r.itemType === "FACILITY" ? r.facility?.pricePerDay ?? 0 : r.equipment?.price ?? 0), 0);

  const topUsers = Object.values(
    reservations.reduce<Record<string, { name: string; count: number }>>((acc, r) => {
      acc[r.user.fullName] = acc[r.user.fullName] || { name: r.user.fullName, count: 0 };
      if (r.status === "APPROVED") acc[r.user.fullName].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    range: { from, to },
    rows,
    revenue,
    topUsers
  });
}
