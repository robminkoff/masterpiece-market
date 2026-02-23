import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import {
  getProfile,
  getOwnershipsByOwner,
  getArtworksByOwner,
  getActiveMortgageCount,
  getMuseumCount,
  foundMuseum,
  executeAscension,
  adjustCredits,
} from "@/lib/db";
import {
  MUSEUM_FOUNDING_REQUIREMENTS,
  museumEndowmentRequired,
  type ArtworkTier,
} from "@/lib/types";

// POST /api/found-museum — validate all requirements, create museum, trigger ascension
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const museumName = body?.name;
  if (!museumName || typeof museumName !== "string" || museumName.trim().length < 3) {
    return NextResponse.json({ error: "Museum name must be at least 3 characters" }, { status: 400 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const artworks = await getArtworksByOwner(userId);
  const ownerships = await getOwnershipsByOwner(userId);

  // Tier counts
  const tierCounts: Record<ArtworkTier, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of artworks) tierCounts[a.tier]++;

  const uniqueTags = new Set(artworks.flatMap((a) => a.tags)).size;
  const reqs = MUSEUM_FOUNDING_REQUIREMENTS;

  // Validate all requirements
  const errors: string[] = [];
  if (tierCounts.A < reqs.minTierA) errors.push(`Need ${reqs.minTierA}+ A-tier artworks`);
  if (tierCounts.B < reqs.minTierB) errors.push(`Need ${reqs.minTierB}+ B-tier artworks`);
  if (tierCounts.C < reqs.minTierC) errors.push(`Need ${reqs.minTierC}+ C-tier artworks`);
  if (tierCounts.D < reqs.minTierD) errors.push(`Need ${reqs.minTierD}+ D-tier artworks`);
  if (artworks.length < reqs.minTotalArtworks) errors.push(`Need ${reqs.minTotalArtworks}+ total artworks`);
  if (uniqueTags < reqs.minTagDiversity) errors.push(`Need ${reqs.minTagDiversity}+ unique tags`);
  if (profile.expertise < reqs.minExpertise) errors.push(`Need ${reqs.minExpertise}+ expertise`);

  // Endowment check
  const endowmentNeeded = museumEndowmentRequired(
    artworks.map((a) => {
      const o = ownerships.find((ow) => ow.artwork_id === a.id);
      return { insured_value: a.insured_value, tier: a.tier, on_loan: o?.on_loan ?? false, idle_weeks: o?.idle_weeks ?? 0 };
    }),
  );
  if (profile.credits < endowmentNeeded) errors.push(`Need ${endowmentNeeded.toLocaleString()} cr endowment`);

  // No active mortgages
  const mortgageCount = await getActiveMortgageCount(userId);
  if (mortgageCount > 0) errors.push("All mortgages must be cleared");

  if (errors.length > 0) {
    return NextResponse.json({ error: "Requirements not met", details: errors }, { status: 400 });
  }

  // Deduct endowment
  await adjustCredits(userId, -endowmentNeeded, `Museum endowment: ${museumName}`);

  // Create museum record
  const museum = await foundMuseum({
    ownerId: userId,
    name: museumName.trim(),
    endowment: endowmentNeeded,
  });

  // Execute ascension
  const newMuseumCount = await getMuseumCount(userId);
  await executeAscension(userId, newMuseumCount);

  return NextResponse.json({
    museum,
    ascension: true,
    museumCount: newMuseumCount,
  }, { status: 201 });
}
