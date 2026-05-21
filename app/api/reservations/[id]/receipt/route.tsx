import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import {
  handleApiRouteError,
  jsonError,
  jsonMethodNotAllowed,
  parseRouteParamId,
} from "@/lib/api-route";
import { database as prisma } from "@/lib/database";
import { ReservationReceiptDoc } from "@/components/pdf/reservation-receipt";
import { requireRouteSession } from "@/lib/session";
import { fmtDateTime } from "@/lib/utils";
import {
  getReservationItemName,
  getReservationItemPrice,
  getReservationItemType,
} from "@/lib/reservations";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRouteSession(_request);
    if (!auth.ok) {
      return auth.response;
    }
    const session = auth.session;

    const reservationId = parseRouteParamId(params.id, "reservation id");

    const reservation = await prisma.reservation.findFirst({
      where:
        session.user.role === "ADMIN"
          ? { reservationId }
          : {
              reservationId,
              userId: Number(session.user.id),
            },
      include: {
        user: { select: { userId: true, name: true, email: true, contactNumber: true } },
        facility: true,
        equipment: true,
      },
    });

    if (!reservation) {
      return jsonError("Not found", 404);
    }

    const itemType = getReservationItemType(reservation);

    const doc = (
      <ReservationReceiptDoc
        reservation={{
          reservationId: reservation.reservationId,
          name: reservation.user.name,
          email: reservation.user.email,
          contactNumber: reservation.user.contactNumber,
          itemName: getReservationItemName(reservation),
          itemType,
          startDateTime: fmtDateTime(reservation.startDateTime),
          endDateTime: fmtDateTime(reservation.endDateTime),
          purpose: reservation.purpose,
          status: reservation.status,
          itemPrice: getReservationItemPrice(reservation),
          expectedAttendees: reservation.expectedAttendees,
          equipmentQuantity: reservation.equipmentQuantity,
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
  } catch (error) {
    return handleApiRouteError(
      error,
      `[/api/reservations/${params.id}/receipt] GET`,
      "Failed to generate receipt."
    );
  }
}

export const POST = () => jsonMethodNotAllowed(["GET"]);
export const PATCH = () => jsonMethodNotAllowed(["GET"]);
export const PUT = () => jsonMethodNotAllowed(["GET"]);
export const DELETE = () => jsonMethodNotAllowed(["GET"]);
