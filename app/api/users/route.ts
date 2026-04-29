import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ADMIN_ROLE } from "@/lib/admin-roles";
import { isActiveAdmin, isCoreAdmin, isInactiveAdmin } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adminCreateSchema,
  adminRemovalSchema,
  userAccountStatusSchema,
  userUpdateSchema,
} from "@/lib/schemas";
import { md5 } from "@/lib/utils";

const adminSelect = {
  adminId: true,
  name: true,
  birthdate: true,
  gender: true,
  address: true,
  username: true,
  contactNumber: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  deactivatedAt: true,
} as const;

type AdminDirectoryRecord = Prisma.AdminGetPayload<{
  select: typeof adminSelect;
}>;

class AdminManagementError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AdminManagementError";
  }
}

function getAdminRemovalBlockedReason({
  actorAdminId,
  targetAdmin,
  activeAdminCount,
  activeCoreAdminCount,
}: {
  actorAdminId: number;
  targetAdmin: Pick<AdminDirectoryRecord, "adminId" | "role" | "isActive">;
  activeAdminCount: number;
  activeCoreAdminCount: number;
}) {
  if (!targetAdmin.isActive) {
    return "Admin access has already been removed.";
  }

  if (targetAdmin.adminId === actorAdminId) {
    return "You cannot remove your own admin access.";
  }

  if (activeAdminCount <= 1) {
    return "At least one active admin must remain in the system.";
  }

  if (targetAdmin.role === ADMIN_ROLE.CORE_ADMIN && activeCoreAdminCount <= 1) {
    return "At least one active core admin must remain in the system.";
  }

  return null;
}

function serializeAdminDirectoryRecord(
  admin: AdminDirectoryRecord,
  actorAdminId: number,
  counts: {
    activeAdminCount: number;
    activeCoreAdminCount: number;
  }
) {
  const removalBlockedReason = getAdminRemovalBlockedReason({
    actorAdminId,
    targetAdmin: admin,
    activeAdminCount: counts.activeAdminCount,
    activeCoreAdminCount: counts.activeCoreAdminCount,
  });

  return {
    ...admin,
    canBeRemoved: removalBlockedReason === null,
    removalBlockedReason,
  };
}

function isAdminUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  if (kind === "admins") {
    if (!isActiveAdmin(session?.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      orderBy: { adminId: "desc" },
      select: adminSelect,
    });

    const currentAdminId = Number(session?.user?.id);
    const activeAdminCount = admins.filter((admin) => admin.isActive).length;
    const activeCoreAdminCount = admins.filter(
      (admin) => admin.isActive && admin.role === ADMIN_ROLE.CORE_ADMIN
    ).length;

    return NextResponse.json({
      currentAdminId,
      currentAdminRole: session?.user?.adminRole ?? null,
      canManageAdmins: isCoreAdmin(session?.user),
      admins: admins.map((admin) =>
        serializeAdminDirectoryRecord(admin, currentAdminId, {
          activeAdminCount,
          activeCoreAdminCount,
        })
      ),
    });
  }

  if (isActiveAdmin(session?.user)) {
    const users = await prisma.user.findMany({
      orderBy: { userId: "desc" },
      select: {
        userId: true,
        name: true,
        birthdate: true,
        gender: true,
        address: true,
        username: true,
        contactNumber: true,
        email: true,
        isActive: true,
        deactivatedAt: true,
      },
    });
    return NextResponse.json(users);
  }

  if (isInactiveAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.user?.id || session.user.role !== "USER" || session.user.userActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { userId: Number(session.user.id) },
    select: {
      userId: true,
      name: true,
      birthdate: true,
      gender: true,
      address: true,
      username: true,
      contactNumber: true,
      email: true,
      isActive: true,
      deactivatedAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isActiveAdmin(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCoreAdmin(session.user)) {
    return NextResponse.json(
      { error: "Only core admins can manage administrator access." },
      { status: 403 }
    );
  }

  const parsed = adminCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const actorAdminId = Number(session.user.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const actor = await tx.admin.findUnique({
        where: { adminId: actorAdminId },
        select: { adminId: true, role: true, isActive: true },
      });

      if (!actor?.isActive) {
        throw new AdminManagementError(403, "Your admin access is no longer active.");
      }

      if (actor.role !== ADMIN_ROLE.CORE_ADMIN) {
        throw new AdminManagementError(403, "Only core admins can manage administrator access.");
      }

      const existingUser = await tx.user.findUnique({
        where: { userId: data.userId },
        select: {
          userId: true,
          name: true,
          birthdate: true,
          gender: true,
          address: true,
          username: true,
          password: true,
          contactNumber: true,
          email: true,
          isActive: true,
        },
      });

      if (!existingUser) {
        throw new AdminManagementError(404, "User account not found.");
      }

      if (!existingUser.isActive) {
        throw new AdminManagementError(
          400,
          "Only active user accounts in this system can be assigned as admins."
        );
      }

      const matchingAdmins = await tx.admin.findMany({
        where: {
          OR: [
            { email: existingUser.email },
            { username: existingUser.username },
          ],
        },
        select: adminSelect,
      });

      if (matchingAdmins.length > 1) {
        throw new AdminManagementError(
          409,
          "This email or username is already assigned to another admin account."
        );
      }

      const existingAdmin = matchingAdmins[0];

      if (existingAdmin?.isActive) {
        throw new AdminManagementError(
          409,
          "This user account already has active admin access."
        );
      }

      if (existingAdmin) {
        const reactivatedAdmin = await tx.admin.update({
          where: { adminId: existingAdmin.adminId },
          data: {
            name: existingUser.name,
            username: existingUser.username,
            email: existingUser.email,
            password: existingUser.password,
            contactNumber: existingUser.contactNumber,
            gender: existingUser.gender,
            birthdate: existingUser.birthdate,
            address: existingUser.address,
            role: data.adminRole,
            isActive: true,
            deactivatedAt: null,
          },
          select: adminSelect,
        });

        return {
          admin: reactivatedAdmin,
          reactivated: true,
        };
      }

      const createdAdmin = await tx.admin.create({
        data: {
          name: existingUser.name,
          username: existingUser.username,
          email: existingUser.email,
          password: existingUser.password,
          contactNumber: existingUser.contactNumber,
          gender: existingUser.gender,
          birthdate: existingUser.birthdate,
          address: existingUser.address,
          role: data.adminRole,
        },
        select: adminSelect,
      });

      return {
        admin: createdAdmin,
        reactivated: false,
      };
    });

    console.info(
      JSON.stringify({
        event: result.reactivated ? "admin_reactivated" : "admin_created",
        actorAdminId,
        targetAdminId: result.admin.adminId,
        targetRole: result.admin.role,
        occurredAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      ok: true,
      reactivated: result.reactivated,
      message: result.reactivated
        ? "Admin access restored successfully."
        : "Admin access granted successfully.",
      admin: result.admin,
    });
  } catch (error) {
    if (error instanceof AdminManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (isAdminUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An admin with this username already exists." },
        { status: 409 }
      );
    }

    throw error;
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  if (isActiveAdmin(session?.user)) {
    const parsed = userAccountStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const actorAdminId = Number(session?.user?.id);
    const now = new Date();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const actor = await tx.admin.findUnique({
          where: { adminId: actorAdminId },
          select: { adminId: true, username: true, role: true, isActive: true },
        });

        if (!actor?.isActive) {
          throw new AdminManagementError(403, "Your admin access is no longer active.");
        }

        const targetUser = await tx.user.findUnique({
          where: { userId: parsed.data.userId },
          select: {
            userId: true,
            name: true,
            username: true,
            email: true,
            contactNumber: true,
            isActive: true,
            deactivatedAt: true,
          },
        });

        if (!targetUser) {
          throw new AdminManagementError(404, "User account not found.");
        }

        if (!parsed.data.isActive && targetUser.username === actor.username) {
          throw new AdminManagementError(
            400,
            "You cannot deactivate the user account linked to your current admin session."
          );
        }

        if (targetUser.isActive === parsed.data.isActive) {
          return {
            user: targetUser,
            changed: false,
            message: parsed.data.isActive
              ? "User account is already active."
              : "User account is already inactive.",
          };
        }

        const updatedUser = await tx.user.update({
          where: { userId: parsed.data.userId },
          data: {
            isActive: parsed.data.isActive,
            deactivatedAt: parsed.data.isActive ? null : now,
          },
          select: {
            userId: true,
            name: true,
            username: true,
            email: true,
            contactNumber: true,
            isActive: true,
            deactivatedAt: true,
          },
        });

        return {
          user: updatedUser,
          changed: true,
          message: parsed.data.isActive
            ? "User account activated successfully."
            : "User account deactivated successfully.",
        };
      });

      return NextResponse.json({
        ok: true,
        changed: result.changed,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof AdminManagementError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      throw error;
    }
  }

  if (!session?.user?.id || session.user.role !== "USER" || session.user.userActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const passwordHash = data.password ? md5(data.password) : null;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { userId: Number(session.user.id) },
        select: { userId: true, username: true },
      });

      if (!existingUser) {
        throw new AdminManagementError(404, "User account not found.");
      }

      const updatedUser = await tx.user.update({
        where: { userId: existingUser.userId },
        data: {
          name: data.name,
          email: data.email,
          contactNumber: data.contactNumber,
          gender: data.gender,
          birthdate: data.birthdate ? new Date(data.birthdate) : null,
          address: data.address || null,
          ...(passwordHash ? { password: passwordHash } : {}),
        },
        select: {
          userId: true,
          name: true,
          birthdate: true,
          gender: true,
          address: true,
          username: true,
          contactNumber: true,
          email: true,
        },
      });

      await tx.admin.updateMany({
        where: { username: existingUser.username },
        data: {
          name: data.name,
          email: data.email,
          contactNumber: data.contactNumber,
          gender: data.gender,
          birthdate: data.birthdate ? new Date(data.birthdate) : null,
          address: data.address || null,
          ...(passwordHash ? { password: passwordHash } : {}),
        },
      });

      return updatedUser;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AdminManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isActiveAdmin(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCoreAdmin(session.user)) {
    return NextResponse.json(
      { error: "Only core admins can manage administrator access." },
      { status: 403 }
    );
  }

  const parsed = adminRemovalSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const actorAdminId = Number(session.user.id);
  const targetAdminId = parsed.data.adminId;
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const actor = await tx.admin.findUnique({
        where: { adminId: actorAdminId },
        select: { adminId: true, role: true, isActive: true },
      });

      if (!actor?.isActive) {
        throw new AdminManagementError(403, "Your admin access is no longer active.");
      }

      if (actor.role !== ADMIN_ROLE.CORE_ADMIN) {
        throw new AdminManagementError(403, "Only core admins can manage administrator access.");
      }

      const targetAdmin = await tx.admin.findUnique({
        where: { adminId: targetAdminId },
        select: adminSelect,
      });

      if (!targetAdmin) {
        throw new AdminManagementError(404, "Admin account not found.");
      }

      if (!targetAdmin.isActive) {
        return {
          admin: targetAdmin,
          alreadyRemoved: true,
          message: "Admin access has already been removed.",
        };
      }

      const activeAdminCount = await tx.admin.count({
        where: { isActive: true },
      });
      const activeCoreAdminCount = await tx.admin.count({
        where: {
          isActive: true,
          role: ADMIN_ROLE.CORE_ADMIN,
        },
      });

      const removalBlockedReason = getAdminRemovalBlockedReason({
        actorAdminId,
        targetAdmin,
        activeAdminCount,
        activeCoreAdminCount,
      });

      if (removalBlockedReason) {
        throw new AdminManagementError(400, removalBlockedReason);
      }

      const updatedAdmin = await tx.admin.updateMany({
        where: {
          adminId: targetAdminId,
          isActive: true,
        },
        data: {
          isActive: false,
          deactivatedAt: now,
        },
      });

      if (updatedAdmin.count === 0) {
        const latest = await tx.admin.findUnique({
          where: { adminId: targetAdminId },
          select: adminSelect,
        });

        if (!latest) {
          throw new AdminManagementError(404, "Admin account not found.");
        }

        if (!latest.isActive) {
          return {
            admin: latest,
            alreadyRemoved: true,
            message: "Admin access has already been removed.",
          };
        }

        throw new AdminManagementError(
          400,
          "Admin access could not be removed. Please try again."
        );
      }

      const latest = await tx.admin.findUnique({
        where: { adminId: targetAdminId },
        select: adminSelect,
      });

      if (!latest) {
        throw new AdminManagementError(404, "Admin account not found.");
      }

      return {
        admin: latest,
        alreadyRemoved: false,
        message: "Admin access removed successfully.",
      };
    });

    console.info(
      JSON.stringify({
        event: "admin_removed",
        actorAdminId,
        targetAdminId: result.admin.adminId,
        targetRole: result.admin.role,
        occurredAt: now.toISOString(),
      })
    );

    return NextResponse.json({
      ok: true,
      alreadyRemoved: result.alreadyRemoved,
      message: result.message,
      admin: result.admin,
    });
  } catch (error) {
    if (error instanceof AdminManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
