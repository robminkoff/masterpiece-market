# Masterpiece Market

An online art market simulation game — collect iconic artworks, bid in live auctions, manage insurance and loans, and build a legendary collection.

Inspired by the 1970s board game *Masterpiece*, reimagined as a scalable web app with real-time auctions, virtual curators and dealers, recognizable artworks, and a carrying-cost system that rewards active stewardship over passive hoarding.

## Tech Stack

- **Next.js 14+** (App Router) + TypeScript
- **TailwindCSS** for styling
- **Supabase** (Postgres + Auth) for database and auth
- **Socket.IO** for real-time auction bidding
- **Zod** for validation
- **Zustand** for client state

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### 1. Install dependencies

```bash
# Main app
npm install

# Socket.IO server
cd server && npm install && cd ..
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials (optional for v0 — app runs with stub data)
```

### 3. Start the dev servers

In **two terminal windows**:

```bash
# Terminal 1: Next.js app
npm run dev
# → http://localhost:3000

# Terminal 2: Socket.IO server (for live auction bidding)
cd server && npm run dev
# → ws://localhost:3001
```

### 4. Explore

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Game pitch + entry points |
| Catalog | `/catalog` | Browse all artworks with tier filtering |
| Artwork Detail | `/artworks/[id]` | IV, weekly costs, provenance timeline |
| Auction House | `/auction-house` | Upcoming + live auctions |
| Live Auction | `/auction-house/live/[auctionId]` | Real-time bidding room |
| Dashboard | `/dashboard` | Credits, collection, weekly bill |

## Project Structure

```
masterpiece-market/
├── docs/                          # Game documentation
│   ├── GAME_OVERVIEW.md           # Full game design document
│   ├── RULES.md                   # Board-game-style rulebook
│   ├── ECONOMY_TUNING.md          # Economy numbers + scenarios
│   ├── ARCHITECTURE.md            # System diagram + data flow
│   └── NEXT_STEPS.md              # Phased roadmap
├── server/                        # Socket.IO WebSocket server
│   ├── src/index.ts               # Server entry point
│   └── README.md                  # Socket event docs
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── api/                   # API routes
│   │   │   ├── artworks/          # GET artworks
│   │   │   └── auctions/          # CRUD auctions + bids + settle
│   │   ├── catalog/               # Artwork catalog page
│   │   ├── artworks/[id]/         # Artwork detail page
│   │   ├── auction-house/         # Auction listing + live rooms
│   │   └── dashboard/             # Player dashboard
│   ├── components/                # Shared UI components
│   ├── data/seed.ts               # Seed data (20 artworks, 18 NPCs)
│   └── lib/                       # Shared utilities
│       ├── types.ts               # TypeScript types + game constants
│       ├── validators.ts          # Zod schemas
│       ├── store.ts               # Zustand store
│       └── supabase.ts            # Supabase client (stubbed for v0)
├── supabase/
│   └── migrations/
│       └── 0001_init.sql          # Full database schema
├── scripts/
│   └── seed.ts                    # Database seed script
└── .env.example                   # Environment variable template
```

## Current State (v0)

This is a **skeleton/scaffold** — the UI, routing, API structure, and game documentation are in place. The app runs with in-memory stub data. Key TODOs:

- Connect to real Supabase database
- Implement authentication
- Wire API routes to Postgres
- Build weekly billing system
- Implement NPC curator/dealer interactions
- Add progression tier logic

See [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for the full roadmap.

## Documentation

- **[Game Overview](docs/GAME_OVERVIEW.md)** — comprehensive game design
- **[Rules](docs/RULES.md)** — player-facing rulebook with examples
- **[Economy Tuning](docs/ECONOMY_TUNING.md)** — numbers, scenarios, and tuning levers
- **[Architecture](docs/ARCHITECTURE.md)** — system diagram and data flows
- **[Next Steps](docs/NEXT_STEPS.md)** — phased development roadmap
