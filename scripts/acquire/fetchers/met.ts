/**
 * Met Museum Open Access adapter.
 * API docs: https://metmuseum.github.io/
 *
 * Calls /public/collection/v1/objects/{id} and returns the primaryImage URL.
 * Only works for Open Access objects (isPublicDomain === true).
 */

import { delay } from "../types";

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

interface MetObject {
  objectID: number;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  medium: string;
  dimensions: string;
}

export async function fetchMetImageUrl(sourceId: string): Promise<string> {
  await delay(1000); // polite rate limiting

  const res = await fetch(`${BASE}/objects/${sourceId}`);
  if (!res.ok) {
    throw new Error(`Met API returned ${res.status} for object ${sourceId}`);
  }

  const obj: MetObject = await res.json();

  if (!obj.isPublicDomain) {
    throw new Error(`Met object ${sourceId} ("${obj.title}") is NOT public domain`);
  }

  if (!obj.primaryImage) {
    throw new Error(`Met object ${sourceId} ("${obj.title}") has no primaryImage URL`);
  }

  return obj.primaryImage;
}
