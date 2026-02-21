/**
 * assign-to-dealers.ts — Assign unowned artworks to dealer NPCs.
 *
 * After the acquisition pipeline registers artworks in the DB, they exist
 * but have no ownership records. This script:
 *   1. Queries all artworks with no active ownership
 *   2. Round-robin assigns them to the 6 dealer NPCs (npc-d01 … npc-d06)
 *   3. Creates ownership records (acquired_via: "consignment")
 *   4. Reserves a configurable number of D-tier artworks as unassigned
 *      for the starter-gift pool
 *
 * Usage:
 *   npx tsx scripts/assign-to-dealers.ts
 *   npx tsx scripts/assign-to-dealers.ts --reserve-d 20   # keep 20 D-tier unassigned
 *   npx tsx scripts/assign-to-dealers.ts --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

const DEALER_IDS = ["npc-d01", "npc-d02", "npc-d03", "npc-d04", "npc-d05", "npc-d06"];
const DEFAULT_RESERVE_D = 15; // D-tier artworks kept unassigned for starter gifts

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  let reserveD = DEFAULT_RESERVE_D;
  const reserveIdx = args.indexOf("--reserve-d");
  if (reserveIdx !== -1 && args[reserveIdx + 1]) {
    reserveD = parseInt(args[reserveIdx + 1], 10);
    if (isNaN(reserveD) || reserveD < 0) reserveD = DEFAULT_RESERVE_D;
  }

  console.log("=== Assign Unowned Artworks to Dealers ===\n");
  console.log(`  Reserve D-tier for gifts: ${reserveD}`);
  console.log(`  Dry run: ${dryRun}\n`);

  // 1. Get all artworks
  const { data: allArtworks, error: artErr } = await db
    .from("artworks")
    .select("id, title, tier")
    .eq("status", "active")
    .order("insured_value", { ascending: false });
  if (artErr) throw artErr;

  // 2. Get all active ownerships
  const { data: activeOwns, error: ownErr } = await db
    .from("ownerships")
    .select("artwork_id")
    .eq("is_active", true);
  if (ownErr) throw ownErr;

  const ownedIds = new Set((activeOwns ?? []).map((o) => o.artwork_id));

  // 3. Filter to unowned
  const unowned = (allArtworks ?? []).filter((a) => !ownedIds.has(a.id));
  console.log(`Found ${unowned.length} unowned artworks (out of ${allArtworks?.length ?? 0} total).\n`);

  if (unowned.length === 0) {
    console.log("Nothing to assign.");
    return;
  }

  // 4. Separate D-tier for gift pool reservation
  const dTier = unowned.filter((a) => a.tier === "D");
  const nonDTier = unowned.filter((a) => a.tier !== "D");

  // Reserve some D-tier unassigned
  const actualReserve = Math.min(reserveD, dTier.length);
  const dToAssign = dTier.slice(actualReserve); // assign the rest
  const dReserved = dTier.slice(0, actualReserve);

  const toAssign = [...nonDTier, ...dToAssign];

  console.log(`  D-tier total unowned: ${dTier.length}`);
  console.log(`  D-tier reserved for gifts: ${dReserved.length}`);
  console.log(`  Artworks to assign: ${toAssign.length}\n`);

  if (dReserved.length > 0) {
    console.log("Reserved for starter gifts:");
    for (const a of dReserved) {
      console.log(`  [RESERVED] ${a.id} — ${a.title}`);
    }
    console.log();
  }

  // 5. Round-robin assign
  let dealerIdx = 0;
  let assigned = 0;
  let errors = 0;

  for (const artwork of toAssign) {
    const dealerId = DEALER_IDS[dealerIdx % DEALER_IDS.length];
    dealerIdx++;

    if (dryRun) {
      console.log(`  [DRY] ${artwork.id} (${artwork.tier}) → ${dealerId}`);
      assigned++;
      continue;
    }

    const ownId = `own-assign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await db.from("ownerships").insert({
      id: ownId,
      artwork_id: artwork.id,
      owner_id: dealerId,
      acquired_via: "consignment",
      is_active: true,
      idle_weeks: 0,
      on_loan: false,
    });

    if (error) {
      console.error(`  [ERROR] ${artwork.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  [OK] ${artwork.id} (${artwork.tier}) → ${dealerId}`);
      assigned++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Assigned: ${assigned}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Reserved (D-tier gift pool): ${dReserved.length}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
