# Monte Carlo Simulation — Masterpiece Market

Design-tuning tool that simulates player progression under different market
conditions and spending strategies. Not production code.

## Quick start

```bash
npm run sim:mc                         # default: 9 scenarios, 5k runs each
npm run sim:mc -- --runs=1000          # fewer runs (faster)
npm run sim:mc -- --market=cold        # single market, all top-up strategies
npm run sim:mc -- --topup=aggressive   # single top-up, all markets
npm run sim:mc -- --seed=123           # different PRNG seed
npm run sim:mc -- --loans=false        # disable loans
npm run sim:mc -- --flipping=true      # enable speculative flipping
```

## What is simulated

Each run models a single player attempting to found a museum:

1. **Starting state**: 250,000 credits, no artworks.
2. **Each week** (up to 104 weeks):
   - Pay weekly carry costs (premium + storage) for all owned works
   - Receive loan offers probabilistically; accept if affordable
   - Sell works if cash runway drops below safety threshold
   - Buy new works from weekly auction supply to fill museum tier requirements
   - Check museum founding conditions
3. **Museum founded** when player owns ≥8 artworks (1A + 2B + 3C + 2D),
   tag diversity ≥5, and cash ≥ 12× total normal weekly carry (endowment).
4. **Bankruptcy** if cash drops below zero after paying carry.
5. **Timeout** if neither occurs within the week limit.

### Auction model

Weekly supply: D=10 lots, C=6, B=3, A=1. IV drawn uniformly within tier range.
Clearing price = IV × pct, where pct is drawn from a clamped Normal distribution
whose mean and variance define the market condition (hot/normal/cold).

### Loan model

Each non-loaned artwork has a per-tier weekly probability of receiving a loan
offer. Curator tier is chosen by weighted random (assistant 50%, curator 35%,
chief 13%, legendary 2%). Fee is % of IV, paid upfront per loan. Duration is
uniform random 4–12 weeks. While on loan, premium is reduced by 70%.

### Player strategy

- Buys cheapest missing tier first (D → C → B → A)
- Only buys if post-purchase runway ≥ 4 weeks
- Sells least-valuable non-loaned work if runway < 2 weeks
- Default sell preference: dealer (instant 50% IV)

### Top-up strategies

| Name       | Behavior                                                    |
|------------|-------------------------------------------------------------|
| None       | No credit purchases                                         |
| Emergency  | Buy 250k when runway < 3 weeks (max 2×)                    |
| Aggressive | Buy 1M at week 2, then 500k when runway < 4 weeks (max 4×) |

## What is NOT modeled

- Other players / NPC bidding competition
- Prestige, stewardship, or reputation effects
- Museum operating costs after founding
- Delinquency, estate auctions, or forced sales
- Dealer markup rates (buying FROM dealers)
- Exhibition mechanics
- Strategic tag selection (tags are random)
- Time value of money or inflation

## Output columns

| Column   | Meaning                                              |
|----------|------------------------------------------------------|
| Museum%  | Percentage of runs that successfully founded a museum |
| P10/P50/P90 | Weeks to museum at 10th, 50th, 90th percentile   |
| Bankr%   | Percentage of runs ending in bankruptcy               |
| Bk P50   | Median week of bankruptcy                             |
| NW@52    | Median net worth at week 52 (non-bankrupt runs)       |

## Adding scenarios

Edit `config.ts`:

```typescript
// Add a new market preset
MARKET_PRESETS.boom = {
  name: "Boom", clearingMean: 1.15, clearingStd: 0.08,
  clearingMin: 0.80, clearingMax: 1.80,
};

// Add a new top-up strategy
TOPUP_PRESETS.whale = {
  name: "Whale",
  rules: [{ triggerWeek: 1, amount: 5_000_000, maxUses: 1 }],
};
```

Then run: `npm run sim:mc -- --market=boom --topup=whale`

## Tuning knobs

All parameters live in `config.ts` in the `SimConfig` type. Key knobs:

- `tiers[X].premiumRate / storageFee` — weekly carry cost
- `market.clearingMean / clearingStd` — how cheap/expensive auctions are
- `loans.premiumReduction` — how much loans save (0.7 = 70% off premium)
- `strategy.safetyBufferWeeks` — how conservative the player is
- `museum.endowmentWeeks` — how much cash reserve is required to found
- `fees.buyerPremium / sellerFee` — transaction friction

## File structure

```
scripts/sim/
  prng.ts         — Deterministic PRNG (Mulberry32)
  config.ts       — Types, defaults, presets, CLI parsing
  engine.ts       — Simulation engine (one run)
  montecarlo.ts   — Entry point: runs scenarios, prints stats
  README.md       — This file
```
