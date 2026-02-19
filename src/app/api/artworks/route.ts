import { NextRequest, NextResponse } from "next/server";
import { SEED_ARTWORKS, SEED_NPCS, DEMO_COLLECTOR_ID } from "@/data/seed";
import { ownerships, provenanceEvents } from "@/data/store";
import { STUB_USER_ID } from "@/lib/supabase";
import { getPlayerProfile } from "@/data/store";
import { dealerAskingPrice } from "@/lib/types";
import type { ArtworkLoanInfo, ArtworkOwnerInfo, EnrichedArtwork } from "@/lib/types";

function buildOwnerInfo(ownership: (typeof ownerships)[number]): ArtworkOwnerInfo {
  if (ownership.owner_id === STUB_USER_ID) {
    const profile = getPlayerProfile();
    return {
      owner_id: STUB_USER_ID,
      owner_type: "user",
      display_name: profile?.display_name ?? "Player",
      slug: profile?.username ?? "player",
      acquired_at: ownership.acquired_at,
    };
  }

  if (ownership.owner_id === DEMO_COLLECTOR_ID) {
    return {
      owner_id: DEMO_COLLECTOR_ID,
      owner_type: "user",
      display_name: "Eleanor Voss",
      slug: "demo-collector",
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
  const loanEvent = provenanceEvents
    .filter((e) => e.artwork_id === artworkId && (e.event_type === "loan" || e.event_type === "exhibition"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!loanEvent) return undefined;

  const meta = loanEvent.metadata as Record<string, string>;
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

function enrichArtwork(artwork: (typeof SEED_ARTWORKS)[number]): EnrichedArtwork & { dealer_price?: number } {
  const ownership = ownerships.find(
    (o) => o.artwork_id === artwork.id && o.is_active,
  );

  const owner = ownership ? buildOwnerInfo(ownership) : undefined;
  const loan = ownership?.on_loan ? buildLoanInfo(artwork.id) : undefined;

  // Add dealer price when owner is a dealer NPC
  let dealer_price: number | undefined;
  if (ownership && owner?.role === "dealer") {
    dealer_price = dealerAskingPrice(artwork.insured_value, ownership.owner_id);
  }

  return { ...artwork, owner, loan, dealer_price };
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
    const provenance = provenanceEvents
      .filter((e) => e.artwork_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ artwork: enriched, provenance });
  }

  const artworks = SEED_ARTWORKS.map(enrichArtwork);
  return NextResponse.json({ artworks });
}
