import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { getSoloRun, saveSoloRun } from "@/lib/solo-db";
import { buildSoloConfig, generatePackageArtwork, weekRng } from "@/lib/solo-engine";

export const dynamic = "force-dynamic";

// POST /api/solo/buy-package — purchase a mystery package
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { runId } = body;
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const run = await getSoloRun(runId, userId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.outcome) return NextResponse.json({ error: "Run already finished" }, { status: 400 });

  const cfg = buildSoloConfig(run.configKey);

  if (!cfg.surprisePackages.enabled || cfg.surprisePackages.packages.length === 0) {
    return NextResponse.json({ error: "Packages not available" }, { status: 400 });
  }

  // Acquisition cap check
  const acquisitionsThisWeek = run.artworks.filter((a) => a.acquiredWeek === run.week && a.purchaseCost > 0).length;
  if (acquisitionsThisWeek >= cfg.maxAcquisitionsPerWeek) {
    return NextResponse.json({ error: `Max ${cfg.maxAcquisitionsPerWeek} acquisitions per week` }, { status: 400 });
  }

  const pkg = cfg.surprisePackages.packages[0];
  if (run.cash < pkg.cost) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  // Use a unique RNG for package draws (offset by acquisitions count to avoid determinism exploits)
  const rng = weekRng(run.seed, run.week * 1000 + acquisitionsThisWeek + 500);
  const artwork = generatePackageArtwork(cfg, rng, run.week);
  if (!artwork) return NextResponse.json({ error: "Failed to generate package" }, { status: 500 });

  run.cash -= pkg.cost;
  run.artworks.push(artwork);

  await saveSoloRun(run);
  return NextResponse.json({ run, artwork, packageName: pkg.name });
}
