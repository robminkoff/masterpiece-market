import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/lib/auth";
import {
  getArtwork,
  getActiveOwnership,
  getNpcById,
  canAfford,
  adjustCredits,
  executeSaleDb,
} from "@/lib/db";
import { dealerAskingPrice, dealerCommissionAmount, sellerNetProceeds, BUYER_PREMIUM_RATE } from "@/lib/types";

const BuyFromDealerSchema = z.object({
  artwork_id: z.string(),
});

// POST /api/buy-from-dealer — buy a dealer-owned artwork at computed markup price
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = BuyFromDealerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { artwork_id } = parsed.data;

  // Find artwork
  const artwork = await getArtwork(artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  // Find active ownership — must be a dealer
  const ownership = await getActiveOwnership(artwork_id);
  if (!ownership) {
    return NextResponse.json({ error: "Artwork has no active owner" }, { status: 400 });
  }

  const dealer = await getNpcById(ownership.owner_id);
  if (!dealer || dealer.role !== "dealer") {
    return NextResponse.json({ error: "Artwork is not owned by a dealer" }, { status: 400 });
  }

  // Compute price
  const askingPrice = dealerAskingPrice(artwork.insured_value, dealer.id);
  const buyerPremium = Math.round(askingPrice * BUYER_PREMIUM_RATE);
  const totalCost = askingPrice + buyerPremium;

  // Credit check
  if (!(await canAfford(userId, totalCost))) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  // Get dealer commission rate from consignment_terms
  const terms = dealer.npc_data as { consignment_terms?: { commission_rate: number } };
  const commissionRate = terms.consignment_terms?.commission_rate ?? 0.10;

  const commission = dealerCommissionAmount(askingPrice, commissionRate);
  const net = sellerNetProceeds(askingPrice, commissionRate);

  await executeSaleDb({
    artworkId: artwork_id,
    buyerId: userId,
    sellerId: dealer.id,
    salePrice: askingPrice,
    via: "dealer_purchase",
  });

  await adjustCredits(userId, -totalCost, `Purchased ${artwork.title} from ${dealer.name} (incl. ${BUYER_PREMIUM_RATE * 100}% buyer premium)`);

  return NextResponse.json({
    sale: {
      artwork_id,
      asking_price: askingPrice,
      buyer_premium: buyerPremium,
      total_cost: totalCost,
      dealer: dealer.name,
      commission,
      net_proceeds: net,
    },
  });
}
