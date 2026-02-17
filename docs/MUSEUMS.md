# Museum Founding — Endgame System

> The ultimate expression of mastery in Masterpiece Market: founding your own museum.
> A museum transforms a player from collector into institution — with permanent
> benefits, ongoing obligations, and a new layer of strategic depth.

---

## Overview

Museum Founding is the endgame progression for Whale-tier players. Instead of simply accumulating artworks, a founder builds a **permanent cultural institution** — complete with exhibitions, memberships, staff curators, and an endowment that must be maintained.

A museum is not a trophy. It is a living obligation with real costs, real rewards, and real failure states. Founding one is the hardest thing to do in Masterpiece Market — and the most prestigious.

---

## Founding Requirements

To found a museum, a player must satisfy **all** of the following simultaneously:

### 1. Collection Depth (Tier Breadth)

The founder's personal collection must demonstrate breadth across tiers:

| Requirement | Minimum |
|-------------|---------|
| Tier A artworks owned | 1+ |
| Tier B artworks owned | 2+ |
| Tier C artworks owned | 3+ |
| Tier D artworks owned | 2+ |
| **Total artworks** | **8+** |

### 2. Tag Diversity

The collection must span at least **5 distinct tags** across all owned works. This prevents a founder from hoarding a single style — a museum must represent artistic range.

**Example qualifying tags:** `renaissance`, `impressionism`, `surrealism`, `portrait`, `landscape` — drawn from the artwork `tags` field.

### 3. Stewardship Threshold (Sustained)

| Metric | Requirement |
|--------|-------------|
| Stewardship score | 25+ |
| Active loans in last 12 weeks | 6+ |
| Curator relationships at level 3+ | 3+ curators |

These must be sustained — a player who hits the thresholds and then stops loaning cannot found a museum. The system checks the **trailing 12-week window** at founding time.

### 4. Prestige Threshold (Sustained)

| Metric | Requirement |
|--------|-------------|
| Prestige score | 50+ |
| Whale tier | Must currently hold Whale status |
| Time at Whale tier | 8+ consecutive weeks |

### 5. Endowment Requirement

The founder must **lock credits** equal to **12 weeks of carry costs** for their entire collection at current rates. These credits are transferred into the museum's endowment and are **no longer available** for personal use.

```
Endowment = sum(weeklyCarryCost(artwork) for all owned artworks) × 12
```

**Example:** A player with a weekly bill of 3,500 cr must lock 3,500 × 12 = **42,000 credits** into the endowment.

The endowment serves as a buffer — it signals the founder can sustain the institution even during lean periods.

---

## Benefits of Founding a Museum

### Host Exhibitions
- Museums can host **themed exhibitions** using works from the founder's collection AND borrowed works from other players.
- Museum exhibitions generate **prestige** for both the museum and the lending players.
- Exhibition loan fees are paid from the museum endowment.

### Membership Revenue
- Other players can purchase **museum memberships** (tiered: Visitor, Patron, Benefactor).
- Membership fees flow into the museum endowment.
- Revenue is **capped** to prevent museums from becoming pure income engines — the cap scales with the museum's exhibition cadence and collection size.

| Membership Tier | Fee / 4 weeks | Perks |
|----------------|---------------|-------|
| Visitor | 100 cr | View exhibitions, exhibition catalog |
| Patron | 500 cr | Visitor perks + early auction alerts from museum sales |
| Benefactor | 2,000 cr | Patron perks + private viewings, founder introductions |

### Institutional Access
- Museum founders gain access to **institutional-only auctions** — a tier above Private sales.
- Founders can negotiate **institutional loan rates** with NPC curators (lower fees, longer durations).
- The museum itself becomes a provenance marker — works exhibited at a player-founded museum gain a prestige-boosting provenance event.

### NPC Curator Staff
- Upon founding, the museum receives **1 NPC curator** assigned as staff.
- Additional curators can be attracted based on exhibition quality and museum prestige.
- Staff curators automatically propose exhibitions and handle loan logistics, reducing the founder's management burden.
- Maximum staff: 3 curators (1 at founding, 2 earned through sustained museum prestige).

---

## Ongoing Obligations

A museum is not a set-and-forget feature. Founders must maintain:

### 1. Minimum Endowment Reserve

The endowment must always cover at least **8 weeks of carry costs** for all artworks currently held in the museum collection. If the endowment dips below this threshold:

- **Warning** issued immediately.
- **4-week grace period** to replenish.
- After grace: museum enters **probation** (see Failure States).

The founder can top up the endowment at any time by transferring personal credits.

### 2. Exhibition Cadence

The museum must host at least **1 exhibition per 8-week period**. Each exhibition must:

- Run for at least 2 weeks.
- Feature at least 2 artworks (owned or borrowed).
- Have a named theme.

Missing the cadence triggers a prestige penalty and, if repeated, probation.

### 3. Collection Maintenance

The founder must continue to own the minimum collection breadth required for founding (1A + 2B + 3C + 2D). Selling below the threshold triggers a warning and a 4-week grace period to reacquire.

---

## Failure States

### Probation

Triggered by:
- Endowment below 8-week reserve (after 4-week grace)
- Missing 2 consecutive exhibition cadence windows
- Collection dropping below founding minimums (after 4-week grace)

During probation:
- Museum memberships are **frozen** (no new signups, no renewals).
- Institutional auction access is **suspended**.
- Museum prestige decays at 2× normal rate.
- The museum is publicly marked as "On Probation."

Probation lasts until all obligations are met again, or 8 weeks — whichever comes first.

### Emergency Sale

If probation is not resolved within 8 weeks:
- The museum's endowment is liquidated.
- Museum-specific benefits are revoked.
- The founder retains their personal collection and Whale status.
- The museum status changes to `dissolved`.
- A **"Museum Dissolved"** provenance event is recorded on all works that were part of the museum collection.

The founder can attempt to re-found a museum later, but must re-meet all founding requirements from scratch. There is a **12-week cooldown** after dissolution before re-founding is permitted.

### Voluntary Dissolution

A founder can voluntarily dissolve their museum at any time:
- Endowment balance (minus any outstanding obligations) is returned to the founder's personal credits.
- Museum benefits are revoked.
- 12-week cooldown before re-founding.

---

## Museum Progression (Future)

Museums themselves can grow over time:

| Museum Level | Requirement | Benefit |
|-------------|-------------|---------|
| **Emerging** | Founded | 1 staff curator, basic exhibitions |
| **Established** | 4+ exhibitions, 10+ total memberships | 2 staff curators, increased membership cap |
| **Landmark** | 12+ exhibitions, 50+ memberships, prestige 100+ | 3 staff curators, institutional auction hosting rights |

---

## Economy Impact

Museums add a new **credit sink** (endowment lock, exhibition costs) and a new **credit source** (membership revenue). The membership cap ensures museums don't become money printers:

```
Max monthly membership revenue = (number_of_exhibitions_last_8wks × 500) + (collection_size × 100)
```

This keeps revenue proportional to effort and investment.

---

## Quick Reference

| Parameter | Value |
|-----------|-------|
| Min collection to found | 1A + 2B + 3C + 2D (8 total) |
| Min tag diversity | 5 distinct tags |
| Stewardship score required | 25+ |
| Prestige score required | 50+ |
| Whale tenure required | 8 consecutive weeks |
| Endowment lock | 12 weeks of total carry costs |
| Min endowment reserve | 8 weeks of carry costs |
| Exhibition cadence | 1 per 8 weeks |
| Probation duration | Up to 8 weeks |
| Re-founding cooldown | 12 weeks after dissolution |
| Max staff curators | 3 |

---

*A museum is the final word in stewardship. Build one, and the art world remembers your name.*
