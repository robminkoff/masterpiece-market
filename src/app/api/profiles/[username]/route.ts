import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getProfileByUsername,
  getProfile,
  getOwnershipsByOwner,
  getProvenanceByOwner,
  getArtworksByOwner,
  getCredits,
} from "@/lib/db";
import type { ArtworkOwnerInfo, EnrichedArtwork, ProfileEntity } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/profiles/[username] — look up user profile by username
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // Look up profile by username
  const profile = await getProfileByUsername(username);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = profile.id;
  const [ownerships, provenance, ownedArtworks] = await Promise.all([
    getOwnershipsByOwner(userId),
    getProvenanceByOwner(userId),
    getArtworksByOwner(userId),
  ]);

  const playerOwnerInfo: ArtworkOwnerInfo = {
    owner_id: userId,
    owner_type: "user",
    display_name: profile.display_name,
    slug: profile.username ?? username,
    acquired_at: "",
  };

  const artworks: EnrichedArtwork[] = ownedArtworks.map((art) => {
    const own = ownerships.find((o) => o.artwork_id === art.id);
    return {
      ...art,
      owner: { ...playerOwnerInfo, acquired_at: own?.acquired_at ?? "" },
    };
  });

  const entity: ProfileEntity = {
    kind: "user",
    profile: {
      ...profile,
      last_active: profile.last_active ?? new Date().toISOString(),
    },
    ownerships,
    provenance,
  };

  return NextResponse.json({ entity, artworks });
}
