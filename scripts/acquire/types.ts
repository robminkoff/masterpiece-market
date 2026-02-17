/** Shared types for the acquisition pipeline */

export interface PackRow {
  title: string;
  artist: string;
  year: string;
  source: "met" | "rijks" | "nga" | "iiif" | "wikimedia";
  source_id: string;
  source_url: string;
  rights_note: string;
  tier: "A" | "B" | "C" | "D";
  insured_value: string;
  tags: string; // pipe-separated
}

export interface DownloadResult {
  row: PackRow;
  slug: string;
  originalPath: string;
  width: number;
  height: number;
  fileSize: number;
  success: boolean;
  error?: string;
}

export interface NormalizeResult {
  slug: string;
  webPath: string;
  thumbPath: string;
  originalPath: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
}

export interface ManifestEntry {
  slug: string;
  title: string;
  artist: string;
  status: "ok" | "failed" | "needs_review";
  originalPath?: string;
  webPath?: string;
  thumbPath?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface Manifest {
  pack: string;
  timestamp: string;
  entries: ManifestEntry[];
  summary: { total: number; ok: number; failed: number; needs_review: number };
}

export function slugify(title: string, artist: string): string {
  const raw = `${artist}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return raw.slice(0, 80);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
