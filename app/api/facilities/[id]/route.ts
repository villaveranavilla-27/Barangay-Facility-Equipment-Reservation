import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/schemas";
import { requireRouteSession } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = facilitySchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const facility = await prisma.facility.update({
    where: { facilityId: Number(params.id) },
    data: parsed.data,
  });
  return NextResponse.json(facility);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  await prisma.facility.delete({ where: { facilityId: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
