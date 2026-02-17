import { NextResponse } from "next/server";
import { SEED_ARTWORKS } from "@/data/seed";

// GET /api/artworks — list all artworks (seed data for v0)
// TODO: Replace with Supabase query; add filtering, pagination
export async function GET() {
  return NextResponse.json({ artworks: SEED_ARTWORKS });
}
