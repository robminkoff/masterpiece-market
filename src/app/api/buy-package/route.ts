import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { buyPackage } from "@/lib/db";
import type { PackageKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_KEYS = new Set<PackageKey>(["bronze", "silver", "gold"]);

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const packageKey = body.package as string;

  if (!packageKey || !VALID_KEYS.has(packageKey as PackageKey)) {
    return NextResponse.json(
      { error: "Invalid package. Must be bronze, silver, or gold." },
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
