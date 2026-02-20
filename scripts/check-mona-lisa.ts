import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

async function check() {
  // Find the Mona Lisa artwork
  const { data: artworks } = await db.from("artworks").select("id, title, insured_value, tier").ilike("title", "%mona lisa%");
  console.log("Mona Lisa artwork:", JSON.stringify(artworks, null, 2));

  if (!artworks || artworks.length === 0) {
    console.log("Not found in artworks table!");
    return;
  }

  const artId = artworks[0].id;

  // Check ownerships
  const { data: ownerships } = await db.from("ownerships").select("*").eq("artwork_id", artId);
  console.log("\nOwnerships for", artId, ":", JSON.stringify(ownerships, null, 2));

  // Check active ownership specifically
  const { data: active } = await db.from("ownerships").select("*").eq("artwork_id", artId).eq("is_active", true);
  console.log("\nActive ownership:", JSON.stringify(active, null, 2));

  // Check all artworks without active ownership
  const { data: allOwnerships } = await db.from("ownerships").select("artwork_id").eq("is_active", true);
  const ownedIds = new Set((allOwnerships ?? []).map(o => o.artwork_id));

  const { data: allArtworks } = await db.from("artworks").select("id, title");
  const unowned = (allArtworks ?? []).filter(a => !ownedIds.has(a.id));
  console.log("\nAll unowned artworks:", JSON.stringify(unowned, null, 2));
}

check().catch(console.error);
