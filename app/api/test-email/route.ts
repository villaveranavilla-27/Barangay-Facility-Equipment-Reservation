import { NextResponse } from "next/server";
import { getDefaultMailRecipient, sendEmail } from "@/lib/mail";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipient = searchParams.get("to")?.trim() || getDefaultMailRecipient();

  if (!recipient) {
    return NextResponse.json(
      {
        error:
          "No recipient configured. Add a ?to=email@example.com query or configure EMAIL_FROM.",
      },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: recipient,
    subject: "Barangay GO Email Test",
    html: "<p>This is a live email test from Barangay GO.</p>",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, recipient });
}
