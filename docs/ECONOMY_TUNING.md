# Economy Tuning — Masterpiece Market v0.1

## Philosophy

The economy rewards active stewardship. Holding art costs real credits, creating natural pressure to engage: loan works, exhibit them, trade up, or sell. Passive hoarding is punished via carry costs and idle surcharges. All numbers are tunable.

---

## Artwork Tiers

| Tier | Description | Premium Rate/Week | Storage Fee/Week | Example IV |
|------|------------|------------------|-----------------|------------|
| A (Iconic 1/1) | One-of-a-kind masterpieces | 0.60% | 200 | 1,000,000 |
| B (Major) | Significant works | 0.35% | 80 | 200,000 |
| C (Mid) | Solid collection pieces | 0.20% | 25 | 50,000 |
| D (Edition) | Prints, minor works | 0.08% | 5 | 5,000 |

**Weekly Carry Cost** = `(IV × premium_rate) + storage_fee`

---

## Curator Loan Fees (per 2-week exhibition)

| Curator Tier | Fee (% of IV) | Example: IV 200,000 |
|-------------|--------------|---------------------|
| Assistant (Tier 1) | 0.25% | 500 |
| Curator (Tier 2) | 0.45% | 900 |
| Chief (Tier 3) | 0.75% | 1,500 |
| Legendary | 1.20% | 2,400 |

While on loan, owner pays only **30% of normal premium** (70% reduction). Storage is covered by the curator's institution.

---

## Idle Surcharge

- **Trigger:** 8 consecutive weeks with no qualifying activity on an artwork
- **Effect:** premium_rate × 1.20 (20% increase)
- **Reset:** Any qualifying activity (loan, list for sale, exhibit)
- **Stacks:** NO — capped at one surcharge level (+20%)

---

## Starting Credits

New player starts with: **10,000 credits**

---

## Worked Scenarios

### Scenario 1: Beginner buys a Tier D artwork

- Artwork: "Print #7" (Tier D, IV: 5,000)
- Purchase price at auction: 3,200
- Weekly cost: (5,000 × 0.0008) + 5 = 4 + 5 = **9 credits/week**
- Remaining credits after purchase: 10,000 - 3,200 = 6,800
- Weeks of carry before broke (no income): 6,800 / 9 ≈ **755 weeks**
- **Conclusion: Tier D is beginner-safe.**

### Scenario 2: Beginner stretches for a Tier C artwork

- Artwork: "Landscape Study" (Tier C, IV: 50,000)
- Purchase at auction: 28,000 (player saved up to 30,000)
- Weekly cost: (50,000 × 0.002) + 25 = 100 + 25 = **125 credits/week**
- Remaining credits: 30,000 - 28,000 = 2,000
- Weeks before broke: 2,000 / 125 = **16 weeks**
- Player MUST earn income within 16 weeks or risk delinquency
- Loan to Tier 1 curator earns: 50,000 × 0.0025 = 125/exhibition (2 wks)
- During loan, weekly cost drops to: (50,000 × 0.002 × 0.30) + 25 = 30 + 25 = 55/wk
- Net over 2-week loan: earn 125, pay 110 → small +15 surplus
- **Conclusion: Viable but player must stay active.**

### Scenario 3: Mid-tier player with mixed collection

Collection:
- 1× Tier B (IV: 200,000): weekly = (200,000 × 0.0035) + 80 = 780
- 2× Tier C (IV: 50,000 each): weekly = 2 × 125 = 250
- 3× Tier D (IV: 5,000 each): weekly = 3 × 9 = 27
- **Total weekly bill: 1,057 credits**
- Monthly burn: ~4,228 credits

Income from 1 Tier 2 curator loan on Tier B: 200,000 × 0.0045 = 900/exhibition
Income from 2 Tier 1 curator loans on Tier C: 2 × 125 = 250/exhibition cycle
Net income per 2-week cycle: 900 + 250 = 1,150 earned vs ~2,114 costs = **-964 deficit**

Player needs additional income: dealer sales, more loans, or auction profits.
**Conclusion: Mid-tier requires active management.**

### Scenario 4: Whale with Tier A masterpiece

- Artwork: "Mona Lisa" (Tier A, IV: 1,000,000)
- Weekly cost: (1,000,000 × 0.006) + 200 = 6,000 + 200 = **6,200/week**
- Monthly burn from this ONE piece: ~24,800
- Legendary curator loan: 1,000,000 × 0.012 = 12,000/exhibition (2 wks)
- During loan: weekly cost = (1,000,000 × 0.006 × 0.30) + 200 = 1,800 + 200 = 2,000/wk
- Net over 2-week loan: 12,000 earned - 4,000 costs = **+8,000 profit**
- Without loan: -12,400 over same 2 weeks
- **Conclusion: Tier A works demand Legendary curator access (Whale tier) to be sustainable.**

### Scenario 5: Idle Surcharge impact

- Tier B artwork (IV: 200,000), idle for 8 weeks
- Normal premium: 0.35%/wk → With surcharge: 0.42%/wk
- Normal weekly cost: 780 → Surcharged: (200,000 × 0.0042) + 80 = 840 + 80 = **920/wk**
- Extra cost: 140/week — an 18% increase in total carry cost
- **Reset by:** lending, listing, or exhibiting.

### Scenario 6: Delinquency cascade

- Player has 500 credits, weekly bill is 1,057
- Can't pay → 72-hour grace
- After grace, system selects lowest-tier work: Tier D (IV: 5,000)
- Forced auction sells for 3,800
- Remaining debt: 1,057 - 500 - 3,800 = covered, with 3,243 remaining
- Player keeps rest of collection but lost a piece
- **Lesson: Keep a cash buffer.**

---

## Tuning Levers (for future balancing)

| Parameter | Current Value | Description |
|-----------|--------------|-------------|
| `premium_rate` per tier | See tier table | Main cost knob |
| `storage_fee` per tier | See tier table | Flat cost floor |
| `idle_surcharge_multiplier` | 1.20 | Premium increase after idle threshold |
| `idle_weeks_threshold` | 8 | Weeks before surcharge activates |
| `loan_premium_reduction` | 0.70 (70% off) | Cost savings while on loan |
| `curator_loan_fees` per tier | See fee table | Income from loans |
| `starting_credits` | 10,000 | New player starting balance |
| `delinquency_grace_hours` | 72 | Time to resolve before forced sale |
| `inactivity_estate_days` | 60 | Days before estate auction |
| `inactivity_notice_days` | 30 | Days before estate warning |
| `forced_auction_selection` | lowest-tier-first | Which works get sold first |
| `buyer_premium_rate` | 5% | Auction buyer surcharge |
| `seller_fee_rate` | 2.5% | Auction seller commission |

---

## Revenue Sinks (where credits leave the economy)

1. Weekly carry costs (primary sink)
2. Dealer commissions on sales
3. Auction house fees (5% buyer premium, 2.5% seller fee)
4. Restoration costs (optional, via Restoration House dealer)

## Revenue Sources (where credits enter the economy)

1. Starting credits for new players (10,000)
2. Curator loan fees
3. Selling artworks to other players
4. Daily login bonus (50 credits/day, cap 350/week)
5. Achievement bonuses (one-time, for progression milestones)
6. Optional: credit purchase (monetization, future consideration)
