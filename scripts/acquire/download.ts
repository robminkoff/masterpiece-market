/**
 * download — resolve the best image URL for each row, then download it.
 *
 * Source priority per row: use the adapter matching row.source.
 * If the adapter fails and source_url is a direct image link, fall back to that.
 */

import * as fs from "fs";
import * as path from "path";
import { fetchMetImageUrl } from "./fetchers/met";
import { fetchRijksImageUrl } from "./fetchers/rijks";
import { fetchNgaImageUrl } from "./fetchers/nga";
import { fetchIiifImageUrl } from "./fetchers/iiif";
import { fetchWikimediaImageUrl } from "./fetchers/wikimedia";
import { slugify, delay, type PackRow, type DownloadResult } from "./types";

const ORIGINALS_DIR = path.resolve("acquisitions/originals");

async function resolveImageUrl(row: PackRow): Promise<string> {
  switch (row.source) {
    case "met":
      return fetchMetImageUrl(row.source_id);
    case "rijks":
      return fetchRijksImageUrl(row.source_id);
    case "nga":
      return fetchNgaImageUrl(row.source_id);
    case "iiif":
      return fetchIiifImageUrl(row.source_url);
    case "wikimedia":
      return fetchWikimediaImageUrl(row.source_id);
    default:
      throw new Error(`Unknown source: ${row.source}`);
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} downloading ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

export async function downloadRow(row: PackRow): Promise<DownloadResult> {
  const slug = slugify(row.title, row.artist);
  const ext = "jpg"; // normalize everything to jpg downstream
  const destPath = path.join(ORIGINALS_DIR, `${slug}.${ext}`);

  try {
    // Resolve the best image URL
    let imageUrl: string;
    try {
      imageUrl = await resolveImageUrl(row);
    } catch (adapterErr) {
      // Fall back to source_url if it looks like a direct image link
      if (row.source_url && /\.(jpg|jpeg|png|tif|tiff)(\?|$)/i.test(row.source_url)) {
        console.warn(`  [${slug}] Adapter failed, falling back to source_url`);
        imageUrl = row.source_url;
      } else {
        throw adapterErr;
      }
    }

    console.log(`  [${slug}] Downloading from ${imageUrl.slice(0, 80)}...`);
    await downloadFile(imageUrl, destPath);

    // Read dimensions with sharp
    const sharp = (await import("sharp")).default;
    const meta = await sharp(destPath).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const fileSize = fs.statSync(destPath).size;

    return { row, slug, originalPath: destPath, width, height, fileSize, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [${slug}] FAILED: ${msg}`);
    return { row, slug, originalPath: destPath, width: 0, height: 0, fileSize: 0, success: false, error: msg };
  }
}

export async function downloadPack(rows: PackRow[]): Promise<DownloadResult[]> {
  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });

  const results: DownloadResult[] = [];
  for (const row of rows) {
    const result = await downloadRow(row);
    results.push(result);
    // Small delay between downloads for politeness
    await delay(500);
  }
  return results;
}
