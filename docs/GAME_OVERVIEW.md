# Masterpiece Market — Game Overview

> A persistent online art-market simulation inspired by the 1970s board game *Masterpiece*.
> Players collect iconic artworks through real-time auctions, manage carrying costs,
> cultivate relationships with virtual curators and dealers, and climb the ranks
> from Beginner to Whale — all while the market punishes hoarders and rewards
> active stewardship.

---

## Table of Contents

1. [Premise](#1-premise)
2. [Player Goals](#2-player-goals)
3. [How Auctions Work](#3-how-auctions-work)
4. [How Ownership Works](#4-how-ownership-works)
5. [Insurance & Storage (Carry Costs)](#5-insurance--storage-carry-costs)
6. [Loan Mechanic](#6-loan-mechanic)
7. [Delinquency and Forced Auctions](#7-delinquency-and-forced-auctions)
8. [Inactivity and Estate Auctions](#8-inactivity-and-estate-auctions)
9. [Curator Loans & Dealer Offers](#9-curator-loans--dealer-offers)
10. [Progression: Beginner, Mid, Whale](#10-progression-beginner--mid--whale)
11. [Why the System Prevents Sitting on Masterpieces](#11-why-the-system-prevents-sitting-on-masterpieces)

---

## 1. Premise

Masterpiece Market drops every player into a persistent virtual art world. You are an art collector — your wallet is filled with credits, the auction houses are buzzing, and the curators are waiting. Your job is to build a collection worth talking about.

But here's the catch: **owning art costs money.** Every week, every artwork in your collection generates an insurance premium and a storage fee. If you can't pay, you lose the work. A player who buys a Vermeer and then goes quiet will watch their credit balance bleed dry — and eventually lose those works to forced auction.

The market is alive. Auctions fire in real time. Curators rotate their exhibition schedules. Dealers surface private opportunities. Other players are always competing for the same pieces. The art world never sleeps, and neither should your strategy.

**Core tension:** Every artwork is simultaneously an asset (it has value, it builds prestige) and a liability (it costs money every week). The game is about managing that tension — knowing when to acquire, when to loan, when to exhibit, and when to sell.

---

## 2. Player Goals

There is no single "win condition." Instead, players pursue a layered set of objectives that reinforce each other:

### Build a Prestigious Collection
- Acquire artworks that align with curatorial themes.
- Curate a coherent collection rather than a random pile of canvases.
- Higher-tier artworks carry more prestige but also more cost.

### Grow Net Worth
- **Net Worth = Credits + Total Collection Value.**
- Credits are liquid cash — earned through sales, loan fees, and smart deals.
- Collection Value is the sum of the insured values of all artworks you own.
- A player with 50,000 credits and a collection worth 200,000 has a net worth of 250,000.

### Achieve Progression Tiers
- **Beginner** — Where everyone starts. Access to regular auctions, basic dealers.
- **Mid** — Unlocked through collection milestones and sustained activity. Opens Evening Sales, additional dealers, and reduced commissions.
- **Whale** — The top tier. Requires active stewardship, curator relationships, and significant net worth. Opens Private sales, underwriting, and broker introductions.

### Engage with NPCs for Strategic Advantage
- **Curators** accept loans of your artworks for exhibitions, reducing your carrying costs and paying you fees.
- **Dealers** offer buy/sell opportunities, private listings, restoration services, and collection strategy advice — each with a different specialty.

The best players weave all of these threads together: they acquire deliberately, loan actively, sell strategically, and build relationships that unlock the most lucrative opportunities.

---

## 3. How Auctions Work

Auctions are the beating heart of Masterpiece Market. Every major acquisition and many major sales happen on the auction block.

### Real-Time Bidding

All auctions use **live, real-time bidding via WebSockets**. When a player places a bid, every other participant sees it instantly. There is no refresh button — the auction is a living, breathing event.

### Auction Types

| Type | Access | Description |
|------|--------|-------------|
| **Regular** | All players | Open auctions with no restrictions. The bread and butter of the market. |
| **Evening Sales** | Mid tier+ | Curated events featuring higher-value works. Smaller bidder pools mean better opportunities — but steeper competition. |
| **Private** | Whale tier only | Invitation-only auctions for the most prestigious artworks. Limited participants, high stakes, extraordinary pieces. |

### Bidding Rules

- **Minimum Bid Increment:** Each auction defines a minimum increment. Typical increments scale with the lot value (e.g., 500 credits on a 20,000-credit lot).
- **Reserve Price:** Some lots carry a hidden reserve. If bidding does not reach the reserve, the lot goes unsold and returns to its consignor.
- **Countdown Timer:** Every auction has a countdown clock. When the clock hits zero, the highest bidder wins.
- **Late-Bid Extension:** If a bid is placed in the final 15 seconds, the timer extends by 15 seconds. This prevents last-second sniping and ensures every bidder has a fair chance to respond.

### Settlement

When the hammer falls:

1. **Winner pays.** The winning bid amount is deducted from the winner's credit balance immediately.
2. **Ownership transfers.** The artwork moves from the previous owner (or the system) to the winner's collection.
3. **Provenance event recorded.** An immutable provenance record is appended to the artwork's history: who sold it, who bought it, the sale price, and the timestamp.
4. **Commission deducted.** A buyer premium (5%) and seller fee (2.5%) are applied.

**Example:** A Vermeer comes up in a Regular auction with a 5,000-credit reserve and a 200-credit minimum increment. Three players bid it up to 12,400 credits. A late bid at the 10-second mark extends the timer. The final hammer price is 13,000 credits. The winner's balance drops by 13,650 (including buyer premium); the seller receives the proceeds minus their 2.5% fee.

---

## 4. How Ownership Works

### Unique Database Assets

Every artwork in Masterpiece Market is a **unique, one-of-one database record**. There is exactly one *Girl with a Pearl Earring*, one *Starry Night*, one *Water Lilies*. If you own it, nobody else does. When you sell it, it is gone from your collection.

This is not a blockchain system — it is a traditional relational database with strict uniqueness constraints. But the effect is the same: scarcity is real, and provenance matters.

### Provenance Chain

Every artwork carries a **full provenance chain** — an append-only ledger of every ownership change and significant event in the work's history within the game. Provenance events include:

- **Acquisition:** Player purchased the work (auction, dealer, or private sale).
- **Sale:** Player sold the work.
- **Loan:** Player loaned the work to a curator for exhibition.
- **Loan Return:** Work returned from exhibition.
- **Forced Sale:** Work was sold via forced auction due to delinquency.
- **Estate Sale:** Work was sold via estate auction due to inactivity.
- **Restoration:** Work underwent condition restoration via a dealer.

The provenance chain is **append-only**. Records are never deleted or modified.

### What Owners Can Do

| Action | Effect |
|--------|--------|
| **Hold** | Keep it in your collection. You pay full weekly carry costs. |
| **Loan to a Curator** | Send it to a curator's exhibition for a fixed period. Reduced carry costs, and the curator pays you a loan fee. |
| **List for Sale** | Consign it to auction or offer it through a dealer. |
| **Exhibit** | Display it in your personal gallery. Builds prestige but does not reduce costs. |

Every one of these actions (except Hold) generates a provenance event and counts as qualifying activity.

---

## 5. Insurance & Storage (Carry Costs)

This is the mechanic that makes Masterpiece Market more than a simple auction game. **Owning art is expensive.**

### The Formula

```
Weekly Carry Cost = (Insured Value × premium_rate) + storage_fee
```

### Tier Schedule

| Tier | Description | Premium Rate/wk | Storage Fee/wk | Example (IV = 100,000) |
|------|-------------|-----------------|----------------|----------------------|
| **A — Iconic (1/1)** | The rarest masterpieces | 0.60% | 200 cr | 800 cr/wk |
| **B — Major** | Significant works by renowned artists | 0.35% | 80 cr | 430 cr/wk |
| **C — Mid** | Solid mid-range pieces | 0.20% | 25 cr | 225 cr/wk |
| **D — Edition** | Prints, minor works | 0.08% | 5 cr | 85 cr/wk |

### Weekly Processing

Carry costs are processed automatically once per week. The system calculates the total cost across every artwork in a player's collection and deducts it from their credit balance.

### Idle Surcharge

If a player performs **no qualifying activity for 8 consecutive weeks**, an idle surcharge kicks in:

> **Premium rate increases by +20% until the player performs a qualifying activity.**

"Qualifying activity" includes: placing a bid, completing a sale, loaning a work, or accepting a dealer offer.

**Example:** A Tier B work with IV 200,000 normally costs 780 cr/wk (700 premium + 80 storage). With idle surcharge: 0.42%/wk = 840 premium + 80 storage = **920 cr/wk**.

The surcharge resets immediately when the player performs any qualifying activity. It does not stack — capped at one level (+20%).

---

## 6. Loan Mechanic

Loaning artworks to curators is the primary way to **reduce carrying costs** and **earn passive income** simultaneously.

### How It Works

1. A player offers an artwork to a curator whose tastes align with the piece.
2. If the curator accepts, the artwork enters a **2-week exhibition period**.
3. During the exhibition, the player still owns the work — but it cannot be sold or moved.
4. At the end of the 2-week period, the work returns to the player's collection.

### Cost Reduction While on Loan

While an artwork is on loan, the player's **insurance premium is reduced by 70%** — they pay only 30% of the normal premium. Storage fee is also covered by the curator's institution.

**Example:** A Tier B work (IV 200,000) normally costs 780 cr/wk. While on loan:
- Premium: 700 × 0.30 = **210 cr/wk**
- Storage: covered by curator
- **Total while on loan: ~210 cr/wk** (down from 780 — a 73% reduction)

### Curator Loan Fees

The curator pays the player a loan fee based on their tier:

| Curator Tier | Loan Fee (% of IV) | Example (IV = 200,000) |
|-------------|-------------------|----------------------|
| Assistant (Tier 1) | 0.25% | 500 cr |
| Curator (Tier 2) | 0.45% | 900 cr |
| Chief (Tier 3) | 0.75% | 1,500 cr |
| Legendary | 1.20% | 2,400 cr |

Higher-tier curators pay better — but they are pickier about what they accept.

### Strategic Implications

Loaning is not just a cost-management tool. It also:
- Builds **curator relationships**, which factor into Whale-tier progression.
- Generates **provenance events**, enriching the artwork's history.
- Counts as **qualifying activity**, resetting the idle surcharge timer.

A savvy player keeps a rotation of loans running at all times.

---

## 7. Delinquency and Forced Auctions

### The Delinquency Sequence

**Step 1 — Bill Fails.**
The weekly carry-cost processor runs and the player's credit balance is insufficient. The player is flagged as **delinquent**.

**Step 2 — 72-Hour Grace Period.**
The player has 72 hours to bring their balance above zero by selling, receiving loan fees, or other credit-generating activity.

**Step 3 — Auto-Consignment.**
If 72 hours pass and the player is still delinquent, the system selects artworks for forced auction. Selection starts with **lowest-tier works first** (Tier D before C, etc.).

**Step 4 — Forced Auction.**
Consigned works are placed into a special "Forced Sale" auction visible to all players. **There is no reserve price.**

**Step 5 — Settlement.**
Proceeds are applied: outstanding debt first, then auction fees, then any leftover returns to the delinquent player.

**Example:** A player owes 1,200 cr. Two Tier D works sell at forced auction for 1,500 and 2,800. Total: 4,300. After covering the 1,200 debt and 5% commission (215), the player receives 2,885 cr back.

A **Forced Sale** provenance event is recorded. Players cannot bid in other auctions while delinquent.

---

## 8. Inactivity and Estate Auctions

### The Inactivity Sequence

**Day 0** — Last qualifying activity.

**Day 30** — **Estate Notice** sent via notification/email.

**Day 60** — **Estate Auction** triggered, unless:

> **Safe Harbor Rule:** If the player has enough credits to cover 8 weeks of carry costs at current rates, the estate auction is deferred. It triggers when the balance can no longer cover 8 weeks, or at 90 days — whichever comes first.

### Estate Auction Process

1. The player's **entire collection** is consigned with no reserve.
2. Total proceeds (minus commissions) are **held in escrow for 90 days**.
3. If the player returns within 90 days, they can claim their proceeds.
4. After 90 days, unclaimed proceeds are absorbed into the system economy.

### Why This Exists

Without estate auctions, inactive players would permanently lock artworks out of the market. Since every artwork is unique, the estate system ensures the market stays liquid and all artworks remain accessible to active players.

---

## 9. Curator Loans & Dealer Offers

### Curators (12 Total)

| # | Name | Tier | Specialty |
|---|------|------|-----------|
| 1 | Mina Kline | Assistant | Experimental new media |
| 2 | Theo Marrow | Assistant | Dark surreal/noir |
| 3 | Jun Park | Assistant | Minimal/graphic |
| 4 | Dr. Celeste Armand | Curator | High-concept institutional |
| 5 | Rafi Delgado | Curator | Pop/bold/shareable |
| 6 | Imogen Vale | Curator | Romantic landscapes/atmosphere |
| 7 | Kenji Sato | Curator | Design/typography/architecture |
| 8 | Vivienne Roche | Chief | Canonical blue-chip |
| 9 | Professor Omar Nwosu | Chief | Politics/power/history |
| 10 | Sister Alethea | Chief | Contemplative/spiritual minimal |
| 11 | "The Archivist" | Legendary | Provenance-obsessed, anonymous |
| 12 | Marquis Sable | Legendary | Contrarian kingmaker |

Higher-tier curators are pickier but pay better loan fees. Successful loans build relationship points that contribute to Whale-tier progression.

### Dealers (6 Total)

| Dealer | Type | Specialty | Unlock |
|--------|------|-----------|--------|
| Galleria North | Primary | New listings, fair prices | Beginner |
| Bram & Co. | Secondary | Resale market, variable pricing | Beginner |
| The Private Room | Broker | Private sales, discreet | Whale |
| Restoration House | Specialist | Provenance research, condition reports | Mid |
| Hearthstone Advisory | Specialist | Collection strategy advice | Mid |
| Night Market | Grey Market | Risky but profitable; throttled access | Whale |

---

## 10. Progression: Beginner → Mid → Whale

### Beginner Tier
- Starting tier for all players
- Access to: Regular auctions, Galleria North, Bram & Co.
- Standard commission rates

### Mid Tier
Requirements:
- Own 5+ artworks
- Total collection IV 50,000+ credits
- At least 1 qualifying activity per week for 6 of last 8 weeks
- 3+ completed curator loans

Unlocks: Evening Sales, Restoration House, Hearthstone Advisory, 5% commission reduction, curator exhibition calendars.

### Whale Tier
Requires all three pillars:

**Pillar 1 — Stewardship:** Consistent loan rotation (2+ works on loan over past 4 weeks), regular dealer interactions.

**Pillar 2 — Prestige:** Relationship level 3+ with at least 2 curators. At least one loan to a Tier 3 or Legendary curator.

**Pillar 3 — Net Worth:** 500,000+ credits (collection value + balance).

Unlocks: Private Sales, The Private Room broker, Night Market access, ability to underwrite auctions, broker introductions, lowest commissions (-15%).

**Key Design Principle:** Whale status requires active stewardship and relationships, not just money. A wealthy but passive player cannot achieve Whale tier.

### Demotion
Progression is not permanent. If metrics fall below maintenance thresholds, players can be demoted, reinforcing sustained engagement.

---

## 11. Why the System Prevents Sitting on Masterpieces

Every mechanic conspires against passive hoarding:

1. **Carry costs create holding pressure** — every artwork costs money every week.
2. **Idle surcharge punishes passivity** — 8 quiet weeks trigger a 20% premium increase.
3. **Delinquency forces sales** — when credits run out, assets are liquidated at market price.
4. **Inactivity triggers estate auctions** — abandon the game and your entire collection returns to the market.
5. **The economy rewards active stewardship** — loans reduce costs by up to 70%+, generate income, build relationships, and unlock progression.

**The message is clear:** In Masterpiece Market, art is not a trophy to hang on a wall and forget. It is a living asset that demands attention, rewards care, and punishes neglect. The best collectors are not the richest — they are the most engaged.

---

*Masterpiece Market — where every masterpiece demands a master.*
