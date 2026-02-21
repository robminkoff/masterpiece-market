/**
 * Wikimedia Commons adapter.
 * Uses the MediaWiki API to resolve the full-resolution image URL
 * for a given Commons filename.
 *
 * source_id should be the Commons filename (with or without "File:" prefix).
 */

import { delay } from "../types";

const API_BASE = "https://commons.wikimedia.org/w/api.php";
const MAX_RETRIES = 2;

export async function fetchWikimediaImageUrl(sourceId: string): Promise<string> {
  await delay(1500);

  // Decode any URL-encoded characters (e.g. %28 → (, %2C → ,)
  // so that URLSearchParams doesn't double-encode them
  const decoded = decodeURIComponent(sourceId);
  const filename = decoded.startsWith("File:") ? decoded : `File:${decoded}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.warn(`  [wikimedia] Retry ${attempt} for "${filename}"`);
      await delay(3000 * attempt);
    }

    const params = new URLSearchParams({
      action: "query",
      titles: filename,
      prop: "imageinfo",
      iiprop: "url|size",
      format: "json",
    });

    const res = await fetch(`${API_BASE}?${params}`);

    if (res.status === 429) {
      if (attempt < MAX_RETRIES) continue;
      throw new Error(`Wikimedia API rate limited (429) after ${MAX_RETRIES} retries`);
    }

    if (!res.ok) {
      throw new Error(`Wikimedia API returned ${res.status}`);
    }

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) {
      throw new Error(`Wikimedia: unexpected API response for "${filename}"`);
    }

    const page = Object.values(pages)[0] as {
      imageinfo?: Array<{ url: string; width: number; height: number }>;
      missing?: string;
    };

    if (page.missing !== undefined) {
      throw new Error(`Wikimedia: file "${filename}" not found on Commons`);
    }

    const info = page.imageinfo?.[0];
    if (!info?.url) {
      throw new Error(`Wikimedia: no image URL for "${filename}"`);
    }

    // If image is extremely large (>100MP), request a resized version via thumbnail URL
    const pixels = (info.width ?? 0) * (info.height ?? 0);
    if (pixels > 100_000_000) {
      // Use Wikimedia's thumbnail service to get a max 4000px wide version
      const thumbUrl = info.url.replace(
        /\/commons\/([\da-f]\/[\da-f]{2})\//,
        "/commons/thumb/$1/",
      ) + "/4000px-" + decoded;
      return thumbUrl;
    }

    return info.url;
  }

  throw new Error(`Wikimedia: failed to fetch after retries`);
}
