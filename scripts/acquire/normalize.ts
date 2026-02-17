/**
 * normalize — generate web and thumb derivatives from downloaded originals.
 *
 * Rules:
 *   - NO cropping. Native aspect ratio is always preserved.
 *   - zoom_master: original file or capped at 6000px long side
 *   - display_web: 1400px long side, quality 80
 *   - thumb: 400px long side
 *
 * Output dirs:
 *   - acquisitions/originals/  (already present from download step)
 *   - acquisitions/web/
 *   - acquisitions/thumbs/
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import type { DownloadResult, NormalizeResult } from "./types";

const WEB_LONG_SIDE = 1400;
const THUMB_LONG_SIDE = 400;
const MASTER_CAP = 6000;

const WEB_DIR = path.resolve("acquisitions/web");
const THUMB_DIR = path.resolve("acquisitions/thumbs");

function resizeDims(
  width: number,
  height: number,
  maxLongSide: number,
): { width: number; height: number } {
  const longSide = Math.max(width, height);
  if (longSide <= maxLongSide) return { width, height };
  const ratio = maxLongSide / longSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function normalizeOne(dl: DownloadResult): Promise<NormalizeResult | null> {
  if (!dl.success || !fs.existsSync(dl.originalPath)) {
    return null;
  }

  fs.mkdirSync(WEB_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  const slug = dl.slug;
  const webPath = path.join(WEB_DIR, `${slug}.jpg`);
  const thumbPath = path.join(THUMB_DIR, `${slug}.jpg`);

  const meta = await sharp(dl.originalPath).metadata();
  const w = meta.width ?? dl.width;
  const h = meta.height ?? dl.height;

  // Cap the original if it's enormous
  const longSide = Math.max(w, h);
  if (longSide > MASTER_CAP) {
    const capped = resizeDims(w, h, MASTER_CAP);
    await sharp(dl.originalPath)
      .resize(capped.width, capped.height, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(dl.originalPath + ".tmp");
    fs.renameSync(dl.originalPath + ".tmp", dl.originalPath);
    console.log(`  [${slug}] Capped master to ${capped.width}x${capped.height}`);
  }

  // Generate web derivative
  const webDims = resizeDims(w, h, WEB_LONG_SIDE);
  await sharp(dl.originalPath)
    .resize(webDims.width, webDims.height, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(webPath);

  // Generate thumb derivative
  const thumbDims = resizeDims(w, h, THUMB_LONG_SIDE);
  await sharp(dl.originalPath)
    .resize(thumbDims.width, thumbDims.height, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toFile(thumbPath);

  const orientation: "portrait" | "landscape" | "square" =
    w > h ? "landscape" : h > w ? "portrait" : "square";

  console.log(`  [${slug}] web=${webDims.width}x${webDims.height} thumb=${thumbDims.width}x${thumbDims.height} (${orientation})`);

  return {
    slug,
    webPath,
    thumbPath,
    originalPath: dl.originalPath,
    width: w,
    height: h,
    orientation,
  };
}

export async function normalizePack(downloads: DownloadResult[]): Promise<NormalizeResult[]> {
  const results: NormalizeResult[] = [];
  for (const dl of downloads) {
    const result = await normalizeOne(dl);
    if (result) results.push(result);
  }
  return results;
}
