import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isActiveAdmin } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = facilitySchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const facility = await prisma.facility.update({
    where: { facilityId: Number(params.id) },
    data: parsed.data,
  });
  return NextResponse.json(facility);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.facility.delete({ where: { facilityId: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
