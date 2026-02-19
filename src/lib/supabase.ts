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

// ---------------------------------------------------------------------------
// In-memory stub user (used by 13+ game-logic files — keep unchanged)
// ---------------------------------------------------------------------------

export const STUB_USER_ID = "00000000-0000-0000-0000-000000000001";
export const STUB_USER: {
  id: string;
  username: string;
  display_name: string;
  tier: import("./types").PlayerTier;
  credits: number;
  prestige: number;
  stewardship: number;
} = {
  id: STUB_USER_ID,
  username: "dev-player",
  display_name: "Dev Player",
  tier: "emerging",
  credits: 250_000,
  prestige: 0,
  stewardship: 0,
};
