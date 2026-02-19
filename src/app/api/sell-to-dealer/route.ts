import { NextRequest, NextResponse } from "next/server";
import { SellToDealerSchema } from "@/lib/validators";
import { SEED_ARTWORKS, SEED_NPCS } from "@/data/seed";
import { ownerships, auctionSubmissions, adjustCredits, persistState } from "@/data/store";
import { DEALER_BUY_RATE, canResell } from "@/lib/types";
import { executeSale } from "@/lib/sale";

// POST /api/sell-to-dealer — instant sale at 50% IV
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = SellToDealerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { artwork_id, seller_id } = parsed.data;

  // Find artwork
  const artwork = SEED_ARTWORKS.find((a) => a.id === artwork_id);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }

  // Find active ownership
  const ownership = ownerships.find(
    (o) => o.artwork_id === artwork_id && o.owner_id === seller_id && o.is_active,
  );
  if (!ownership) {
    return NextResponse.json({ error: "You do not own this artwork" }, { status: 403 });
  }

  // Guards
  if (ownership.on_loan) {
    return NextResponse.json({ error: "Cannot sell while artwork is on loan" }, { status: 400 });
  }
  if (!canResell(ownership.acquired_at)) {
    return NextResponse.json({ error: "24-hour hold period has not elapsed" }, { status: 400 });
  }
  if (auctionSubmissions.includes(artwork_id)) {
    return NextResponse.json({ error: "Artwork is already submitted to auction" }, { status: 400 });
  }

  // Price: 50% of IV
  const salePrice = Math.round(artwork.insured_value * DEALER_BUY_RATE);

  // Buyer: Galleria North as default market maker
  const buyer = SEED_NPCS.find((n) => n.id === "npc-d01")!;

  const result = executeSale({
    artworkId: artwork_id,
    buyerId: buyer.id,
    sellerId: seller_id,
    salePrice,
    commissionRate: 0,
    dealerName: buyer.name,
    via: "instant_dealer_sale",
  });

  adjustCredits(+salePrice, `Sold ${artwork.title} to dealer`);
  persistState();

  return NextResponse.json({
    sale: {
      artwork_id,
      sale_price: salePrice,
      buyer: buyer.name,
      commission: result.commission,
      net_proceeds: result.netProceeds,
    },
  });
}
