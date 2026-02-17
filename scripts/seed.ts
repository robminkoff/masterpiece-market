/**
 * Masterpiece Market — Database Seed Script
 *
 * Usage (once Supabase is configured):
 *   npx tsx scripts/seed.ts
 *
 * For v0, this file documents the seed data structure.
 * The actual data is in src/data/seed.ts and served via API routes.
 *
 * When connected to Supabase, this script will:
 * 1. Insert 20 artworks
 * 2. Insert 12 curators + 6 dealers
 * 3. Insert 1-2 sample auctions
 */

// TODO: Replace with real Supabase client
// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

import { SEED_ARTWORKS, SEED_NPCS, SEED_AUCTIONS, SEED_MUSEUMS, SEED_MUSEUM_EXHIBITIONS } from "../src/data/seed";

async function seed() {
  console.log("=== Masterpiece Market Seed Script ===\n");

  // --- Artworks ---
  console.log(`Artworks to seed: ${SEED_ARTWORKS.length}`);
  for (const a of SEED_ARTWORKS) {
    console.log(`  [${a.tier}] ${a.title} by ${a.artist} — IV: ${a.insured_value.toLocaleString()}`);
  }

  // TODO: Insert into Supabase
  // const { error: artErr } = await supabase.from("artworks").upsert(
  //   SEED_ARTWORKS.map(({ created_at, ...rest }) => rest)
  // );
  // if (artErr) throw artErr;

  // --- NPCs ---
  const curators = SEED_NPCS.filter((n) => n.role === "curator");
  const dealers = SEED_NPCS.filter((n) => n.role === "dealer");
  console.log(`\nCurators to seed: ${curators.length}`);
  for (const c of curators) {
    console.log(`  [${c.npc_tier}] ${c.name} — ${c.specialty}`);
  }
  console.log(`\nDealers to seed: ${dealers.length}`);
  for (const d of dealers) {
    console.log(`  [${d.npc_tier}] ${d.name} — ${d.specialty}`);
  }

  // TODO: Insert into Supabase
  // const { error: npcErr } = await supabase.from("npcs").upsert(
  //   SEED_NPCS.map(({ created_at, ...rest }) => rest)
  // );
  // if (npcErr) throw npcErr;

  // --- Auctions ---
  console.log(`\nAuctions to seed: ${SEED_AUCTIONS.length}`);
  for (const a of SEED_AUCTIONS) {
    console.log(`  [${a.status}] ${a.id} — starting at ${a.starting_bid.toLocaleString()} cr`);
  }

  // TODO: Insert into Supabase
  // const { error: aucErr } = await supabase.from("auctions").upsert(
  //   SEED_AUCTIONS.map(({ artwork, created_at, ...rest }) => rest)
  // );
  // if (aucErr) throw aucErr;

  // --- Museums ---
  console.log(`\nMuseums to seed: ${SEED_MUSEUMS.length}`);
  for (const m of SEED_MUSEUMS) {
    console.log(`  [${m.status}] ${m.name} — endowment: ${m.endowment.toLocaleString()} cr`);
  }

  // TODO: Insert into Supabase
  // const { error: musErr } = await supabase.from("museums").upsert(
  //   SEED_MUSEUMS.map(({ owner, created_at, ...rest }) => rest)
  // );
  // if (musErr) throw musErr;

  // --- Museum Exhibitions ---
  console.log(`\nMuseum Exhibitions to seed: ${SEED_MUSEUM_EXHIBITIONS.length}`);
  for (const e of SEED_MUSEUM_EXHIBITIONS) {
    console.log(`  [${e.status}] ${e.title}`);
  }

  // TODO: Insert into Supabase
  // const { error: mexErr } = await supabase.from("museum_exhibitions").upsert(
  //   SEED_MUSEUM_EXHIBITIONS.map(({ created_at, ...rest }) => rest)
  // );
  // if (mexErr) throw mexErr;

  console.log("\n✓ Seed data logged. Connect Supabase and uncomment inserts to populate the database.");
}

seed().catch(console.error);
