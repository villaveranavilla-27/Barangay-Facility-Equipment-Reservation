const APP_URL_CANDIDATES = [
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_API_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
];

function normalizeAppOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function getAppOrigin(fallback?: string | null) {
  for (const candidate of [...APP_URL_CANDIDATES, fallback]) {
    const origin = normalizeAppOrigin(candidate);

    if (origin) {
      return origin;
    }
  }

  return null;
}

export function getAppUrl(path: string, fallback?: string | null) {
  const origin = getAppOrigin(fallback);

  if (!origin) {
    return null;
  }

  return new URL(path, `${origin}/`).toString();
}
