import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Artworks that were owned by DEMO_COLLECTOR and got filtered out during seed
const ORPHANED = [
  { artwork_id: "art-001", dealer_id: "npc-d03" }, // Mona Lisa → The Private Room
  { artwork_id: "art-004", dealer_id: "npc-d01" }, // Great Wave → Galleria North
  { artwork_id: "art-010", dealer_id: "npc-d02" }, // The Kiss → Bram & Co.
  { artwork_id: "art-015", dealer_id: "npc-d04" }, // Composition II → Restoration House
];

async function fix() {
  for (const { artwork_id, dealer_id } of ORPHANED) {
    // Check if already has active ownership
    const { data: existing } = await db
      .from("ownerships")
      .select("id")
      .eq("artwork_id", artwork_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      console.log(`${artwork_id}: already has active owner, skipping`);
      continue;
    }

    const ownId = `own-fix-${artwork_id}`;
    const { error } = await db.from("ownerships").upsert({
      id: ownId,
      artwork_id,
      owner_id: dealer_id,
      acquired_via: "consignment",
      is_active: true,
      idle_weeks: 0,
      on_loan: false,
    }, { onConflict: "id" });

    if (error) {
      console.error(`${artwork_id}: ERROR`, error.message);
    } else {
      console.log(`${artwork_id}: assigned to ${dealer_id}`);
    }
  }

  console.log("\nDone. Orphaned artworks assigned to dealers.");
}

fix().catch(console.error);
