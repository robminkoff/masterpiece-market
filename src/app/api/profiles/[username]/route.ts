import { NextResponse } from "next/server";
import { STUB_USER, STUB_USER_ID } from "@/lib/supabase";
import { SEED_ARTWORKS, DEMO_COLLECTOR_ID } from "@/data/seed";

export const dynamic = "force-dynamic";
import { ownerships, provenanceEvents, getPlayerProfile, getCredits } from "@/data/store";
import type { Ownership, ProvenanceEvent, ProfileEntity, ArtworkOwnerInfo, EnrichedArtwork } from "@/lib/types";

// ---------- Demo collector ----------

const DEMO_USER_ID = DEMO_COLLECTOR_ID;
const DEMO_USERNAME = "demo-collector";
const DEMO_DISPLAY_NAME = "Eleanor Voss";
const DEMO_CREATED = "2025-06-15T10:00:00Z";

const DEMO_ARTWORK_IDS = ["art-001", "art-004", "art-010", "art-015"];

function getDemoData() {
  const demoOwnerships: Ownership[] = DEMO_ARTWORK_IDS.map((artId, i) => ({
    id: `demo-own-${i}`,
    artwork_id: artId,
    owner_id: DEMO_USER_ID,
    acquired_at: new Date(Date.now() - (90 - i * 20) * 86400000).toISOString(),
    acquired_via: i % 2 === 0 ? "auction" : "purchase",
    is_active: true,
    idle_weeks: Math.max(0, i - 2),
    on_loan: i === 1,
  }));

  const demoProvenance: ProvenanceEvent[] = [
    ...DEMO_ARTWORK_IDS.map((artId, i) => ({
      id: `demo-prov-${i}`,
      artwork_id: artId,
      event_type: "purchase" as const,
      from_owner: i % 2 === 0 ? null : `npc-d0${(i % 6) + 1}`,
      to_owner: DEMO_USER_ID,
      price: SEED_ARTWORKS.find((a) => a.id === artId)?.insured_value ?? 50_000,
      metadata: i % 2 === 0 ? { source: "evening auction" } : { dealer: "Galleria North" },
      created_at: new Date(Date.now() - (90 - i * 20) * 86400000).toISOString(),
    })),
    {
      id: "demo-prov-loan-1",
      artwork_id: "art-004",
      event_type: "loan",
      from_owner: DEMO_USER_ID,
      to_owner: "npc-c01",
      price: null,
      metadata: { curator: "Mina Kline", exhibition: "Waves & Wonders" },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const demoOwnerInfo: ArtworkOwnerInfo = {
    owner_id: DEMO_USER_ID,
    owner_type: "user",
    display_name: DEMO_DISPLAY_NAME,
    slug: DEMO_USERNAME,
    acquired_at: DEMO_CREATED,
  };

  const demoArtworks: EnrichedArtwork[] = DEMO_ARTWORK_IDS
    .map((id) => SEED_ARTWORKS.find((a) => a.id === id))
    .filter((a): a is (typeof SEED_ARTWORKS)[number] => !!a)
    .map((a) => ({ ...a, owner: { ...demoOwnerInfo, acquired_at: demoOwnerships.find((o) => o.artwork_id === a.id)?.acquired_at ?? DEMO_CREATED } }));

  const entity: ProfileEntity = {
    kind: "user",
    profile: {
      id: DEMO_USER_ID,
      username: DEMO_USERNAME,
      display_name: DEMO_DISPLAY_NAME,
      tier: "connoisseur",
      credits: 142_500,
      prestige: 68,
      stewardship: 74,
      created_at: DEMO_CREATED,
      last_active: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    ownerships: demoOwnerships,
    provenance: demoProvenance,
  };

  return { entity, artworks: demoArtworks };
}

// ---------- Route handler ----------

// GET /api/profiles/[username] — look up user profile by username (live store data)
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // Demo collector
  if (username === DEMO_USERNAME) {
    const demo = getDemoData();
    return NextResponse.json(demo);
  }

  const profile = getPlayerProfile();

  // Match against the live player profile username, or fall back to STUB_USER for compatibility
  const matchUsername = profile?.username ?? STUB_USER.username;
  if (username !== matchUsername) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const playerOwnerships = ownerships.filter((o) => o.owner_id === STUB_USER_ID);
  const playerProvenance = provenanceEvents.filter(
    (e) => e.from_owner === STUB_USER_ID || e.to_owner === STUB_USER_ID,
  );

  // Attach artwork objects with owner info for the client
  const playerOwnerInfo: ArtworkOwnerInfo = {
    owner_id: STUB_USER_ID,
    owner_type: "user",
    display_name: profile?.display_name ?? STUB_USER.display_name,
    slug: matchUsername,
    acquired_at: "",
  };

  const ownedArtworks: EnrichedArtwork[] = playerOwnerships
    .map((o) => {
      const art = SEED_ARTWORKS.find((a) => a.id === o.artwork_id);
      if (!art) return null;
      return { ...art, owner: { ...playerOwnerInfo, acquired_at: o.acquired_at } };
    })
    .filter(Boolean) as EnrichedArtwork[];

  const entity: ProfileEntity = {
    kind: "user",
    profile: {
      ...STUB_USER,
      username: matchUsername,
      display_name: profile?.display_name ?? STUB_USER.display_name,
      credits: getCredits(),
      created_at: profile?.created_at ?? new Date().toISOString(),
      last_active: new Date().toISOString(),
    },
    ownerships: playerOwnerships,
    provenance: playerProvenance,
  };

  return NextResponse.json({ entity, artworks: ownedArtworks });
}
