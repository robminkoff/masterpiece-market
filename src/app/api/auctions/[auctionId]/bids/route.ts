import { NextRequest, NextResponse } from "next/server";
import { PlaceBidSchema } from "@/lib/validators";
import { getAuthUserId } from "@/lib/auth";
import { getAuction, updateAuction, insertBid, canAfford } from "@/lib/db";
import { BID_EXTENSION_SECONDS } from "@/lib/types";

// POST /api/auctions/:auctionId/bids — place a bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { auctionId } = await params;
  const body = await request.json();
  const parsed = PlaceBidSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount } = parsed.data;

  // Find auction
  const auction = await getAuction(auctionId);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  // Validate auction is live
  if (auction.status !== "live") {
    return NextResponse.json({ error: `Auction is ${auction.status}, not accepting bids` }, { status: 400 });
  }

  // Validate bidder has enough credits
  if (!(await canAfford(userId, amount))) {
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
    id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    auction_id: auctionId,
    bidder_id: userId,
    amount,
  };
  await insertBid(bid);

  // Update auction state
  const updates: Record<string, unknown> = {
    current_bid: amount,
    current_bidder: userId,
    bid_count: auction.bid_count + 1,
  };

  // Extend timer if bid is in final 15 seconds
  const endsAt = new Date(auction.ends_at);
  const now = new Date();
  if (endsAt.getTime() - now.getTime() < BID_EXTENSION_SECONDS * 1000) {
    updates.ends_at = new Date(now.getTime() + BID_EXTENSION_SECONDS * 1000).toISOString();
  }

  await updateAuction(auctionId, updates as Partial<typeof auction>);

  return NextResponse.json(
    { bid: { ...bid, created_at: new Date().toISOString() }, auction: { ...auction, ...updates } },
    { status: 201 },
  );
}
