import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { canAfford, adjustCredits, repayMortgage } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Mortgage } from "@/lib/types";

// POST /api/mortgage/repay — repay a mortgage
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mortgageId = body?.mortgage_id;
  if (!mortgageId || typeof mortgageId !== "string") {
    return NextResponse.json({ error: "mortgage_id is required" }, { status: 400 });
  }

  // Fetch the mortgage
  const { data: mortgage, error } = await supabaseAdmin
    .from("mortgages")
    .select("*")
    .eq("id", mortgageId)
    .maybeSingle();
  if (error) throw error;
  if (!mortgage) {
    return NextResponse.json({ error: "Mortgage not found" }, { status: 404 });
  }

  const m = mortgage as Mortgage;

  // Guard: belongs to user
  if (m.owner_id !== userId) {
    return NextResponse.json({ error: "Not your mortgage" }, { status: 403 });
  }

  // Guard: is active
  if (m.status !== "active") {
    return NextResponse.json({ error: "Mortgage is not active" }, { status: 400 });
  }

  // Guard: can afford repayment
  const affordable = await canAfford(userId, m.principal);
  if (!affordable) {
    return NextResponse.json({ error: "Cannot afford to repay principal" }, { status: 400 });
  }

  // Deduct principal and mark repaid
  await adjustCredits(userId, -m.principal, `Repaid mortgage ${m.id}`);
  await repayMortgage(m.id);

  return NextResponse.json({ repaid: true, mortgage_id: m.id });
}
