#!/usr/bin/env npx tsx
/**
 * Masterpiece Market — Monte Carlo Simulation
 *
 * Runs thousands of simulated player lifecycles under different market
 * conditions and spending strategies, reporting time-to-museum and
 * bankruptcy risk.
 *
 * Usage:
 *   npx tsx scripts/sim/montecarlo.ts
 *   npx tsx scripts/sim/montecarlo.ts --runs=10000 --seed=123
 *   npx tsx scripts/sim/montecarlo.ts --market=cold --topup=none
 *   npx tsx scripts/sim/montecarlo.ts --loans=false --flipping=true
 *   npx tsx scripts/sim/montecarlo.ts --tune=gpt-lowfee
 *   npx tsx scripts/sim/montecarlo.ts --compare --market=normal
 *
 * npm script:
 *   npm run sim:mc
 *   npm run sim:mc -- --runs=1000 --market=hot
 */

import { PRNG } from "./prng";
import { parseArgs, buildScenarios, SimConfig, TUNE_PRESETS } from "./config";
import { simulateRun, SimResult } from "./engine";

// ── Statistics helpers ──────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return percentile(s, 0.5);
}

function p10(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  return percentile(s, 0.1);
}

function p90(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  return percentile(s, 0.9);
}

function pct(n: number, total: number): string {
  return ((n / total) * 100).toFixed(1) + "%";
}

function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000) + "k";
  return String(Math.round(n));
}

// ── Run one scenario ────────────────────────────────────────────────

interface ScenarioStats {
  name: string;
  total: number;
  museumCount: number;
  bankruptCount: number;
  timeoutCount: number;
  museumWeeks: number[];    // week values for museum outcomes
  bankruptWeeks: number[];  // week values for bankruptcy outcomes
  nw52: number[];           // net worth at week 52 for non-bankrupt-before-52
  // Achievement tier counts (when enabled)
  achievementsEnabled: boolean;
  wingCount: number;
  galleryCount: number;
  exhibitionCount: number;
  noneCount: number; // ran out with nothing to show
}

function runScenario(
  cfg: SimConfig,
  runs: number,
  baseSeed: number,
): ScenarioStats {
  const stats: ScenarioStats = {
    name: cfg.name,
    total: runs,
    museumCount: 0,
    bankruptCount: 0,
    timeoutCount: 0,
    museumWeeks: [],
    bankruptWeeks: [],
    nw52: [],
    achievementsEnabled: cfg.achievements.enabled,
    wingCount: 0,
    galleryCount: 0,
    exhibitionCount: 0,
    noneCount: 0,
  };

  for (let i = 0; i < runs; i++) {
    const rng = new PRNG(baseSeed + i * 7919); // spread seeds
    const r = simulateRun(cfg, rng);

    switch (r.outcome) {
      case "museum":
        stats.museumCount++;
        stats.museumWeeks.push(r.week);
        // If museum was founded before week 52, record NW at founding
        if (r.week <= 52) stats.nw52.push(r.netWorth);
        break;
      case "bankruptcy":
        stats.bankruptCount++;
        stats.bankruptWeeks.push(r.week);
        break;
      case "timeout":
        stats.timeoutCount++;
        stats.nw52.push(r.netWorth);
        break;
    }

    // Track achievement tiers
    if (cfg.achievements.enabled && r.outcome !== "museum") {
      switch (r.achievement) {
        case "wing":       stats.wingCount++; break;
        case "gallery":    stats.galleryCount++; break;
        case "exhibition": stats.exhibitionCount++; break;
        default:           stats.noneCount++; break;
      }
    }
  }

  return stats;
}

// ── Output formatting ───────────────────────────────────────────────

function printHeader(runs: number, maxWeeks: number, seed: number, tuneInfo?: string): void {
  console.log();
  console.log("  Masterpiece Market — Monte Carlo Simulation");
  console.log("  " + "═".repeat(60));
  console.log(
    `  Runs: ${runs.toLocaleString()}  |  Max weeks: ${maxWeeks}  |  Seed: ${seed}`,
  );
  if (tuneInfo) {
    console.log(`  ${tuneInfo}`);
  }
  console.log();
}

function printTable(scenarios: ScenarioStats[]): void {
  const hasAchievements = scenarios.some((s) => s.achievementsEnabled);

  // Dynamic name column width
  const nameWidth = Math.max(22, ...scenarios.map((s) => s.name.length + 1));

  // Column headers
  const cols = [
    "Scenario".padEnd(nameWidth),
    "Museum%".padStart(8),
    "P10".padStart(5),
    "P50".padStart(5),
    "P90".padStart(5),
  ];
  if (hasAchievements) {
    cols.push("Wing%".padStart(7), "Gall%".padStart(7), "Exhb%".padStart(7), "None%".padStart(7));
  } else {
    cols.push("Bankr%".padStart(8), "Bk P50".padStart(7));
  }
  cols.push("NW@52".padStart(8));
  const header = cols.join("  ");

  console.log("  " + header);
  console.log("  " + "─".repeat(header.length));

  for (const s of scenarios) {
    const museumPct = pct(s.museumCount, s.total);
    const mP10 = s.museumWeeks.length > 0 ? String(p10(s.museumWeeks)) : "—";
    const mP50 = s.museumWeeks.length > 0 ? String(median(s.museumWeeks)) : "—";
    const mP90 = s.museumWeeks.length > 0 ? String(p90(s.museumWeeks)) : "—";
    const nw = s.nw52.length > 0 ? fmtK(median(s.nw52)) : "—";

    const rowCols = [
      s.name.padEnd(nameWidth),
      museumPct.padStart(8),
      mP10.padStart(5),
      mP50.padStart(5),
      mP90.padStart(5),
    ];

    if (hasAchievements) {
      rowCols.push(
        pct(s.wingCount, s.total).padStart(7),
        pct(s.galleryCount, s.total).padStart(7),
        pct(s.exhibitionCount, s.total).padStart(7),
        pct(s.noneCount, s.total).padStart(7),
      );
    } else {
      const bankPct = pct(s.bankruptCount, s.total);
      const bP50 = s.bankruptWeeks.length > 0 ? String(median(s.bankruptWeeks)) : "—";
      rowCols.push(bankPct.padStart(8), bP50.padStart(7));
    }
    rowCols.push(nw.padStart(8));

    console.log("  " + rowCols.join("  "));
  }

  console.log();
}

function printLegend(hasAchievements: boolean): void {
  console.log("  Legend:");
  console.log("    Museum%  = % of runs that founded a museum");
  console.log("    P10/P50/P90 = weeks to museum (10th/50th/90th percentile)");
  if (hasAchievements) {
    console.log("    Wing%    = % ending with a Wing (next below Museum)");
    console.log("    Gall%    = % ending with a Gallery");
    console.log("    Exhb%    = % ending with an Exhibition Hall");
    console.log("    None%    = % ending with no achievement");
  } else {
    console.log("    Bankr%   = % of runs ending in bankruptcy");
    console.log("    Bk P50   = median week of bankruptcy");
  }
  console.log("    NW@52    = median net worth at week 52 (survivors + museum founders)");
  console.log();
}

// ── Main ────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const scenarios = buildScenarios(args);

  // Build tune info string for header
  let tuneInfo: string | undefined;
  if (args.compare) {
    const names = Object.values(TUNE_PRESETS).map((t) => t.name);
    tuneInfo = `Comparing: ${names.join(", ")}`;
  } else if (args.tune !== "current") {
    const tune = TUNE_PRESETS[args.tune];
    tuneInfo = tune ? `Tune: ${tune.name}` : `Tune: ${args.tune}`;
  }

  printHeader(args.runs, args.maxWeeks, args.seed, tuneInfo);

  const nameWidth = Math.max(22, ...scenarios.map((s) => s.name.length + 1));
  const allStats: ScenarioStats[] = [];

  for (const cfg of scenarios) {
    const t0 = Date.now();
    const stats = runScenario(cfg, args.runs, args.seed);
    const elapsed = Date.now() - t0;
    const runsPerSec = Math.round(args.runs / (elapsed / 1000));
    process.stderr.write(
      `  ✓ ${cfg.name.padEnd(nameWidth)} ${elapsed}ms (${runsPerSec.toLocaleString()} runs/s)\n`,
    );
    allStats.push(stats);
  }

  const hasAchievements = allStats.some((s) => s.achievementsEnabled);

  console.log();
  printTable(allStats);
  printLegend(hasAchievements);
}

main();
