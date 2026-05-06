import { getAppUrl } from "@/lib/app-url";
import { fmtDate, fmtDateTime, money } from "@/lib/utils";
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

type EmailVariant = "admin" | "approved" | "denied";

const EMAIL_THEME: Record<
  EmailVariant,
  {
    headerBg: string;
    accent: string;
    detailsBg: string;
    highlightBg: string;
    highlightText: string;
    highlightTitle: string;
  }
> = {
  admin: {
    headerBg: "#1f3a5f",
    accent: "#1f3a5f",
    detailsBg: "#f4f7fb",
    highlightBg: "#edf4ff",
    highlightText: "#17304e",
    highlightTitle: "Admin notification",
  },
  approved: {
    headerBg: "#165719",
    accent: "#165719",
    detailsBg: "#f8fbf8",
    highlightBg: "#ecf9ee",
    highlightText: "#114416",
    highlightTitle: "Confirmation",
  },
  denied: {
    headerBg: "#8f1d1d",
    accent: "#8f1d1d",
    detailsBg: "#fff7f7",
    highlightBg: "#feecec",
    highlightText: "#7a1919",
    highlightTitle: "Reservation alert",
  },
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
  variant,
  preheader,
  title,
  intro,
  reservation,
  highlight,
  highlightTitle,
  actionLabel,
  actionUrl,
}: {
  variant: EmailVariant;
  preheader: string;
  title: string;
  intro: string;
  reservation: ReservationEmailContext;
  highlight?: string | null;
  highlightTitle?: string;
  actionLabel?: string;
  actionUrl?: string | null;
}) {
  const theme = EMAIL_THEME[variant];

  return `<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;background:#f4f7f4;padding:24px;font-family:Arial,sans-serif;color:#16222b;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
        preheader
      )}</div>
      <div style="margin:0 auto;max-width:720px;">
        <div style="border-radius:20px;background:#ffffff;overflow:hidden;box-shadow:0 14px 36px rgba(15,23,42,0.08);">
          <div style="background:${theme.headerBg};padding:28px 32px;color:#ffffff;">
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
                ? `<div style="margin-bottom:24px;border-left:4px solid ${theme.accent};border-radius:16px;background:${theme.highlightBg};padding:18px 20px;color:${theme.highlightText};font-size:15px;line-height:1.6;">
                    <strong style="display:block;margin-bottom:6px;color:${theme.highlightText};">${escapeHtml(
                      highlightTitle ?? theme.highlightTitle
                    )}</strong>
                    ${escapeHtml(highlight)}
                  </div>`
                : ""
            }
            <div style="border-radius:18px;background:${theme.detailsBg};padding:24px;">
              <h2 style="margin:0 0 18px;font-size:18px;color:${theme.accent};">Reservation Details</h2>
              ${buildReservationDetails(reservation)}
            </div>
            ${
              actionLabel && actionUrl
                ? `<div style="margin-top:28px;">
                    <a href="${escapeHtml(
                      actionUrl
                    )}" style="display:inline-block;border-radius:999px;background:${theme.accent};padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;">
                      ${escapeHtml(actionLabel)}
                    </a>
                  </div>`
                : ""
            }
          </div>
        </div>
        <p style="margin:16px 8px 0;color:#5f6f78;font-size:13px;line-height:1.6;">
          You can reply directly to this email to continue the conversation about this reservation.
        </p>
      </div>
    </body>
  </html>`;
}

export function buildAdminReservationRequestEmail(reservation: ReservationEmailContext) {
  const itemName = getReservationItemName(reservation);
  const reservationDate = fmtDate(reservation.startDateTime);

  return {
    subject: `New Reservation Request \u2013 ${itemName} on ${reservationDate}`,
    html: emailLayout({
      variant: "admin",
      preheader: "A new reservation request is waiting for admin review.",
      title: "New Reservation Request",
      intro: `${reservation.user.name} (${reservation.user.email}) submitted a pending reservation request for ${itemName}. Please review the details below and update the request in the admin portal.`,
      reservation: { ...reservation, status: reservation.status ?? "PENDING" },
      highlight: `Requested schedule: ${fmtDateTime(
        reservation.startDateTime
      )} to ${fmtDateTime(reservation.endDateTime)}.`,
      highlightTitle: "Pending review",
      actionLabel: "Review Reservation",
      actionUrl: getAppUrl("/admin/reservations"),
    }),
  };
}

export function buildUserReservationApprovedEmail(
  reservation: ReservationEmailContext
) {
  return {
    subject: "Reservation Approved",
    html: emailLayout({
      variant: "approved",
      preheader: "Your reservation request has been approved.",
      title: "Reservation Approved",
      intro: "Your reservation request has been approved and is now confirmed. Please keep this email for your reference.",
      reservation: { ...reservation, status: reservation.status ?? "APPROVED" },
      highlight: "Your reservation is confirmed in the system.",
      actionLabel: "View My Reservations",
      actionUrl: getAppUrl("/user/reservations"),
    }),
  };
}

export function buildUserReservationDeniedEmail(
  reservation: ReservationEmailContext
) {
  return {
    subject: "Reservation Denied",
    html: emailLayout({
      variant: "denied",
      preheader: "Your reservation request has been denied.",
      title: "Reservation Denied",
      intro: "Your reservation request was reviewed and could not be approved at this time.",
      reservation: { ...reservation, status: reservation.status ?? "DENIED" },
      highlight:
        reservation.adminNotes ??
        "No specific reason was provided. Please contact the barangay administration office for more information.",
      highlightTitle: reservation.adminNotes ? "Reason provided" : "Next step",
      actionLabel: "Review Reservation Status",
      actionUrl: getAppUrl("/user/reservations"),
    }),
  };
}
