/**
 * Wikimedia Commons adapter.
 * Uses the MediaWiki API to resolve the full-resolution image URL
 * for a given Commons filename.
 *
 * source_id should be the Commons filename (with or without "File:" prefix).
 */

import { delay } from "../types";

const API_BASE = "https://en.wikipedia.org/w/api.php";

export async function fetchWikimediaImageUrl(sourceId: string): Promise<string> {
  await delay(1000);

  // Normalize: ensure "File:" prefix
  const filename = sourceId.startsWith("File:") ? sourceId : `File:${sourceId}`;

  const params = new URLSearchParams({
    action: "query",
    titles: filename,
    prop: "imageinfo",
    iiprop: "url|size",
    format: "json",
  });

  const res = await fetch(`${API_BASE}?${params}`);
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

  return info.url;
}
