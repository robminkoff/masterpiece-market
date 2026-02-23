import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getArtwork,
  getActiveOwnership,
  getActiveMortgages,
  getActiveMortgageForArtwork,
  getActiveMortgageCount,
  createMortgage,
  adjustCredits,
  getAuctions,
} from "@/lib/db";
import { MORTGAGE_CONFIG } from "@/lib/types";

// GET /api/mortgage — list active mortgages for current user
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mortgages = await getActiveMortgages(userId);
  return NextResponse.json({ mortgages });
}

// POST /api/mortgage — take a mortgage on an artwork
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const artworkId = body?.artwork_id;
  if (!artworkId || typeof artworkId !== "string") {
    return NextResponse.json({ error: "artwork_id is required" }, { status: 400 });
  }

  // Verify ownership
  const ownership = await getActiveOwnership(artworkId);
  if (!ownership || ownership.owner_id !== userId) {
    return NextResponse.json({ error: "You do not own this artwork" }, { status: 403 });
  }

  // Guard: not on loan
  if (ownership.on_loan) {
    return NextResponse.json({ error: "Cannot mortgage while artwork is on loan" }, { status: 400 });
  }

  // Guard: not already mortgaged
  const existing = await getActiveMortgageForArtwork(artworkId);
  if (existing) {
    return NextResponse.json({ error: "Artwork is already mortgaged" }, { status: 400 });
  }

  // Guard: max 2 active mortgages
  const activeCount = await getActiveMortgageCount(userId);
  if (activeCount >= MORTGAGE_CONFIG.maxActive) {
    return NextResponse.json({ error: `Maximum ${MORTGAGE_CONFIG.maxActive} active mortgages allowed` }, { status: 400 });
  }

  // Guard: not in auction
  const auctions = await getAuctions();
  const inAuction = auctions.some(
    (a) => a.artwork_id === artworkId && (a.status === "scheduled" || a.status === "live"),
  );
  if (inAuction) {
    return NextResponse.json({ error: "Cannot mortgage artwork in active auction" }, { status: 400 });
  }

  // Calculate principal
  const artwork = await getArtwork(artworkId);
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }
  const principal = Math.round(artwork.insured_value * MORTGAGE_CONFIG.ltvRate);

  // Create mortgage and credit the user
  const mortgage = await createMortgage({ artworkId, ownerId: userId, principal });
  await adjustCredits(userId, principal, `Mortgage on ${artwork.title}`);

  return NextResponse.json({ mortgage }, { status: 201 });
}
