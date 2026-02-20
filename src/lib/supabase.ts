import { createBrowserClient } from "@supabase/ssr";

// ---------------------------------------------------------------------------
// Supabase browser client (safe for client components)
// ---------------------------------------------------------------------------

// Fallback placeholders allow `next build` to succeed without real env vars.
// The app will not connect to Supabase until valid values are provided at runtime.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export function createSupabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
