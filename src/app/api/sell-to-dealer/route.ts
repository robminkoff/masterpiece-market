import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getArtwork,
  getActiveOwnership,
  adjustCredits,
  executeSaleDb,
  getAuctions,
  getActiveMortgageForArtwork,
} from "@/lib/db";
import { DEALER_BUY_RATE, canResell, dealerCommissionAmount, sellerNetProceeds } from "@/lib/types";

// POST /api/sell-to-dealer — instant sale at 50% IV
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const artwork_id = body?.artwork_id;
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
    return NextResponse.json({ error: "Cannot sell while artwork is on loan" }, { status: 400 });
  }
  if (!canResell(ownership.acquired_at)) {
    return NextResponse.json({ error: "24-hour hold period has not elapsed" }, { status: 400 });
  }

  // Check if artwork is mortgaged
  const mortgage = await getActiveMortgageForArtwork(artwork_id);
  if (mortgage) {
    return NextResponse.json({ error: "Cannot sell a mortgaged artwork. Repay the mortgage first." }, { status: 400 });
  }

  // Check if artwork is submitted to auction
  const auctions = await getAuctions();
  const inAuction = auctions.some(
    (a) => a.artwork_id === artwork_id && (a.status === "scheduled" || a.status === "live"),
  );
  if (inAuction) {
    return NextResponse.json({ error: "Artwork is already submitted to auction" }, { status: 400 });
  }

  // Price: 50% of IV
  const salePrice = Math.round(artwork.insured_value * DEALER_BUY_RATE);

  await executeSaleDb({
    artworkId: artwork_id,
    buyerId: "npc-d01",
    sellerId: userId,
    salePrice,
    via: "instant_dealer_sale",
  });

  await adjustCredits(userId, +salePrice, `Sold ${artwork.title} to dealer`);

  return NextResponse.json({
    sale: {
      artwork_id,
      sale_price: salePrice,
      buyer: "Galleria North",
      commission: 0,
      net_proceeds: salePrice,
    },
  });
}
