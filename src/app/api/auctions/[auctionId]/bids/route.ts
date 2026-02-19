import { NextRequest, NextResponse } from "next/server";
import { PlaceBidSchema } from "@/lib/validators";
import { auctions, canAfford } from "@/data/store";
import { BID_EXTENSION_SECONDS } from "@/lib/types";

// In-memory bid store for v0
const bids: { auction_id: string; bidder_id: string; amount: number; created_at: string }[] = [];

// POST /api/auctions/:auctionId/bids — place a bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { auctionId } = await params;
  const body = await request.json();
  const parsed = PlaceBidSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bidder_id, amount } = parsed.data;

  // Find auction
  const auction = auctions.find((a) => a.id === auctionId);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  // Validate auction is live
  if (auction.status !== "live") {
    return NextResponse.json({ error: `Auction is ${auction.status}, not accepting bids` }, { status: 400 });
  }

  // Validate bidder has enough credits
  if (!canAfford(amount)) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  // Validate bid amount
  if (amount <= auction.current_bid) {
    return NextResponse.json(
      { error: `Bid must be higher than current bid of ${auction.current_bid}` },
      { status: 400 },
    );
  }

  // Record bid
  const bid = {
    auction_id: auctionId,
    bidder_id,
    amount,
    created_at: new Date().toISOString(),
  };
  bids.push(bid);

  // Update auction state
  auction.current_bid = amount;
  auction.current_bidder = bidder_id;
  auction.bid_count += 1;

  // Extend timer if bid is in final 15 seconds
  const endsAt = new Date(auction.ends_at);
  const now = new Date();
  if (endsAt.getTime() - now.getTime() < BID_EXTENSION_SECONDS * 1000) {
    auction.ends_at = new Date(now.getTime() + BID_EXTENSION_SECONDS * 1000).toISOString();
  }

  return NextResponse.json({ bid, auction }, { status: 201 });
}
