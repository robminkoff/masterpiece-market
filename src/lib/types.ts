// Masterpiece Market — Core Types

export type ArtworkTier = "A" | "B" | "C" | "D";
export type PlayerTier = "beginner" | "mid" | "whale";
export type AuctionType = "regular" | "evening" | "private" | "forced" | "estate";
export type AuctionStatus = "scheduled" | "live" | "ended" | "settled" | "cancelled";
export type NpcRole = "curator" | "dealer";
export type CuratorTier = "assistant" | "curator" | "chief" | "legendary";
export type DealerTier = "primary" | "secondary" | "broker" | "specialist";
export type LoanStatus = "pending" | "accepted" | "declined" | "expired";

// ---------- Tier config ----------

export const TIER_CONFIG = {
  A: { premiumRate: 0.006, storageFee: 200, label: "Iconic (1/1)" },
  B: { premiumRate: 0.0035, storageFee: 80, label: "Major" },
  C: { premiumRate: 0.002, storageFee: 25, label: "Mid" },
  D: { premiumRate: 0.0008, storageFee: 5, label: "Edition" },
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
export const STARTING_CREDITS = 10_000;
export const BUYER_PREMIUM_RATE = 0.05;
export const SELLER_FEE_RATE = 0.025;
export const BID_EXTENSION_SECONDS = 15;

// ---------- Entity interfaces ----------

export interface Profile {
  id: string;
  display_name: string;
  tier: PlayerTier;
  credits: number;
  prestige: number;
  stewardship: number;
  created_at: string;
  last_active: string;
}

export type ArtworkSource = "met" | "rijks" | "nga" | "iiif" | "wikimedia";
export type ArtworkStatus = "active" | "needs_review" | "retired";
export type Orientation = "portrait" | "landscape" | "square";

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
  specialty: string | null;
  description: string | null;
  traits: Record<string, unknown>;
  unlock_tier: PlayerTier;
  created_at: string;
}

// ---------- Museum types ----------

export type MuseumStatus = "active" | "probation" | "dissolved";
export type MuseumLevel = "emerging" | "established" | "landmark";
export type MuseumMembershipTier = "visitor" | "patron" | "benefactor";

export const MUSEUM_FOUNDING_REQUIREMENTS = {
  minTierA: 1,
  minTierB: 2,
  minTierC: 3,
  minTierD: 2,
  minTotalArtworks: 8,
  minTagDiversity: 5,
  minStewardship: 25,
  minPrestige: 50,
  minWhaleWeeks: 8,
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
