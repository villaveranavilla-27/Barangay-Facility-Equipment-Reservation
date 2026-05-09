export const SESSION_COOKIE_NAME = "__Host-barangay-go-session";
export const SESSION_COOKIE_FALLBACK_NAME = "barangay-go-session";
export const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(SESSION_ABSOLUTE_TIMEOUT_MS / 1000),
};

const APP_URL_CANDIDATES = [
  process.env.APP_URL,
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_API_URL,
];

function getNow() {
  return new Date();
}

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}

function parseProtocol(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).protocol;
  } catch {
    return null;
  }
}

function isLocalHost(value?: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("localhost") ||
    normalized.includes("127.0.0.1") ||
    normalized.includes("[::1]")
  );
}

export function isSecureSessionRequest(requestHeaders?: Headers | null) {
  const forwardedProto = requestHeaders?.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  const forwardedSsl = requestHeaders?.get("x-forwarded-ssl");
  if (forwardedSsl) {
    return forwardedSsl.trim().toLowerCase() === "on";
  }

  const originProtocol = parseProtocol(requestHeaders?.get("origin"));
  if (originProtocol) {
    return originProtocol === "https:";
  }

  const refererProtocol = parseProtocol(requestHeaders?.get("referer"));
  if (refererProtocol) {
    return refererProtocol === "https:";
  }

  const host = requestHeaders?.get("host");
  if (isLocalHost(host)) {
    return false;
  }

  for (const candidate of APP_URL_CANDIDATES) {
    const protocol = parseProtocol(candidate);

    if (protocol) {
      return protocol === "https:";
    }
  }

  return process.env.NODE_ENV === "production";
}

export function getSessionCookieName(requestHeaders?: Headers | null) {
  return isSecureSessionRequest(requestHeaders)
    ? SESSION_COOKIE_NAME
    : SESSION_COOKIE_FALLBACK_NAME;
}

export function getSessionCookieNames(requestHeaders?: Headers | null) {
  return [...new Set([getSessionCookieName(requestHeaders), SESSION_COOKIE_NAME, SESSION_COOKIE_FALLBACK_NAME])];
}

export function getSessionCookieOptions(
  requestHeaders?: Headers | null,
  now = getNow()
) {
  return {
    ...SESSION_COOKIE_OPTIONS,
    secure: isSecureSessionRequest(requestHeaders),
    expires: addMilliseconds(now, SESSION_ABSOLUTE_TIMEOUT_MS),
  };
}

export function getSessionCookieDeletionDefinitions() {
  const expiredAt = new Date(0);

  return [
    {
      name: SESSION_COOKIE_NAME,
      value: "",
      ...SESSION_COOKIE_OPTIONS,
      secure: true,
      maxAge: 0,
      expires: expiredAt,
    },
    {
      name: SESSION_COOKIE_FALLBACK_NAME,
      value: "",
      ...SESSION_COOKIE_OPTIONS,
      secure: false,
      maxAge: 0,
      expires: expiredAt,
    },
  ];
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
