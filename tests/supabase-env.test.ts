import assert from "node:assert/strict";
import { getSupabaseEnv } from "../utils/supabase/env";

const TEST_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "DIRECT_URL",
] as const;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function withEnv(
  env: Partial<Record<(typeof TEST_ENV_KEYS)[number], string>>,
  fn: () => void
) {
  const previousValues = new Map<string, string | undefined>();

  for (const key of TEST_ENV_KEYS) {
    previousValues.set(key, process.env[key]);
    delete process.env[key];
  }

  try {
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }

    fn();
  } finally {
    for (const key of TEST_ENV_KEYS) {
      const previousValue = previousValues.get(key);
      if (typeof previousValue === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  }
}

runTest("uses explicit public Supabase variables when present", () => {
  withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: "https://explicit-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "explicit-key",
      DIRECT_URL:
        "postgresql://postgres.fallback:password@db.fallback.supabase.co:5432/postgres",
    },
    () => {
      const env = getSupabaseEnv();

      assert.equal(env.supabaseUrl, "https://explicit-project.supabase.co");
      assert.equal(env.supabasePublishableKey, "explicit-key");
    }
  );
});

runTest("derives the Supabase URL from DIRECT_URL when the public URL is missing", () => {
  withEnv(
    {
      DIRECT_URL:
        "postgresql://postgres.jlymymrpibojggixzxar:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    },
    () => {
      const env = getSupabaseEnv();

      assert.equal(
        env.supabaseUrl,
        "https://jlymymrpibojggixzxar.supabase.co"
      );
      assert.equal(env.supabasePublishableKey, "publishable-key");
    }
  );
});

runTest("derives the Supabase URL from pooled DATABASE_URL when DIRECT_URL is unavailable", () => {
  withEnv(
    {
      DATABASE_URL:
        "postgresql://postgres.jlymymrpibojggixzxar:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    },
    () => {
      const env = getSupabaseEnv();

      assert.equal(
        env.supabaseUrl,
        "https://jlymymrpibojggixzxar.supabase.co"
      );
    }
  );
});

runTest("accepts the anon key fallback when the publishable key variable name differs", () => {
  withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: "https://explicit-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    },
    () => {
      const env = getSupabaseEnv();

      assert.equal(env.supabasePublishableKey, "anon-key");
    }
  );
});

runTest("throws a targeted error when the publishable key is missing", () => {
  withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: "https://explicit-project.supabase.co",
    },
    () => {
      assert.throws(
        () => getSupabaseEnv(),
        /Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\./
      );
    }
  );
});

console.log("Supabase env tests completed successfully.");
