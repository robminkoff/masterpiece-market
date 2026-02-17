/**
 * register — insert artwork rows and provenance events into the database.
 *
 * Inserts into:
 *   - artworks (metadata + image URLs + native dimensions)
 *   - provenance_events (event_type = "ingested")
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in env.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import type { PackRow, NormalizeResult } from "./types";
import { slugify } from "./types";
import type { UploadResult } from "./upload";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  }
  return createClient(url, key);
}

export interface RegisterResult {
  slug: string;
  artworkId: string;
  success: boolean;
  error?: string;
}

export async function registerOne(
  row: PackRow,
  norm: NormalizeResult,
  upload: UploadResult,
): Promise<RegisterResult> {
  const supabase = getSupabase();
  const slug = slugify(row.title, row.artist);
  const artworkId = `art-${slug}`;

  // Compute a checksum of the web file for provenance
  const webFile = fs.readFileSync(norm.webPath);
  const checksum = crypto.createHash("sha256").update(webFile).digest("hex").slice(0, 16);

  const tags = row.tags
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);

  const artworkRow = {
    id: artworkId,
    title: row.title,
    artist: row.artist,
    year: row.year ? Number(row.year) : null,
    medium: null, // CSV doesn't include medium; can be enriched later
    tier: row.tier,
    insured_value: Number(row.insured_value),
    image_url: upload.originalUrl,
    image_url_web: upload.webUrl,
    image_url_thumb: upload.thumbUrl,
    tags,
    description: null,
    native_width: norm.width,
    native_height: norm.height,
    source: row.source,
    source_id: row.source_id || null,
    source_url: row.source_url || null,
    rights_note: row.rights_note,
    status: "active",
  };

  const { error: artErr } = await supabase.from("artworks").upsert(artworkRow, { onConflict: "id" });
  if (artErr) {
    return { slug, artworkId, success: false, error: `artworks insert: ${artErr.message}` };
  }

  // Append provenance event
  const { error: provErr } = await supabase.from("provenance_events").insert({
    artwork_id: artworkId,
    event_type: "ingested",
    metadata: {
      source: row.source,
      source_id: row.source_id,
      source_url: row.source_url,
      rights_note: row.rights_note,
      checksum,
      native_width: norm.width,
      native_height: norm.height,
    },
  });
  if (provErr) {
    console.warn(`  [${slug}] provenance insert warning: ${provErr.message}`);
  }

  console.log(`  [${slug}] Registered as ${artworkId}`);
  return { slug, artworkId, success: true };
}

export async function registerPack(
  rows: PackRow[],
  normals: NormalizeResult[],
  uploads: UploadResult[],
): Promise<RegisterResult[]> {
  const results: RegisterResult[] = [];

  for (const row of rows) {
    const slug = slugify(row.title, row.artist);
    const norm = normals.find((n) => n.slug === slug);
    const upload = uploads.find((u) => u.slug === slug);

    if (!norm || !upload) {
      results.push({ slug, artworkId: "", success: false, error: "Missing normalize or upload result" });
      continue;
    }

    const result = await registerOne(row, norm, upload);
    results.push(result);
  }

  return results;
}
