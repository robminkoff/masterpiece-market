import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const isServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
console.log(`Using ${isServiceKey ? "service_role" : "anon"} key\n`);

const db = createClient(url, key);

async function check() {
  console.log("Checking if migration 0007 has been applied...\n");

  // 1. Check if artworks table has any data
  const { data: artworks, error: artErr } = await db.from("artworks").select("id").limit(3);
  console.log("artworks:", artErr ? `ERROR: ${artErr.message}` : `${(artworks ?? []).length} rows, IDs: ${(artworks ?? []).map(a => a.id).join(", ")}`);

  // 2. Check if credit_events table exists
  const { data: ce, error: ceErr } = await db.from("credit_events").select("id").limit(1);
  console.log("credit_events table:", ceErr ? `NOT FOUND or no access (${ceErr.message})` : `EXISTS (${(ce ?? []).length} rows)`);

  // 3. Check profiles.last_burn_at
  const { data: profiles, error: profErr } = await db.from("profiles").select("id, last_burn_at, tier, credits").limit(3);
  if (profErr) {
    console.log("profiles:", `ERROR: ${profErr.message}`);
  } else if (profiles && profiles.length > 0) {
    const p = profiles[0];
    const hasLastBurnAt = "last_burn_at" in p;
    console.log(`profiles: ${profiles.length} rows, tier="${p.tier}", credits=${p.credits}, last_burn_at=${hasLastBurnAt ? p.last_burn_at : "COLUMN MISSING"}`);
  } else {
    console.log("profiles: 0 rows (empty table)");
  }

  // 4. Check NPCs
  const { data: npcs, error: npcErr } = await db.from("npcs").select("id, name, slug").limit(3);
  console.log("npcs:", npcErr ? `ERROR: ${npcErr.message}` : `${(npcs ?? []).length} rows${npcs?.[0] ? `, sample: id="${npcs[0].id}", name="${npcs[0].name}"` : ""}`);

  // 5. Check ownerships
  const { data: owns, error: ownErr } = await db.from("ownerships").select("id, owner_id, artwork_id").limit(3);
  console.log("ownerships:", ownErr ? `ERROR: ${ownErr.message}` : `${(owns ?? []).length} rows${owns?.[0] ? `, sample: owner_id="${owns[0].owner_id}", artwork_id="${owns[0].artwork_id}"` : ""}`);

  // 6. Check execute_sale RPC
  const { error: rpcErr } = await db.rpc("execute_sale", {
    p_artwork_id: "test-check",
    p_buyer_id: "test-check",
    p_seller_id: "test-check",
    p_sale_price: 0,
    p_via: "migration_check",
  });
  if (rpcErr) {
    if (rpcErr.message.includes("does not exist") || rpcErr.code === "42883") {
      console.log("execute_sale RPC: NOT FOUND - migration NOT applied");
    } else {
      console.log(`execute_sale RPC: EXISTS (runtime error expected: ${rpcErr.message})`);
    }
  } else {
    console.log("execute_sale RPC: EXISTS and ran (unexpected - rolled back?)");
  }

  console.log("\n--- Summary ---");
  const artworkIdIsText = artworks && artworks.length > 0 && typeof artworks[0].id === "string" && !artworks[0].id.match(/^[0-9a-f]{8}-/);
  const npcIdIsText = npcs && npcs.length > 0 && typeof npcs[0].id === "string" && !npcs[0].id.match(/^[0-9a-f]{8}-/);

  if (!ceErr && profiles && "last_burn_at" in (profiles[0] || {})) {
    console.log("Migration 0007 appears to be APPLIED");
  } else if (artworks && artworks.length === 0 && (!npcs || npcs.length === 0)) {
    console.log("Tables are EMPTY - migration status unclear. Need to check schema columns.");
  } else {
    console.log("Migration 0007 appears NOT YET applied (credit_events or last_burn_at missing)");
  }

  if (artworks && artworks.length === 0 && (!npcs || npcs.length === 0)) {
    console.log("\nDatabase has no seed data. After applying migration, run: npx tsx scripts/seed.ts");
  }
}

check().catch(console.error);
