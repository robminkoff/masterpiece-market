// Data access layer — queries Supabase via the admin (service-role) client.
// Replaces src/data/store.ts as the single source of truth.

import { supabaseAdmin } from "@/lib/supabase-admin";
import type {
  Artwork,
  Auction,
  ArtworkTier,
  Npc,
  Ownership,
  PackageKey,
  Profile,
  ProvenanceEvent,
} from "@/lib/types";
import {
  weeklyCarryCost,
  tierFromIV,
  STARTING_CREDITS,
  IV_TIER_THRESHOLDS,
  SURPRISE_PACKAGES,
} from "@/lib/types";

const db = supabaseAdmin;

// ──────────────────────────────────────────────
// Artworks
// ──────────────────────────────────────────────

export async function getArtworks(): Promise<Artwork[]> {
  const { data, error } = await db.from("artworks").select("*").order("insured_value", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getArtwork(id: string): Promise<Artwork | null> {
  const { data, error } = await db.from("artworks").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getArtworksByOwner(ownerId: string): Promise<Artwork[]> {
  const { data: owns, error: ownErr } = await db
    .from("ownerships")
    .select("artwork_id")
    .eq("owner_id", ownerId)
    .eq("is_active", true);
  if (ownErr) throw ownErr;
  if (!owns || owns.length === 0) return [];

  const ids = owns.map((o) => o.artwork_id);
  const { data, error } = await db.from("artworks").select("*").in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function getUnassignedArtworks(tier?: ArtworkTier): Promise<Artwork[]> {
  // Get all active ownership artwork_ids
  const { data: activeOwns, error: ownErr } = await db
    .from("ownerships")
    .select("artwork_id")
    .eq("is_active", true);
  if (ownErr) throw ownErr;

  const ownedIds = (activeOwns ?? []).map((o) => o.artwork_id);

  let query = db.from("artworks").select("*").eq("status", "active");
  if (tier) query = query.eq("tier", tier);

  const { data, error } = await query;
  if (error) throw error;

  const ownedSet = new Set(ownedIds);
  return (data ?? []).filter((a) => !ownedSet.has(a.id));
}

// ──────────────────────────────────────────────
// Ownerships
// ──────────────────────────────────────────────

export async function getActiveOwnership(artworkId: string): Promise<Ownership | null> {
  const { data, error } = await db
    .from("ownerships")
    .select("*")
    .eq("artwork_id", artworkId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOwnershipsByOwner(ownerId: string): Promise<Ownership[]> {
  const { data, error } = await db
    .from("ownerships")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("is_active", true);
  if (error) throw error;
  return data ?? [];
}

export async function getWeeklyAcquisitionCount(userId: string): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("ownerships")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId)
    .gte("acquired_at", weekAgo)
    .in("acquired_via", ["dealer_purchase", "package_mystery"]);
  if (error) throw error;
  return count ?? 0;
}

export async function getAllActiveOwnerships(): Promise<Ownership[]> {
  const { data, error } = await db.from("ownerships").select("*").eq("is_active", true);
  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// Provenance
// ──────────────────────────────────────────────

export async function getProvenanceByArtwork(artworkId: string): Promise<ProvenanceEvent[]> {
  const { data, error } = await db
    .from("provenance_events")
    .select("*")
    .eq("artwork_id", artworkId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProvenanceByOwner(ownerId: string): Promise<ProvenanceEvent[]> {
  const { data, error } = await db
    .from("provenance_events")
    .select("*")
    .or(`from_owner.eq.${ownerId},to_owner.eq.${ownerId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// Credits
// ──────────────────────────────────────────────

export async function getCredits(userId: string): Promise<number> {
  const { data, error } = await db.from("profiles").select("credits").eq("id", userId).single();
  if (error) throw error;
  return data.credits;
}

export async function adjustCredits(userId: string, delta: number, reason: string): Promise<number> {
  // Read current
  const current = await getCredits(userId);
  const newBalance = current + delta;

  // Update profile
  const { error: updateErr } = await db
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  // Insert credit event
  const { error: eventErr } = await db.from("credit_events").insert({
    id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    delta,
    reason,
    balance: newBalance,
  });
  if (eventErr) throw eventErr;

  return newBalance;
}

export async function canAfford(userId: string, amount: number): Promise<boolean> {
  const credits = await getCredits(userId);
  return credits >= amount;
}

// ──────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("username", username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  fields: { username?: string; display_name?: string },
): Promise<Profile> {
  const { data, error } = await db
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// Auctions
// ──────────────────────────────────────────────

export async function getAuctions(): Promise<Auction[]> {
  const { data, error } = await db.from("auctions").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAuction(id: string): Promise<Auction | null> {
  const { data, error } = await db.from("auctions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAuction(auction: Omit<Auction, "artwork">): Promise<Auction> {
  const { data, error } = await db.from("auctions").insert(auction).select().single();
  if (error) throw error;
  return data;
}

export async function updateAuction(id: string, fields: Partial<Auction>): Promise<void> {
  const { error } = await db.from("auctions").update(fields).eq("id", id);
  if (error) throw error;
}

export async function insertBid(bid: {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
}): Promise<void> {
  const { error } = await db.from("bids").insert(bid);
  if (error) throw error;
}

// ──────────────────────────────────────────────
// NPCs / Dealers
// ──────────────────────────────────────────────

export async function getNpcs(): Promise<Npc[]> {
  const { data, error } = await db.from("npcs").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getNpcBySlug(slug: string): Promise<Npc | null> {
  const { data, error } = await db.from("npcs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getNpcById(id: string): Promise<Npc | null> {
  const { data, error } = await db.from("npcs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDealerNpcs(): Promise<Npc[]> {
  const { data, error } = await db.from("npcs").select("*").eq("role", "dealer");
  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// Sales (execute_sale RPC)
// ──────────────────────────────────────────────

export async function executeSaleDb(params: {
  artworkId: string;
  buyerId: string;
  sellerId: string;
  salePrice: number;
  via: string;
}): Promise<{ ownership_id: string; provenance_id: string }> {
  const { data, error } = await db.rpc("execute_sale", {
    p_artwork_id: params.artworkId,
    p_buyer_id: params.buyerId,
    p_seller_id: params.sellerId,
    p_sale_price: params.salePrice,
    p_via: params.via,
  });
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// Burn Tick
// ──────────────────────────────────────────────

export async function applyBurnTick(
  userId: string,
): Promise<{ weeksElapsed: number; totalBurned: number }> {
  const profile = await getProfile(userId);
  if (!profile) return { weeksElapsed: 0, totalBurned: 0 };

  const lastBurn = new Date(profile.last_burn_at).getTime();
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((now - lastBurn) / msPerWeek);

  if (weeksElapsed <= 0) {
    return { weeksElapsed: 0, totalBurned: 0 };
  }

  // Calculate weekly carry for all player-owned artworks
  const ownerships = await getOwnershipsByOwner(userId);
  const artworks = await getArtworks();
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const weeklyTotal = ownerships.reduce((sum, o) => {
    const art = artworkMap.get(o.artwork_id);
    if (!art) return sum;
    return sum + weeklyCarryCost(art.insured_value, art.tier as ArtworkTier, o.on_loan, o.idle_weeks);
  }, 0);

  const totalBurned = weeksElapsed * weeklyTotal;

  // Deduct and log each week
  for (let i = 0; i < weeksElapsed; i++) {
    await adjustCredits(userId, -weeklyTotal, `Weekly carry cost (week ${i + 1} of ${weeksElapsed})`);
  }

  // Advance last_burn_at
  const newBurnAt = new Date(lastBurn + weeksElapsed * msPerWeek).toISOString();
  await db.from("profiles").update({ last_burn_at: newBurnAt }).eq("id", userId);

  return { weeksElapsed, totalBurned };
}

// ──────────────────────────────────────────────
// Dealer D-Tier Artworks (signup gift)
// ──────────────────────────────────────────────

export async function getDealerDTierArtworks(): Promise<
  { artwork: Artwork; ownership: Ownership }[]
> {
  // Get all active ownerships by dealer NPCs
  const { data: ownerships, error: ownErr } = await db
    .from("ownerships")
    .select("*")
    .like("owner_id", "npc-d%")
    .eq("is_active", true);
  if (ownErr) throw ownErr;
  if (!ownerships || ownerships.length === 0) return [];

  const artworkIds = ownerships.map((o) => o.artwork_id);
  const { data: artworks, error: artErr } = await db
    .from("artworks")
    .select("*")
    .in("id", artworkIds)
    .eq("tier", "D");
  if (artErr) throw artErr;
  if (!artworks || artworks.length === 0) return [];

  const artworkMap = new Map(artworks.map((a) => [a.id, a]));
  return ownerships
    .filter((o) => artworkMap.has(o.artwork_id))
    .map((o) => ({ artwork: artworkMap.get(o.artwork_id)!, ownership: o }));
}

// ──────────────────────────────────────────────
// Surprise Packages
// ──────────────────────────────────────────────

function drawTierFromWeights(tiers: Record<ArtworkTier, number>): ArtworkTier {
  const roll = Math.random();
  let cumulative = 0;
  for (const [tier, weight] of Object.entries(tiers) as [ArtworkTier, number][]) {
    cumulative += weight;
    if (roll < cumulative) return tier;
  }
  return "D"; // fallback
}

function ivRangeForTier(tier: ArtworkTier): { min: number; max: number } {
  // IV_TIER_THRESHOLDS is sorted descending: A >= 350k, B >= 75k, C >= 50k, D >= 0
  const sorted = [...IV_TIER_THRESHOLDS].sort((a, b) => b.min - a.min);
  const idx = sorted.findIndex((t) => t.tier === tier);
  const min = sorted[idx].min;
  const max = idx === 0 ? 1_000_000 : sorted[idx - 1].min - 1;
  return { min, max };
}

export async function generatePackageArtwork(tier: ArtworkTier): Promise<Artwork> {
  const { min, max } = ivRangeForTier(tier);
  const iv = min + Math.floor(Math.random() * (max - min + 1));
  const serial = Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const id = `art-pkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const artwork: Record<string, unknown> = {
    id,
    title: `Mystery ${tier === "A" ? "Masterwork" : tier === "B" ? "Major Work" : tier === "C" ? "Study" : "Sketch"} #${serial}`,
    artist: "Unknown",
    year: null,
    medium: "Mixed media",
    tier: tierFromIV(iv),
    insured_value: iv,
    image_url: null,
    image_url_web: null,
    image_url_thumb: null,
    tags: ["mystery", "package"],
    description: `A ${tier === "A" ? "remarkable" : tier === "B" ? "significant" : tier === "C" ? "notable" : "modest"} work revealed from a surprise package.`,
    gallery_notes: [
      {
        heading: "Provenance",
        body: "Acquired through a mystery package. Origin and attribution pending further research.",
      },
      {
        heading: "Market Significance",
        body: `Insured value of ${iv.toLocaleString()} credits. Discovered in a surprise package.`,
      },
    ],
    source: null,
    source_id: null,
    source_url: null,
    rights_note: null,
    status: "active",
  };

  const { data, error } = await db.from("artworks").insert(artwork).select().single();
  if (error) throw error;
  return data;
}

export async function buyPackage(
  userId: string,
  packageKey: PackageKey,
): Promise<{ artwork: Artwork; tier: ArtworkTier; packageLabel: string }> {
  const pkg = SURPRISE_PACKAGES[packageKey];
  if (!pkg) throw new Error(`Unknown package: ${packageKey}`);

  // Check affordability
  const credits = await getCredits(userId);
  if (credits < pkg.cost) {
    throw new Error(`Not enough credits. Need ${pkg.cost.toLocaleString()}, have ${credits.toLocaleString()}.`);
  }

  // Draw tier
  const tier = drawTierFromWeights(pkg.tiers);

  // Generate artwork
  const artwork = await generatePackageArtwork(tier);

  // Create ownership
  const ownId = `own-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { error: ownErr } = await db.from("ownerships").insert({
    id: ownId,
    artwork_id: artwork.id,
    owner_id: userId,
    acquired_via: `package_${packageKey}`,
    is_active: true,
    idle_weeks: 0,
    on_loan: false,
  });
  if (ownErr) throw ownErr;

  // Record provenance
  const provId = `prov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { error: provErr } = await db.from("provenance_events").insert({
    id: provId,
    artwork_id: artwork.id,
    event_type: "package_reveal",
    from_owner: null,
    to_owner: userId,
    price: pkg.cost,
    metadata: { via: `package_${packageKey}`, tier_drawn: tier },
  });
  if (provErr) throw provErr;

  // Deduct credits
  await adjustCredits(userId, -pkg.cost, `Surprise package: ${pkg.label}`);

  return { artwork, tier, packageLabel: pkg.label };
}

// ──────────────────────────────────────────────
// Reset
// ──────────────────────────────────────────────

export async function resetPlayerGame(userId: string): Promise<void> {
  // Find player-owned artworks
  const playerOwnerships = await getOwnershipsByOwner(userId);

  // Return each to Galleria North (npc-d01) via execute_sale
  for (const o of playerOwnerships) {
    await executeSaleDb({
      artworkId: o.artwork_id,
      buyerId: "npc-d01",
      sellerId: userId,
      salePrice: 0,
      via: "game_reset",
    });
  }

  // Reset credits
  const { error } = await db
    .from("profiles")
    .update({ credits: STARTING_CREDITS, last_burn_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;

  // Clear credit log
  await db.from("credit_events").delete().eq("user_id", userId);
}
