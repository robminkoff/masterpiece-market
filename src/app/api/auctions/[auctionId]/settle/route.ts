import { NextRequest, NextResponse } from "next/server";
import {
  getAuction,
  getArtwork,
  updateAuction,
  adjustCredits,
  executeSaleDb,
} from "@/lib/db";
import { BUYER_PREMIUM_RATE, SELLER_FEE_RATE, AUCTION_BACKSTOP_RATE } from "@/lib/types";

// POST /api/auctions/:auctionId/settle — settle a completed auction
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { auctionId } = await params;

  const auction = await getAuction(auctionId);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  if (auction.status !== "ended") {
    return NextResponse.json({ error: `Auction is ${auction.status}, cannot settle` }, { status: 400 });
  }

  const artwork = await getArtwork(auction.artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 500 });
  }

  const sellerId = auction.seller_id ?? "system";
  let buyerId: string;
  let salePrice: number;

  if (auction.bid_count > 0 && auction.current_bidder) {
    buyerId = auction.current_bidder;
    salePrice = auction.current_bid;
  } else {
    // No bids — backstop: Galleria North buys at 25% IV
    buyerId = "npc-d01";
    salePrice = Math.round(artwork.insured_value * AUCTION_BACKSTOP_RATE);
  }

  const buyerPremium = Math.round(salePrice * BUYER_PREMIUM_RATE);
  const sellerFee = Math.round(salePrice * SELLER_FEE_RATE);

  await executeSaleDb({
    artworkId: auction.artwork_id,
    buyerId,
    sellerId,
    salePrice,
    via: "auction_settlement",
  });

  // Credit adjustments — only for real user accounts (not NPCs)
  if (!buyerId.startsWith("npc-")) {
    const totalCost = salePrice + buyerPremium;
    await adjustCredits(buyerId, -totalCost, `Won auction for ${artwork.title}`);
  }
  if (sellerId !== "system" && !sellerId.startsWith("npc-")) {
    const netProceeds = salePrice - sellerFee;
    await adjustCredits(sellerId, +netProceeds, `Auction sale of ${artwork.title}`);
  }

  // Update auction state
  await updateAuction(auctionId, {
    status: "settled",
    settled_at: new Date().toISOString(),
  });

  return NextResponse.json({
    settlement: {
      auction_id: auctionId,
      status: "settled",
      sale_price: salePrice,
      buyer_id: buyerId,
      buyer_premium: buyerPremium,
      seller_fee: sellerFee,
      net_proceeds: salePrice - sellerFee,
      backstop: auction.bid_count === 0,
    },
  });
}
