import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminCreateSchema, userUpdateSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  if (kind === "admins") {
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const admins = await prisma.admin.findMany({
      orderBy: { adminId: "desc" },
      select: { adminId: true, name: true, birthdate: true, gender: true, address: true, username: true, contactNumber: true, email: true }
    });
    return NextResponse.json(admins);
  }

  if (session?.user?.role === "ADMIN") {
    const users = await prisma.user.findMany({
      orderBy: { userId: "desc" },
      select: { userId: true, name: true, birthdate: true, gender: true, address: true, username: true, contactNumber: true, email: true }
    });
    return NextResponse.json(users);
  }

  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { userId: Number(session.user.id) },
    select: { userId: true, name: true, birthdate: true, gender: true, address: true, username: true, contactNumber: true, email: true }
  });
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const admin = await prisma.admin.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      password: md5(data.password),
      contactNumber: data.contactNumber,
      gender: data.gender,
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
      address: data.address || null
    }
  });
  return NextResponse.json(admin);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.user.update({
    where: { userId: Number(session.user.id) },
    data: {
      name: data.name,
      email: data.email,
      contactNumber: data.contactNumber,
      gender: data.gender,
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
      address: data.address || null,
      ...(data.password ? { password: md5(data.password) } : {})
    },
    select: { userId: true, name: true, birthdate: true, gender: true, address: true, username: true, contactNumber: true, email: true }
  });

  return NextResponse.json(updated);
}
