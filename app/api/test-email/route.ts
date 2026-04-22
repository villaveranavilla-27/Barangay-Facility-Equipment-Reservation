import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function GET() {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Test App" <no-reply@example.com>',
    to: "test@example.com",
    subject: "Test Email",
    text: "This is a test email.",
  });

  return NextResponse.json({
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  });
}