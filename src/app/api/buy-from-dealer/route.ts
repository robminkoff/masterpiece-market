import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SEED_ARTWORKS, SEED_NPCS } from "@/data/seed";
import { ownerships, canAfford, adjustCredits, persistState } from "@/data/store";
import { dealerAskingPrice } from "@/lib/types";
import { executeSale } from "@/lib/sale";

const BuyFromDealerSchema = z.object({
  artwork_id: z.string(),
  buyer_id: z.string(),
});

// POST /api/buy-from-dealer — buy a dealer-owned artwork at computed markup price
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = BuyFromDealerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { artwork_id, buyer_id } = parsed.data;

  // Find artwork
  const artwork = SEED_ARTWORKS.find((a) => a.id === artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  // Find active ownership — must be a dealer
  const ownership = ownerships.find(
    (o) => o.artwork_id === artwork_id && o.is_active,
  );
  if (!ownership) {
    return NextResponse.json({ error: "Artwork has no active owner" }, { status: 400 });
  }

  const dealer = SEED_NPCS.find((n) => n.id === ownership.owner_id && n.role === "dealer");
  if (!dealer) {
    return NextResponse.json({ error: "Artwork is not owned by a dealer" }, { status: 400 });
  }

  // Compute price
  const salePrice = dealerAskingPrice(artwork.insured_value, dealer.id);

  // Credit check
  if (!canAfford(salePrice)) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  // Get dealer commission rate from consignment_terms
  const terms = dealer.npc_data as { consignment_terms?: { commission_rate: number } };
  const commissionRate = terms.consignment_terms?.commission_rate ?? 0.10;

  const result = executeSale({
    artworkId: artwork_id,
    buyerId: buyer_id,
    sellerId: dealer.id,
    salePrice,
    commissionRate,
    dealerName: dealer.name,
    via: "dealer_purchase",
  });

  adjustCredits(-salePrice, `Purchased ${artwork.title} from ${dealer.name}`);
  persistState();

  return NextResponse.json({
    sale: {
      artwork_id,
      sale_price: salePrice,
      dealer: dealer.name,
      commission: result.commission,
      net_proceeds: result.netProceeds,
    },
  });
}
