import { NextResponse } from "next/server";
import { STUB_USER, STUB_USER_ID } from "@/lib/supabase";
import { SEED_OWNERSHIPS, SEED_PROVENANCE_EVENTS, SEED_ARTWORKS } from "@/data/seed";
import type { ProfileEntity } from "@/lib/types";

// GET /api/profiles/[username] — look up user profile by username (seed data)
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // For v0, only the stub user exists
  if (username !== STUB_USER.username) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ownerships = SEED_OWNERSHIPS.filter((o) => o.owner_id === STUB_USER_ID);
  const provenance = SEED_PROVENANCE_EVENTS.filter(
    (e) => e.from_owner === STUB_USER_ID || e.to_owner === STUB_USER_ID,
  );

  // Attach artwork objects to ownerships for the client
  const ownedArtworks = ownerships
    .map((o) => SEED_ARTWORKS.find((a) => a.id === o.artwork_id))
    .filter(Boolean);

  const entity: ProfileEntity = {
    kind: "user",
    profile: {
      ...STUB_USER,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    },
    ownerships,
    provenance,
  };

  return NextResponse.json({ entity, artworks: ownedArtworks });
}
