import { AdminRole, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isActiveAdmin } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class PromoteAdminError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PromoteAdminError";
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isActiveAdmin(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = Number(body?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const actorAdminId = Number(session.user.id);

    const result = await prisma.$transaction(async (tx) => {
      const currentAdmin = await tx.admin.findUnique({
        where: { adminId: actorAdminId },
        select: { adminId: true, isActive: true },
      });

      if (!currentAdmin?.isActive) {
        throw new PromoteAdminError(403, "Forbidden");
      }

      const targetUser = await tx.user.findUnique({
        where: { userId },
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

      if (!targetUser) {
        throw new PromoteAdminError(404, "User not found");
      }

      if (!targetUser.isActive) {
        throw new PromoteAdminError(
          400,
          "Only active user accounts can be promoted to admin."
        );
      }

      const existingAdmin = await tx.admin.findFirst({
        where: {
          OR: [
            { email: targetUser.email },
            { username: targetUser.username },
          ],
        },
        select: { adminId: true, isActive: true },
      });

      if (existingAdmin?.isActive) {
        throw new PromoteAdminError(400, "Already an admin");
      }

      const admin = existingAdmin
        ? await tx.admin.update({
            where: { adminId: existingAdmin.adminId },
            data: {
              name: targetUser.name,
              username: targetUser.username,
              email: targetUser.email,
              password: targetUser.password,
              contactNumber: targetUser.contactNumber,
              gender: targetUser.gender,
              birthdate: targetUser.birthdate,
              address: targetUser.address,
              role: AdminRole.ADMIN,
              isActive: true,
              deactivatedAt: null,
            },
            select: {
              adminId: true,
              name: true,
              username: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          })
        : await tx.admin.create({
            data: {
              name: targetUser.name,
              username: targetUser.username,
              email: targetUser.email,
              password: targetUser.password,
              contactNumber: targetUser.contactNumber,
              gender: targetUser.gender,
              birthdate: targetUser.birthdate,
              address: targetUser.address,
              role: AdminRole.ADMIN,
            },
            select: {
              adminId: true,
              name: true,
              username: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          });

      await tx.user.update({
        where: { userId: targetUser.userId },
        data: { role: Role.ADMIN },
      });

      return admin;
    });

    console.info(
      JSON.stringify({
        event: "admin_promoted",
        actorAdminId,
        targetUserId: userId,
        targetAdminId: result.adminId,
        occurredAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({ success: true, admin: result });
  } catch (error) {
    if (error instanceof PromoteAdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
