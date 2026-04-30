import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

type MailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

let transporter: any = null;

function getMailConfig(): MailConfig | null {
  const user = process.env.EMAIL_USER?.trim() || process.env.GMAIL_USER?.trim();
  const pass =
    process.env.EMAIL_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
  const host = process.env.EMAIL_HOST?.trim() || (user && pass ? "smtp.gmail.com" : undefined);
  const portValue = process.env.EMAIL_PORT?.trim() || (user && pass ? "587" : undefined);
  const from = process.env.EMAIL_FROM?.trim() || user || null;

  if (!host || !portValue || !user || !pass || !from) {
    return null;
  }

  const port = Number(portValue);
  if (!Number.isFinite(port)) {
    return null;
  }

  return { host, port, user, pass, from };
}

function getTransporter(config: MailConfig) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const config = getMailConfig();

  if (!config) {
    console.info(
      "[mail skipped]",
      subject,
      "Missing Gmail mail configuration."
    );
    return;
  }

  try {
    await getTransporter(config).sendMail({
      from: config.from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[mail failed]", subject, error);
  }
}

export async function sendMail(subject: string, html: string, to?: string) {
  const fallbackRecipient =
    to?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_USER?.trim() ||
    process.env.GMAIL_USER?.trim();

  if (!fallbackRecipient) {
    console.info("[mail skipped]", subject, "Missing recipient email.");
    return;
  }

  await sendEmail({
    to: fallbackRecipient,
    subject,
    html,
  });
}
