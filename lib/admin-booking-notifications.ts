import { buildAdminReservationRequestEmail } from "@/lib/reservation-emails";
import { sendEmail } from "@/lib/mail";

export type PendingReservationAdminNotification = Parameters<
  typeof buildAdminReservationRequestEmail
>[0];

type Logger = Pick<typeof console, "info" | "warn" | "error">;
type SendEmailFn = typeof sendEmail;
type ScheduleTask = (task: () => void | Promise<void>) => void;
type SleepFn = (ms: number) => Promise<void>;

type NotificationDeps = {
  env?: NodeJS.ProcessEnv;
  logger?: Logger;
  sendEmail?: SendEmailFn;
  scheduleTask?: ScheduleTask;
  sleep?: SleepFn;
};

type NotificationResult = {
  attempted: boolean;
  delivered: boolean;
  recipient: string | null;
  reason: string | null;
};

const ENABLE_ADMIN_BOOKING_NOTIFICATIONS_ENV = "ENABLE_ADMIN_BOOKING_NOTIFICATIONS";
const ADMIN_BOOKING_NOTIFICATION_EMAIL_ENV = "ADMIN_BOOKING_NOTIFICATION_EMAIL";
const DEFAULT_RETRY_DELAY_MS = 1500;
const MAX_DELIVERY_ATTEMPTS = 2;

function getTrimmedEnvValue(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();
  return value ? value : null;
}

function extractEmailAddress(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim() || null;
}

function isRetryableNotificationError(error: string) {
  const normalized = error.toLowerCase();

  return !(
    normalized.includes("missing recipient email") ||
    normalized.includes("missing mail configuration") ||
    normalized.includes("invalid email_host") ||
    normalized.includes("invalid email_port")
  );
}

function defaultScheduleTask(task: () => void | Promise<void>) {
  if (typeof setImmediate === "function") {
    setImmediate(() => {
      void task();
    });
    return;
  }

  setTimeout(() => {
    void task();
  }, 0);
}

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isAdminBookingNotificationsEnabled(
  env: NodeJS.ProcessEnv = process.env
) {
  return getTrimmedEnvValue(env, ENABLE_ADMIN_BOOKING_NOTIFICATIONS_ENV) !== "false";
}

export function getAdminBookingNotificationRecipient(
  env: NodeJS.ProcessEnv = process.env
) {
  return (
    extractEmailAddress(
      getTrimmedEnvValue(env, ADMIN_BOOKING_NOTIFICATION_EMAIL_ENV)
    ) || extractEmailAddress(getTrimmedEnvValue(env, "EMAIL_USER"))
  );
}

export async function sendPendingReservationAdminNotification(
  reservation: PendingReservationAdminNotification,
  deps: NotificationDeps = {}
): Promise<NotificationResult> {
  const env = deps.env ?? process.env;
  const logger = deps.logger ?? console;
  const sendEmailFn = deps.sendEmail ?? sendEmail;
  const sleep = deps.sleep ?? defaultSleep;
  const recipient = getAdminBookingNotificationRecipient(env);

  if ((reservation.status ?? "PENDING") !== "PENDING") {
    return {
      attempted: false,
      delivered: false,
      recipient,
      reason: "reservation_not_pending",
    };
  }

  if (!isAdminBookingNotificationsEnabled(env)) {
    return {
      attempted: false,
      delivered: false,
      recipient,
      reason: "notifications_disabled",
    };
  }

  if (!recipient) {
    logger.warn("[admin booking notification] missing recipient email", {
      reservationId: reservation.reservationId,
      env: [ADMIN_BOOKING_NOTIFICATION_EMAIL_ENV, "EMAIL_USER"],
    });

    return {
      attempted: false,
      delivered: false,
      recipient: null,
      reason: "missing_recipient",
    };
  }

  const message = buildAdminReservationRequestEmail(reservation);

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    const result = await sendEmailFn({
      to: recipient,
      subject: message.subject,
      html: message.html,
      replyTo: reservation.user.email,
      logLabel: `reservation:${reservation.reservationId}:admin-pending`,
    });

    if (result.ok) {
      logger.info("[admin booking notification] sent", {
        reservationId: reservation.reservationId,
        recipient,
        attempt,
        messageId: result.messageId ?? null,
      });

      return {
        attempted: true,
        delivered: true,
        recipient,
        reason: null,
      };
    }

    const shouldRetry =
      attempt < MAX_DELIVERY_ATTEMPTS && isRetryableNotificationError(result.error);

    logger[shouldRetry ? "warn" : "error"](
      "[admin booking notification] delivery failed",
      {
        reservationId: reservation.reservationId,
        recipient,
        attempt,
        error: result.error,
        retrying: shouldRetry,
      }
    );

    if (shouldRetry) {
      await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
      continue;
    }

    return {
      attempted: true,
      delivered: false,
      recipient,
      reason: result.error,
    };
  }

  return {
    attempted: true,
    delivered: false,
    recipient,
    reason: "delivery_failed",
  };
}

export function schedulePendingReservationAdminNotification(
  reservation: PendingReservationAdminNotification,
  deps: NotificationDeps = {}
) {
  const env = deps.env ?? process.env;
  const logger = deps.logger ?? console;
  const scheduleTask = deps.scheduleTask ?? defaultScheduleTask;

  if ((reservation.status ?? "PENDING") !== "PENDING") {
    logger.info("[admin booking notification] skipped non-pending reservation", {
      reservationId: reservation.reservationId,
      status: reservation.status ?? "UNKNOWN",
    });
    return false;
  }

  if (!isAdminBookingNotificationsEnabled(env)) {
    logger.info("[admin booking notification] disabled by environment", {
      reservationId: reservation.reservationId,
      env: ENABLE_ADMIN_BOOKING_NOTIFICATIONS_ENV,
    });
    return false;
  }

  const recipient = getAdminBookingNotificationRecipient(env);
  if (!recipient) {
    logger.warn("[admin booking notification] missing recipient email", {
      reservationId: reservation.reservationId,
      env: [ADMIN_BOOKING_NOTIFICATION_EMAIL_ENV, "EMAIL_USER"],
    });
    return false;
  }

  scheduleTask(() => {
    void sendPendingReservationAdminNotification(reservation, {
      ...deps,
      env,
      logger,
    }).catch((error) => {
      logger.error("[admin booking notification] unexpected delivery exception", {
        reservationId: reservation.reservationId,
        recipient,
        error,
        message:
          error instanceof Error ? error.message : "Unknown admin notification error.",
      });
    });
  });

  logger.info("[admin booking notification] scheduled", {
    reservationId: reservation.reservationId,
    recipient,
  });

  return true;
}
