/**
 * Configuration types, defaults, presets, and CLI parsing.
 *
 * Every tunable knob is in SimConfig. Presets compose market conditions
 * and top-up strategies into named scenarios.
 */

// ── Tier identifiers ────────────────────────────────────────────────

export type Tier = "A" | "B" | "C" | "D";
export const TIERS: Tier[] = ["A", "B", "C", "D"];
export const TIERS_CHEAPEST_FIRST: Tier[] = ["D", "C", "B", "A"];

// ── Sub-config types ────────────────────────────────────────────────

export interface TierConfig {
  minIV: number;
  maxIV: number;
  premiumRate: number;   // weekly, as decimal (0.025 = 2.5%)
  storageFee: number;    // flat weekly fee in credits
  lotsPerWeek: number;   // auction supply per week
  loanOfferProb: number; // weekly probability of receiving a loan offer
}

export interface MarketConfig {
  name: string;
  clearingMean: number;  // mean of clearing pct distribution
  clearingStd: number;
  clearingMin: number;   // clamp bounds
  clearingMax: number;
}

export interface TopUpConfig {
  name: string;
  rules: TopUpRule[];
}

export interface TopUpRule {
  /** If set, triggers unconditionally on this week. */
  triggerWeek?: number;
  /** If set, triggers when runway drops below this many weeks. */
  triggerRunwayBelow?: number;
  /** Amount of credits to purchase. */
  amount: number;
  /** Max times this rule can fire across the entire run. */
  maxUses: number;
}

export interface LoanConfig {
  enabled: boolean;
  durationMin: number;      // weeks
  durationMax: number;
  feeIsPerLoan: boolean;    // true = total fee per loan; false = per week
  premiumReduction: number; // 0.7 = 70% reduction (pay 30%)
  curatorTiers: { name: string; weight: number; feeRate: number }[];
}

export interface StrategyConfig {
  safetyBufferWeeks: number;  // min runway after purchase
  sellRunwayThreshold: number; // sell if runway drops below this
  sellPreference: "dealer" | "auction" | "mixed";
  flippingEnabled: boolean;
  flipProfitThreshold: number; // min expected profit to flip (as fraction of IV)
}

export interface MuseumConfig {
  minA: number;
  minB: number;
  minC: number;
  minD: number;
  minTotal: number;
  minTagDiversity: number;
  endowmentWeeks: number; // cash >= this * total_normal_weekly_carry
}

export interface FeeConfig {
  buyerPremium: number;    // 0.05 = 5%
  sellerFee: number;       // 0.025 = 2.5%
  dealerBuyRate: number;   // 0.50 = 50% of IV
  backstopRate: number;    // 0.25 = 25% of IV
}

// ── Top-level simulation config ─────────────────────────────────────

export interface SimConfig {
  name: string;
  startingCredits: number;
  maxWeeks: number;
  tiers: Record<Tier, TierConfig>;
  market: MarketConfig;
  topUp: TopUpConfig;
  loans: LoanConfig;
  strategy: StrategyConfig;
  museum: MuseumConfig;
  fees: FeeConfig;
  idleSurchargeWeeks: number;
  idleSurchargeMultiplier: number;
}

// ── Tag pool for diversity modeling ─────────────────────────────────

export const TAG_POOL = [
  "renaissance", "baroque", "modern", "contemporary",
  "impressionist", "abstract", "portrait", "landscape",
  "sculpture", "photography", "asian", "american",
];

// ── Defaults ────────────────────────────────────────────────────────

export const DEFAULT_TIERS: Record<Tier, TierConfig> = {
  A: { minIV: 350_000, maxIV: 1_200_000, premiumRate: 0.025, storageFee: 1_000, lotsPerWeek: 1,  loanOfferProb: 0.12 },
  B: { minIV:  75_000, maxIV:   349_000, premiumRate: 0.015, storageFee:   400, lotsPerWeek: 3,  loanOfferProb: 0.10 },
  C: { minIV:  50_000, maxIV:    74_000, premiumRate: 0.008, storageFee:   100, lotsPerWeek: 6,  loanOfferProb: 0.07 },
  D: { minIV:   5_000, maxIV:    49_000, premiumRate: 0.003, storageFee:    20, lotsPerWeek: 10, loanOfferProb: 0.05 },
};

export const DEFAULT_LOANS: LoanConfig = {
  enabled: true,
  durationMin: 4,
  durationMax: 12,
  feeIsPerLoan: true,
  premiumReduction: 0.7,
  curatorTiers: [
    { name: "assistant",  weight: 50, feeRate: 0.0025 },
    { name: "curator",    weight: 35, feeRate: 0.0045 },
    { name: "chief",      weight: 13, feeRate: 0.0075 },
    { name: "legendary",  weight:  2, feeRate: 0.012  },
  ],
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  safetyBufferWeeks: 4,
  sellRunwayThreshold: 2,
  sellPreference: "dealer",
  flippingEnabled: false,
  flipProfitThreshold: 0.05,
};

export const DEFAULT_MUSEUM: MuseumConfig = {
  minA: 1,
  minB: 2,
  minC: 3,
  minD: 2,
  minTotal: 8,
  minTagDiversity: 5,
  endowmentWeeks: 12,
};

export const DEFAULT_FEES: FeeConfig = {
  buyerPremium: 0.05,
  sellerFee: 0.025,
  dealerBuyRate: 0.50,
  backstopRate: 0.25,
};

// ── Market presets ──────────────────────────────────────────────────

export const MARKET_PRESETS: Record<string, MarketConfig> = {
  hot:    { name: "Hot",    clearingMean: 1.05, clearingStd: 0.10, clearingMin: 0.60, clearingMax: 1.60 },
  normal: { name: "Normal", clearingMean: 0.95, clearingStd: 0.10, clearingMin: 0.50, clearingMax: 1.40 },
  cold:   { name: "Cold",   clearingMean: 0.80, clearingStd: 0.12, clearingMin: 0.25, clearingMax: 1.20 },
};

// ── Top-up presets ──────────────────────────────────────────────────

export const TOPUP_PRESETS: Record<string, TopUpConfig> = {
  none: {
    name: "No top-up",
    rules: [],
  },
  emergency: {
    name: "Emergency",
    rules: [
      { triggerRunwayBelow: 3, amount: 250_000, maxUses: 2 },
    ],
  },
  aggressive: {
    name: "Aggressive",
    rules: [
      { triggerWeek: 2, amount: 1_000_000, maxUses: 1 },
      { triggerRunwayBelow: 4, amount: 500_000, maxUses: 4 },
    ],
  },
};

// ── Build a single config from presets ───────────────────────────────

export function buildConfig(
  marketKey: string,
  topUpKey: string,
  overrides?: Partial<SimConfig>,
): SimConfig {
  const market = MARKET_PRESETS[marketKey] ?? MARKET_PRESETS.normal;
  const topUp = TOPUP_PRESETS[topUpKey] ?? TOPUP_PRESETS.none;
  return {
    name: `${market.name} / ${topUp.name}`,
    startingCredits: 250_000,
    maxWeeks: 104,
    tiers: { ...DEFAULT_TIERS },
    market,
    topUp,
    loans: { ...DEFAULT_LOANS },
    strategy: { ...DEFAULT_STRATEGY },
    museum: { ...DEFAULT_MUSEUM },
    fees: { ...DEFAULT_FEES },
    idleSurchargeWeeks: 8,
    idleSurchargeMultiplier: 1.2,
    ...overrides,
  };
}

// ── Build the default 9-scenario matrix ─────────────────────────────

export function buildDefaultScenarios(): SimConfig[] {
  const scenarios: SimConfig[] = [];
  for (const m of ["hot", "normal", "cold"]) {
    for (const t of ["none", "emergency", "aggressive"]) {
      scenarios.push(buildConfig(m, t));
    }
  }
  return scenarios;
}

// ── CLI argument parsing ────────────────────────────────────────────

export interface CLIArgs {
  runs: number;
  maxWeeks: number;
  seed: number;
  market: string | null;   // null = run all
  topup: string | null;    // null = run all
  loans: boolean;
  flipping: boolean;
}

export function parseArgs(argv: string[] = process.argv.slice(2)): CLIArgs {
  const args: CLIArgs = {
    runs: 5_000,
    maxWeeks: 104,
    seed: 42,
    market: null,
    topup: null,
    loans: true,
    flipping: false,
  };

  for (const arg of argv) {
    const [key, val] = arg.replace(/^--/, "").split("=");
    switch (key) {
      case "runs":     args.runs = parseInt(val, 10); break;
      case "weeks":    args.maxWeeks = parseInt(val, 10); break;
      case "seed":     args.seed = parseInt(val, 10); break;
      case "market":   args.market = val; break;
      case "topup":    args.topup = val; break;
      case "loans":    args.loans = val !== "false" && val !== "0"; break;
      case "flipping": args.flipping = val !== "false" && val !== "0"; break;
    }
  }

  return args;
}

/** Build scenario list honoring CLI filters. */
export function buildScenarios(args: CLIArgs): SimConfig[] {
  const markets = args.market ? [args.market] : ["hot", "normal", "cold"];
  const topups = args.topup ? [args.topup] : ["none", "emergency", "aggressive"];

  const scenarios: SimConfig[] = [];
  for (const m of markets) {
    for (const t of topups) {
      scenarios.push(
        buildConfig(m, t, {
          maxWeeks: args.maxWeeks,
          loans: { ...DEFAULT_LOANS, enabled: args.loans },
          strategy: { ...DEFAULT_STRATEGY, flippingEnabled: args.flipping },
        }),
      );
    }
  }
  return scenarios;
}
