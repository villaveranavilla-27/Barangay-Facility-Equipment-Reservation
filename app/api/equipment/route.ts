import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isActiveAdmin } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { equipmentSchema } from "@/lib/schemas";

export async function GET() {
  const equipment = await prisma.equipment.findMany({ orderBy: { equipmentId: "desc" } });
  return NextResponse.json(equipment);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = Number(session?.user?.id);

  const parsed = equipmentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const item = await prisma.equipment.create({
    data: {
      ...parsed.data,
      adminId,
    },
  });

  return NextResponse.json(item);
}
