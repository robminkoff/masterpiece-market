import { NextRequest, NextResponse } from "next/server";
import { SEED_NPCS, SEED_ARTWORKS } from "@/data/seed";
import { auctions, auctionSubmissions, adjustCredits, persistState } from "@/data/store";
import { BUYER_PREMIUM_RATE, SELLER_FEE_RATE, AUCTION_BACKSTOP_RATE } from "@/lib/types";
import { executeSale } from "@/lib/sale";
import { STUB_USER_ID } from "@/lib/supabase";

// POST /api/auctions/:auctionId/settle — settle a completed auction
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { auctionId } = await params;

  const auction = auctions.find((a) => a.id === auctionId);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  if (auction.status !== "ended") {
    return NextResponse.json({ error: `Auction is ${auction.status}, cannot settle` }, { status: 400 });
  }

  const artwork = SEED_ARTWORKS.find((a) => a.id === auction.artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 500 });
  }

  const sellerId = auction.seller_id ?? "system";
  let buyerId: string;
  let salePrice: number;

  if (auction.bid_count > 0 && auction.current_bidder) {
    // Has bids — highest bidder wins
    buyerId = auction.current_bidder;
    salePrice = auction.current_bid;
  } else {
    // No bids — backstop: Galleria North buys at 30% IV
    const backstopDealer = SEED_NPCS.find((n) => n.id === "npc-d01")!;
    buyerId = backstopDealer.id;
    salePrice = Math.round(artwork.insured_value * AUCTION_BACKSTOP_RATE);
  }

  const buyerPremium = Math.round(salePrice * BUYER_PREMIUM_RATE);
  const sellerFee = Math.round(salePrice * SELLER_FEE_RATE);

  const result = executeSale({
    artworkId: auction.artwork_id,
    buyerId,
    sellerId,
    salePrice,
    commissionRate: SELLER_FEE_RATE,
    dealerName: "Auction House",
    via: "auction_settlement",
  });

  // Credit adjustments for stub user
  if (buyerId === STUB_USER_ID) {
    const totalCost = salePrice + buyerPremium;
    adjustCredits(-totalCost, `Won auction for ${artwork.title}`);
  }
  if (sellerId === STUB_USER_ID) {
    const netProceeds = salePrice - sellerFee;
    adjustCredits(+netProceeds, `Auction sale of ${artwork.title}`);
  }

  // Update auction state
  auction.status = "settled";
  auction.settled_at = new Date().toISOString();

  // Remove from auction submissions
  const subIdx = auctionSubmissions.indexOf(auction.artwork_id);
  if (subIdx >= 0) auctionSubmissions.splice(subIdx, 1);

  persistState();

  return NextResponse.json({
    settlement: {
      auction_id: auctionId,
      status: "settled",
      sale_price: salePrice,
      buyer_id: buyerId,
      buyer_premium: buyerPremium,
      seller_fee: sellerFee,
      net_proceeds: result.netProceeds,
      backstop: auction.bid_count === 0,
    },
  });
}
