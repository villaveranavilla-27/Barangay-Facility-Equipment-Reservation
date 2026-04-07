import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/mail";
import { fmtDateTime } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  const where =
    session?.user?.role === "ADMIN" || scope === "all"
      ? {}
      : { userId: Number(session?.user?.id || 0) };

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { reservationId: "desc" },
    include: { user: { select: { userId: true, fullName: true, email: true, contactInfo: true } }, facility: true, equipment: true }
  });

  const data = reservations.map((r) => ({
    ...r,
    itemName: r.itemType === "FACILITY" ? r.facility?.itemName ?? "" : r.equipment?.itemName ?? "",
    residentName: r.user.fullName
  }));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = reservationSchema.safeParse({
    ...body,
    userId: Number(session.user.id)
  });

  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const reservation = await prisma.reservation.create({
    data: {
      userId: Number(session.user.id),
      itemType: data.itemType,
      facilityId: data.facilityId ? Number(data.facilityId) : null,
      equipmentId: data.equipmentId ? Number(data.equipmentId) : null,
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      purpose: data.purpose,
      expectedAttendees: data.expectedAttendees ?? null
    },
    include: { user: { select: { userId: true, fullName: true, email: true, contactInfo: true } }, facility: true, equipment: true }
  });

  const itemName = reservation.itemType === "FACILITY" ? reservation.facility?.itemName : reservation.equipment?.itemName;
  await sendMail(
    "New reservation request",
    `<p>New reservation received from <strong>${reservation.user.fullName}</strong>.</p>
     <p>Item: ${itemName}</p>
     <p>Schedule: ${fmtDateTime(reservation.startDateTime)} - ${fmtDateTime(reservation.endDateTime)}</p>
     <p>Purpose: ${reservation.purpose}</p>`
  );

  return NextResponse.json({ ok: true, reservationId: reservation.reservationId, residentName: reservation.user.fullName });
}
