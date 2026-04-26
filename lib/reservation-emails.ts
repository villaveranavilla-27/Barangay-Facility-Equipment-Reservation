import { getAppUrl } from "@/lib/app-url";
import { fmtDateTime, money } from "@/lib/utils";
import {
  getReservationItemName,
  getReservationItemPrice,
  getReservationItemType,
} from "@/lib/reservations";

type ReservationEmailContext = {
  reservationId: number;
  facilityId: number | null;
  facility: { itemName: string; pricePerDay: number } | null;
  equipment: { itemName: string; price: unknown } | null;
  startDateTime: Date | string;
  endDateTime: Date | string;
  purpose: string;
  status?: string;
  expectedAttendees?: number | null;
  equipmentQuantity?: number | null;
  adminNotes?: string | null;
  user: {
    name: string;
    email: string;
    contactNumber: string;
  };
  admin?: {
    name: string | null;
  } | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sentenceCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function detailRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return `<tr>
    <td style="padding:8px 0;color:#55626d;font-weight:600;vertical-align:top;width:180px;">${escapeHtml(
      label
    )}</td>
    <td style="padding:8px 0;color:#16222b;">${escapeHtml(String(value))}</td>
  </tr>`;
}

function buildReservationDetails(reservation: ReservationEmailContext) {
  const itemType = getReservationItemType(reservation);
  const itemPrice = getReservationItemPrice(reservation);
  const priceLabel = itemType === "FACILITY" ? "Price per day" : "Unit price";

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
      ${detailRow("Reservation ID", reservation.reservationId)}
      ${detailRow("Status", reservation.status ? sentenceCase(reservation.status) : null)}
      ${detailRow("Resident name", reservation.user.name)}
      ${detailRow("Email", reservation.user.email)}
      ${detailRow("Contact number", reservation.user.contactNumber)}
      ${detailRow("Item type", sentenceCase(itemType))}
      ${detailRow("Item name", getReservationItemName(reservation))}
      ${detailRow("Schedule start", fmtDateTime(reservation.startDateTime))}
      ${detailRow("Schedule end", fmtDateTime(reservation.endDateTime))}
      ${detailRow("Purpose", reservation.purpose)}
      ${detailRow(
        "Expected attendees",
        itemType === "FACILITY" ? reservation.expectedAttendees ?? "N/A" : null
      )}
      ${detailRow(
        "Requested quantity",
        itemType === "EQUIPMENT" ? reservation.equipmentQuantity ?? "N/A" : null
      )}
      ${detailRow(priceLabel, money(itemPrice))}
      ${detailRow("Reviewed by", reservation.admin?.name ?? null)}
    </table>
  `;
}

function emailLayout({
  preheader,
  title,
  intro,
  reservation,
  highlight,
  actionLabel,
  actionUrl,
}: {
  preheader: string;
  title: string;
  intro: string;
  reservation: ReservationEmailContext;
  highlight?: string | null;
  actionLabel?: string;
  actionUrl?: string | null;
}) {
  return `<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;background:#f4f7f4;padding:24px;font-family:Arial,sans-serif;color:#16222b;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
        preheader
      )}</div>
      <div style="margin:0 auto;max-width:720px;">
        <div style="border-radius:20px;background:#ffffff;overflow:hidden;box-shadow:0 14px 36px rgba(15,23,42,0.08);">
          <div style="background:#165719;padding:28px 32px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">
              Barangay Facility and Equipment Management System
            </div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(
              title
            )}</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">${escapeHtml(
              intro
            )}</p>
            ${
              highlight
                ? `<div style="margin-bottom:24px;border-radius:16px;background:#fff6e8;padding:18px 20px;color:#7c4a03;font-size:15px;line-height:1.6;">
                    <strong style="display:block;margin-bottom:6px;color:#5f3904;">Important note</strong>
                    ${escapeHtml(highlight)}
                  </div>`
                : ""
            }
            <div style="border-radius:18px;background:#f8fbf8;padding:24px;">
              <h2 style="margin:0 0 18px;font-size:18px;color:#165719;">Reservation Details</h2>
              ${buildReservationDetails(reservation)}
            </div>
            ${
              actionLabel && actionUrl
                ? `<div style="margin-top:28px;">
                    <a href="${escapeHtml(
                      actionUrl
                    )}" style="display:inline-block;border-radius:999px;background:#165719;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;">
                      ${escapeHtml(actionLabel)}
                    </a>
                  </div>`
                : ""
            }
          </div>
        </div>
        <p style="margin:16px 8px 0;color:#5f6f78;font-size:13px;line-height:1.6;">
          This is an automated message. For questions about this reservation, please contact the barangay administration office.
        </p>
      </div>
    </body>
  </html>`;
}

export function buildAdminReservationRequestEmail(reservation: ReservationEmailContext) {
  return {
    subject: `New reservation request #${reservation.reservationId}`,
    html: emailLayout({
      preheader: "A new reservation request is waiting for admin review.",
      title: "New Reservation Request",
      intro: `${reservation.user.name} submitted a reservation request that is awaiting review. Please check the reservation details below and update the request status in the admin portal.`,
      reservation: { ...reservation, status: reservation.status ?? "PENDING" },
      actionLabel: "Review Reservation",
      actionUrl: getAppUrl("/admin/reservations"),
    }),
  };
}

export function buildUserReservationApprovedEmail(
  reservation: ReservationEmailContext
) {
  return {
    subject: `Reservation approved #${reservation.reservationId}`,
    html: emailLayout({
      preheader: "Your reservation request has been approved.",
      title: "Reservation Approved",
      intro: "Your reservation request has been approved. Please keep this email for your reference.",
      reservation: { ...reservation, status: reservation.status ?? "APPROVED" },
      actionLabel: "View My Reservations",
      actionUrl: getAppUrl("/user/reservations"),
    }),
  };
}

export function buildUserReservationDeniedEmail(
  reservation: ReservationEmailContext
) {
  return {
    subject: `Reservation denied #${reservation.reservationId}`,
    html: emailLayout({
      preheader: "Your reservation request has been denied.",
      title: "Reservation Denied",
      intro: "Your reservation request was reviewed and could not be approved at this time.",
      reservation: { ...reservation, status: reservation.status ?? "DENIED" },
      highlight: reservation.adminNotes ?? "Please contact the barangay administration office for more information.",
      actionLabel: "Review Reservation Status",
      actionUrl: getAppUrl("/user/reservations"),
    }),
  };
}
