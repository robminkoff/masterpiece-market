import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getArtwork,
  getActiveOwnership,
  getAuctions,
  createAuction,
  getActiveMortgageForArtwork,
} from "@/lib/db";
import { AUCTION_BACKSTOP_RATE, canResell } from "@/lib/types";

// POST /api/send-to-auction — submit artwork to next auction cycle
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const artwork_id = body?.artwork_id;
  const auction_type = body?.auction_type ?? "regular";

  if (!artwork_id || typeof artwork_id !== "string") {
    return NextResponse.json({ error: "artwork_id is required" }, { status: 400 });
  }

  // Find artwork
  const artwork = await getArtwork(artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  // Find active ownership
  const ownership = await getActiveOwnership(artwork_id);
  if (!ownership || ownership.owner_id !== userId) {
    return NextResponse.json({ error: "You do not own this artwork" }, { status: 403 });
  }

  // Guards
  if (ownership.on_loan) {
    return NextResponse.json({ error: "Cannot auction while artwork is on loan" }, { status: 400 });
  }
  if (!canResell(ownership.acquired_at)) {
    return NextResponse.json({ error: "24-hour hold period has not elapsed" }, { status: 400 });
  }

  // Check if artwork is mortgaged
  const mortgage = await getActiveMortgageForArtwork(artwork_id);
  if (mortgage) {
    return NextResponse.json({ error: "Cannot auction a mortgaged artwork. Repay the mortgage first." }, { status: 400 });
  }

  // Check for existing active auction
  const auctions = await getAuctions();
  const alreadySubmitted = auctions.some(
    (a) => a.artwork_id === artwork_id && (a.status === "scheduled" || a.status === "live"),
  );
  if (alreadySubmitted) {
    return NextResponse.json({ error: "Artwork is already submitted to auction" }, { status: 400 });
  }

  // Starting bid = backstop floor (25% IV)
  const startingBid = Math.round(artwork.insured_value * AUCTION_BACKSTOP_RATE);

  const now = new Date();
  const startsAt = new Date(now.getTime() + 60 * 60 * 1000); // +1h
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h

  const newAuction = await createAuction({
    id: `auc-${Date.now()}`,
    artwork_id,
    seller_id: userId,
    auction_type,
    status: "scheduled",
    starting_bid: startingBid,
    reserve_price: null,
    current_bid: 0,
    current_bidder: null,
    bid_count: 0,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    settled_at: null,
  });

  return NextResponse.json({ auction: { ...newAuction, artwork } }, { status: 201 });
}
