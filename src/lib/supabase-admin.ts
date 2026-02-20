// Server-side Supabase client using the service_role key.
// Bypasses RLS — use only in API routes, never expose to the client.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || "placeholder-service-key";

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
