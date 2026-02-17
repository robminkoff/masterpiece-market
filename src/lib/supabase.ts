// Supabase client — stubbed for v0
// TODO: Replace with real Supabase client when project is set up
//
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// For v0, we use in-memory data from seed. This file exists so that the
// import path is stable and can be swapped to a real client later.

export const STUB_USER_ID = "00000000-0000-0000-0000-000000000001";
export const STUB_USER: {
  id: string;
  display_name: string;
  tier: import("./types").PlayerTier;
  credits: number;
  prestige: number;
  stewardship: number;
} = {
  id: STUB_USER_ID,
  display_name: "Dev Player",
  tier: "beginner",
  credits: 10_000,
  prestige: 0,
  stewardship: 0,
};
