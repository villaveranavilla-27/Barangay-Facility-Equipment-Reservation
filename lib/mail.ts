import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

type SendEmailResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

type MailConfig = {
  from: string;
  host: string;
  port: number;
  secure: false;
  user: string;
  transport: {
    host: string;
    port: number;
    secure: false;
    auth: {
      user: string;
      pass: string;
    };
  };
  cacheKey: string;
};

type MailConfigResult =
  | {
      ok: true;
      config: MailConfig;
    }
  | {
      ok: false;
      error: string;
    };

const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 587;
const legacyEnvWarnings = new Set<string>();

let transporter: any = null;
let transporterCacheKey = "";

function getTrimmedEnvValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function warnLegacyEnvUsage(legacyName: string, replacement: string) {
  if (legacyEnvWarnings.has(legacyName)) {
    return;
  }

  legacyEnvWarnings.add(legacyName);
  console.warn(
    `[mail config] ${legacyName} is deprecated. Rename it to ${replacement}.`
  );
}

function readMailEnv(name: string, legacyNames: string[] = []) {
  const directValue = getTrimmedEnvValue(name);
  if (directValue) {
    return directValue;
  }

  for (const legacyName of legacyNames) {
    const legacyValue = getTrimmedEnvValue(legacyName);
    if (!legacyValue) {
      continue;
    }

    warnLegacyEnvUsage(legacyName, name);
    return legacyValue;
  }

  return null;
}

function parseLegacyEmailServer() {
  const server = getTrimmedEnvValue("EMAIL_SERVER");
  if (!server) {
    return null;
  }

  warnLegacyEnvUsage(
    "EMAIL_SERVER",
    "EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS"
  );

  try {
    const parsed = new URL(server);
    return {
      host: parsed.hostname || null,
      user: parsed.username ? decodeURIComponent(parsed.username) : null,
      pass: parsed.password ? decodeURIComponent(parsed.password) : null,
    };
  } catch {
    console.error(
      "[mail config] EMAIL_SERVER could not be parsed. Replace it with EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS."
    );
    return null;
  }
}

function getMailFromValue() {
  return getTrimmedEnvValue("EMAIL_FROM") || readMailEnv("EMAIL_USER", ["GMAIL_USER"]);
}

function extractEmailAddress(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim() || null;
}

function getMailConfig(): MailConfigResult {
  if (getTrimmedEnvValue("EMAIL_SECURE")) {
    warnLegacyEnvUsage("EMAIL_SECURE", "remove it and use EMAIL_PORT=587");
  }

  const legacyServerConfig = parseLegacyEmailServer();
  const user = readMailEnv("EMAIL_USER", ["GMAIL_USER"]) || legacyServerConfig?.user;
  const pass = readMailEnv("EMAIL_PASS", ["GMAIL_APP_PASSWORD"]) || legacyServerConfig?.pass;
  const from = getMailFromValue();
  const host = getTrimmedEnvValue("EMAIL_HOST") || legacyServerConfig?.host || GMAIL_SMTP_HOST;
  const portValue = getTrimmedEnvValue("EMAIL_PORT") || String(GMAIL_SMTP_PORT);

  const missingKeys: string[] = [];
  if (!user) {
    missingKeys.push("EMAIL_USER");
  }
  if (!pass) {
    missingKeys.push("EMAIL_PASS");
  }
  if (!from) {
    missingKeys.push("EMAIL_FROM");
  }

  if (missingKeys.length > 0) {
    return {
      ok: false,
      error: `Missing mail configuration: ${missingKeys.join(
        ", "
      )}. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.`,
    };
  }

  const resolvedFrom = from!;
  const resolvedUser = user!;
  const resolvedPass = pass!;

  const port = Number(portValue);
  if (!Number.isInteger(port)) {
    return {
      ok: false,
      error: `Invalid EMAIL_PORT value "${portValue}". Gmail SMTP must use port ${GMAIL_SMTP_PORT}.`,
    };
  }

  if (host.toLowerCase() !== GMAIL_SMTP_HOST) {
    return {
      ok: false,
      error: `Invalid EMAIL_HOST value "${host}". Gmail SMTP must use ${GMAIL_SMTP_HOST}.`,
    };
  }

  if (port !== GMAIL_SMTP_PORT) {
    return {
      ok: false,
      error: `Invalid EMAIL_PORT value "${port}". Gmail SMTP must use port ${GMAIL_SMTP_PORT} with secure=false.`,
    };
  }

  return {
    ok: true,
    config: {
      from: resolvedFrom,
      host,
      port,
      secure: false,
      user: resolvedUser,
      transport: {
        host,
        port,
        secure: false,
        auth: {
          user: resolvedUser,
          pass: resolvedPass,
        },
      },
      cacheKey: `smtp:${host}:${port}:${resolvedUser}`,
    },
  };
}

function getTransporter(config: MailConfig) {
  if (!transporter || transporterCacheKey !== config.cacheKey) {
    transporter = nodemailer.createTransport(config.transport);
    transporterCacheKey = config.cacheKey;
  }

  return transporter;
}

export function getDefaultMailRecipient() {
  return (
    extractEmailAddress(readMailEnv("EMAIL_USER", ["GMAIL_USER"])) ||
    extractEmailAddress(getTrimmedEnvValue("EMAIL_FROM"))
  );
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((value) => value.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    const error = "Missing recipient email.";
    console.error("[mail skipped]", subject, error);
    return { ok: false, error };
  }

  const configResult = getMailConfig();
  if (!configResult.ok) {
    console.error("[mail config invalid]", subject, configResult.error);
    return configResult;
  }

  try {
    await getTransporter(configResult.config).sendMail({
      from: configResult.config.from,
      to: recipients.join(", "),
      subject,
      html,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail transport error.";

    console.error("[mail failed]", {
      subject,
      recipients,
      host: configResult.config.host,
      port: configResult.config.port,
      from: configResult.config.from,
      error,
    });

    return {
      ok: false,
      error: `Email delivery failed: ${message}`,
    };
  }
}

export async function sendMail(subject: string, html: string, to?: string) {
  const fallbackRecipient = to?.trim() || getDefaultMailRecipient();

  if (!fallbackRecipient) {
    const error = "Missing recipient email.";
    console.error("[mail skipped]", subject, error);
    return { ok: false, error } as const;
  }

  return sendEmail({
    to: fallbackRecipient,
    subject,
    html,
  });
}
