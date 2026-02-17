/**
 * buildPack — validate a pack CSV file.
 *
 * Usage: npx tsx scripts/acquire/buildPack.ts acquisitions/packs/06_impressionism.csv
 */

import { parse } from "csv-parse/sync";
import * as fs from "fs";
import type { PackRow } from "./types";

const VALID_SOURCES = ["met", "rijks", "nga", "iiif", "wikimedia"] as const;
const VALID_TIERS = ["A", "B", "C", "D"] as const;

const REQUIRED_COLUMNS = [
  "title", "artist", "year", "source", "source_id",
  "source_url", "rights_note", "tier", "insured_value", "tags",
];

export function validatePack(csvPath: string): { rows: PackRow[]; errors: string[] } {
  if (!fs.existsSync(csvPath)) {
    return { rows: [], errors: [`File not found: ${csvPath}`] };
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const errors: string[] = [];
  const rows: PackRow[] = [];

  if (records.length === 0) {
    errors.push("CSV is empty (no data rows).");
    return { rows, errors };
  }

  // Check columns
  const columns = Object.keys(records[0]);
  for (const col of REQUIRED_COLUMNS) {
    if (!columns.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }
  if (errors.length > 0) return { rows, errors };

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const line = i + 2; // 1-indexed, +1 for header

    if (!r.title?.trim()) errors.push(`Row ${line}: missing title`);
    if (!r.artist?.trim()) errors.push(`Row ${line}: missing artist`);

    if (!VALID_SOURCES.includes(r.source as (typeof VALID_SOURCES)[number])) {
      errors.push(`Row ${line}: invalid source "${r.source}" (must be ${VALID_SOURCES.join("|")})`);
    }

    if (!VALID_TIERS.includes(r.tier as (typeof VALID_TIERS)[number])) {
      errors.push(`Row ${line}: invalid tier "${r.tier}" (must be A|B|C|D)`);
    }

    const iv = Number(r.insured_value);
    if (isNaN(iv) || iv <= 0) {
      errors.push(`Row ${line}: insured_value must be a positive number, got "${r.insured_value}"`);
    }

    if (!r.source_id?.trim() && !r.source_url?.trim()) {
      errors.push(`Row ${line}: must have at least source_id or source_url`);
    }

    if (!r.rights_note?.trim()) {
      errors.push(`Row ${line}: missing rights_note`);
    }

    rows.push(r as unknown as PackRow);
  }

  return { rows, errors };
}

// CLI entry point
if (require.main === module) {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/acquire/buildPack.ts <path-to-csv>");
    process.exit(1);
  }

  const { rows, errors } = validatePack(csvPath);

  if (errors.length > 0) {
    console.error(`\nValidation FAILED with ${errors.length} error(s):\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`\nValidation OK: ${rows.length} rows in ${csvPath}`);

  // Summary
  const tiers = { A: 0, B: 0, C: 0, D: 0 };
  const sources: Record<string, number> = {};
  for (const r of rows) {
    tiers[r.tier]++;
    sources[r.source] = (sources[r.source] || 0) + 1;
  }
  console.log(`  Tiers: A=${tiers.A} B=${tiers.B} C=${tiers.C} D=${tiers.D}`);
  console.log(`  Sources: ${Object.entries(sources).map(([k, v]) => `${k}=${v}`).join(" ")}`);
}
