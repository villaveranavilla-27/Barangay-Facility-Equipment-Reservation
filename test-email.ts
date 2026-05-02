import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: "villaveranavilla@gmail.com",
    subject: "Test Email",
    text: "If you receive this, email works.",
  });

  console.log("Email sent");
}

testEmail().catch(console.error);