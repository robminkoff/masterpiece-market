/**
 * Solo-mode database helpers — CRUD for solo_runs table.
 * Uses the admin client (service role) to bypass RLS.
 */

import { supabaseAdmin } from "./supabase-admin";
import type { SoloRunState, SimArtwork, AuctionLot, LoanOffer, QuizState } from "./solo-engine";

interface SoloRunRow {
  id: string;
  user_id: string;
  seed: number;
  config_key: string;
  week: number;
  cash: number;
  expertise: number;
  artworks: SimArtwork[];
  pending_loans: LoanOffer[];
  pending_lots: AuctionLot[];
  quiz: QuizState | null;
  outcome: string | null;
  achievement: string | null;
  museums_founded: number;
  total_carry_paid: number;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

function rowToState(row: SoloRunRow): SoloRunState {
  return {
    id: row.id,
    userId: row.user_id,
    seed: row.seed,
    configKey: row.config_key,
    week: row.week,
    cash: Number(row.cash),
    expertise: row.expertise,
    artworks: row.artworks ?? [],
    pendingLoans: row.pending_loans ?? [],
    pendingLots: row.pending_lots ?? [],
    quiz: row.quiz,
    outcome: row.outcome,
    achievement: row.achievement,
    museumsFounded: row.museums_founded,
    totalCarryPaid: Number(row.total_carry_paid),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    acquisitionsThisWeek: 0, // re-derived client-side or from lots purchased
  };
}

export async function getSoloRun(runId: string, userId: string): Promise<SoloRunState | null> {
  const { data, error } = await supabaseAdmin
    .from("solo_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToState(data as SoloRunRow);
}

export async function listSoloRuns(userId: string): Promise<SoloRunState[]> {
  const { data, error } = await supabaseAdmin
    .from("solo_runs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as SoloRunRow[]).map(rowToState);
}

export async function getActiveRun(userId: string): Promise<SoloRunState | null> {
  const { data, error } = await supabaseAdmin
    .from("solo_runs")
    .select("*")
    .eq("user_id", userId)
    .is("outcome", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return rowToState(data as SoloRunRow);
}

export async function createSoloRun(params: {
  id: string;
  userId: string;
  seed: number;
  configKey: string;
  cash: number;
  artworks: SimArtwork[];
}): Promise<SoloRunState> {
  const { data, error } = await supabaseAdmin
    .from("solo_runs")
    .insert({
      id: params.id,
      user_id: params.userId,
      seed: params.seed,
      config_key: params.configKey,
      cash: params.cash,
      artworks: params.artworks,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create solo run: ${error.message}`);
  return rowToState(data as SoloRunRow);
}

export async function saveSoloRun(state: SoloRunState): Promise<void> {
  const { error } = await supabaseAdmin
    .from("solo_runs")
    .update({
      week: state.week,
      cash: state.cash,
      expertise: state.expertise,
      artworks: state.artworks,
      pending_loans: state.pendingLoans,
      pending_lots: state.pendingLots,
      quiz: state.quiz,
      outcome: state.outcome,
      achievement: state.achievement,
      museums_founded: state.museumsFounded,
      total_carry_paid: state.totalCarryPaid,
      finished_at: state.finishedAt,
    })
    .eq("id", state.id);

  if (error) throw new Error(`Failed to save solo run: ${error.message}`);
}
