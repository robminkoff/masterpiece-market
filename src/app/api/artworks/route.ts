import { NextRequest, NextResponse } from "next/server";
import { SEED_ARTWORKS, SEED_OWNERSHIPS, SEED_NPCS, SEED_PROVENANCE_EVENTS } from "@/data/seed";
import { STUB_USER_ID, STUB_USER } from "@/lib/supabase";
import type { ArtworkLoanInfo, ArtworkOwnerInfo, EnrichedArtwork } from "@/lib/types";

function buildOwnerInfo(ownership: (typeof SEED_OWNERSHIPS)[number]): ArtworkOwnerInfo {
  if (ownership.owner_id === STUB_USER_ID) {
    return {
      owner_id: STUB_USER_ID,
      owner_type: "user",
      display_name: STUB_USER.display_name,
      slug: STUB_USER.username,
      acquired_at: ownership.acquired_at,
    };
  }

  const npc = SEED_NPCS.find((n) => n.id === ownership.owner_id);
  if (npc) {
    return {
      owner_id: npc.id,
      owner_type: "npc",
      display_name: npc.name,
      slug: npc.slug,
      role: npc.role,
      npc_tier: npc.npc_tier,
      acquired_at: ownership.acquired_at,
    };
  }

  return {
    owner_id: ownership.owner_id,
    owner_type: "user",
    display_name: "Unknown",
    slug: "unknown",
    acquired_at: ownership.acquired_at,
  };
}

function buildLoanInfo(artworkId: string): ArtworkLoanInfo | undefined {
  // Find the most recent loan or exhibition event for this artwork
  const loanEvent = SEED_PROVENANCE_EVENTS
    .filter((e) => e.artwork_id === artworkId && (e.event_type === "loan" || e.event_type === "exhibition"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!loanEvent) return undefined;

  const meta = loanEvent.metadata as Record<string, string>;

  // The borrower is to_owner for loans, from_owner for exhibitions (the exhibitor)
  const borrowerId = loanEvent.event_type === "loan" ? loanEvent.to_owner : loanEvent.from_owner;
  if (!borrowerId) return undefined;

  const borrowerNpc = SEED_NPCS.find((n) => n.id === borrowerId);
  if (!borrowerNpc) return undefined;

  return {
    borrower_id: borrowerNpc.id,
    borrower_name: borrowerNpc.name,
    borrower_slug: borrowerNpc.slug,
    exhibition_title: meta.exhibition,
  };
}

function enrichArtwork(artwork: (typeof SEED_ARTWORKS)[number]): EnrichedArtwork {
  const ownership = SEED_OWNERSHIPS.find(
    (o) => o.artwork_id === artwork.id && o.is_active,
  );

  const owner = ownership ? buildOwnerInfo(ownership) : undefined;
  // Only build loan info if the artwork is actually on loan
  const loan = ownership?.on_loan ? buildLoanInfo(artwork.id) : undefined;

  return { ...artwork, owner, loan };
}

// GET /api/artworks — list all artworks, or single artwork with ?id=
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const artwork = SEED_ARTWORKS.find((a) => a.id === id);
    if (!artwork) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
    }
    const enriched = enrichArtwork(artwork);
    const provenance = SEED_PROVENANCE_EVENTS
      .filter((e) => e.artwork_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json({ artwork: enriched, provenance });
  }

  const artworks: EnrichedArtwork[] = SEED_ARTWORKS.map(enrichArtwork);
  return NextResponse.json({ artworks });
}
