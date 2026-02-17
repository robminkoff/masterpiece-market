/**
 * IIIF Image API adapter.
 * Requests the full image from a IIIF image service endpoint.
 *
 * Expects source_url to be the IIIF image service base URL, e.g.:
 *   https://example.org/iiif/image/12345
 *
 * Requests: {base}/full/full/0/default.jpg (IIIF v2)
 * Also tries: {base}/full/max/0/default.jpg (IIIF v3)
 */

import { delay } from "../types";

export async function fetchIiifImageUrl(sourceUrl: string): Promise<string> {
  await delay(500);

  // Try IIIF v2: /full/full/0/default.jpg
  const v2Url = `${sourceUrl.replace(/\/$/, "")}/full/full/0/default.jpg`;
  const res = await fetch(v2Url, { method: "HEAD" });
  if (res.ok) {
    return v2Url;
  }

  // Try IIIF v3: /full/max/0/default.jpg
  const v3Url = `${sourceUrl.replace(/\/$/, "")}/full/max/0/default.jpg`;
  const res2 = await fetch(v3Url, { method: "HEAD" });
  if (res2.ok) {
    return v3Url;
  }

  throw new Error(
    `IIIF: neither v2 nor v3 full-size URL responded for ${sourceUrl}`,
  );
}
