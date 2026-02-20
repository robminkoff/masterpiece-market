import { NextRequest, NextResponse } from "next/server";
import {
  getArtworks,
  getArtwork,
  getAllActiveOwnerships,
  getProvenanceByArtwork,
  getNpcs,
  getProfile,
} from "@/lib/db";
import { dealerAskingPrice } from "@/lib/types";
import type { ArtworkLoanInfo, ArtworkOwnerInfo, EnrichedArtwork, Npc, Ownership, ProvenanceEvent } from "@/lib/types";

function buildOwnerInfo(
  ownership: Ownership,
  npcs: Npc[],
  profileCache: Map<string, { display_name: string; username: string }>,
): ArtworkOwnerInfo {
  // NPC owner
  const npc = npcs.find((n) => n.id === ownership.owner_id);
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

  // User owner
  const cached = profileCache.get(ownership.owner_id);
  return {
    owner_id: ownership.owner_id,
    owner_type: "user",
    display_name: cached?.display_name ?? "Collector",
    slug: cached?.username ?? "unknown",
    acquired_at: ownership.acquired_at,
  };
}

function buildLoanInfo(
  artworkId: string,
  provEvents: ProvenanceEvent[],
  npcs: Npc[],
): ArtworkLoanInfo | undefined {
  const loanEvent = provEvents
    .filter((e) => e.artwork_id === artworkId && (e.event_type === "loan" || e.event_type === "exhibition"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!loanEvent) return undefined;

  const meta = loanEvent.metadata as Record<string, string>;
  const borrowerId = loanEvent.event_type === "loan" ? loanEvent.to_owner : loanEvent.from_owner;
  if (!borrowerId) return undefined;

  const borrowerNpc = npcs.find((n) => n.id === borrowerId);
  if (!borrowerNpc) return undefined;

  return {
    borrower_id: borrowerNpc.id,
    borrower_name: borrowerNpc.name,
    borrower_slug: borrowerNpc.slug,
    exhibition_title: meta.exhibition,
  };
}

// GET /api/artworks — list all artworks, or single artwork with ?id=
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const artwork = await getArtwork(id);
    if (!artwork) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
    }
    const provenance = await getProvenanceByArtwork(id);
    const ownerships = await getAllActiveOwnerships();
    const npcs = await getNpcs();

    const ownership = ownerships.find((o) => o.artwork_id === id && o.is_active);
    const profileCache = new Map<string, { display_name: string; username: string }>();
    if (ownership && !npcs.find((n) => n.id === ownership.owner_id)) {
      const profile = await getProfile(ownership.owner_id);
      if (profile) {
        profileCache.set(ownership.owner_id, {
          display_name: profile.display_name,
          username: profile.username ?? "unknown",
        });
      }
    }

    const owner = ownership ? buildOwnerInfo(ownership, npcs, profileCache) : undefined;
    const loan = ownership?.on_loan ? buildLoanInfo(id, provenance, npcs) : undefined;

    let dealer_price: number | undefined;
    if (ownership && owner?.role === "dealer") {
      dealer_price = dealerAskingPrice(artwork.insured_value, ownership.owner_id);
    }

    const enriched: EnrichedArtwork & { dealer_price?: number } = {
      ...artwork,
      owner,
      loan,
      dealer_price,
    };
    return NextResponse.json({ artwork: enriched, provenance });
  }

  // List all artworks
  const [artworks, ownerships, npcs] = await Promise.all([
    getArtworks(),
    getAllActiveOwnerships(),
    getNpcs(),
  ]);

  // Collect unique user owner IDs to batch-fetch profiles
  const userOwnerIds = new Set<string>();
  for (const o of ownerships) {
    if (!npcs.find((n) => n.id === o.owner_id)) {
      userOwnerIds.add(o.owner_id);
    }
  }
  const profileCache = new Map<string, { display_name: string; username: string }>();
  for (const uid of userOwnerIds) {
    const profile = await getProfile(uid);
    if (profile) {
      profileCache.set(uid, {
        display_name: profile.display_name,
        username: profile.username ?? "unknown",
      });
    }
  }

  const enriched = artworks.map((artwork) => {
    const ownership = ownerships.find((o) => o.artwork_id === artwork.id && o.is_active);
    const owner = ownership ? buildOwnerInfo(ownership, npcs, profileCache) : undefined;

    let dealer_price: number | undefined;
    if (ownership && owner?.role === "dealer") {
      dealer_price = dealerAskingPrice(artwork.insured_value, ownership.owner_id);
    }

    return { ...artwork, owner, dealer_price } as EnrichedArtwork & { dealer_price?: number };
  });

  return NextResponse.json({ artworks: enriched });
}
