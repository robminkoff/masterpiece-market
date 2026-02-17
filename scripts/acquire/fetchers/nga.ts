/**
 * National Gallery of Art (NGA) adapter.
 * NGA provides Open Access images (CC0) from object pages.
 *
 * The NGA doesn't have a formal public JSON API for image URLs,
 * so we use their IIIF image service when available, or fall back
 * to scraping the open access download link from the object page.
 */

import { delay } from "../types";

export async function fetchNgaImageUrl(sourceId: string): Promise<string> {
  await delay(1000);

  // NGA exposes IIIF manifests for many objects.
  // Pattern: https://media.nga.gov/iiif/public/objects/{id}/primary/default.jpg
  // Try the IIIF full-size first.
  const iiifUrl = `https://media.nga.gov/iiif/public/objects/${sourceId}/primary/full/full/0/default.jpg`;

  const res = await fetch(iiifUrl, { method: "HEAD" });
  if (res.ok) {
    return iiifUrl;
  }

  // Fallback: try the standard NGA image CDN pattern
  const cdnUrl = `https://media.nga.gov/public/objects/${sourceId}/0/primary/large.jpg`;
  const res2 = await fetch(cdnUrl, { method: "HEAD" });
  if (res2.ok) {
    return cdnUrl;
  }

  throw new Error(
    `NGA: could not resolve image for object ${sourceId}. ` +
    `Try providing a direct source_url instead.`,
  );
}
