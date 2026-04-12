import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ReservationReceiptDoc } from "@/components/pdf/reservation-receipt";
import { fmtDateTime } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const reservation = await prisma.reservation.findUnique({
    where: { reservationId: Number(params.id) },
    include: {
      user: { select: { userId: true, name: true, email: true, contactNumber: true } },
      facility: true,
      equipment: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = (
    <ReservationReceiptDoc
      reservation={{
        reservationId: reservation.reservationId,
        name: reservation.user.name,
        email: reservation.user.email,
        itemName: reservation.facilityId
          ? reservation.facility?.itemName ?? ""
          : reservation.equipment?.itemName ?? "",
        itemType: reservation.facilityId ? "FACILITY" : "EQUIPMENT",
        startDateTime: fmtDateTime(reservation.startDateTime),
        endDateTime: fmtDateTime(reservation.endDateTime),
        purpose: reservation.purpose,
        status: reservation.status,
        approvedAt: reservation.approvedAt ? fmtDateTime(reservation.approvedAt) : null,
      }}
    />
  );

  const buffer = await pdf(doc).toBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reservation-${reservation.reservationId}.pdf"`,
    },
  });
}
