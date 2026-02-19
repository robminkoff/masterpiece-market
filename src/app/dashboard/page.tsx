"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { STUB_USER_ID } from "@/lib/supabase";
import { weeklyCarryCost, IDLE_WEEKS_THRESHOLD, LOAN_PREMIUM_REDUCTION, DEALER_BUY_RATE } from "@/lib/types";
import type { EnrichedArtwork, ArtworkTier, Ownership } from "@/lib/types";
import { ArtFrame } from "@/components/ArtFrame";

// ---------- Health thresholds ----------

const SAFE_WEEKS = 8;
const TIGHT_WEEKS = 3;

type HealthStatus = "safe" | "tight" | "at_risk";

function getHealth(runwayWeeks: number): HealthStatus {
  if (runwayWeeks >= SAFE_WEEKS) return "safe";
  if (runwayWeeks >= TIGHT_WEEKS) return "tight";
  return "at_risk";
}

const HEALTH_STYLE: Record<HealthStatus, { label: string; bg: string; text: string; bar: string; dot: string; border: string }> = {
  safe:    { label: "SAFE",    bg: "bg-green-50 dark:bg-green-950/30",    text: "text-green-700 dark:text-green-400",    bar: "bg-green-500",  dot: "bg-green-500",  border: "border-green-200 dark:border-green-900" },
  tight:   { label: "TIGHT",   bg: "bg-yellow-50 dark:bg-yellow-950/30",  text: "text-yellow-700 dark:text-yellow-400",  bar: "bg-yellow-500", dot: "bg-yellow-500", border: "border-yellow-200 dark:border-yellow-900" },
  at_risk: { label: "AT RISK", bg: "bg-red-50 dark:bg-red-950/30",       text: "text-red-700 dark:text-red-400",       bar: "bg-red-500",    dot: "bg-red-500",    border: "border-red-200 dark:border-red-900" },
};

// ---------- Types ----------

interface OwnedRow {
  artworkId: string;
  title: string;
  artist: string;
  tier: string;
  iv: number;
  imageUrl: string | null;
  weeklyCost: number;
  weeklyCostIfLoaned: number;
  idleWeeks: number;
  onLoan: boolean;
  acquiredAt: string;
}

interface FeedItem {
  id: string;
  label: string;
  detail: string;
  date: string;
  amount?: number;
}

export default function DashboardPage() {
  const [rows, setRows] = useState<OwnedRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/artworks").then((r) => r.json()),
      fetch("/api/credits").then((r) => r.json()),
    ]).then(([artData, creditData]) => {
      setCredits(creditData.credits ?? 0);

      const artworks = (artData.artworks ?? []) as (EnrichedArtwork & { ownership?: Ownership })[];

      // Build owned rows from artworks enriched with owner info
      const owned: OwnedRow[] = artworks
        .filter((a) => a.owner?.owner_id === STUB_USER_ID)
        .map((art) => {
          const iv = art.insured_value;
          const tier = art.tier as ArtworkTier;
          // Find ownership data from the enriched artwork's owner info
          const onLoan = art.loan != null;
          const idleWeeks = 0; // idle_weeks not in enriched response; carry uses 0 as default
          return {
            artworkId: art.id,
            title: art.title,
            artist: art.artist,
            tier,
            iv,
            imageUrl: art.image_url ?? null,
            weeklyCost: weeklyCarryCost(iv, tier, onLoan, idleWeeks),
            weeklyCostIfLoaned: weeklyCarryCost(iv, tier, true, 0),
            idleWeeks,
            onLoan,
            acquiredAt: art.owner?.acquired_at ?? "",
          };
        });

      // Actionable items first (highest carry), on-loan items last
      owned.sort((a, b) => {
        if (a.onLoan !== b.onLoan) return a.onLoan ? 1 : -1;
        return b.weeklyCost - a.weeklyCost;
      });
      setRows(owned);

      // Activity feed: fetch provenance for user-owned artworks
      const feedItems: FeedItem[] = [];
      // We'll use a simple fetch for provenance events
      const userArtIds = owned.map((r) => r.artworkId);
      const provenancePromises = userArtIds.map((id) =>
        fetch(`/api/artworks?id=${id}`).then((r) => r.json()),
      );

      Promise.all(provenancePromises).then((results) => {
        for (const data of results) {
          const provenance = (data.provenance ?? []) as import("@/lib/types").ProvenanceEvent[];
          const artName = data.artwork?.title ?? "";
          for (const e of provenance) {
            if (e.to_owner !== STUB_USER_ID && e.from_owner !== STUB_USER_ID) continue;
            const meta = e.metadata as Record<string, string>;
            if (e.event_type === "purchase") {
              const isBuy = e.to_owner === STUB_USER_ID;
              feedItems.push({
                id: e.id,
                label: isBuy ? "Acquired" : "Sold",
                detail: `${artName}${meta.source ? ` via ${meta.source}` : ""}${meta.dealer ? ` via ${meta.dealer}` : ""}`,
                date: e.created_at,
                amount: e.price ?? undefined,
              });
            } else if (e.event_type === "loan") {
              feedItems.push({
                id: e.id,
                label: "Loaned",
                detail: `${artName} to ${meta.curator ?? "curator"}${meta.exhibition ? ` for "${meta.exhibition}"` : ""}`,
                date: e.created_at,
              });
            } else {
              feedItems.push({ id: e.id, label: e.event_type, detail: artName, date: e.created_at });
            }
          }
        }
        feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFeed(feedItems.slice(0, 8));
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ---------- Computed stats ----------
  const cash = credits;
  const collectionIV = rows.reduce((s, r) => s + r.iv, 0);
  const weeklyBurn = rows.reduce((s, r) => s + r.weeklyCost, 0);
  const runway = weeklyBurn > 0 ? cash / weeklyBurn : Infinity;
  const runwayWeeks = Math.floor(runway * 10) / 10;
  const health = loading ? "safe" : getHealth(runway);
  const hs = HEALTH_STYLE[health];
  const barPct = Math.min(100, (runway / 12) * 100);

  // ---------- Best action recommendation ----------
  const bestToSell = rows.find((r) => !r.onLoan);
  const bestToLoan = rows.find((r) => !r.onLoan);
  const loanSavings = bestToLoan ? bestToLoan.weeklyCost - bestToLoan.weeklyCostIfLoaned : 0;

  // ---------- Top-up handler ----------
  async function handleTopUp(amount: number) {
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      const data = await res.json();
      setCredits(data.credits);
    }
    setShowCreditModal(false);
  }

  if (loading) return <p className="text-gray-500 py-12 text-center">Loading dashboard...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ========== HERO HEALTH CARD ========== */}
      <div className={`rounded-xl p-6 ${hs.bg} border ${hs.border}`}>
        {/* Status + CTAs row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${hs.dot}`} />
            <span className={`text-sm font-bold tracking-wider ${hs.text}`}>{hs.label}</span>
          </div>
          {health !== "safe" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreditModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity"
              >
                Add Credits
              </button>
              <button
                type="button"
                onClick={() => setShowSellModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Sell an Artwork
              </button>
            </div>
          )}
        </div>

        {/* Three stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Cash</div>
            <div className="text-2xl font-bold">{cash.toLocaleString()} cr</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Collection</div>
            <div className="text-2xl font-bold">{collectionIV.toLocaleString()} cr</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Weekly Burn</div>
            <div className={`text-2xl font-bold ${hs.text}`}>{weeklyBurn.toLocaleString()} cr</div>
          </div>
        </div>

        {/* Runway bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500">Runway</span>
            <span className="font-semibold">
              {runway === Infinity ? "No burn" : `${runwayWeeks} weeks`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className={`h-full rounded-full ${hs.bar} transition-all`} style={{ width: `${barPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0</span>
            <span>12+ wk</span>
          </div>
        </div>
      </div>

      {/* ========== RECOMMENDED ACTION ========== */}
      {health !== "safe" && bestToSell && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Recommended</p>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Sell <span className="font-bold">{bestToSell.title}</span> to a dealer
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Cuts burn by {bestToSell.weeklyCost.toLocaleString()} cr/wk
                {" · "}instant {Math.round(bestToSell.iv * DEALER_BUY_RATE).toLocaleString()} cr
              </p>
            </div>
            <Link
              href={`/artworks/${bestToSell.artworkId}`}
              className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity"
            >
              Sell Now
            </Link>
          </div>
          {bestToLoan && !bestToLoan.onLoan && loanSavings > 0 && bestToLoan.artworkId !== bestToSell.artworkId && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Or loan <span className="font-medium text-gray-700 dark:text-gray-200">{bestToLoan.title}</span> to a curator
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Reduces burn by {loanSavings.toLocaleString()} cr/wk ({Math.round(LOAN_PREMIUM_REDUCTION * 100)}% premium reduction + earns a fee)
                </p>
              </div>
              <Link
                href={`/artworks/${bestToLoan.artworkId}`}
                className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Loan
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ========== COLLECTION (liability-first) ========== */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Your Collection</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4">No artworks owned.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
                <tr>
                  <th className="text-left p-3 font-medium">Artwork</th>
                  <th className="text-right p-3 font-medium">Weekly Carry</th>
                  <th className="text-right p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.artworkId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-3">
                      <Link href={`/artworks/${r.artworkId}`} className="font-medium hover:text-[var(--accent-dark)] transition-colors">
                        {r.title}
                      </Link>
                      <p className="text-xs text-gray-400">{r.artist}</p>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold">{r.weeklyCost.toLocaleString()} cr</span>
                      <p className="text-[10px] text-gray-400">IV {r.iv.toLocaleString()}</p>
                    </td>
                    <td className="p-3 text-right">
                      {r.onLoan && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">On Loan</span>
                      )}
                      {!r.onLoan && r.idleWeeks >= IDLE_WEEKS_THRESHOLD && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">Idle {r.idleWeeks}/{IDLE_WEEKS_THRESHOLD}</span>
                      )}
                      {!r.onLoan && r.idleWeeks >= 6 && r.idleWeeks < IDLE_WEEKS_THRESHOLD && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Idle {r.idleWeeks}/{IDLE_WEEKS_THRESHOLD}</span>
                      )}
                      {!r.onLoan && r.idleWeeks < 6 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Held</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!r.onLoan && (
                        <div className="flex gap-1 justify-end">
                          <Link
                            href={`/artworks/${r.artworkId}`}
                            className="text-[10px] font-semibold px-2 py-1 rounded bg-[var(--accent-dark)] text-white hover:opacity-90 transition-opacity"
                          >
                            Sell
                          </Link>
                          <Link
                            href={`/artworks/${r.artworkId}`}
                            className="text-[10px] font-semibold px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            Loan
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========== ACTIVITY FEED ========== */}
      <section className="mt-8 mb-12">
        <h2 className="text-lg font-semibold mb-3">Activity</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4">No activity yet.</p>
        ) : (
          <div className="space-y-0">
            {feed.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</span>
                    {item.amount != null && (
                      <span className="text-xs font-semibold">{item.amount.toLocaleString()} cr</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 mt-1">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========== ADD CREDITS MODAL ========== */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreditModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Add Credits</h3>
            <p className="text-sm text-gray-500 mb-4">
              Purchase credits to extend your runway and keep your collection safe.
            </p>
            <div className="space-y-2">
              {[
                { amount: 10_000, label: "10,000 cr", price: "$10" },
                { amount: 25_000, label: "25,000 cr", price: "$20" },
                { amount: 50_000, label: "50,000 cr", price: "$30" },
              ].map((opt) => (
                <button
                  key={opt.amount}
                  type="button"
                  onClick={() => handleTopUp(opt.amount)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[var(--accent-dark)] hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{opt.label}</span>
                    <span className="font-semibold text-[var(--accent-dark)]">{opt.price}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    +{weeklyBurn > 0 ? `${Math.floor(opt.amount / weeklyBurn * 10) / 10} weeks runway` : "runway"}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowCreditModal(false)}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========== SELL AN ARTWORK MODAL ========== */}
      {showSellModal && (() => {
        const sellable = rows
          .filter((r) => !r.onLoan)
          .sort((a, b) => b.iv - a.iv);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSellModal(false)}>
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-8 max-w-5xl w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Sell an Artwork</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Choose a work to sell. Highest value first.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2"
                >
                  ×
                </button>
              </div>
              {sellable.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-8 text-center">All artworks are on loan.</p>
              ) : (
                <div className={`grid gap-4 ${sellable.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : sellable.length === 2 ? "grid-cols-2" : sellable.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
                  {sellable.map((r) => (
                      <Link
                        key={r.artworkId}
                        href={`/artworks/${r.artworkId}`}
                        onClick={() => setShowSellModal(false)}
                        className="group/card flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[var(--accent-dark)] hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors overflow-hidden"
                      >
                        <div className="flex justify-center p-4 pb-2">
                          <ArtFrame src={r.imageUrl} alt={r.title} tier={r.tier as ArtworkTier} size="sm" />
                        </div>
                        <div className="px-4 pb-4 flex flex-col flex-1">
                          <p className="font-semibold text-sm leading-tight">{r.title}</p>
                          <p className="text-xs text-gray-400 mb-2">{r.artist}</p>
                          <p className="mt-auto text-2xl font-bold text-[var(--accent-dark)] leading-tight">
                            ~{Math.round(r.iv * DEALER_BUY_RATE).toLocaleString()} cr
                          </p>
                          <p className="text-[10px] text-gray-400">instant dealer price</p>
                        </div>
                      </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
