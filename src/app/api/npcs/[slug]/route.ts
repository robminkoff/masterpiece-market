import { NextResponse } from "next/server";
import {
  getNpcBySlug,
  getOwnershipsByOwner,
  getProvenanceByOwner,
  getArtworksByOwner,
} from "@/lib/db";
import type { ProfileEntity } from "@/lib/types";

// GET /api/npcs/[slug] — look up NPC by slug
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const npc = await getNpcBySlug(slug);
  if (!npc) {
    return NextResponse.json({ error: "NPC not found" }, { status: 404 });
  }

  const [ownerships, provenance, ownedArtworks] = await Promise.all([
    getOwnershipsByOwner(npc.id),
    getProvenanceByOwner(npc.id),
    getArtworksByOwner(npc.id),
  ]);

  const entity: ProfileEntity = {
    kind: "npc",
    npc,
    ownerships,
    provenance,
  };

  return NextResponse.json({ entity, artworks: ownedArtworks });
}
