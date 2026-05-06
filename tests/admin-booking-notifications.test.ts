import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";

const originalResolveFilename = (Module as unknown as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown
  ) => string;
})._resolveFilename;

(Module as unknown as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown
  ) => string;
})._resolveFilename = function resolveFilename(
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown
) {
  if (request.startsWith("@/")) {
    request = path.join(process.cwd(), request.slice(2));
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

process.env.APP_URL = "https://barangay.example.com";

const {
  schedulePendingReservationAdminNotification,
  sendPendingReservationAdminNotification,
} = require("../lib/admin-booking-notifications") as typeof import("../lib/admin-booking-notifications");
const { buildAdminReservationRequestEmail } = require("../lib/reservation-emails") as typeof import("../lib/reservation-emails");

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

type BackgroundTask = () => void | Promise<void>;

function createReservation() {
  return {
    reservationId: 123,
    facilityId: 7,
    facility: {
      itemName: "Barangay Hall",
      pricePerDay: 2500,
    },
    equipment: null,
    startDateTime: new Date("2026-06-01T01:00:00.000Z"),
    endDateTime: new Date("2026-06-01T03:00:00.000Z"),
    purpose: "Community health seminar",
    status: "PENDING",
    expectedAttendees: 80,
    equipmentQuantity: null,
    adminNotes: null,
    user: {
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      contactNumber: "09171234567",
    },
    admin: null,
  } as const;
}

async function main() {
  await runTest(
    "admin reservation email content includes subject, requester details, and review link",
    () => {
      const message = buildAdminReservationRequestEmail(createReservation());

      assert.match(
        message.subject,
        /^New Reservation Request \u2013 Barangay Hall on /
      );
      assert.match(message.html, /Juan Dela Cruz/);
      assert.match(message.html, /juan@example\.com/);
      assert.match(message.html, /Barangay Hall/);
      assert.match(message.html, /Community health seminar/);
      assert.match(message.html, /Review Reservation/);
      assert.match(
        message.html,
        /https:\/\/barangay\.example\.com\/admin\/reservations/
      );
    }
  );

  await runTest(
    "scheduled admin notification runs in the background and sends once enabled",
    async () => {
      const reservation = createReservation();
      const logs: Array<{ level: string; payload: unknown[] }> = [];
      let scheduledTask: BackgroundTask | undefined;
      let sendStarted = false;
      let sendCompleted = false;
      let resolveSend: (() => void) | undefined;

      const sendGate = new Promise<void>((resolve) => {
        resolveSend = resolve;
      });

      const scheduled = schedulePendingReservationAdminNotification(reservation, {
        env: {
          EMAIL_USER: "admin@example.com",
          ENABLE_ADMIN_BOOKING_NOTIFICATIONS: "true",
        },
        logger: {
          info: (...payload: unknown[]) => logs.push({ level: "info", payload }),
          warn: (...payload: unknown[]) => logs.push({ level: "warn", payload }),
          error: (...payload: unknown[]) => logs.push({ level: "error", payload }),
        },
        scheduleTask: (task) => {
          scheduledTask = task;
        },
        sendEmail: async () => {
          sendStarted = true;
          await sendGate;
          sendCompleted = true;

          return {
            ok: true as const,
            recipients: ["admin@example.com"],
            accepted: ["admin@example.com"],
            rejected: [],
            messageId: "message-1",
          };
        },
      });

      assert.equal(scheduled, true);
      assert.equal(sendStarted, false);
      assert.ok(scheduledTask);

      const runScheduledTask: BackgroundTask =
        scheduledTask ??
        (() => {
          throw new Error("Expected the notification task to be scheduled.");
        });

      const backgroundWork = Promise.resolve(runScheduledTask());

      assert.equal(sendStarted, true);
      assert.equal(sendCompleted, false);

      const releaseSend: () => void =
        resolveSend ??
        (() => {
          throw new Error("Expected the send gate to be resolvable.");
        });
      releaseSend();
      await backgroundWork;

      assert.equal(sendCompleted, true);
      assert.ok(
        logs.some(
          (entry) =>
            entry.level === "info" &&
            String(entry.payload[0]).includes("[admin booking notification] scheduled")
        )
      );
    }
  );

  await runTest(
    "direct admin notification delivery skips cleanly when no admin email is configured",
    async () => {
      const warnings: unknown[][] = [];

      const result = await sendPendingReservationAdminNotification(createReservation(), {
        env: {
          ENABLE_ADMIN_BOOKING_NOTIFICATIONS: "true",
        },
        logger: {
          info: () => undefined,
          warn: (...payload: unknown[]) => warnings.push(payload),
          error: () => undefined,
        },
      });

      assert.equal(result.attempted, false);
      assert.equal(result.delivered, false);
      assert.equal(result.reason, "missing_recipient");
      assert.equal(warnings.length, 1);
    }
  );

  console.log("Admin booking notification tests completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
