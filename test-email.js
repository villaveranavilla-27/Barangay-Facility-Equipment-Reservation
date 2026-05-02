import nodemailer from "nodemailer";

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

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "villaveranavilla@gmail.com",
      subject: "Test Email",
      text: "If you see this, your email config works.",
    });

    console.log("Email sent:", info);
  } catch (error) {
    console.error("Email error:", error);
  }
}

testEmail();
