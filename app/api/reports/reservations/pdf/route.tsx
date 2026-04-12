import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ReservationsSummaryDoc } from "@/components/pdf/reservations-summary";
import { fmtDate } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where =
    from && to
      ? { startDateTime: { gte: new Date(from), lte: new Date(to) } }
      : {};

  const reservations = await prisma.reservation.findMany({
    where,
    include: { user: true, facility: true, equipment: true },
    orderBy: { reservationId: "desc" },
  });

  const rows = reservations.map((reservation) => ({
    id: reservation.reservationId,
    name: reservation.user.name,
    item: reservation.facilityId
      ? reservation.facility?.itemName ?? ""
      : reservation.equipment?.itemName ?? "",
    status: reservation.status,
    date: fmtDate(reservation.startDateTime),
  }));

  const doc = (
    <ReservationsSummaryDoc
      title={`Reservations Summary${from && to ? ` (${from} to ${to})` : ""}`}
      rows={rows}
    />
  );

  const buffer = await pdf(doc).toBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="reservations-summary.pdf"',
    },
  });
}
