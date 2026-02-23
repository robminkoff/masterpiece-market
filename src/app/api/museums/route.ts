import { NextResponse } from "next/server";
import { getMuseums } from "@/lib/db";

// GET /api/museums — list all museums
export async function GET() {
  const museums = await getMuseums();
  return NextResponse.json({ museums });
}
