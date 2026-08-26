import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase sisi browser untuk static export.
 * Hanya anon key (dirancang publik, dilindungi RLS) — tanpa env,
 * app tetap jalan dan fitur turun ke jalur fallback.
 */

let client: SupabaseClient | null = null;

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
