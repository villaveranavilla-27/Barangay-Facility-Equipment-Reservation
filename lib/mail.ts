import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

type MailConfig = {
  from: string;
  transport: string | Record<string, unknown>;
  cacheKey: string;
};

let transporter: any = null;
let transporterCacheKey = "";

function parseSecureFlag(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  return null;
}

function getSmtpCredentialConfig() {
  const user = process.env.EMAIL_USER?.trim() || process.env.GMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
  const host = process.env.EMAIL_HOST?.trim() || (user && pass ? "smtp.gmail.com" : undefined);
  const portValue = process.env.EMAIL_PORT?.trim() || (user && pass ? "587" : undefined);

  if (!host || !portValue || !user || !pass) {
    return null;
  }

  const port = Number(portValue);
  if (!Number.isFinite(port)) {
    return null;
  }

  const secureOverride = parseSecureFlag(process.env.EMAIL_SECURE);
  const secure = secureOverride ?? port === 465;

  return {
    user,
    host,
    port,
    secure,
    transport: {
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    },
  };
}

function getMailConfig(): MailConfig | null {
  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_USER?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    null;
  const server = process.env.EMAIL_SERVER?.trim();

  if (server && from) {
    return {
      from,
      transport: server,
      cacheKey: `url:${server}`,
    };
  }

  const smtpConfig = getSmtpCredentialConfig();
  if (!smtpConfig || !from) {
    return null;
  }

  return {
    from,
    transport: smtpConfig.transport,
    cacheKey: `smtp:${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}:${smtpConfig.secure}`,
  };
}

function getTransporter(config: MailConfig) {
  if (!transporter || transporterCacheKey !== config.cacheKey) {
    transporter = nodemailer.createTransport(config.transport as any);
    transporterCacheKey = config.cacheKey;
  }

  return transporter;
}

export function getDefaultMailRecipient() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_USER?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    null
  );
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((value) => value.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.info("[mail skipped]", subject, "Missing recipient email.");
    return false;
  }

  const config = getMailConfig();

  if (!config) {
    console.info(
      "[mail skipped]",
      subject,
      "Missing mail configuration. Set EMAIL_SERVER or EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS."
    );
    return false;
  }

  try {
    await getTransporter(config).sendMail({
      from: config.from,
      to: recipients.join(", "),
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("[mail failed]", subject, error);
    return false;
  }
}

export async function sendMail(subject: string, html: string, to?: string) {
  const fallbackRecipient = to?.trim() || getDefaultMailRecipient();

  if (!fallbackRecipient) {
    console.info("[mail skipped]", subject, "Missing recipient email.");
    return false;
  }

  return sendEmail({
    to: fallbackRecipient,
    subject,
    html,
  });
}
