import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/schemas";
import { requireRouteSession } from "@/lib/session";

export async function GET() {
  const facilities = await prisma.facility.findMany({ orderBy: { facilityId: "desc" } });
  return NextResponse.json(facilities);
}

export async function POST(request: Request) {
  const auth = await requireRouteSession(request, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  const adminId = Number(auth.session.user.id);

  const parsed = facilitySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const facility = await prisma.facility.create({
    data: {
      ...parsed.data,
      adminId,
    },
  });
  return NextResponse.json(facility);
}
