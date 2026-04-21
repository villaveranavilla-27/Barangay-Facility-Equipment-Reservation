import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/mail";
import { buildAdminReservationRequestEmail } from "@/lib/reservation-emails";
import { serializeReservation } from "@/lib/reservations";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "ADMIN" ? {} : { userId: Number(session.user.id) };

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

  const data = reservations.map((reservation) => serializeReservation(reservation));

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
      select: { equipmentId: true, quantity: true },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    if (
      equipment.quantity !== null &&
      data.equipmentQuantity &&
      data.equipmentQuantity > equipment.quantity
    ) {
      return NextResponse.json(
        { error: "Requested quantity exceeds the available quantity" },
        { status: 400 }
      );
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
      equipmentQuantity:
        data.itemType === "EQUIPMENT" ? data.equipmentQuantity ?? null : null,
      adminNotes: null,
    },
    include: {
      user: {
        select: { userId: true, name: true, email: true, contactNumber: true },
      },
      facility: true,
      equipment: true,
    },
  });

  const adminRecipients = await prisma.admin.findMany({
    select: { email: true },
  });

  const seenEmails = new Set<string>();
  const uniqueAdminEmails = adminRecipients
    .map((admin) => admin.email.trim())
    .filter((email) => {
      if (!email) {
        return false;
      }

      const normalizedEmail = email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        return false;
      }

      seenEmails.add(normalizedEmail);
      return true;
    });

  if (uniqueAdminEmails.length > 0) {
    const message = buildAdminReservationRequestEmail(reservation);
    await Promise.all(
      uniqueAdminEmails.map((email) => sendMail(message.subject, message.html, email))
    );
  }

  return NextResponse.json({
    ok: true,
    ...serializeReservation(reservation),
  });
}
