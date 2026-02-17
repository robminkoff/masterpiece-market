# Next Steps — Masterpiece Market Roadmap

## Phase 0: Current State (v0.0 — Skeleton)

What's been built:
- Project scaffold with Next.js 14, TypeScript, TailwindCSS
- Page routes: Home, Catalog, Artwork Detail, Auction House, Live Auction, Dashboard
- API route stubs for artworks, auctions, bids, settlement
- Socket.IO server with basic auction room events
- DB schema (SQL migration ready to apply)
- Seed data: 20 artworks, 12 curators, 6 dealers, sample auctions
- Full documentation: game design, rules, economy tuning, architecture

---

## Phase 1: Core Functionality (Weeks 1–3)

- [ ] Set up Supabase project and apply migration
- [ ] Implement Supabase Auth (signup, login, sessions)
- [ ] Connect API routes to real database queries
- [ ] Build artwork catalog with real data + filtering/sorting
- [ ] Implement full auction lifecycle (create → bid → settle)
- [ ] Wire Socket.IO to actual auction state in Redis
- [ ] Build dashboard with real user data (balance, collection, bills)
- [ ] Implement weekly billing cron job (Vercel Cron or pg_cron)
- [ ] Basic error handling and loading states
- [ ] Add `.env.local` setup with real Supabase credentials

## Phase 2: Game Systems (Weeks 4–6)

- [ ] Curator NPC system (loan requests, approval logic, fee calculation)
- [ ] Dealer NPC system (offers, commissions, access tiers)
- [ ] Idle surcharge calculation and automatic application
- [ ] Delinquency detection → grace period → forced auction pipeline
- [ ] Inactivity tracking → estate notice → estate auction pipeline
- [ ] Provenance timeline UI on artwork detail page
- [ ] Progression tier calculation (Beginner → Mid → Whale)
- [ ] Tier-gated access to auction types and dealers
- [ ] Curator relationship tracking and levels

## Phase 3: Polish & UX (Weeks 7–9)

- [ ] Artwork image integration (public domain art API or manual uploads)
- [ ] Responsive design pass (mobile-friendly auction room)
- [ ] Notification system (delinquency warnings, auction alerts, loan requests)
- [ ] Search and filter for catalog (by artist, tier, tags, price range)
- [ ] Auction history page (past sales, price trends)
- [ ] Player profile page (public collection view)
- [ ] Sound effects for auction events (bid placed, timer warning, won)
- [ ] Onboarding tutorial flow for new players

## Phase 4: Multiplayer & Social (Weeks 10–12)

- [ ] Player-to-player direct offers
- [ ] Exhibition system (curated public displays)
- [ ] Leaderboards (Net Worth, Prestige, Stewardship)
- [ ] Chat in auction rooms
- [ ] Player collection showcases
- [ ] Activity feed (recent sales, notable acquisitions)

## Phase 5: Advanced Economy (Weeks 13–16)

- [ ] Market events (art world news affecting IVs)
- [ ] Seasonal exhibitions with bonus rewards
- [ ] Whale feature: underwrite auctions
- [ ] Advanced dealer AI (dynamic pricing, negotiation)
- [ ] Collection synergy bonuses (own multiple works by same artist)
- [ ] Insurance claims (rare events: damage, theft — adds drama)

## Phase 6: Production Readiness (Weeks 17–20)

- [ ] Rate limiting and abuse prevention
- [ ] Row-level security policies in Supabase
- [ ] Error monitoring (Sentry or similar)
- [ ] Analytics (player behavior, economy health metrics)
- [ ] Load testing auction rooms (concurrent bidders)
- [ ] Admin dashboard for economy tuning (adjust rates live)
- [ ] Deployment pipeline (Vercel + Supabase + Upstash)

---

## Known Technical Debt

- Socket.IO server runs as a separate process (consider Next.js custom server or edge functions)
- Redis is stubbed with in-memory state for v0
- Auth is stubbed with a fake user for v0
- No image hosting solution yet
- No email/notification service
- Economy tuning numbers are theoretical — need playtesting
- No automated tests yet

## Key Decisions to Make

1. **Image hosting**: Supabase Storage vs Cloudinary vs S3?
2. **Cron jobs**: Vercel Cron vs external scheduler vs Supabase pg_cron?
3. **Monetization**: Credit purchase? Premium tiers? Cosmetics?
4. **Mobile**: PWA vs React Native in future?
5. **AI curators**: Should NPC curators use LLM-generated dialogue?
6. **Multiplayer scale**: How many concurrent bidders per auction room?
7. **Economy resets**: Seasonal resets? Or fully persistent?
