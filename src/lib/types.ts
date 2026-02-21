// Masterpiece Market — Core Types

export type ArtworkTier = "A" | "B" | "C" | "D";
export type PlayerTier = "emerging" | "established" | "connoisseur" | "patron";
export type AuctionType = "regular" | "evening" | "private" | "forced" | "estate";
export type AuctionStatus = "scheduled" | "live" | "ended" | "settled" | "cancelled";
export type NpcRole = "curator" | "dealer" | "critic";
export type CuratorTier = "assistant" | "curator" | "chief" | "legendary";
export type DealerTier = "primary" | "secondary" | "broker" | "specialist";
export type CriticTier = "junior" | "senior" | "chief" | "legendary";
export type LoanStatus = "pending" | "accepted" | "declined" | "expired";

// ---------- Tier config ----------
// Tier = stewardship burden bucket derived from Insured Value.
// Higher IV → higher tier → higher weekly carry and stricter rules.

export const IV_TIER_THRESHOLDS: { min: number; tier: ArtworkTier }[] = [
  { min: 350_000, tier: "A" },
  { min: 75_000, tier: "B" },
  { min: 50_000, tier: "C" },
  { min: 0, tier: "D" },
];

/** Derive artwork tier from its Insured Value. */
export function tierFromIV(iv: number): ArtworkTier {
  for (const { min, tier } of IV_TIER_THRESHOLDS) {
    if (iv >= min) return tier;
  }
  return "D";
}

export const TIER_CONFIG = {
  A: { premiumRate: 0.015, storageFee: 1_000 },
  B: { premiumRate: 0.015, storageFee: 400 },
  C: { premiumRate: 0.008, storageFee: 100 },
  D: { premiumRate: 0.003, storageFee: 20 },
} as const;

export const CURATOR_LOAN_FEES: Record<CuratorTier, number> = {
  assistant: 0.0025,
  curator: 0.0045,
  chief: 0.0075,
  legendary: 0.012,
};

export const LOAN_PREMIUM_REDUCTION = 0.7; // 70% reduction while on loan
export const IDLE_SURCHARGE_MULTIPLIER = 1.2;
export const IDLE_WEEKS_THRESHOLD = 8;
export const DELINQUENCY_GRACE_HOURS = 72;
export const INACTIVITY_ESTATE_DAYS = 60;
export const INACTIVITY_NOTICE_DAYS = 30;
export const STARTING_CREDITS = 1_000_000;
export const BUYER_PREMIUM_RATE = 0.05;
export const SELLER_FEE_RATE = 0.025;
export const BID_EXTENSION_SECONDS = 15;
export const MIN_HOLD_HOURS = 0;
export const MAX_ACQUISITIONS_PER_WEEK = 1;

// ---------- Entity interfaces ----------

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  tier: PlayerTier;
  credits: number;
  prestige: number;
  stewardship: number;
  created_at: string;
  last_active: string;
  last_burn_at: string;
}

export type ArtworkSource = "met" | "rijks" | "nga" | "iiif" | "wikimedia";
export type ArtworkStatus = "active" | "needs_review" | "retired";
export type Orientation = "portrait" | "landscape" | "square";

/** A single section of gallery notes — styled like an interpretive placard in a museum. */
export interface GalleryNoteSection {
  heading: string;
  body: string;
}

/**
 * Gallery Notes — Drop-Minting Reference
 *
 * Every artwork should include a `gallery_notes` array with 2–3 sections.
 * Each section has a `heading` (displayed in small-caps) and a `body`
 * (2–3 sentences, museum-label register — concise, factual, no hype).
 *
 * Standard headings (pick 2–3 per artwork):
 *   - "Historical Context"   — provenance, commission history, when/where created
 *   - "Technique"            — materials, method, what makes the execution notable
 *   - "Cultural Impact"      — influence on later art, popular culture, public consciousness
 *   - "Market Significance"  — REQUIRED — explains the artwork's IV and market dynamics in gameplay terms
 *
 * Example:
 *   gallery_notes: [
 *     { heading: "Historical Context", body: "Painted in Rome in 1505 for Cardinal X..." },
 *     { heading: "Technique", body: "Employs cross-hatching on toned paper..." },
 *     { heading: "Market Significance", body: "Strong academic demand keeps loan placement reliable..." },
 *   ]
 */
export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  medium: string | null;
  tier: ArtworkTier;
  insured_value: number;
  image_url: string | null;
  image_url_web: string | null;
  image_url_thumb: string | null;
  tags: string[];
  description: string | null;
  gallery_notes: GalleryNoteSection[];
  native_width: number | null;
  native_height: number | null;
  dominant_orientation: Orientation | null;
  source: ArtworkSource | null;
  source_id: string | null;
  source_url: string | null;
  rights_note: string | null;
  status: ArtworkStatus;
  created_at: string;
}

export interface Ownership {
  id: string;
  artwork_id: string;
  owner_id: string;
  acquired_at: string;
  acquired_via: string;
  is_active: boolean;
  idle_weeks: number;
  on_loan: boolean;
}

export interface ProvenanceEvent {
  id: string;
  artwork_id: string;
  event_type: string;
  from_owner: string | null;
  to_owner: string | null;
  price: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Auction {
  id: string;
  artwork_id: string;
  seller_id: string | null;
  auction_type: AuctionType;
  status: AuctionStatus;
  starting_bid: number;
  reserve_price: number | null;
  current_bid: number;
  current_bidder: string | null;
  bid_count: number;
  starts_at: string;
  ends_at: string;
  settled_at: string | null;
  // Joined fields (optional)
  artwork?: Artwork;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
}

export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  npc_tier: string;
  slug: string;
  specialty: string | null;
  description: string | null;
  traits: Record<string, unknown>;
  credits: number;
  prestige: number;
  stewardship_score: number;
  npc_data: Record<string, unknown>;
  unlock_tier: PlayerTier;
  created_at: string;
}

// ---------- Profile entity (discriminated union) ----------

export type ProfileEntity =
  | { kind: "user"; profile: Profile; ownerships: Ownership[]; provenance: ProvenanceEvent[] }
  | { kind: "npc"; npc: Npc; ownerships: Ownership[]; provenance: ProvenanceEvent[] };

/** Compute stewardship score from behavioral events, clamped 0–100. */
export function computeStewardship(events: {
  delinquent: number;
  onTime: number;
  loansMade: number;
  exhibitionCount: number;
}): number {
  const raw =
    50 -
    events.delinquent * 5 +
    events.onTime * 2 +
    events.loansMade * 1 +
    events.exhibitionCount * 3;
  return Math.max(0, Math.min(100, raw));
}

// ---------- Museum types ----------

export type MuseumStatus = "active" | "probation" | "dissolved";
export type MuseumLevel = "emerging" | "established" | "landmark";
export type MuseumMembershipTier = "visitor" | "patron" | "benefactor";

export const MUSEUM_FOUNDING_REQUIREMENTS = {
  minTierA: 1,
  minTierB: 1,
  minTierC: 2,
  minTierD: 2,
  minTotalArtworks: 6,
  minTagDiversity: 5,
  minStewardship: 25,
  minPrestige: 50,
  minPatronWeeks: 8,
  endowmentWeeks: 12,           // lock 12 weeks of carry costs
  minEndowmentReserveWeeks: 8,  // must always cover 8 weeks
  exhibitionCadenceWeeks: 8,    // 1 exhibition per this many weeks
  probationMaxWeeks: 8,
  refoundCooldownWeeks: 12,
} as const;

export const MUSEUM_MEMBERSHIP_FEES: Record<MuseumMembershipTier, number> = {
  visitor: 100,
  patron: 500,
  benefactor: 2_000,
};

export interface Museum {
  id: string;
  owner_id: string;
  name: string;
  status: MuseumStatus;
  endowment: number;
  staff_curator_count: number;
  level: MuseumLevel;
  founded_at: string;
  dissolved_at: string | null;
  created_at: string;
  // Joined fields (optional)
  owner?: Profile;
}

export interface MuseumExhibition {
  id: string;
  museum_id: string;
  title: string;
  theme: string | null;
  description: string | null;
  status: "planned" | "open" | "closed";
  starts_at: string;
  ends_at: string;
  visitors: number;
  prestige_earned: number;
  created_at: string;
}

export interface MuseumMembership {
  id: string;
  museum_id: string;
  user_id: string;
  tier: MuseumMembershipTier;
  started_at: string;
  ends_at: string;
  auto_renew: boolean;
}

// ---------- Enriched types for API responses ----------

export interface ArtworkOwnerInfo {
  owner_id: string;
  owner_type: "user" | "npc";
  display_name: string;
  slug: string;
  role?: NpcRole;
  npc_tier?: string;
  acquired_at: string;
}

export interface ArtworkLoanInfo {
  borrower_id: string;
  borrower_name: string;
  borrower_slug: string;
  exhibition_title?: string;
}

export interface EnrichedArtwork extends Artwork {
  owner?: ArtworkOwnerInfo;
  loan?: ArtworkLoanInfo;
}

// ---------- Helpers ----------

export function weeklyCarryCost(iv: number, tier: ArtworkTier, onLoan: boolean, idleWeeks: number): number {
  const cfg = TIER_CONFIG[tier];
  let rate = cfg.premiumRate;
  if (idleWeeks >= IDLE_WEEKS_THRESHOLD) {
    rate *= IDLE_SURCHARGE_MULTIPLIER;
  }
  if (onLoan) {
    rate *= 1 - LOAN_PREMIUM_REDUCTION;
  }
  return Math.round(iv * rate) + cfg.storageFee;
}

export function loanFee(iv: number, curatorTier: CuratorTier): number {
  return Math.round(iv * CURATOR_LOAN_FEES[curatorTier]);
}

/** Calculate the endowment required to found a museum given a list of owned artworks. */
export function museumEndowmentRequired(
  artworks: { insured_value: number; tier: ArtworkTier; on_loan: boolean; idle_weeks: number }[],
): number {
  const totalWeekly = artworks.reduce(
    (sum, a) => sum + weeklyCarryCost(a.insured_value, a.tier, a.on_loan, a.idle_weeks),
    0,
  );
  return totalWeekly * MUSEUM_FOUNDING_REQUIREMENTS.endowmentWeeks;
}

// ---------- Dealer / sale helpers ----------

/** Calculate dealer commission amount from sale price and rate. */
export function dealerCommissionAmount(salePrice: number, commissionRate: number): number {
  return Math.round(salePrice * commissionRate);
}

/** Calculate seller net proceeds after dealer commission. */
export function sellerNetProceeds(salePrice: number, commissionRate: number): number {
  return salePrice - dealerCommissionAmount(salePrice, commissionRate);
}

/** Check if an artwork can be resold (48h minimum hold after acquisition). */
export function canResell(acquiredAt: string): boolean {
  const holdMs = MIN_HOLD_HOURS * 60 * 60 * 1000;
  return Date.now() - new Date(acquiredAt).getTime() >= holdMs;
}

// ---------- Sell / auction constants ----------

export const DEALER_BUY_RATE = 0.50;
export const AUCTION_BACKSTOP_RATE = 0.25;

/** Markup multiplier per dealer NPC — determines asking price for dealer-owned artworks. */
export const DEALER_MARKUP_RATES: Record<string, number> = {
  "npc-d01": 1.10, // Galleria North
  "npc-d02": 1.15, // Bram & Co.
  "npc-d03": 1.25, // The Private Room
  "npc-d04": 1.20, // Restoration House
  "npc-d05": 1.12, // Hearthstone Advisory
  "npc-d06": 1.30, // Night Market
};

/** Compute the asking price a dealer would list an artwork for. */
export function dealerAskingPrice(iv: number, dealerId: string): number {
  const markup = DEALER_MARKUP_RATES[dealerId] ?? 1.10;
  return Math.round(iv * markup);
}

// ---------- Surprise Packages ----------

export type PackageKey = "mystery";

export interface SurprisePackage {
  key: PackageKey;
  label: string;
  cost: number;
  tiers: Record<ArtworkTier, number>; // probability weights summing to 1 (not disclosed to players)
}

export const SURPRISE_PACKAGES: Record<PackageKey, SurprisePackage> = {
  mystery: {
    key: "mystery",
    label: "Mystery",
    cost: 100_000,
    tiers: { D: 0.20, C: 0.35, B: 0.35, A: 0.10 },
  },
};
