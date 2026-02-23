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
  maxAcquisitionsPerWeek: number; // cap on artworks acquired per week (99 = unlimited)
}

export interface MuseumConfig {
  minA: number;
  minB: number;
  minC: number;
  minD: number;
  minTotal: number;
  minTagDiversity: number;
  endowmentWeeks: number; // cash >= this * total_normal_weekly_carry
  minPrestige: number;    // prestige points needed (0 = no requirement)
  minStewardship: number; // stewardship score needed (0 = no requirement)
}

export interface MortgageConfig {
  enabled: boolean;
  ltvRate: number;              // loan-to-value ratio, e.g. 0.5 = borrow 50% of IV
  weeklyInterestRate: number;   // e.g. 0.02 = 2% of principal per week
  termWeeks: number;            // repayment window
  maxMortgages: number;         // max concurrent mortgages
}

export interface GenreBonusConfig {
  enabled: boolean;
  bonusPerMatch: number; // e.g. 0.25 = +25% fee per additional matching-tag work loaned that week
}

export interface QuizConfig {
  enabled: boolean;
  entryFee: number;       // e.g. 1,000 cr
  correctRate: number;    // probability of correct answer, e.g. 0.7
  prestigeReward: number; // prestige points per correct answer
  timesPerWeek: number;   // e.g. 7 (daily) or 1 (weekly)
}

export interface FeeConfig {
  buyerPremium: number;    // 0.05 = 5%
  sellerFee: number;       // 0.025 = 2.5%
  dealerBuyRate: number;   // 0.50 = 50% of IV
  backstopRate: number;    // 0.25 = 25% of IV
}

export interface StartingArtworkConfig {
  enabled: boolean;
  tier: Tier;
}

export interface SurprisePackageConfig {
  enabled: boolean;
  packages: PackageDef[];
}

export interface PackageDef {
  name: string;
  cost: number;
  tierWeights: { tier: Tier; weight: number }[];
}

// ── Achievement tiers (graduated outcomes) ───────────────────────────

export type Achievement = "museum" | "wing" | "gallery" | "exhibition";

export interface AchievementTierDef {
  minArtworks: number;
  minTags: number;
  minBTier: number; // artworks of tier B or above
  minATier: number; // artworks of tier A
}

export interface AchievementConfig {
  enabled: boolean; // false = legacy binary (museum/bankruptcy/timeout)
  exhibition: AchievementTierDef;
  gallery: AchievementTierDef;
  wing: AchievementTierDef;
  // museum uses MuseumConfig requirements (top tier)
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
  startingArtwork: StartingArtworkConfig;
  surprisePackages: SurprisePackageConfig;
  idleSurchargeWeeks: number;
  idleSurchargeMultiplier: number;
  mortgage: MortgageConfig;
  genreBonus: GenreBonusConfig;
  quiz: QuizConfig;
  achievements: AchievementConfig;
}

// ── Tag pool for diversity modeling ─────────────────────────────────

export const TAG_POOL = [
  "renaissance", "baroque", "modern", "contemporary",
  "impressionist", "abstract", "portrait", "landscape",
  "sculpture", "photography", "asian", "american",
];

// ── Defaults ────────────────────────────────────────────────────────

export const DEFAULT_TIERS: Record<Tier, TierConfig> = {
  A: { minIV: 350_000, maxIV: 1_200_000, premiumRate: 0.015, storageFee: 1_000, lotsPerWeek: 1,  loanOfferProb: 0.12 },
  B: { minIV:  75_000, maxIV:   349_000, premiumRate: 0.010, storageFee:   500, lotsPerWeek: 3,  loanOfferProb: 0.10 },
  C: { minIV:  50_000, maxIV:    74_000, premiumRate: 0.0075, storageFee:   250, lotsPerWeek: 6,  loanOfferProb: 0.07 },
  D: { minIV:   5_000, maxIV:    49_000, premiumRate: 0.005,  storageFee:   100, lotsPerWeek: 10, loanOfferProb: 0.05 },
};

export const DEFAULT_LOANS: LoanConfig = {
  enabled: true,
  durationMin: 4,
  durationMax: 12,
  feeIsPerLoan: true,
  premiumReduction: 0.7,
  curatorTiers: [
    { name: "assistant",  weight: 50, feeRate: 0.01  },
    { name: "curator",    weight: 35, feeRate: 0.02  },
    { name: "chief",      weight: 13, feeRate: 0.035 },
    { name: "legendary",  weight:  2, feeRate: 0.05  },
  ],
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  safetyBufferWeeks: 4,
  sellRunwayThreshold: 2,
  sellPreference: "dealer",
  flippingEnabled: false,
  flipProfitThreshold: 0.05,
  maxAcquisitionsPerWeek: 3,
};

export const DEFAULT_MUSEUM: MuseumConfig = {
  minA: 1,
  minB: 1,
  minC: 2,
  minD: 4,
  minTotal: 8,
  minTagDiversity: 5,
  endowmentWeeks: 6,
  minPrestige: 10,
  minStewardship: 0,
};

export const DEFAULT_MORTGAGE: MortgageConfig = {
  enabled: true,
  ltvRate: 0.5,
  weeklyInterestRate: 0.02,
  termWeeks: 12,
  maxMortgages: 2,
};

export const DEFAULT_GENRE_BONUS: GenreBonusConfig = {
  enabled: true,
  bonusPerMatch: 0.5,
};

export const DEFAULT_QUIZ: QuizConfig = {
  enabled: true,
  entryFee: 0,
  correctRate: 0.7,
  prestigeReward: 1,
  timesPerWeek: 7,
};

export const DEFAULT_ACHIEVEMENTS: AchievementConfig = {
  enabled: true,
  exhibition: { minArtworks: 2, minTags: 2, minBTier: 0, minATier: 0 },
  gallery:    { minArtworks: 4, minTags: 3, minBTier: 1, minATier: 0 },
  wing:       { minArtworks: 6, minTags: 4, minBTier: 2, minATier: 1 },
};

export const DEFAULT_FEES: FeeConfig = {
  buyerPremium: 0.05,
  sellerFee: 0.025,
  dealerBuyRate: 0.50,
  backstopRate: 0.25,
};

export const DEFAULT_STARTING_ARTWORK: StartingArtworkConfig = {
  enabled: true,
  tier: "D",
};

export const DEFAULT_SURPRISE_PACKAGES: SurprisePackageConfig = {
  enabled: true,
  packages: [
    {
      name: "Mystery",
      cost: 100_000,
      tierWeights: [
        { tier: "D", weight: 20 },
        { tier: "C", weight: 35 },
        { tier: "B", weight: 35 },
        { tier: "A", weight: 10 },
      ],
    },
  ],
};

export const RAISED_LOAN_FEES: LoanConfig["curatorTiers"] = [
  { name: "assistant",  weight: 50, feeRate: 0.01  },
  { name: "curator",    weight: 35, feeRate: 0.02  },
  { name: "chief",      weight: 13, feeRate: 0.035 },
  { name: "legendary",  weight:  2, feeRate: 0.05  },
];

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

// ── Tune presets (parameter variants for A/B comparison) ─────────────

export interface TunePreset {
  name: string;
  startingCredits?: number;
  tierOverrides?: Partial<Record<Tier, Partial<TierConfig>>>;
  loanOverrides?: Partial<LoanConfig>;
  strategyOverrides?: Partial<StrategyConfig>;
  startingArtwork?: Partial<StartingArtworkConfig>;
  surprisePackages?: Partial<SurprisePackageConfig>;
  mortgageOverrides?: Partial<MortgageConfig>;
  genreBonusOverrides?: Partial<GenreBonusConfig>;
  quizOverrides?: Partial<QuizConfig>;
  museumOverrides?: Partial<MuseumConfig>;
  achievementOverrides?: Partial<AchievementConfig>;
}

export const TUNE_PRESETS: Record<string, TunePreset> = {
  current: {
    name: "Current",
  },
  gpt: {
    name: "GPT v0",
    tierOverrides: { A: { premiumRate: 0.015 } },
    loanOverrides: {
      curatorTiers: [
        { name: "assistant",  weight: 50, feeRate: 0.005  },
        { name: "curator",    weight: 35, feeRate: 0.01   },
        { name: "chief",      weight: 13, feeRate: 0.016  },
        { name: "legendary",  weight:  2, feeRate: 0.025  },
      ],
    },
  },
  "gpt-lowfee": {
    name: "GPT lowfee",
    tierOverrides: { A: { premiumRate: 0.015 } },
  },
  "loans2x": {
    name: "2x Loans",
    tierOverrides: {
      A: { loanOfferProb: 0.24 },
      B: { loanOfferProb: 0.20 },
      C: { loanOfferProb: 0.14 },
      D: { loanOfferProb: 0.10 },
    },
  },
  combo: {
    name: "Combo",
    tierOverrides: {
      A: { premiumRate: 0.015, loanOfferProb: 0.24 },
      B: { loanOfferProb: 0.20 },
      C: { loanOfferProb: 0.14 },
      D: { loanOfferProb: 0.10 },
    },
  },
  "start500k": {
    name: "500k Start",
    startingCredits: 500_000,
  },
  "500k-gpt": {
    name: "500k+GPT",
    startingCredits: 500_000,
    tierOverrides: { A: { premiumRate: 0.015 } },
  },
  "500k-art-pkg": {
    name: "500k+Art+Pkg",
    startingCredits: 500_000,
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  "500k-full": {
    name: "500k Full",
    startingCredits: 500_000,
    tierOverrides: { A: { premiumRate: 0.015 } },
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  "start1m": {
    name: "1M Start",
    startingCredits: 1_000_000,
  },
  "start1m-gpt": {
    name: "1M+GPT",
    startingCredits: 1_000_000,
    tierOverrides: { A: { premiumRate: 0.015 } },
  },
  "start-art": {
    name: "Start w/Art",
    startingArtwork: { enabled: true },
  },
  pkg: {
    name: "Packages",
    surprisePackages: { enabled: true },
  },
  "1m-art": {
    name: "1M+Art",
    startingCredits: 1_000_000,
    startingArtwork: { enabled: true },
  },
  "1m-pkg": {
    name: "1M+Pkg",
    startingCredits: 1_000_000,
    surprisePackages: { enabled: true },
  },
  "1m-art-pkg": {
    name: "1M+Art+Pkg",
    startingCredits: 1_000_000,
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  "full": {
    name: "Full (1M+GPT+A+P)",
    startingCredits: 1_000_000,
    tierOverrides: { A: { premiumRate: 0.015 } },
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  // ── Acquisition rate-limit presets ──────────────────────────────
  "cap1": {
    name: "1/week",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 1 },
  },
  "cap2": {
    name: "2/week",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 2 },
  },
  "cap1-pkg": {
    name: "1/wk+Pkg",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 1 },
    surprisePackages: { enabled: true },
  },
  "cap2-pkg": {
    name: "2/wk+Pkg",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 2 },
    surprisePackages: { enabled: true },
  },
  "cap1-art-pkg": {
    name: "1/wk+A+P",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 1 },
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  "cap2-art-pkg": {
    name: "2/wk+A+P",
    startingCredits: 1_000_000,
    strategyOverrides: { maxAcquisitionsPerWeek: 2 },
    startingArtwork: { enabled: true },
    surprisePackages: { enabled: true },
  },
  // ── New mechanic presets ──────────────────────────────────────────
  highfees: {
    name: "High Fees",
    loanOverrides: { curatorTiers: RAISED_LOAN_FEES },
  },
  mortgage: {
    name: "Mortgage",
    mortgageOverrides: { enabled: true },
  },
  quiz: {
    name: "Quiz",
    quizOverrides: { enabled: true },
    museumOverrides: { minPrestige: 10 },
  },
  genre: {
    name: "Genre Bonus",
    genreBonusOverrides: { enabled: true },
  },
  "1m-pkg-hf": {
    name: "1M+Pkg+HighFees",
    startingCredits: 1_000_000,
    surprisePackages: { enabled: true },
    loanOverrides: { curatorTiers: RAISED_LOAN_FEES },
  },
  "1m-pkg-mort": {
    name: "1M+Pkg+Mortgage",
    startingCredits: 1_000_000,
    surprisePackages: { enabled: true },
    mortgageOverrides: { enabled: true },
  },
  "1m-pkg-quiz": {
    name: "1M+Pkg+Quiz",
    startingCredits: 1_000_000,
    surprisePackages: { enabled: true },
    quizOverrides: { enabled: true },
    museumOverrides: { minPrestige: 10 },
  },
  "1m-pkg-all": {
    name: "1M+Pkg+All",
    startingCredits: 1_000_000,
    surprisePackages: { enabled: true },
    loanOverrides: { curatorTiers: RAISED_LOAN_FEES },
    mortgageOverrides: { enabled: true },
    genreBonusOverrides: { enabled: true },
    quizOverrides: { enabled: true },
    museumOverrides: { minPrestige: 10 },
  },
  // ── Default / educational preset (matches built-in defaults) ──────
  default: {
    name: "Default",
  },
  // ── Legacy preset (restores pre-unified defaults for regression) ──
  legacy: {
    name: "Legacy",
    startingCredits: 250_000,
    tierOverrides: {
      A: { premiumRate: 0.025 },
      B: { premiumRate: 0.015 },
    },
    loanOverrides: {
      curatorTiers: [
        { name: "assistant",  weight: 50, feeRate: 0.0025 },
        { name: "curator",    weight: 35, feeRate: 0.0045 },
        { name: "chief",      weight: 13, feeRate: 0.0075 },
        { name: "legendary",  weight:  2, feeRate: 0.012  },
      ],
    },
    strategyOverrides: { maxAcquisitionsPerWeek: 99 },
    startingArtwork: { enabled: false },
    surprisePackages: { enabled: false },
    mortgageOverrides: { enabled: false },
    genreBonusOverrides: { enabled: false, bonusPerMatch: 0.25 },
    quizOverrides: { enabled: false, prestigeReward: 2 },
    museumOverrides: {
      minA: 1, minB: 1, minC: 2, minD: 2, minTotal: 6,
      minTagDiversity: 5, endowmentWeeks: 12, minPrestige: 0,
    },
    achievementOverrides: { enabled: false },
  },
  "student-hard": {
    name: "Student Hard",
    startingCredits: 1_000_000,
    tierOverrides: {
      A: { premiumRate: 0.015 },
      B: { premiumRate: 0.010 },
    },
    loanOverrides: { curatorTiers: RAISED_LOAN_FEES },
    strategyOverrides: { maxAcquisitionsPerWeek: 2 },
    surprisePackages: { enabled: true },
    mortgageOverrides: { enabled: true },
    genreBonusOverrides: { enabled: true, bonusPerMatch: 0.5 },
    quizOverrides: { enabled: true, prestigeReward: 3 },
    museumOverrides: {
      minA: 2, minB: 2, minC: 3, minD: 3, minTotal: 10,
      minTagDiversity: 7, endowmentWeeks: 8, minPrestige: 30,
    },
    achievementOverrides: { enabled: true },
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
    startingCredits: 1_000_000,
    maxWeeks: 104,
    tiers: { ...DEFAULT_TIERS },
    market,
    topUp,
    loans: { ...DEFAULT_LOANS },
    strategy: { ...DEFAULT_STRATEGY },
    museum: { ...DEFAULT_MUSEUM },
    fees: { ...DEFAULT_FEES },
    startingArtwork: { ...DEFAULT_STARTING_ARTWORK },
    surprisePackages: { ...DEFAULT_SURPRISE_PACKAGES },
    idleSurchargeWeeks: 8,
    idleSurchargeMultiplier: 1.2,
    mortgage: { ...DEFAULT_MORTGAGE },
    genreBonus: { ...DEFAULT_GENRE_BONUS },
    quiz: { ...DEFAULT_QUIZ },
    achievements: { ...DEFAULT_ACHIEVEMENTS },
    ...overrides,
  };
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
  tune: string;            // tune preset key (default: "current")
  compare: boolean;        // run all tune presets side-by-side
  startart: boolean;       // override: give player a starting D-tier artwork
  packages: boolean;       // override: enable surprise packages
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
    tune: "current",
    compare: false,
    startart: false,
    packages: false,
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
      case "tune":     args.tune = val; break;
      case "compare":  args.compare = val !== "false" && val !== "0"; break;
      case "startart": args.startart = val !== "false" && val !== "0"; break;
      case "packages": args.packages = val !== "false" && val !== "0"; break;
    }
  }

  return args;
}

/** Build scenario list honoring CLI filters and tune presets. */
export function buildScenarios(args: CLIArgs): SimConfig[] {
  const markets = args.market ? [args.market] : ["hot", "normal", "cold"];
  const topups = args.topup ? [args.topup] : ["none", "emergency", "aggressive"];
  const tuneKeys = args.compare
    ? Object.keys(TUNE_PRESETS)
    : [args.tune];

  const scenarios: SimConfig[] = [];

  for (const tuneKey of tuneKeys) {
    const tune = TUNE_PRESETS[tuneKey] ?? TUNE_PRESETS.current;

    // Build tiers with tune overrides
    const tiers: Record<Tier, TierConfig> = {
      A: { ...DEFAULT_TIERS.A },
      B: { ...DEFAULT_TIERS.B },
      C: { ...DEFAULT_TIERS.C },
      D: { ...DEFAULT_TIERS.D },
    };
    for (const t of TIERS) {
      if (tune.tierOverrides?.[t]) {
        tiers[t] = { ...tiers[t], ...tune.tierOverrides[t] };
      }
    }

    // Build loan config with tune overrides
    const loans: LoanConfig = {
      ...DEFAULT_LOANS,
      ...(tune.loanOverrides ?? {}),
      enabled: args.loans,
    };

    // Starting artwork: tune preset or CLI flag
    const startingArtwork: StartingArtworkConfig = {
      ...DEFAULT_STARTING_ARTWORK,
      ...(tune.startingArtwork ?? {}),
      ...(args.startart ? { enabled: true } : {}),
    };

    // Surprise packages: tune preset or CLI flag
    const surprisePackages: SurprisePackageConfig = {
      ...DEFAULT_SURPRISE_PACKAGES,
      ...(tune.surprisePackages ?? {}),
      ...(args.packages ? { enabled: true } : {}),
    };

    const prefix = tuneKeys.length > 1 ? `${tune.name} | ` : "";

    for (const m of markets) {
      for (const t of topups) {
        const market = MARKET_PRESETS[m] ?? MARKET_PRESETS.normal;
        const topUp = TOPUP_PRESETS[t] ?? TOPUP_PRESETS.none;

        scenarios.push({
          name: `${prefix}${market.name} / ${topUp.name}`,
          startingCredits: tune.startingCredits ?? 1_000_000,
          maxWeeks: args.maxWeeks,
          tiers,
          market,
          topUp,
          loans,
          strategy: { ...DEFAULT_STRATEGY, flippingEnabled: args.flipping, ...(tune.strategyOverrides ?? {}) },
          museum: { ...DEFAULT_MUSEUM, ...(tune.museumOverrides ?? {}) },
          fees: { ...DEFAULT_FEES },
          startingArtwork,
          surprisePackages,
          idleSurchargeWeeks: 8,
          idleSurchargeMultiplier: 1.2,
          mortgage: { ...DEFAULT_MORTGAGE, ...(tune.mortgageOverrides ?? {}) },
          genreBonus: { ...DEFAULT_GENRE_BONUS, ...(tune.genreBonusOverrides ?? {}) },
          quiz: { ...DEFAULT_QUIZ, ...(tune.quizOverrides ?? {}) },
          achievements: { ...DEFAULT_ACHIEVEMENTS, ...(tune.achievementOverrides ?? {}) },
        });
      }
    }
  }

  return scenarios;
}
