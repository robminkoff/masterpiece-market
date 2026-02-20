// Extract the authenticated user's UUID from the Supabase session cookie.

import { createSupabaseServer } from "@/lib/supabase-server";

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
