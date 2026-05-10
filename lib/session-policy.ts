export function getSessionCookieSettings(nodeEnv = process.env.NODE_ENV) {
  const secure = nodeEnv === "production";

  return {
    name: secure ? "__Host-barangay-go-session" : "barangay-go-session",
    options: {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

const sessionCookieSettings = getSessionCookieSettings();

export const SESSION_COOKIE_NAME = sessionCookieSettings.name;
export const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_COOKIE_OPTIONS = sessionCookieSettings.options;

function getNow() {
  return new Date();
}

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}

export function createSessionTimestamps(now = getNow()) {
  return {
    createdAt: now,
    lastActivity: now,
    expiresAt: addMilliseconds(now, SESSION_ABSOLUTE_TIMEOUT_MS),
  };
}

export function createSessionActivityUpdate(now = getNow()) {
  return {
    lastActivity: now,
  };
}

export function evaluateSessionTimeouts({
  createdAt,
  lastActivity,
  now = getNow(),
}: {
  createdAt: Date;
  lastActivity: Date;
  now?: Date;
}) {
  const idleAgeMs = now.getTime() - lastActivity.getTime();
  if (idleAgeMs > SESSION_IDLE_TIMEOUT_MS) {
    return {
      expired: true as const,
      reason: "idle" as const,
      idleAgeMs,
      absoluteAgeMs: now.getTime() - createdAt.getTime(),
    };
  }

  const absoluteAgeMs = now.getTime() - createdAt.getTime();
  if (absoluteAgeMs > SESSION_ABSOLUTE_TIMEOUT_MS) {
    return {
      expired: true as const,
      reason: "absolute" as const,
      idleAgeMs,
      absoluteAgeMs,
    };
  }

  return {
    expired: false as const,
    reason: null,
    idleAgeMs,
    absoluteAgeMs,
  };
}
