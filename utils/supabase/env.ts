const SUPABASE_URL_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
] as const;

const SUPABASE_PUBLISHABLE_KEY_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

function readTrimmedEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readFirstDefinedEnv(names: readonly string[]) {
  for (const name of names) {
    const value = readTrimmedEnv(name);
    if (value) {
      return value;
    }
  }

  return null;
}

function toSupabaseUrl(projectRef: string) {
  return `https://${projectRef}.supabase.co`;
}

function extractProjectRefFromConnectionString(connectionString: string) {
  try {
    const parsed = new URL(connectionString);

    const apiHostMatch = parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    if (apiHostMatch) {
      return apiHostMatch[1];
    }

    const directHostMatch = parsed.hostname.match(
      /^db\.([a-z0-9]+)\.supabase\.co$/i
    );
    if (directHostMatch) {
      return directHostMatch[1];
    }

    if (parsed.hostname.endsWith(".pooler.supabase.com")) {
      const poolerUserMatch = parsed.username.match(/^postgres\.([a-z0-9]+)$/i);
      if (poolerUserMatch) {
        return poolerUserMatch[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function deriveSupabaseUrlOnServer() {
  for (const connectionString of [
    readTrimmedEnv("DIRECT_URL"),
    readTrimmedEnv("DATABASE_URL"),
  ]) {
    if (!connectionString) {
      continue;
    }

    const projectRef = extractProjectRefFromConnectionString(connectionString);
    if (projectRef) {
      return toSupabaseUrl(projectRef);
    }
  }

  return null;
}

export function getSupabaseEnv() {
  const supabaseUrl =
    readFirstDefinedEnv(SUPABASE_URL_ENV_NAMES) ??
    (typeof window === "undefined" ? deriveSupabaseUrlOnServer() : null);
  const supabasePublishableKey = readFirstDefinedEnv(
    SUPABASE_PUBLISHABLE_KEY_ENV_NAMES
  );

  if (!supabaseUrl || !supabasePublishableKey) {
    const missingVariables = [];

    if (!supabaseUrl) {
      missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!supabasePublishableKey) {
      missingVariables.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }

    throw new Error(
      `Missing Supabase environment variables: ${missingVariables.join(", ")}.`
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
