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

  const sent = await sendEmail({
    to: recipient,
    subject: "Barangay GO Email Test",
    html: "<p>This is a live email test from Barangay GO.</p>",
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Email could not be sent. Check the configured mail transport." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, recipient });
}
