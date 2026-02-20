import { NextRequest, NextResponse } from "next/server";
import { getDealerNpcs, getAllActiveOwnerships, getArtworks } from "@/lib/db";
import { dealerAskingPrice } from "@/lib/types";

// GET /api/dealer-inventory — dealer-owned artworks for marketplace
export async function GET(request: NextRequest) {
  const tierFilter = request.nextUrl.searchParams.get("tier");
  const dealerIdFilter = request.nextUrl.searchParams.get("dealer_id");

  const [dealerNpcs, ownerships, artworks] = await Promise.all([
    getDealerNpcs(),
    getAllActiveOwnerships(),
    getArtworks(),
  ]);

  const dealerIds = new Set(dealerNpcs.map((n) => n.id));
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const dealerOwnerships = ownerships.filter(
    (o) => o.is_active && dealerIds.has(o.owner_id),
  );

  const inventory = dealerOwnerships
    .map((o) => {
      const artwork = artworkMap.get(o.artwork_id);
      if (!artwork) return null;

      const dealer = dealerNpcs.find((n) => n.id === o.owner_id);
      if (!dealer) return null;

      if (tierFilter && artwork.tier !== tierFilter) return null;
      if (dealerIdFilter && dealer.id !== dealerIdFilter) return null;

      return {
        artwork,
        dealer_id: dealer.id,
        dealer_name: dealer.name,
        dealer_slug: dealer.slug,
        asking_price: dealerAskingPrice(artwork.insured_value, dealer.id),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ inventory });
}
