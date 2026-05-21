import { NextResponse } from "next/server";
import { database as prisma } from "@/lib/database";
import { equipmentSchema } from "@/lib/schemas";
import { requireRouteSession } from "@/lib/session";

export async function GET() {
  const equipment = await prisma.equipment.findMany({ orderBy: { equipmentId: "desc" } });
  return NextResponse.json(equipment);
}

export async function POST(request: Request) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  const adminId = Number(auth.session.user.id);

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
