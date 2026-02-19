import { NextResponse } from "next/server";
import { getPlayerProfile, setPlayerProfile } from "@/data/store";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/account — return current player profile (or null)
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ profile: getPlayerProfile() });
}

// POST /api/account — create or update player profile
export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, display_name } = body as {
    username?: string;
    display_name?: string;
  };

  // Validate username: 3-20 chars, lowercase alphanumeric + hyphens
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 20 ||
    !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(username)
  ) {
    return NextResponse.json(
      { error: "Username must be 3-20 lowercase alphanumeric characters or hyphens, and cannot start/end with a hyphen." },
      { status: 400 },
    );
  }

  // Validate display name: 1-40 chars
  if (
    typeof display_name !== "string" ||
    display_name.trim().length < 1 ||
    display_name.trim().length > 40
  ) {
    return NextResponse.json(
      { error: "Display name must be 1-40 characters." },
      { status: 400 },
    );
  }

  const profile = setPlayerProfile(username, display_name.trim());
  return NextResponse.json({ profile });
}
