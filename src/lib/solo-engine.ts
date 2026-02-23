/**
 * Solo-mode turn engine — pure functions for single-player game logic.
 *
 * Extracted from scripts/sim/engine.ts with the key difference:
 * the sim auto-plays all decisions, while solo mode splits into
 * automated (advance-week) and player-driven (buy, sell, loan, etc.) phases.
 */

import { PRNG } from "./prng";
import { QUIZ_QUESTIONS } from "@/data/quiz-questions";

// ── Types ───────────────────────────────────────────────────────────

export type Tier = "A" | "B" | "C" | "D";
export const TIERS: Tier[] = ["A", "B", "C", "D"];
export const TIERS_CHEAPEST_FIRST: Tier[] = ["D", "C", "B", "A"];

export const TAG_POOL = [
  "renaissance", "baroque", "modern", "contemporary",
  "impressionist", "abstract", "portrait", "landscape",
  "sculpture", "photography", "asian", "american",
];

export type Achievement = "museum" | "wing" | "gallery" | "exhibition";

export interface SimArtwork {
  iv: number;
  tier: Tier;
  tags: string[];
  idleWeeks: number;
  onLoan: boolean;
  loanWeeksRemaining: number;
  acquiredWeek: number;
  purchaseCost: number;
  mortgaged: boolean;
  mortgagePrincipal: number;
  mortgageWeeksRemaining: number;
}

export interface AuctionLot {
  index: number; // position in pending_lots array
  iv: number;
  tier: Tier;
  tags: string[];
  clearingPrice: number;
  totalCost: number; // clearingPrice * 1.05
}

export interface LoanOffer {
  index: number; // position in pending_loans array
  artworkIndex: number;
  curatorTier: string;
  curatorName: string;
  fee: number;
  duration: number;
}

export interface QuizState {
  questionId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  answered: boolean;
}

export interface SoloRunState {
  id: string;
  userId: string;
  seed: number;
  configKey: string;
  week: number;
  cash: number;
  expertise: number;
  artworks: SimArtwork[];
  pendingLoans: LoanOffer[];
  pendingLots: AuctionLot[];
  quiz: QuizState | null;
  outcome: string | null;
  achievement: string | null;
  museumsFounded: number;
  totalCarryPaid: number;
  startedAt: string;
  finishedAt: string | null;
  acquisitionsThisWeek: number; // tracked in-memory during the week
}

// ── Tier config (matches game's types.ts) ───────────────────────────

export interface TierConfig {
  minIV: number;
  maxIV: number;
  premiumRate: number;
  storageFee: number;
  lotsPerWeek: number;
  loanOfferProb: number;
}

export interface MarketConfig {
  name: string;
  clearingMean: number;
  clearingStd: number;
  clearingMin: number;
  clearingMax: number;
}

export interface MuseumConfig {
  minA: number;
  minB: number;
  minC: number;
  minD: number;
  minTotal: number;
  minTagDiversity: number;
  endowmentWeeks: number;
  minPrestige: number;
}

export interface MortgageConfig {
  enabled: boolean;
  ltvRate: number;
  weeklyInterestRate: number;
  termWeeks: number;
  maxMortgages: number;
}

export interface LoanConfig {
  enabled: boolean;
  durationMin: number;
  durationMax: number;
  premiumReduction: number;
  curatorTiers: { name: string; weight: number; feeRate: number }[];
}

export interface GenreBonusConfig {
  enabled: boolean;
  bonusPerMatch: number;
}

export interface AchievementTierDef {
  minArtworks: number;
  minTags: number;
  minBTier: number;
  minATier: number;
}

export interface AchievementConfig {
  enabled: boolean;
  exhibition: AchievementTierDef;
  gallery: AchievementTierDef;
  wing: AchievementTierDef;
}

export interface FeeConfig {
  buyerPremium: number;
  sellerFee: number;
  dealerBuyRate: number;
  backstopRate: number;
}

export interface SurprisePackageConfig {
  enabled: boolean;
  packages: { name: string; cost: number; tierWeights: { tier: Tier; weight: number }[] }[];
}

export interface SoloConfig {
  name: string;
  startingCredits: number;
  maxWeeks: number;
  maxAcquisitionsPerWeek: number;
  tiers: Record<Tier, TierConfig>;
  market: MarketConfig;
  loans: LoanConfig;
  museum: MuseumConfig;
  fees: FeeConfig;
  surprisePackages: SurprisePackageConfig;
  idleSurchargeWeeks: number;
  idleSurchargeMultiplier: number;
  mortgage: MortgageConfig;
  genreBonus: GenreBonusConfig;
  quiz: { enabled: boolean };
  achievements: AchievementConfig;
  startingArtwork: { enabled: boolean; tier: Tier };
}

// ── Default tier configs ────────────────────────────────────────────

const DEFAULT_TIERS: Record<Tier, TierConfig> = {
  A: { minIV: 350_000, maxIV: 1_200_000, premiumRate: 0.015, storageFee: 1_000, lotsPerWeek: 1, loanOfferProb: 0.12 },
  B: { minIV: 75_000, maxIV: 349_000, premiumRate: 0.010, storageFee: 500, lotsPerWeek: 3, loanOfferProb: 0.10 },
  C: { minIV: 50_000, maxIV: 74_000, premiumRate: 0.0075, storageFee: 250, lotsPerWeek: 6, loanOfferProb: 0.07 },
  D: { minIV: 5_000, maxIV: 49_000, premiumRate: 0.005, storageFee: 100, lotsPerWeek: 10, loanOfferProb: 0.05 },
};

// ── Solo config (single fixed configuration) ───────────────────────

export function buildSoloConfig(_presetKey?: string): SoloConfig {
  return {
    name: "Solo",
    startingCredits: 1_000_000,
    maxWeeks: 104,
    maxAcquisitionsPerWeek: 2,
    tiers: { ...DEFAULT_TIERS },
    market: { name: "Normal", clearingMean: 0.95, clearingStd: 0.10, clearingMin: 0.50, clearingMax: 1.40 },
    loans: {
      enabled: true,
      durationMin: 4,
      durationMax: 12,
      premiumReduction: 0.7,
      curatorTiers: [
        { name: "assistant", weight: 50, feeRate: 0.01 },
        { name: "curator", weight: 35, feeRate: 0.02 },
        { name: "chief", weight: 13, feeRate: 0.035 },
        { name: "legendary", weight: 2, feeRate: 0.05 },
      ],
    },
    museum: {
      minA: 1, minB: 1, minC: 2, minD: 4, minTotal: 8,
      minTagDiversity: 5, endowmentWeeks: 6, minPrestige: 10,
    },
    fees: { buyerPremium: 0.05, sellerFee: 0.025, dealerBuyRate: 0.50, backstopRate: 0.25 },
    surprisePackages: {
      enabled: true,
      packages: [{
        name: "Mystery",
        cost: 100_000,
        tierWeights: [
          { tier: "D", weight: 20 },
          { tier: "C", weight: 35 },
          { tier: "B", weight: 35 },
          { tier: "A", weight: 10 },
        ],
      }],
    },
    idleSurchargeWeeks: 8,
    idleSurchargeMultiplier: 1.2,
    mortgage: { enabled: true, ltvRate: 0.5, weeklyInterestRate: 0.02, termWeeks: 12, maxMortgages: 2 },
    genreBonus: { enabled: true, bonusPerMatch: 0.5 },
    quiz: { enabled: true },
    achievements: {
      enabled: true,
      exhibition: { minArtworks: 2, minTags: 2, minBTier: 0, minATier: 0 },
      gallery: { minArtworks: 4, minTags: 3, minBTier: 1, minATier: 0 },
      wing: { minArtworks: 6, minTags: 4, minBTier: 2, minATier: 1 },
    },
    startingArtwork: { enabled: true, tier: "D" },
  };
}

// ── PRNG helper: create a week-deterministic RNG ────────────────────

export function weekRng(seed: number, week: number): PRNG {
  // Combine seed and week so each week has unique but deterministic randomness
  return new PRNG(seed * 10007 + week);
}

// ── Weekly carry cost (matches game formula) ────────────────────────

export function weeklyCarry(work: SimArtwork, tierCfg: TierConfig, cfg: SoloConfig, overrideOnLoan?: boolean): number {
  let rate = tierCfg.premiumRate;
  if (work.idleWeeks >= cfg.idleSurchargeWeeks) {
    rate *= cfg.idleSurchargeMultiplier;
  }
  const onLoan = overrideOnLoan !== undefined ? overrideOnLoan : work.onLoan;
  if (onLoan) {
    rate *= 1 - cfg.loans.premiumReduction;
  }
  return Math.round(work.iv * rate) + tierCfg.storageFee;
}

export function totalWeeklyCarry(artworks: SimArtwork[], cfg: SoloConfig): number {
  let sum = 0;
  for (const w of artworks) {
    sum += weeklyCarry(w, cfg.tiers[w.tier], cfg);
  }
  return sum;
}

export function normalWeeklyCarry(artworks: SimArtwork[], cfg: SoloConfig): number {
  let sum = 0;
  for (const w of artworks) {
    sum += weeklyCarry(w, cfg.tiers[w.tier], cfg, false);
  }
  return sum;
}

export function runway(cash: number, artworks: SimArtwork[], cfg: SoloConfig): number {
  const carry = totalWeeklyCarry(artworks, cfg);
  return carry > 0 ? cash / carry : Infinity;
}

// ── Tier composition ────────────────────────────────────────────────

export function tierCounts(artworks: SimArtwork[]): Record<Tier, number> {
  const c: Record<Tier, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const w of artworks) c[w.tier]++;
  return c;
}

export function tierNeeded(artworks: SimArtwork[], cfg: SoloConfig): Record<Tier, number> {
  const c = tierCounts(artworks);
  return {
    A: Math.max(0, cfg.museum.minA - c.A),
    B: Math.max(0, cfg.museum.minB - c.B),
    C: Math.max(0, cfg.museum.minC - c.C),
    D: Math.max(0, cfg.museum.minD - c.D),
  };
}

// ── Museum founding check ───────────────────────────────────────────

export function checkMuseum(cash: number, artworks: SimArtwork[], expertise: number, cfg: SoloConfig): boolean {
  if (artworks.some((w) => w.mortgaged)) return false;

  const needed = tierNeeded(artworks, cfg);
  if (needed.A > 0 || needed.B > 0 || needed.C > 0 || needed.D > 0) return false;
  if (artworks.length < cfg.museum.minTotal) return false;

  const tags = new Set<string>();
  for (const w of artworks) {
    for (const t of w.tags) tags.add(t);
  }
  if (tags.size < cfg.museum.minTagDiversity) return false;

  const nCarry = normalWeeklyCarry(artworks, cfg);
  const endowment = cfg.museum.endowmentWeeks * nCarry;
  if (cash < endowment) return false;

  if (cfg.museum.minPrestige > 0 && expertise < cfg.museum.minPrestige) return false;

  return true;
}

// ── Lot generation with clearing prices ─────────────────────────────

export function generateLots(cfg: SoloConfig, rng: PRNG): AuctionLot[] {
  const lots: AuctionLot[] = [];
  let idx = 0;
  for (const tier of TIERS_CHEAPEST_FIRST) {
    const tc = cfg.tiers[tier];
    for (let i = 0; i < tc.lotsPerWeek; i++) {
      const iv = rng.uniformInt(tc.minIV, tc.maxIV);
      const numTags = rng.uniformInt(1, 2);
      const tags = rng.pick(TAG_POOL, numTags);
      const clearingPct = rng.normalClamped(
        cfg.market.clearingMean, cfg.market.clearingStd,
        cfg.market.clearingMin, cfg.market.clearingMax,
      );
      const clearingPrice = Math.round(iv * clearingPct);
      const totalCost = Math.round(clearingPrice * (1 + cfg.fees.buyerPremium));
      lots.push({ index: idx++, iv, tier, tags, clearingPrice, totalCost });
    }
  }
  return lots;
}

// ── Loan offer generation ───────────────────────────────────────────

export function generateLoanOffers(artworks: SimArtwork[], cfg: SoloConfig, rng: PRNG): LoanOffer[] {
  if (!cfg.loans.enabled) return [];

  const offers: LoanOffer[] = [];
  let idx = 0;
  for (let i = 0; i < artworks.length; i++) {
    const w = artworks[i];
    if (w.onLoan || w.mortgaged) continue;

    const prob = cfg.tiers[w.tier].loanOfferProb;
    if (!rng.chance(prob)) continue;

    const names = cfg.loans.curatorTiers.map((c) => c.name);
    const weights = cfg.loans.curatorTiers.map((c) => c.weight);
    const feeRates = cfg.loans.curatorTiers.map((c) => c.feeRate);
    const chosen = rng.weightedChoice(names, weights);
    const cIdx = names.indexOf(chosen);
    const feeRate = feeRates[cIdx];

    const fee = Math.round(w.iv * feeRate);
    const duration = rng.uniformInt(cfg.loans.durationMin, cfg.loans.durationMax);

    offers.push({
      index: idx++,
      artworkIndex: i,
      curatorTier: chosen,
      curatorName: `${chosen.charAt(0).toUpperCase() + chosen.slice(1)} Curator`,
      fee,
      duration,
    });
  }
  return offers;
}

// ── Quiz generation ─────────────────────────────────────────────────

export function generateQuiz(seed: number, week: number): QuizState {
  // Deterministic question from seed + week
  const hash = Math.abs((seed * 31 + week * 127) | 0);
  const idx = hash % QUIZ_QUESTIONS.length;
  const q = QUIZ_QUESTIONS[idx];
  return {
    questionId: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    answered: false,
  };
}

// ── Achievement evaluation ──────────────────────────────────────────

export function evaluateAchievement(artworks: SimArtwork[], cfg: SoloConfig): Achievement | null {
  if (!cfg.achievements.enabled) return null;

  const counts = tierCounts(artworks);
  const bPlus = counts.A + counts.B;
  const tags = new Set<string>();
  for (const w of artworks) {
    for (const t of w.tags) tags.add(t);
  }
  const numArt = artworks.length;
  const numTags = tags.size;

  const wi = cfg.achievements.wing;
  if (numArt >= wi.minArtworks && numTags >= wi.minTags && bPlus >= wi.minBTier && counts.A >= wi.minATier) {
    return "wing";
  }
  const g = cfg.achievements.gallery;
  if (numArt >= g.minArtworks && numTags >= g.minTags && bPlus >= g.minBTier && counts.A >= g.minATier) {
    return "gallery";
  }
  const e = cfg.achievements.exhibition;
  if (numArt >= e.minArtworks && numTags >= e.minTags && bPlus >= e.minBTier && counts.A >= e.minATier) {
    return "exhibition";
  }

  return null;
}

// ── Mortgage processing ─────────────────────────────────────────────

export interface MortgageResult {
  artworks: SimArtwork[];
  cash: number;
  forcedSales: number;
}

export function processMortgages(artworks: SimArtwork[], cash: number, cfg: SoloConfig): MortgageResult {
  if (!cfg.mortgage.enabled) return { artworks, cash, forcedSales: 0 };

  const toRemove: SimArtwork[] = [];
  let newCash = cash;

  for (const w of artworks) {
    if (!w.mortgaged) continue;

    const interest = Math.round(w.mortgagePrincipal * cfg.mortgage.weeklyInterestRate);
    newCash -= interest;
    w.mortgageWeeksRemaining--;

    if (w.mortgageWeeksRemaining <= 0) {
      if (newCash >= w.mortgagePrincipal) {
        newCash -= w.mortgagePrincipal;
        w.mortgaged = false;
        w.mortgagePrincipal = 0;
      } else {
        const proceeds = Math.round(w.iv * cfg.fees.dealerBuyRate);
        newCash += proceeds - w.mortgagePrincipal;
        toRemove.push(w);
      }
    }
  }

  const remaining = toRemove.length > 0
    ? artworks.filter((w) => !toRemove.includes(w))
    : artworks;

  return { artworks: remaining, cash: newCash, forcedSales: toRemove.length };
}

// ── Advance week (Phase 1 automation) ───────────────────────────────

export interface AdvanceWeekResult {
  bankrupt: boolean;
  museumEligible: boolean;
  carryPaid: number;
  forcedSales: number;
  newWeek: number;
}

export function advanceWeek(
  state: {
    week: number;
    cash: number;
    artworks: SimArtwork[];
    expertise: number;
    totalCarryPaid: number;
    seed: number;
  },
  cfg: SoloConfig,
): AdvanceWeekResult {
  const newWeek = state.week + 1;
  let { cash } = state;
  let artworks = [...state.artworks.map(a => ({ ...a }))]; // deep copy

  // 1. Process loan returns
  for (const w of artworks) {
    if (w.onLoan) {
      w.loanWeeksRemaining--;
      if (w.loanWeeksRemaining <= 0) {
        w.onLoan = false;
        w.idleWeeks = 0;
      }
    }
  }

  // 2. Increment idle weeks for non-loaned works
  for (const w of artworks) {
    if (!w.onLoan) {
      w.idleWeeks++;
    }
  }

  // 3. Pay weekly carry
  const carry = totalWeeklyCarry(artworks, cfg);
  cash -= carry;

  // 4. Bankruptcy check
  if (cash < 0) {
    return { bankrupt: true, museumEligible: false, carryPaid: carry, forcedSales: 0, newWeek };
  }

  // 5. Process mortgages
  const mortResult = processMortgages(artworks, cash, cfg);
  artworks = mortResult.artworks;
  cash = mortResult.cash;

  // Re-check bankruptcy after mortgage processing
  if (cash < 0) {
    return { bankrupt: true, museumEligible: false, carryPaid: carry, forcedSales: mortResult.forcedSales, newWeek };
  }

  // 6. Museum eligibility check
  const museumEligible = checkMuseum(cash, artworks, state.expertise, cfg);

  // Update state in-place
  state.week = newWeek;
  state.cash = cash;
  state.artworks = artworks;
  state.totalCarryPaid += carry;

  return {
    bankrupt: false,
    museumEligible,
    carryPaid: carry,
    forcedSales: mortResult.forcedSales,
    newWeek,
  };
}

// ── Ascension (museum founded → reset within run) ───────────────────

export function executeAscension(
  state: { cash: number; artworks: SimArtwork[]; museumsFounded: number; seed: number; week: number },
  cfg: SoloConfig,
): void {
  const MUSEUM_BONUS = 250_000;
  state.museumsFounded++;
  state.artworks = [];
  state.cash = cfg.startingCredits + (state.museumsFounded * MUSEUM_BONUS);

  // Gift a new starting artwork
  if (cfg.startingArtwork.enabled) {
    const rng = weekRng(state.seed, state.week + 10000); // offset to avoid collisions
    const tier = cfg.startingArtwork.tier;
    const tc = cfg.tiers[tier];
    const iv = rng.uniformInt(tc.minIV, tc.maxIV);
    const tags = rng.pick(TAG_POOL, rng.uniformInt(1, 2));
    state.artworks.push({
      iv,
      tier,
      tags,
      idleWeeks: 0,
      onLoan: false,
      loanWeeksRemaining: 0,
      acquiredWeek: state.week,
      purchaseCost: 0,
      mortgaged: false,
      mortgagePrincipal: 0,
      mortgageWeeksRemaining: 0,
    });
  }
}

// ── Generate a surprise package artwork ─────────────────────────────

export function generatePackageArtwork(cfg: SoloConfig, rng: PRNG, week: number): SimArtwork | null {
  if (!cfg.surprisePackages.enabled || cfg.surprisePackages.packages.length === 0) return null;

  const pkg = cfg.surprisePackages.packages[0]; // only Mystery for now
  const tiers = pkg.tierWeights.map((tw) => tw.tier);
  const weights = pkg.tierWeights.map((tw) => tw.weight);
  const resultTier = rng.weightedChoice(tiers, weights);

  const tc = cfg.tiers[resultTier];
  const iv = rng.uniformInt(tc.minIV, tc.maxIV);
  const tags = rng.pick(TAG_POOL, rng.uniformInt(1, 2));

  return {
    iv,
    tier: resultTier,
    tags,
    idleWeeks: 0,
    onLoan: false,
    loanWeeksRemaining: 0,
    acquiredWeek: week,
    purchaseCost: pkg.cost,
    mortgaged: false,
    mortgagePrincipal: 0,
    mortgageWeeksRemaining: 0,
  };
}

// ── Genre bonus calculation ─────────────────────────────────────────

export function calculateGenreBonus(
  acceptedLoans: { artworkIndex: number; fee: number }[],
  artworks: SimArtwork[],
  cfg: SoloConfig,
): number {
  if (!cfg.genreBonus.enabled || acceptedLoans.length < 2) return 0;

  const tagCounts = new Map<string, { fee: number; idx: number }[]>();
  for (const loan of acceptedLoans) {
    const w = artworks[loan.artworkIndex];
    if (!w) continue;
    for (const tag of w.tags) {
      let list = tagCounts.get(tag);
      if (!list) {
        list = [];
        tagCounts.set(tag, list);
      }
      list.push({ fee: loan.fee, idx: loan.artworkIndex });
    }
  }

  const bonused = new Set<number>();
  let totalBonus = 0;
  for (const [, entries] of tagCounts) {
    if (entries.length < 2) continue;
    for (const entry of entries) {
      if (bonused.has(entry.idx)) continue;
      bonused.add(entry.idx);
      totalBonus += Math.round(entry.fee * cfg.genreBonus.bonusPerMatch);
    }
  }
  return totalBonus;
}
