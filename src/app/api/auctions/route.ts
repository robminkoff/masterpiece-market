import { NextRequest, NextResponse } from "next/server";
import { getAuctions, createAuction, getArtworks } from "@/lib/db";
import { CreateAuctionSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// GET /api/auctions — list all auctions with joined artwork data
export async function GET() {
  const [auctions, artworks] = await Promise.all([getAuctions(), getArtworks()]);
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const enriched = auctions.map((a) => ({
    ...a,
    artwork: artworkMap.get(a.artwork_id) ?? undefined,
  }));

  return NextResponse.json({ auctions: enriched });
}

// POST /api/auctions — create a new auction (admin/dev only)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateAuctionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  if (new Date(input.starts_at) >= new Date(input.ends_at)) {
    return NextResponse.json({ error: "starts_at must be before ends_at" }, { status: 400 });
  }

  const newAuction = await createAuction({
    id: `auc-${Date.now()}`,
    artwork_id: input.artwork_id,
    seller_id: null,
    auction_type: input.auction_type,
    status: "scheduled",
    starting_bid: input.starting_bid,
    reserve_price: input.reserve_price ?? null,
    current_bid: 0,
    current_bidder: null,
    bid_count: 0,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    settled_at: null,
  });

  return NextResponse.json({ auction: newAuction }, { status: 201 });
}
