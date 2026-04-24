import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isActiveAdmin } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/schemas";

export async function GET() {
  const facilities = await prisma.facility.findMany({ orderBy: { facilityId: "desc" } });
  return NextResponse.json(facilities);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = Number(session?.user?.id);

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
