import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] }
  });

  if (existing) {
    return NextResponse.json({ error: "Email or username already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      password: md5(data.password),
      contactInfo: data.contactInfo,
      gender: data.gender,
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
      address: data.address || null
    }
  });

  return NextResponse.json({ ok: true, userId: user.userId });
}
