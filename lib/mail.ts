import nodemailer from "nodemailer";

export async function sendMail(subject: string, html: string, to?: string) {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    console.info("[mail skipped]", subject);
    return;
  }

  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: to || process.env.EMAIL_FROM,
    subject,
    html
  });
}
