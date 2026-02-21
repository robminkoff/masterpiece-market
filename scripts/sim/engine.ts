/**
 * Simulation engine — runs a single player lifecycle.
 *
 * One call to simulateRun() plays out up to `maxWeeks` of game time,
 * returning an outcome (museum founded, bankruptcy, or timeout).
 *
 * All formulas match the game's types.ts constants.
 */

import { PRNG } from "./prng";
import {
  SimConfig,
  Tier,
  TIERS_CHEAPEST_FIRST,
  TAG_POOL,
  TierConfig,
  PackageDef,
} from "./config";

// ── Types ───────────────────────────────────────────────────────────

export interface SimArtwork {
  iv: number;
  tier: Tier;
  tags: string[];
  idleWeeks: number;
  onLoan: boolean;
  loanWeeksRemaining: number;
  acquiredWeek: number;
  purchaseCost: number; // total cost paid (for flip evaluation)
}

export interface SimResult {
  outcome: "museum" | "bankruptcy" | "timeout";
  week: number;
  finalCash: number;
  artworksOwned: number;
  totalCarryPaid: number;
  topUpSpent: number;
  netWorth: number; // cash + sum(IV) of owned works
}

interface PlayerState {
  cash: number;
  artworks: SimArtwork[];
  week: number;
  totalCarryPaid: number;
  topUpUsesByRule: number[]; // per-rule usage count
  topUpSpent: number;
  acquisitionsThisWeek: number; // tracks purchases this week for rate limiting
}

// ── Weekly carry cost (matches game formula) ────────────────────────

/**
 * weekly_carry = round(IV * adjusted_rate) + storage_fee
 *
 * adjusted_rate starts at tier premium rate, then:
 *   - if idle >= 8 weeks: *= 1.2
 *   - if on loan: *= (1 - 0.7) = 0.3
 */
function weeklyCarry(
  work: SimArtwork,
  tierCfg: TierConfig,
  cfg: SimConfig,
  overrideOnLoan?: boolean,
): number {
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

/** Total weekly carry for entire collection. */
function totalWeeklyCarry(state: PlayerState, cfg: SimConfig): number {
  let sum = 0;
  for (const w of state.artworks) {
    sum += weeklyCarry(w, cfg.tiers[w.tier], cfg);
  }
  return sum;
}

/** Normal (non-loan-discounted) carry — used for endowment calculation. */
function normalWeeklyCarry(state: PlayerState, cfg: SimConfig): number {
  let sum = 0;
  for (const w of state.artworks) {
    sum += weeklyCarry(w, cfg.tiers[w.tier], cfg, /* overrideOnLoan */ false);
  }
  return sum;
}

/** Runway = how many weeks the player can sustain current carry. */
function runway(state: PlayerState, cfg: SimConfig): number {
  const carry = totalWeeklyCarry(state, cfg);
  return carry > 0 ? state.cash / carry : Infinity;
}

// ── Tier composition helpers ────────────────────────────────────────

function tierCounts(artworks: SimArtwork[]): Record<Tier, number> {
  const c: Record<Tier, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const w of artworks) c[w.tier]++;
  return c;
}

function tierNeeded(artworks: SimArtwork[], cfg: SimConfig): Record<Tier, number> {
  const c = tierCounts(artworks);
  return {
    A: Math.max(0, cfg.museum.minA - c.A),
    B: Math.max(0, cfg.museum.minB - c.B),
    C: Math.max(0, cfg.museum.minC - c.C),
    D: Math.max(0, cfg.museum.minD - c.D),
  };
}

// ── Museum founding check ───────────────────────────────────────────

function checkMuseum(state: PlayerState, cfg: SimConfig): boolean {
  // 1. Tier composition: 1A + 2B + 3C + 2D minimum
  const needed = tierNeeded(state.artworks, cfg);
  if (needed.A > 0 || needed.B > 0 || needed.C > 0 || needed.D > 0) return false;
  if (state.artworks.length < cfg.museum.minTotal) return false;

  // 2. Tag diversity
  const tags = new Set<string>();
  for (const w of state.artworks) {
    for (const t of w.tags) tags.add(t);
  }
  if (tags.size < cfg.museum.minTagDiversity) return false;

  // 3. Endowment: cash >= endowmentWeeks * normal_weekly_carry
  const normalCarry = normalWeeklyCarry(state, cfg);
  const endowment = cfg.museum.endowmentWeeks * normalCarry;
  if (state.cash < endowment) return false;

  return true;
}

// ── Auction lot generation ──────────────────────────────────────────

interface AuctionLot {
  iv: number;
  tier: Tier;
  tags: string[];
}

function generateLots(cfg: SimConfig, rng: PRNG): AuctionLot[] {
  const lots: AuctionLot[] = [];
  for (const tier of TIERS_CHEAPEST_FIRST) {
    const tc = cfg.tiers[tier];
    for (let i = 0; i < tc.lotsPerWeek; i++) {
      const iv = rng.uniformInt(tc.minIV, tc.maxIV);
      const numTags = rng.uniformInt(1, 2);
      const tags = rng.pick(TAG_POOL, numTags);
      lots.push({ iv, tier, tags });
    }
  }
  return lots;
}

// ── Simulation: one full run ────────────────────────────────────────

export function simulateRun(cfg: SimConfig, rng: PRNG): SimResult {
  const state: PlayerState = {
    cash: cfg.startingCredits,
    artworks: [],
    week: 0,
    totalCarryPaid: 0,
    topUpUsesByRule: cfg.topUp.rules.map(() => 0),
    topUpSpent: 0,
    acquisitionsThisWeek: 0,
  };

  // ── Starting artwork (gifted at week 0) ──────────────────────────
  if (cfg.startingArtwork.enabled) {
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
      acquiredWeek: 0,
      purchaseCost: 0,
    });
  }

  for (let week = 1; week <= cfg.maxWeeks; week++) {
    state.week = week;
    state.acquisitionsThisWeek = 0; // reset weekly acquisition counter

    // ── 1. Process loan returns ──────────────────────────────────
    for (const w of state.artworks) {
      if (w.onLoan) {
        w.loanWeeksRemaining--;
        if (w.loanWeeksRemaining <= 0) {
          w.onLoan = false;
          w.idleWeeks = 0; // reset idle on loan return
        }
      }
    }

    // ── 2. Increment idle weeks for non-loaned works ─────────────
    for (const w of state.artworks) {
      if (!w.onLoan) {
        w.idleWeeks++;
      }
    }

    // ── 3. Pay weekly carry ──────────────────────────────────────
    const carry = totalWeeklyCarry(state, cfg);
    state.cash -= carry;
    state.totalCarryPaid += carry;

    // ── 4. Bankruptcy check ──────────────────────────────────────
    if (state.cash < 0) {
      return result(state, "bankruptcy");
    }

    // ── 5. Museum check ──────────────────────────────────────────
    if (checkMuseum(state, cfg)) {
      return result(state, "museum");
    }

    // ── 6. Top-up strategy ───────────────────────────────────────
    applyTopUps(state, cfg);

    // ── 7. Try to get loans ──────────────────────────────────────
    if (cfg.loans.enabled) {
      tryLoans(state, cfg, rng);
    }

    // ── 8. Sell if runway is dangerously low ─────────────────────
    sellIfNeeded(state, cfg, rng);

    // ── 9. Acquire new works to fill museum requirements ─────────
    acquireWorks(state, cfg, rng);

    // ── 10. Buy surprise packages if enabled ────────────────────
    if (cfg.surprisePackages.enabled) {
      buySurprisePackage(state, cfg, rng);
    }

    // ── 11. Flip for profit (optional) ───────────────────────────
    if (cfg.strategy.flippingEnabled) {
      tryFlips(state, cfg, rng);
    }
  }

  return result(state, "timeout");
}

// ── Step implementations ────────────────────────────────────────────

function applyTopUps(state: PlayerState, cfg: SimConfig): void {
  const rw = runway(state, cfg);

  for (let i = 0; i < cfg.topUp.rules.length; i++) {
    const rule = cfg.topUp.rules[i];
    if (state.topUpUsesByRule[i] >= rule.maxUses) continue;

    let shouldFire = false;
    if (rule.triggerWeek !== undefined && state.week === rule.triggerWeek) {
      shouldFire = true;
    }
    if (rule.triggerRunwayBelow !== undefined && rw < rule.triggerRunwayBelow) {
      shouldFire = true;
    }

    if (shouldFire) {
      state.cash += rule.amount;
      state.topUpSpent += rule.amount;
      state.topUpUsesByRule[i]++;
    }
  }
}

function tryLoans(state: PlayerState, cfg: SimConfig, rng: PRNG): void {
  for (const w of state.artworks) {
    if (w.onLoan) continue; // already on loan

    const prob = cfg.tiers[w.tier].loanOfferProb;
    if (!rng.chance(prob)) continue;

    // Determine curator tier (weighted random)
    const names = cfg.loans.curatorTiers.map((c) => c.name);
    const weights = cfg.loans.curatorTiers.map((c) => c.weight);
    const feeRates = cfg.loans.curatorTiers.map((c) => c.feeRate);
    const idx = names.indexOf(rng.weightedChoice(names, weights));
    const feeRate = feeRates[idx];

    // Calculate fee
    const fee = Math.round(w.iv * feeRate);
    // fee is per-loan total (paid upfront)
    if (state.cash < fee) continue; // can't afford

    // Accept the loan
    const duration = rng.uniformInt(cfg.loans.durationMin, cfg.loans.durationMax);
    state.cash -= fee;
    w.onLoan = true;
    w.loanWeeksRemaining = duration;
    w.idleWeeks = 0;
  }
}

function sellIfNeeded(state: PlayerState, cfg: SimConfig, rng: PRNG): void {
  const threshold = cfg.strategy.sellRunwayThreshold;

  while (runway(state, cfg) < threshold && state.artworks.length > 0) {
    // Find sellable works: not on loan, held >= 1 week
    const sellable = state.artworks.filter(
      (w) => !w.onLoan && state.week - w.acquiredWeek >= 1,
    );
    if (sellable.length === 0) break;

    // Sell the least valuable (by IV) to minimize collection impact
    sellable.sort((a, b) => a.iv - b.iv);
    const target = sellable[0];

    const proceeds = sellProceeds(target, cfg, rng);
    state.cash += proceeds;
    state.artworks = state.artworks.filter((w) => w !== target);
  }
}

function sellProceeds(work: SimArtwork, cfg: SimConfig, rng: PRNG): number {
  if (cfg.strategy.sellPreference === "dealer") {
    // Instant sale at 50% of IV, no seller fee
    return Math.round(work.iv * cfg.fees.dealerBuyRate);
  }
  // Auction sale: clearing pct drawn from market distribution
  const pct = rng.normalClamped(
    cfg.market.clearingMean,
    cfg.market.clearingStd,
    cfg.market.clearingMin,
    cfg.market.clearingMax,
  );
  const effectivePct = Math.max(pct, cfg.fees.backstopRate);
  return Math.round(work.iv * effectivePct * (1 - cfg.fees.sellerFee));
}

function acquireWorks(state: PlayerState, cfg: SimConfig, rng: PRNG): void {
  const needed = tierNeeded(state.artworks, cfg);
  const lots = generateLots(cfg, rng);
  const cap = cfg.strategy.maxAcquisitionsPerWeek;

  // Try cheapest tiers first (D → C → B → A)
  for (const tier of TIERS_CHEAPEST_FIRST) {
    if (needed[tier] <= 0) continue;

    // Get lots for this tier, sorted cheapest first
    const tierLots = lots.filter((l) => l.tier === tier);
    tierLots.sort((a, b) => a.iv - b.iv);

    for (const lot of tierLots) {
      if (needed[tier] <= 0) break;
      if (state.acquisitionsThisWeek >= cap) return; // weekly cap reached

      // Draw clearing price
      const clearingPct = rng.normalClamped(
        cfg.market.clearingMean,
        cfg.market.clearingStd,
        cfg.market.clearingMin,
        cfg.market.clearingMax,
      );
      const clearingPrice = Math.round(lot.iv * clearingPct);
      const totalCost = Math.round(clearingPrice * (1 + cfg.fees.buyerPremium));

      if (totalCost > state.cash) continue; // can't afford at all

      // Check post-purchase runway (include new work's carry)
      const newWorkCarry =
        Math.round(lot.iv * cfg.tiers[tier].premiumRate) + cfg.tiers[tier].storageFee;
      const currentCarry = totalWeeklyCarry(state, cfg);
      const futureCarry = currentCarry + newWorkCarry;
      const postRunway =
        futureCarry > 0 ? (state.cash - totalCost) / futureCarry : Infinity;

      if (postRunway < cfg.strategy.safetyBufferWeeks) continue; // too risky

      // Buy it
      state.cash -= totalCost;
      state.artworks.push({
        iv: lot.iv,
        tier: lot.tier,
        tags: lot.tags,
        idleWeeks: 0,
        onLoan: false,
        loanWeeksRemaining: 0,
        acquiredWeek: state.week,
        purchaseCost: totalCost,
      });
      needed[tier]--;
      state.acquisitionsThisWeek++;
    }
  }
}

function tryFlips(state: PlayerState, cfg: SimConfig, rng: PRNG): void {
  // Consider flipping works held 1–4 weeks if expected profit is positive.
  // Expected sell proceeds = IV * E[max(clearingPct, backstop)] * (1 - sellerFee)
  // For dealer: IV * dealerBuyRate
  const toFlip: SimArtwork[] = [];

  for (const w of state.artworks) {
    if (w.onLoan) continue;
    const holdWeeks = state.week - w.acquiredWeek;
    if (holdWeeks < 1 || holdWeeks > 4) continue;

    // Expected dealer proceeds (deterministic)
    const dealerProceeds = Math.round(w.iv * cfg.fees.dealerBuyRate);
    const carryPaid = holdWeeks * weeklyCarry(w, cfg.tiers[w.tier], cfg);
    const netProfit = dealerProceeds - w.purchaseCost - carryPaid;

    if (netProfit > w.iv * cfg.strategy.flipProfitThreshold) {
      toFlip.push(w);
    }
  }

  // Actually flip (sell) profitable works
  for (const w of toFlip) {
    // Only flip if we don't need this tier
    const needed = tierNeeded(state.artworks, cfg);
    if (needed[w.tier] > 0) continue; // we need this tier, keep it

    const proceeds = sellProceeds(w, cfg, rng);
    state.cash += proceeds;
    state.artworks = state.artworks.filter((a) => a !== w);
  }
}

// ── Surprise packages ───────────────────────────────────────────────

function buySurprisePackage(state: PlayerState, cfg: SimConfig, rng: PRNG): void {
  if (state.acquisitionsThisWeek >= cfg.strategy.maxAcquisitionsPerWeek) return;

  const pkgs = cfg.surprisePackages.packages;
  if (pkgs.length === 0) return;

  const needed = tierNeeded(state.artworks, cfg);
  const totalNeeded = needed.A + needed.B + needed.C + needed.D;
  if (totalNeeded <= 0) return;

  // Pick the package with the best chance-per-credit for the highest needed tier.
  // Need A? Gold has 40% A chance for 200k. Need only D? Bronze has 80% for 25k.
  const highestNeeded: Tier =
    needed.A > 0 ? "A" : needed.B > 0 ? "B" : needed.C > 0 ? "C" : "D";

  const scored = pkgs
    .filter((p) => p.cost <= state.cash)
    .map((p) => {
      const w = p.tierWeights.find((tw) => tw.tier === highestNeeded)?.weight ?? 0;
      return { pkg: p, score: w / p.cost };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return;

  const { pkg } = scored[0];

  // Runway check (include estimated carry of the new artwork)
  const currentCarry = totalWeeklyCarry(state, cfg);
  const postRunway =
    currentCarry > 0 ? (state.cash - pkg.cost) / currentCarry : Infinity;
  if (postRunway < cfg.strategy.safetyBufferWeeks) return;

  // Buy and open the package
  state.cash -= pkg.cost;

  const tiers = pkg.tierWeights.map((tw) => tw.tier);
  const weights = pkg.tierWeights.map((tw) => tw.weight);
  const resultTier = rng.weightedChoice(tiers, weights) as Tier;

  const tc = cfg.tiers[resultTier];
  const iv = rng.uniformInt(tc.minIV, tc.maxIV);
  const tags = rng.pick(TAG_POOL, rng.uniformInt(1, 2));

  state.artworks.push({
    iv,
    tier: resultTier,
    tags,
    idleWeeks: 0,
    onLoan: false,
    loanWeeksRemaining: 0,
    acquiredWeek: state.week,
    purchaseCost: pkg.cost,
  });
  state.acquisitionsThisWeek++;
}

// ── Result builder ──────────────────────────────────────────────────

function result(state: PlayerState, outcome: SimResult["outcome"]): SimResult {
  const ivSum = state.artworks.reduce((s, w) => s + w.iv, 0);
  return {
    outcome,
    week: state.week,
    finalCash: state.cash,
    artworksOwned: state.artworks.length,
    totalCarryPaid: state.totalCarryPaid,
    topUpSpent: state.topUpSpent,
    netWorth: state.cash + ivSum,
  };
}
