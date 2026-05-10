import bcrypt from "bcryptjs";
import { AdminRole, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

export class AuthenticationError extends Error {
  constructor(message: string, public readonly status: 400 | 401 | 403 = 401) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export type AuthenticatedPrincipal = {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  adminRole: "CORE_ADMIN" | "ADMIN" | null;
  adminActive: boolean | null;
  userActive: boolean | null;
};

async function checkPassword(plain: string, stored: string) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }

  return md5(plain) === stored;
}

function normalizeAdminRole(role: AdminRole | null | undefined) {
  return role === AdminRole.CORE_ADMIN ? "CORE_ADMIN" : role === AdminRole.ADMIN ? "ADMIN" : null;
}

export async function authenticateCredentials(credentials: unknown): Promise<AuthenticatedPrincipal> {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    throw new AuthenticationError("Missing login fields", 400);
  }

  const { identifier, password, intendedRole } = parsed.data;
  const normalizedIdentifier = identifier.trim();

  if (intendedRole === "admin") {
    const admin = await prisma.admin.findFirst({
      where: {
        isActive: true,
        OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
      },
      select: {
        adminId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        username: true,
        password: true,
      },
    });

    if (!admin) {
      throw new AuthenticationError("Invalid email/username or password", 401);
    }

    const linkedUser = await prisma.user.findUnique({
      where: { username: admin.username },
      select: {
        email: true,
        name: true,
        password: true,
        isActive: true,
      },
    });

    if (linkedUser && !linkedUser.isActive) {
      throw new AuthenticationError("This user account is inactive", 403);
    }

    const isValid = await checkPassword(password, linkedUser?.password ?? admin.password);
    if (!isValid) {
      throw new AuthenticationError("Invalid email/username or password", 401);
    }

    return {
      id: String(admin.adminId),
      username: admin.username,
      email: linkedUser?.email ?? admin.email,
      name: linkedUser?.name ?? admin.name,
      role: "ADMIN",
      adminRole: normalizeAdminRole(admin.role),
      adminActive: admin.isActive,
      userActive: null,
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    },
    select: {
      userId: true,
      username: true,
      email: true,
      name: true,
      password: true,
      isActive: true,
      role: true,
    },
  });

  if (!user) {
    throw new AuthenticationError("Invalid email/username or password", 401);
  }

  const isValid = await checkPassword(password, user.password);
  if (!isValid) {
    throw new AuthenticationError("Invalid email/username or password", 401);
  }

  return {
    id: String(user.userId),
    username: user.username,
    email: user.email,
    name: user.name,
    role: "USER",
    adminRole: null,
    adminActive: null,
    userActive: user.isActive && user.role === Role.USER ? true : user.isActive,
  };
}
