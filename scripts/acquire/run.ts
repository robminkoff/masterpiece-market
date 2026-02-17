/**
 * run.ts — Acquisition Pipeline orchestrator.
 *
 * Usage:
 *   npx tsx scripts/acquire/run.ts validate <csv>
 *   npx tsx scripts/acquire/run.ts download <csv>
 *   npx tsx scripts/acquire/run.ts all <csv> [--dry-run]
 *
 * Commands:
 *   validate   — Check CSV format and contents
 *   download   — Download + normalize (local only, no upload)
 *   all        — Full pipeline: download → normalize → upload → register
 *
 * Options:
 *   --dry-run  — Show what would happen without executing
 *   --retry-failed — Re-process only entries marked "failed" in manifest
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { validatePack } from "./buildPack";
import { downloadPack } from "./download";
import { normalizePack } from "./normalize";
import { uploadPack } from "./upload";
import { registerPack } from "./register";
import type { Manifest, ManifestEntry } from "./types";
import { slugify } from "./types";

// Load env from project root
config({ path: path.resolve(".env.local") });

const MANIFESTS_DIR = path.resolve("acquisitions/manifests");

function writeManifest(packName: string, entries: ManifestEntry[]): string {
  fs.mkdirSync(MANIFESTS_DIR, { recursive: true });

  const manifest: Manifest = {
    pack: packName,
    timestamp: new Date().toISOString(),
    entries,
    summary: {
      total: entries.length,
      ok: entries.filter((e) => e.status === "ok").length,
      failed: entries.filter((e) => e.status === "failed").length,
      needs_review: entries.filter((e) => e.status === "needs_review").length,
    },
  };

  const outPath = path.join(MANIFESTS_DIR, `${packName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const csvPath = args[1];
  const dryRun = args.includes("--dry-run");

  if (!command || !csvPath) {
    console.log(`
Acquisition Pipeline

Usage:
  npx tsx scripts/acquire/run.ts <command> <csv-path> [options]

Commands:
  validate     Check CSV format
  download     Download + normalize locally
  all          Full pipeline (download → normalize → upload → register)

Options:
  --dry-run    Preview without executing
`);
    process.exit(0);
  }

  // --- Validate ---
  console.log(`\n=== Validating ${csvPath} ===\n`);
  const { rows, errors } = validatePack(csvPath);

  if (errors.length > 0) {
    console.error(`Validation FAILED with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`OK: ${rows.length} rows validated.`);

  if (command === "validate") {
    return;
  }

  // --- Dry run ---
  if (dryRun) {
    console.log("\n=== DRY RUN ===\n");
    for (const row of rows) {
      const slug = slugify(row.title, row.artist);
      console.log(`  ${slug} | ${row.source}:${row.source_id} | Tier ${row.tier} | ${row.insured_value} cr`);
    }
    console.log(`\nWould process ${rows.length} artworks.`);
    return;
  }

  // --- Download ---
  console.log(`\n=== Downloading ${rows.length} artworks ===\n`);
  const downloads = await downloadPack(rows);

  const ok = downloads.filter((d) => d.success);
  const failed = downloads.filter((d) => !d.success);
  console.log(`\nDownloaded: ${ok.length} ok, ${failed.length} failed.`);

  // --- Normalize ---
  console.log(`\n=== Normalizing ${ok.length} artworks ===\n`);
  const normals = await normalizePack(ok);
  console.log(`Normalized: ${normals.length} artworks.`);

  // QA gate: check minimum resolution
  const MIN_LONG_SIDE = 2500;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const needsReview: Set<string> = new Set();

  for (const dl of ok) {
    const longSide = Math.max(dl.width, dl.height);
    if (longSide < MIN_LONG_SIDE) {
      console.warn(`  [${dl.slug}] QA: resolution ${dl.width}x${dl.height} below ${MIN_LONG_SIDE}px threshold`);
      needsReview.add(dl.slug);
    }
    if (dl.fileSize > MAX_FILE_SIZE) {
      console.warn(`  [${dl.slug}] QA: file size ${(dl.fileSize / 1024 / 1024).toFixed(1)}MB exceeds 50MB cap`);
      needsReview.add(dl.slug);
    }
  }

  if (command === "download") {
    // Write manifest and stop
    const packName = path.basename(csvPath, ".csv");
    const entries: ManifestEntry[] = downloads.map((d) => {
      const norm = normals.find((n) => n.slug === d.slug);
      return {
        slug: d.slug,
        title: d.row.title,
        artist: d.row.artist,
        status: !d.success ? "failed" : needsReview.has(d.slug) ? "needs_review" : "ok",
        originalPath: d.success ? d.originalPath : undefined,
        webPath: norm?.webPath,
        thumbPath: norm?.thumbPath,
        width: d.width || undefined,
        height: d.height || undefined,
        error: d.error,
      };
    });
    const manifestPath = writeManifest(packName, entries);
    console.log(`\nManifest written to ${manifestPath}`);
    return;
  }

  // --- Upload ---
  console.log(`\n=== Uploading ${normals.length} artworks to Supabase Storage ===\n`);
  const uploads = await uploadPack(normals);
  console.log(`Uploaded: ${uploads.length} artworks.`);

  // --- Register ---
  console.log(`\n=== Registering ${uploads.length} artworks in database ===\n`);
  const registrations = await registerPack(rows, normals, uploads);
  const regOk = registrations.filter((r) => r.success);
  const regFail = registrations.filter((r) => !r.success);
  console.log(`Registered: ${regOk.length} ok, ${regFail.length} failed.`);

  // --- Manifest ---
  const packName = path.basename(csvPath, ".csv");
  const entries: ManifestEntry[] = downloads.map((d) => {
    const norm = normals.find((n) => n.slug === d.slug);
    const reg = registrations.find((r) => r.slug === d.slug);
    return {
      slug: d.slug,
      title: d.row.title,
      artist: d.row.artist,
      status: !d.success || !reg?.success
        ? "failed"
        : needsReview.has(d.slug)
          ? "needs_review"
          : "ok",
      originalPath: d.success ? d.originalPath : undefined,
      webPath: norm?.webPath,
      thumbPath: norm?.thumbPath,
      width: d.width || undefined,
      height: d.height || undefined,
      error: d.error || reg?.error,
    };
  });

  const manifestPath = writeManifest(packName, entries);

  // Final summary
  const summary = {
    total: entries.length,
    ok: entries.filter((e) => e.status === "ok").length,
    failed: entries.filter((e) => e.status === "failed").length,
    needs_review: entries.filter((e) => e.status === "needs_review").length,
  };

  console.log(`
=== Pipeline Complete ===

  Total:        ${summary.total}
  OK:           ${summary.ok}
  Failed:       ${summary.failed}
  Needs Review: ${summary.needs_review}

  Manifest: ${manifestPath}
`);
}

main().catch((err) => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
