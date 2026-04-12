import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/schemas";
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
    include: {
      user: {
        select: { userId: true, name: true, email: true, contactNumber: true },
      },
      facility: true,
      equipment: true,
      admin: { select: { adminId: true, name: true } },
    },
  });

  const data = reservations.map((reservation) => ({
    ...reservation,
    itemType: getItemType(reservation),
    itemName: getItemName(reservation),
    itemPrice: getItemPrice(reservation),
    itemQuantity: reservation.equipment?.quantity ?? null,
    residentName: reservation.user.name,
    adminName: reservation.admin?.name ?? null,
  }));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reservationSchema.safeParse({
    ...body,
    userId: Number(session.user.id),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.itemType === "FACILITY") {
    const facility = await prisma.facility.findUnique({
      where: { facilityId: Number(data.facilityId) },
      select: { facilityId: true, status: true },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    if (facility.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Facility is not available for reservation" },
        { status: 400 }
      );
    }
  }

  if (data.itemType === "EQUIPMENT") {
    const equipment = await prisma.equipment.findUnique({
      where: { equipmentId: Number(data.equipmentId) },
      select: { equipmentId: true },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId: Number(session.user.id),
      facilityId: data.itemType === "FACILITY" ? Number(data.facilityId) : null,
      equipmentId: data.itemType === "EQUIPMENT" ? Number(data.equipmentId) : null,
      adminId: null,
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      purpose: data.purpose,
      expectedAttendees: data.expectedAttendees ?? null,
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
    "New reservation request",
    `<p>New reservation received from <strong>${reservation.user.name}</strong>.</p>
     <p>Item: ${itemName}</p>
     <p>Schedule: ${fmtDateTime(reservation.startDateTime)} - ${fmtDateTime(reservation.endDateTime)}</p>
     <p>Purpose: ${reservation.purpose}</p>`
  );

  return NextResponse.json({
    ok: true,
    reservationId: reservation.reservationId,
    residentName: reservation.user.name,
  });
}
