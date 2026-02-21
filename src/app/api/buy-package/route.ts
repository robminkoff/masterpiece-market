import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { buyPackage, getWeeklyAcquisitionCount } from "@/lib/db";
import { MAX_ACQUISITIONS_PER_WEEK } from "@/lib/types";
import type { PackageKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_KEYS = new Set<PackageKey>(["mystery"]);

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weeklyCount = await getWeeklyAcquisitionCount(userId);
  if (weeklyCount >= MAX_ACQUISITIONS_PER_WEEK) {
    return NextResponse.json(
      { error: "You may acquire at most 1 artwork per week from dealers and packages. Try again next week." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const packageKey = (body.package as string) || "mystery";

  if (!VALID_KEYS.has(packageKey as PackageKey)) {
    return NextResponse.json(
      { error: "Invalid package." },
      { status: 400 },
    );
  }

  try {
    const result = await buyPackage(userId, packageKey as PackageKey);
    return NextResponse.json({
      artwork: result.artwork,
      tier: result.tier,
      package: result.packageLabel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Purchase failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
