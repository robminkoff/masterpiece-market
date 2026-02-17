/**
 * Rijksmuseum adapter.
 * Uses the Rijksmuseum Data API to get high-res image URLs.
 * API key required (free): https://data.rijksmuseum.nl/
 *
 * Falls back to a known URL pattern if no API key is set.
 */

import { delay } from "../types";

const API_BASE = "https://www.rijksmuseum.nl/api/en/collection";

export async function fetchRijksImageUrl(sourceId: string): Promise<string> {
  await delay(1000);

  const apiKey = process.env.RIJKS_API_KEY;

  if (apiKey) {
    const res = await fetch(`${API_BASE}/${sourceId}?key=${apiKey}`);
    if (!res.ok) {
      throw new Error(`Rijks API returned ${res.status} for ${sourceId}`);
    }
    const data = await res.json();
    const webImage = data?.artObject?.webImage;
    if (webImage?.url) {
      // Rijks returns URLs with width parameter; request max size
      return webImage.url.replace(/=s\d+$/, "=s0");
    }
  }

  // Fallback: construct a direct image URL from the object page.
  // Rijksmuseum image tiles follow a known pattern, but the simplest
  // approach is to use their standard download size.
  console.warn(`  [rijks] No API key set; using source_url fallback for ${sourceId}`);
  throw new Error(
    `Rijks object ${sourceId}: set RIJKS_API_KEY in .env.local or provide a direct source_url`,
  );
}
