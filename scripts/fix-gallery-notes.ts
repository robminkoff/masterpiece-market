/**
 * fix-gallery-notes — Remove tier references from gallery_notes in the database.
 *
 * Two-phase update:
 *   1. Re-seed the 40 seed artworks (art-001 … art-040) with corrected gallery_notes + derived tier.
 *   2. Fix any package-generated artworks whose gallery_notes still mention "Tier X".
 *
 * Safe to re-run — all operations are idempotent upserts/updates.
 *
 * Usage:
 *   npx tsx scripts/fix-gallery-notes.ts
 */

import { createClient } from "@supabase/supabase-js";
import { SEED_ARTWORKS } from "../src/data/seed";
import { tierFromIV } from "../src/lib/types";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixGalleryNotes() {
  console.log("=== Fix Gallery Notes — Remove Tier References ===\n");

  // Phase 1: Update seed artworks with corrected gallery_notes + derived tier
  console.log(`Phase 1: Updating ${SEED_ARTWORKS.length} seed artworks...`);
  let seedUpdated = 0;
  for (const a of SEED_ARTWORKS) {
    const { error } = await supabase
      .from("artworks")
      .update({ tier: a.tier, gallery_notes: a.gallery_notes })
      .eq("id", a.id);
    if (error) {
      console.error(`  Error updating ${a.id}: ${error.message}`);
    } else {
      seedUpdated++;
    }
  }
  console.log(`  Done — ${seedUpdated}/${SEED_ARTWORKS.length} seed artworks updated.\n`);

  // Phase 2: Find non-seed artworks with tier references in gallery_notes
  console.log("Phase 2: Scanning non-seed artworks for tier references...");
  const { data: allArtworks, error: fetchErr } = await supabase
    .from("artworks")
    .select("id, insured_value, tier, gallery_notes")
    .not("id", "in", `(${SEED_ARTWORKS.map((a) => a.id).join(",")})`);

  if (fetchErr) {
    console.error("  Fetch error:", fetchErr.message);
    throw fetchErr;
  }

  const tierPattern = /\bTier [ABCD]\b/;
  let fixed = 0;

  for (const art of allArtworks ?? []) {
    const notes = art.gallery_notes as { heading: string; body: string }[] | null;
    if (!notes || notes.length === 0) continue;

    const raw = JSON.stringify(notes);
    if (!tierPattern.test(raw)) continue;

    // Fix gallery_notes: remove tier references
    const updatedNotes = notes.map((note) => ({
      ...note,
      body: note.body
        .replace(/\bTier [ABCD] artwork with an insured value of/g, "Insured value of")
        .replace(/\bTier [ABCD]\b/g, ""),
    }));

    // Also ensure tier column is derived from IV
    const derivedTier = tierFromIV(art.insured_value);

    const { error: upErr } = await supabase
      .from("artworks")
      .update({ gallery_notes: updatedNotes, tier: derivedTier })
      .eq("id", art.id);

    if (upErr) {
      console.error(`  Error updating ${art.id}: ${upErr.message}`);
    } else {
      console.log(`  Fixed ${art.id}`);
      fixed++;
    }
  }

  console.log(`  Done — ${fixed} non-seed artworks fixed.\n`);
  console.log("=== Complete ===");
}

fixGalleryNotes().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
