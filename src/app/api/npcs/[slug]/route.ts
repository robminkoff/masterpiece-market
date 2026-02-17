import { NextResponse } from "next/server";
import { SEED_NPCS, SEED_OWNERSHIPS, SEED_PROVENANCE_EVENTS, SEED_ARTWORKS } from "@/data/seed";
import type { ProfileEntity } from "@/lib/types";

// GET /api/npcs/[slug] — look up NPC by slug (seed data)
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const npc = SEED_NPCS.find((n) => n.slug === slug);
  if (!npc) {
    return NextResponse.json({ error: "NPC not found" }, { status: 404 });
  }

  const ownerships = SEED_OWNERSHIPS.filter((o) => o.owner_id === npc.id);
  const provenance = SEED_PROVENANCE_EVENTS.filter(
    (e) => e.from_owner === npc.id || e.to_owner === npc.id,
  );

  const ownedArtworks = ownerships
    .map((o) => SEED_ARTWORKS.find((a) => a.id === o.artwork_id))
    .filter(Boolean);

  const entity: ProfileEntity = {
    kind: "npc",
    npc,
    ownerships,
    provenance,
  };

  return NextResponse.json({ entity, artworks: ownedArtworks });
}
