/**
 * Masterpiece Market — Database Seed Script
 *
 * Populates the Supabase database with initial game data.
 * Uses UPSERT (ON CONFLICT DO UPDATE) so it's safe to re-run.
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL  — set in .env.local or environment
 *   SUPABASE_SERVICE_KEY      — set in .env.local or environment
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  SEED_ARTWORKS,
  SEED_NPCS,
  SEED_OWNERSHIPS,
  SEED_PROVENANCE_EVENTS,
  SEED_AUCTIONS,
} from "../src/data/seed";

// Load .env.local for local dev
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  console.log("=== Masterpiece Market Seed Script ===\n");

  // --- Artworks ---
  console.log(`Seeding ${SEED_ARTWORKS.length} artworks...`);
  const artworkRows = SEED_ARTWORKS.map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist,
    year: a.year,
    medium: a.medium,
    tier: a.tier,
    insured_value: a.insured_value,
    image_url: a.image_url,
    image_url_web: a.image_url_web,
    image_url_thumb: a.image_url_thumb,
    tags: a.tags,
    description: a.description,
    gallery_notes: a.gallery_notes,
    native_width: a.native_width,
    native_height: a.native_height,
    dominant_orientation: a.dominant_orientation,
    source: a.source,
    source_id: a.source_id,
    source_url: a.source_url,
    rights_note: a.rights_note,
    status: a.status,
  }));

  const { error: artErr } = await supabase
    .from("artworks")
    .upsert(artworkRows, { onConflict: "id" });
  if (artErr) {
    console.error("Artworks error:", artErr);
    throw artErr;
  }
  console.log(`  ✓ ${artworkRows.length} artworks upserted`);

  // --- NPCs ---
  console.log(`Seeding ${SEED_NPCS.length} NPCs...`);
  const npcRows = SEED_NPCS.map((n) => ({
    id: n.id,
    name: n.name,
    role: n.role,
    npc_tier: n.npc_tier,
    slug: n.slug,
    specialty: n.specialty,
    description: n.description,
    traits: n.traits,
    credits: n.credits,
    prestige: n.prestige,
    stewardship_score: n.stewardship_score,
    npc_data: n.npc_data,
    unlock_tier: n.unlock_tier,
  }));

  const { error: npcErr } = await supabase
    .from("npcs")
    .upsert(npcRows, { onConflict: "id" });
  if (npcErr) {
    console.error("NPCs error:", npcErr);
    throw npcErr;
  }
  console.log(`  ✓ ${npcRows.length} NPCs upserted`);

  // --- Ownerships ---
  // Filter out stub user ownerships (they'll be created by real users)
  const STUB_USER_ID = "00000000-0000-0000-0000-000000000001";
  const DEMO_COLLECTOR_ID = "00000000-0000-0000-0000-000000000099";
  const ownershipRows = SEED_OWNERSHIPS.filter(
    (o) => o.owner_id !== STUB_USER_ID && o.owner_id !== DEMO_COLLECTOR_ID,
  ).map((o) => ({
    id: o.id,
    artwork_id: o.artwork_id,
    owner_id: o.owner_id,
    acquired_at: o.acquired_at,
    acquired_via: o.acquired_via,
    is_active: o.is_active,
    idle_weeks: o.idle_weeks,
    on_loan: o.on_loan,
  }));

  console.log(`Seeding ${ownershipRows.length} ownerships...`);
  const { error: ownErr } = await supabase
    .from("ownerships")
    .upsert(ownershipRows, { onConflict: "id" });
  if (ownErr) {
    console.error("Ownerships error:", ownErr);
    throw ownErr;
  }
  console.log(`  ✓ ${ownershipRows.length} ownerships upserted`);

  // --- Provenance Events ---
  const provRows = SEED_PROVENANCE_EVENTS.filter(
    (e) =>
      e.to_owner !== STUB_USER_ID &&
      e.from_owner !== STUB_USER_ID &&
      e.to_owner !== DEMO_COLLECTOR_ID &&
      e.from_owner !== DEMO_COLLECTOR_ID,
  ).map((e) => ({
    id: e.id,
    artwork_id: e.artwork_id,
    event_type: e.event_type,
    from_owner: e.from_owner,
    to_owner: e.to_owner,
    price: e.price,
    metadata: e.metadata,
    created_at: e.created_at,
  }));

  console.log(`Seeding ${provRows.length} provenance events...`);
  const { error: provErr } = await supabase
    .from("provenance_events")
    .upsert(provRows, { onConflict: "id" });
  if (provErr) {
    console.error("Provenance error:", provErr);
    throw provErr;
  }
  console.log(`  ✓ ${provRows.length} provenance events upserted`);

  // --- Auctions ---
  const auctionRows = SEED_AUCTIONS.map((a) => ({
    id: a.id,
    artwork_id: a.artwork_id,
    seller_id: a.seller_id,
    auction_type: a.auction_type,
    status: a.status,
    starting_bid: a.starting_bid,
    reserve_price: a.reserve_price,
    current_bid: a.current_bid,
    current_bidder: a.current_bidder,
    bid_count: a.bid_count,
    starts_at: a.starts_at,
    ends_at: a.ends_at,
    settled_at: a.settled_at,
  }));

  console.log(`Seeding ${auctionRows.length} auctions...`);
  const { error: aucErr } = await supabase
    .from("auctions")
    .upsert(auctionRows, { onConflict: "id" });
  if (aucErr) {
    console.error("Auctions error:", aucErr);
    throw aucErr;
  }
  console.log(`  ✓ ${auctionRows.length} auctions upserted`);

  console.log("\n✓ Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
