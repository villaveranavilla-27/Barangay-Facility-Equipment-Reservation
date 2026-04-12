import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationDecisionSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/mail";
import { fmtDateTime } from "@/lib/utils";

function getItemType(reservation: { facilityId: number | null }) {
  return reservation.facilityId ? "FACILITY" : "EQUIPMENT";
}

function getItemName(reservation: {
  facilityId: number | null;
  facility: { itemName: string } | null;
  equipment: { itemName: string } | null;
}) {
  return reservation.facilityId
    ? reservation.facility?.itemName ?? ""
    : reservation.equipment?.itemName ?? "";
}

function getItemPrice(reservation: {
  facilityId: number | null;
  facility: { pricePerDay: number } | null;
  equipment: { price: unknown } | null;
}) {
  return reservation.facilityId
    ? reservation.facility?.pricePerDay ?? 0
    : Number(reservation.equipment?.price ?? 0);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const reservation = await prisma.reservation.findUnique({
    where: { reservationId: Number(params.id) },
    include: {
      user: {
        select: { userId: true, name: true, email: true, contactNumber: true },
      },
      facility: true,
      equipment: true,
      admin: { select: { adminId: true, name: true } },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...reservation,
    itemType: getItemType(reservation),
    itemName: getItemName(reservation),
    itemPrice: getItemPrice(reservation),
    itemQuantity: reservation.equipment?.quantity ?? null,
    residentName: reservation.user.name,
    adminName: reservation.admin?.name ?? null,
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reservationDecisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const reservation = await prisma.reservation.update({
    where: { reservationId: Number(params.id) },
    data: {
      adminId: Number(session.user.id),
      status: parsed.data.status,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
    },
    include: {
      user: {
        select: { userId: true, name: true, email: true, contactNumber: true },
      },
      facility: true,
      equipment: true,
    },
  });

  const itemName = getItemName(reservation);

  await sendMail(
    `Reservation ${parsed.data.status.toLowerCase()}`,
    `<p>Your reservation has been <strong>${parsed.data.status.toLowerCase()}</strong>.</p>
     <p>Reservation ID: ${reservation.reservationId}</p>
     <p>Item: ${itemName}</p>
     <p>Schedule: ${fmtDateTime(reservation.startDateTime)} - ${fmtDateTime(reservation.endDateTime)}</p>
     ${parsed.data.adminNotes ? `<p>Admin notes: ${parsed.data.adminNotes}</p>` : ""}`,
    reservation.user.email
  );

  return NextResponse.json({
    ...reservation,
    itemType: getItemType(reservation),
    itemName,
    itemPrice: getItemPrice(reservation),
    itemQuantity: reservation.equipment?.quantity ?? null,
    residentName: reservation.user.name,
  });
}
