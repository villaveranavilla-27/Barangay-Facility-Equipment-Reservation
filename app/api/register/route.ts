import { NextResponse } from "next/server";
import { database as prisma } from "@/lib/database";
import { registerSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
      select: { adminId: true },
    });

    if (existing || existingAdmin) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: md5(data.password),
        contactNumber: data.contactNumber,
        gender: data.gender,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        address: data.address || null,
      },
    });

    return NextResponse.json({ ok: true, userId: user.userId });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong while creating account" },
      { status: 500 }
    );
  }
}
