// Shared mutable in-memory state for v0.
// Seed data is copied here at module load so mutations (sales, new auctions)
// are visible across all API routes within a single server process.
// State is persisted to `.data/game-state.json` so it survives restarts.

import fs from "fs";
import path from "path";
import type { Auction, ArtworkTier, Ownership, ProvenanceEvent } from "@/lib/types";
import { STARTING_CREDITS, weeklyCarryCost } from "@/lib/types";
import {
  SEED_ARTWORKS,
  SEED_OWNERSHIPS,
  SEED_PROVENANCE_EVENTS,
  SEED_AUCTIONS,
} from "@/data/seed";
import { STUB_USER_ID } from "@/lib/supabase";

// ---------- Player profile ----------

export interface PlayerProfile {
  username: string;
  display_name: string;
  created_at: string;
}

// ---------- Credit event type ----------

export interface CreditEvent {
  id: string;
  delta: number;
  reason: string;
  balance: number;
  created_at: string;
}

// ---------- Mutable state ----------

export let ownerships: Ownership[] = SEED_OWNERSHIPS.filter((o) => o.owner_id !== STUB_USER_ID);
export let provenanceEvents: ProvenanceEvent[] = SEED_PROVENANCE_EVENTS.filter(
  (e) => e.to_owner !== STUB_USER_ID && e.from_owner !== STUB_USER_ID,
);
export let auctions: Auction[] = [...SEED_AUCTIONS];
export let auctionSubmissions: string[] = [];
export let playerCredits: number = STARTING_CREDITS;
export let lastBurnAt: string = new Date().toISOString();
export let creditLog: CreditEvent[] = [];
export let playerProfile: PlayerProfile | null = null;

// ---------- Credit helpers ----------

export function getCredits(): number {
  return playerCredits;
}

export function canAfford(amount: number): boolean {
  return playerCredits >= amount;
}

export function adjustCredits(delta: number, reason: string): number {
  playerCredits += delta;
  const event: CreditEvent = {
    id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    delta,
    reason,
    balance: playerCredits,
    created_at: new Date().toISOString(),
  };
  creditLog.push(event);
  return playerCredits;
}

// ---------- Profile helpers ----------

export function getPlayerProfile(): PlayerProfile | null {
  return playerProfile;
}

export function setPlayerProfile(username: string, displayName: string): PlayerProfile {
  playerProfile = {
    username,
    display_name: displayName,
    created_at: playerProfile?.created_at ?? new Date().toISOString(),
  };
  persistState();
  return playerProfile;
}

export function isAccountCreated(): boolean {
  return playerProfile !== null;
}

// ---------- Burn tick ----------

export function applyBurnTick(): { weeksElapsed: number; totalBurned: number } {
  const lastBurn = new Date(lastBurnAt).getTime();
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((now - lastBurn) / msPerWeek);

  if (weeksElapsed <= 0) {
    return { weeksElapsed: 0, totalBurned: 0 };
  }

  // Calculate weekly carry for all player-owned artworks
  const playerOwned = ownerships.filter(
    (o) => o.owner_id === STUB_USER_ID && o.is_active,
  );

  const weeklyTotal = playerOwned.reduce((sum, o) => {
    const art = SEED_ARTWORKS.find((a) => a.id === o.artwork_id);
    if (!art) return sum;
    return sum + weeklyCarryCost(art.insured_value, art.tier as ArtworkTier, o.on_loan, o.idle_weeks);
  }, 0);

  const totalBurned = weeksElapsed * weeklyTotal;

  // Deduct and log each week
  for (let i = 0; i < weeksElapsed; i++) {
    adjustCredits(-weeklyTotal, `Weekly carry cost (week ${i + 1} of ${weeksElapsed})`);
  }

  // Advance lastBurnAt by the elapsed weeks
  lastBurnAt = new Date(lastBurn + weeksElapsed * msPerWeek).toISOString();

  return { weeksElapsed, totalBurned };
}

// ---------- Persistence ----------

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "game-state.json");

interface PersistedState {
  ownerships: Ownership[];
  provenanceEvents: ProvenanceEvent[];
  auctions: Auction[];
  auctionSubmissions: string[];
  playerCredits: number;
  lastBurnAt: string;
  creditLog: CreditEvent[];
  playerProfile: PlayerProfile | null;
}

export function persistState(): void {
  const state: PersistedState = {
    ownerships,
    provenanceEvents,
    auctions,
    auctionSubmissions,
    playerCredits,
    lastBurnAt,
    creditLog,
    playerProfile,
  };
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadPersistedState(): void {
  if (!fs.existsSync(STATE_FILE)) return;
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const state: PersistedState = JSON.parse(raw);
    ownerships = state.ownerships;
    provenanceEvents = state.provenanceEvents;
    auctions = state.auctions;
    auctionSubmissions = state.auctionSubmissions;
    playerCredits = state.playerCredits;
    lastBurnAt = state.lastBurnAt;
    creditLog = state.creditLog;
    playerProfile = state.playerProfile ?? null;
  } catch {
    // Corrupted file — fall through to seed defaults
  }
}

export function resetGame(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
  ownerships = SEED_OWNERSHIPS.filter((o) => o.owner_id !== STUB_USER_ID);
  provenanceEvents = SEED_PROVENANCE_EVENTS.filter(
    (e) => e.to_owner !== STUB_USER_ID && e.from_owner !== STUB_USER_ID,
  );
  auctions = [...SEED_AUCTIONS];
  auctionSubmissions = [];
  playerCredits = STARTING_CREDITS;
  lastBurnAt = new Date().toISOString();
  creditLog = [];
  playerProfile = null;
}

// ---------- Init: load persisted state if available ----------
loadPersistedState();
