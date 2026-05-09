import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { AdminRole, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_IDLE_TIMEOUT_MS,
  createSessionActivityUpdate,
  createSessionTimestamps,
  evaluateSessionTimeouts,
} from "@/lib/session-policy";

export {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_IDLE_TIMEOUT_MS,
  createSessionActivityUpdate,
  createSessionTimestamps,
  evaluateSessionTimeouts,
} from "@/lib/session-policy";

type SessionRole = "ADMIN" | "USER";
type RouteSessionRole = SessionRole | "ANY";
type SessionFailureReason =
  | "missing"
  | "not_found"
  | "binding"
  | "idle"
  | "absolute"
  | "principal";

type SessionClient = Prisma.TransactionClient | typeof prisma;
type LockedSessionRecord = {
  sessionId: string;
  role: Role;
  username: string;
  userId: number | null;
  adminId: number | null;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

type SessionResolution =
  | {
      session: AppSession;
      sessionId: string;
      hadCookie: true;
      reason: null;
    }
  | {
      session: null;
      sessionId: string | null;
      hadCookie: boolean;
      reason: SessionFailureReason;
    };

type RouteSessionResult =
  | {
      ok: true;
      session: AppSession;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export type AppSessionUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  role: SessionRole;
  adminRole: "CORE_ADMIN" | "ADMIN" | null;
  adminActive: boolean | null;
  userActive: boolean | null;
};

export type AppSession = {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  user: AppSessionUser;
};

export function getSessionHomePath(user: Pick<AppSessionUser, "role">) {
  return user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
}

function getLoginPathForRole(role: SessionRole) {
  return role === "ADMIN" ? "/admin-login" : "/login";
}

function isRoleAllowed(role: SessionRole, requiredRole: RouteSessionRole) {
  return requiredRole === "ANY" || role === requiredRole;
}

function toAdminRole(role: AdminRole | null | undefined) {
  if (role === AdminRole.CORE_ADMIN) {
    return "CORE_ADMIN";
  }

  if (role === AdminRole.ADMIN) {
    return "ADMIN";
  }

  return null;
}

function getNow() {
  return new Date();
}

function normalizeUserAgent(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 191) : null;
}

function normalizeIpAddress(value: string | null | undefined) {
  const trimmed = value?.split(",")[0]?.trim();
  return trimmed ? trimmed.slice(0, 191) : null;
}

function readCurrentHeaders(source?: Headers) {
  return source ?? headers();
}

function getRequestUserAgent(source?: Headers) {
  return normalizeUserAgent(readCurrentHeaders(source).get("user-agent"));
}

function getRequestIpAddress(source?: Headers) {
  const requestHeaders = readCurrentHeaders(source);
  return normalizeIpAddress(
    requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip") ??
      requestHeaders.get("cf-connecting-ip")
  );
}

function shouldBindUserAgent() {
  return process.env.SESSION_BIND_USER_AGENT === "true";
}

function shouldBindIpAddress() {
  return process.env.SESSION_BIND_IP === "true";
}

function shouldClearCookie(reason: SessionFailureReason) {
  return reason !== "missing";
}

function createUnauthorizedRouteResponse(
  hadCookie: boolean,
  reason: SessionFailureReason
) {
  const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (hadCookie && shouldClearCookie(reason)) {
    clearSessionCookie(response);
  }

  return response;
}

function createForbiddenRouteResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function generateSessionId() {
  return crypto.randomBytes(32).toString("base64url");
}

function getSessionTokenFromCookie() {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

async function deleteSessionRecord(client: SessionClient, sessionId: string) {
  await client.appSession.deleteMany({
    where: { sessionId },
  });
}

async function lockSessionRecord(client: SessionClient, sessionId: string) {
  const rows = await client.$queryRaw<LockedSessionRecord[]>`
    SELECT
      Session_ID AS sessionId,
      Role AS role,
      Username AS username,
      User_ID AS userId,
      Admin_ID AS adminId,
      CreatedAt AS createdAt,
      LastActivity AS lastActivity,
      ExpiresAt AS expiresAt,
      IP_Address AS ipAddress,
      User_Agent AS userAgent
    FROM AppSession
    WHERE Session_ID = ${sessionId}
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

async function buildSessionUser(
  client: SessionClient,
  record: LockedSessionRecord
): Promise<AppSessionUser | null> {
  if (record.role === Role.ADMIN) {
    if (!record.adminId) {
      return null;
    }

    const admin = await client.admin.findUnique({
      where: { adminId: record.adminId },
      select: {
        adminId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        username: true,
      },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    const linkedUser = await client.user.findUnique({
      where: { username: admin.username },
      select: {
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (linkedUser && !linkedUser.isActive) {
      return null;
    }

    return {
      id: String(admin.adminId),
      username: admin.username,
      email: linkedUser?.email ?? admin.email,
      name: linkedUser?.name ?? admin.name,
      role: "ADMIN",
      adminRole: toAdminRole(admin.role),
      adminActive: true,
      userActive: null,
    };
  }

  if (!record.userId) {
    return null;
  }

  const user = await client.user.findUnique({
    where: { userId: record.userId },
    select: {
      userId: true,
      username: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: String(user.userId),
    username: user.username,
    email: user.email,
    name: user.name,
    role: "USER",
    adminRole: null,
    adminActive: null,
    userActive: true,
  };
}

function recordViolatesBinding(record: LockedSessionRecord, requestHeaders?: Headers) {
  if (shouldBindUserAgent()) {
    const currentUserAgent = getRequestUserAgent(requestHeaders);
    if ((record.userAgent ?? null) !== currentUserAgent) {
      return true;
    }
  }

  if (shouldBindIpAddress()) {
    const currentIpAddress = getRequestIpAddress(requestHeaders);
    if ((record.ipAddress ?? null) !== currentIpAddress) {
      return true;
    }
  }

  return false;
}

async function resolveCurrentSession(options?: { headers?: Headers }): Promise<SessionResolution> {
  const sessionId = getSessionTokenFromCookie();

  if (!sessionId) {
    return {
      session: null,
      sessionId: null,
      hadCookie: false,
      reason: "missing",
    };
  }

  return prisma.$transaction(
    async (tx) => {
      const record = await lockSessionRecord(tx, sessionId);

      if (!record) {
        return {
          session: null,
          sessionId,
          hadCookie: true,
          reason: "not_found",
        } satisfies SessionResolution;
      }

      if (recordViolatesBinding(record, options?.headers)) {
        await deleteSessionRecord(tx, record.sessionId);
        return {
          session: null,
          sessionId: record.sessionId,
          hadCookie: true,
          reason: "binding",
        } satisfies SessionResolution;
      }

      const now = getNow();
      const timeoutState = evaluateSessionTimeouts({
        createdAt: record.createdAt,
        lastActivity: record.lastActivity,
        now,
      });

      if (timeoutState.expired || record.expiresAt <= now) {
        await deleteSessionRecord(tx, record.sessionId);
        return {
          session: null,
          sessionId: record.sessionId,
          hadCookie: true,
          reason: timeoutState.reason ?? "absolute",
        } satisfies SessionResolution;
      }

      const user = await buildSessionUser(tx, record);

      if (!user) {
        await deleteSessionRecord(tx, record.sessionId);
        return {
          session: null,
          sessionId: record.sessionId,
          hadCookie: true,
          reason: "principal",
        } satisfies SessionResolution;
      }

      await tx.appSession.update({
        where: { sessionId: record.sessionId },
        data: createSessionActivityUpdate(now),
      });

      return {
        session: {
          sessionId: record.sessionId,
          createdAt: record.createdAt,
          lastActivity: now,
          user,
        },
        sessionId: record.sessionId,
        hadCookie: true,
        reason: null,
      } satisfies SessionResolution;
    },
    {
      timeout: 15000,
      maxWait: 5000,
    }
  );
}

export async function getCurrentSession(options?: { headers?: Headers }) {
  const result = await resolveCurrentSession(options);
  return result.session;
}

export async function requireRouteSession(
  request: Request,
  role: RouteSessionRole = "ANY"
): Promise<RouteSessionResult> {
  const result = await resolveCurrentSession({ headers: request.headers });

  if (!result.session) {
    return {
      ok: false,
      response: createUnauthorizedRouteResponse(result.hadCookie, result.reason),
    };
  }

  if (!isRoleAllowed(result.session.user.role, role)) {
    return {
      ok: false,
      response: createForbiddenRouteResponse(),
    };
  }

  return {
    ok: true,
    session: result.session,
  };
}

export async function requirePageSession(role: SessionRole) {
  const session = await getCurrentSession();

  if (!session || session.user.role !== role) {
    redirect(getLoginPathForRole(role));
  }

  return session;
}

export async function redirectIfAuthenticated() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getSessionHomePath(session.user));
  }
}

export async function createSessionForUser(
  user: AppSessionUser,
  options?: { headers?: Headers }
) {
  const now = getNow();
  const requestHeaders = options?.headers;
  const sessionId = generateSessionId();
  const timestamps = createSessionTimestamps(now);

  await prisma.appSession.create({
    data: {
      sessionId,
      role: user.role === "ADMIN" ? Role.ADMIN : Role.USER,
      username: user.username,
      userId: user.role === "USER" ? Number(user.id) : null,
      adminId: user.role === "ADMIN" ? Number(user.id) : null,
      createdAt: timestamps.createdAt,
      lastActivity: timestamps.lastActivity,
      expiresAt: timestamps.expiresAt,
      ipAddress: getRequestIpAddress(requestHeaders),
      userAgent: getRequestUserAgent(requestHeaders),
    },
  });

  return sessionId;
}

export async function revokeSessionById(sessionId: string) {
  await deleteSessionRecord(prisma, sessionId);
}

export async function revokeCurrentSession() {
  const sessionId = getSessionTokenFromCookie();

  if (!sessionId) {
    return;
  }

  await deleteSessionRecord(prisma, sessionId);
}

export async function revokeSessionsForIdentity(options: {
  username?: string | null;
  userId?: number | null;
  adminId?: number | null;
}) {
  const filters: Prisma.AppSessionWhereInput[] = [];

  if (options.username) {
    filters.push({ username: options.username });
  }

  if (typeof options.userId === "number") {
    filters.push({ userId: options.userId });
  }

  if (typeof options.adminId === "number") {
    filters.push({ adminId: options.adminId });
  }

  if (filters.length === 0) {
    return;
  }

  await prisma.appSession.deleteMany({
    where: {
      OR: filters,
    },
  });
}

export async function cleanupExpiredSessions(now = getNow()) {
  const idleCutoff = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS);

  const result = await prisma.appSession.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: now } }, { lastActivity: { lt: idleCutoff } }],
    },
  });

  return result.count;
}

export function applySessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    ...SESSION_COOKIE_OPTIONS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
