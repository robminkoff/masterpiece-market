import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getProfile,
  updateProfile,
  getOwnershipsByOwner,
  generatePackageArtwork,
  adjustCredits,
} from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/account — return current player profile (or null)
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  return NextResponse.json({ profile });
}

// POST /api/account — create or update player profile
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
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

  const profile = await updateProfile(userId, {
    username,
    display_name: display_name.trim(),
  });

  // Gift a generated D-tier artwork on first profile setup (idempotent)
  let giftedArtworkId: string | null = null;
  try {
    const existing = await getOwnershipsByOwner(userId);
    if (existing.length === 0) {
      const artwork = await generatePackageArtwork("D");
      const ownId = `own-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { error: ownErr } = await supabaseAdmin.from("ownerships").insert({
        id: ownId,
        artwork_id: artwork.id,
        owner_id: userId,
        acquired_via: "signup_gift",
        is_active: true,
        idle_weeks: 0,
        on_loan: false,
      });
      if (ownErr) throw ownErr;
      await adjustCredits(userId, 0, `Signup gift: ${artwork.title}`);
      giftedArtworkId = artwork.id;
    }
  } catch (err) {
    console.error("Signup gift failed:", err);
  }

  return NextResponse.json({ profile, gifted_artwork_id: giftedArtworkId });
}
