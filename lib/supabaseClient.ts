import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/utils/supabase/env";

export function createSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabasePublishableKey);
}

export function createSupabaseAdminClient() {
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY for admin Supabase access."
    );
  }

  return createClient(getSupabaseEnv().supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
