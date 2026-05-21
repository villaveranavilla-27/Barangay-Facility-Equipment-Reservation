import { NextResponse } from "next/server";
import { database as prisma } from "@/lib/database";
import { equipmentSchema } from "@/lib/schemas";
import { requireRouteSession } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = equipmentSchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const item = await prisma.equipment.update({
    where: { equipmentId: Number(params.id) },
    data: parsed.data,
  });
  return NextResponse.json(item);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  await prisma.equipment.delete({ where: { equipmentId: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
