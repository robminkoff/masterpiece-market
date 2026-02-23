"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SoloWeekHeader } from "@/components/solo/SoloWeekHeader";
import { SoloHealthCard } from "@/components/solo/SoloHealthCard";
import { SoloAuctionLots } from "@/components/solo/SoloAuctionLots";
import { SoloLoanOffers } from "@/components/solo/SoloLoanOffers";
import { SoloQuizCard } from "@/components/solo/SoloQuizCard";
import { SoloCollection } from "@/components/solo/SoloCollection";
import { SoloMuseumProgress } from "@/components/solo/SoloMuseumProgress";
import { SoloEndScreen } from "@/components/solo/SoloEndScreen";
import type { SoloRunState, AuctionLot, LoanOffer, SimArtwork, QuizState } from "@/lib/solo-engine";

interface ComputedState {
  weeklyBurn: number;
  runway: number;
  achievement: string | null;
  museumEligible: boolean;
  tierCounts: Record<string, number>;
  config: {
    name: string;
    maxWeeks: number;
    museum: {
      minA: number; minB: number; minC: number; minD: number;
      minTotal: number; minTagDiversity: number; endowmentWeeks: number; minPrestige: number;
    };
    maxAcquisitionsPerWeek: number;
  };
}

export default function SoloPlayPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 py-12 text-center">Loading game...</p>}>
      <SoloPlayContent />
    </Suspense>
  );
}

function SoloPlayContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");

  const [run, setRun] = useState<SoloRunState | null>(null);
  const [computed, setComputed] = useState<ComputedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [lastCarryPaid, setLastCarryPaid] = useState(0);

  const loadRun = useCallback(() => {
    if (!runId) return;
    fetch(`/api/solo/runs/${runId}`)
      .then((r) => r.json())
      .then((data) => {
        setRun(data.run);
        setComputed(data.computed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [runId]);

  useEffect(() => { loadRun(); }, [loadRun]);

  // ── Actions ──────────────────────────────────────────────

  async function handleAdvanceWeek() {
    if (!run) return;
    setAdvancing(true);
    const res = await fetch("/api/solo/advance-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      setLastEvent(data.event);
      setLastCarryPaid(data.carryPaid ?? 0);
      // Reload computed state
      loadRun();
    }
    setAdvancing(false);
  }

  async function handleBuyLot(lotIndex: number) {
    if (!run) return;
    const res = await fetch("/api/solo/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, lotIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleSell(artworkIndex: number) {
    if (!run) return;
    const res = await fetch("/api/solo/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, artworkIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleAcceptLoan(loanIndex: number) {
    if (!run) return;
    const res = await fetch("/api/solo/accept-loan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, loanIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleQuizAnswer(answerIndex: number): Promise<{ correct: boolean; correctIndex: number } | null> {
    if (!run) return null;
    const res = await fetch("/api/solo/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, answerIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      return { correct: data.correct as boolean, correctIndex: data.correctIndex as number };
    } else {
      alert(data.error);
      return null;
    }
  }

  async function handleMortgage(artworkIndex: number) {
    if (!run) return;
    const res = await fetch("/api/solo/mortgage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, artworkIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleRepayMortgage(artworkIndex: number) {
    if (!run) return;
    const res = await fetch("/api/solo/repay-mortgage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id, artworkIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleBuyPackage() {
    if (!run) return;
    const res = await fetch("/api/solo/buy-package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      loadRun();
    } else {
      alert(data.error);
    }
  }

  async function handleFoundMuseum() {
    if (!run) return;
    const res = await fetch("/api/solo/found-museum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: run.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setRun(data.run);
      setLastEvent("museum_founded");
      loadRun();
    } else {
      alert(data.error);
    }
  }

  // ── Render ───────────────────────────────────────────────

  if (loading) return <p className="text-gray-500 py-12 text-center">Loading game...</p>;
  if (!run) return <p className="text-gray-500 py-12 text-center">Run not found.</p>;

  // End screen
  if (run.outcome) {
    return <SoloEndScreen run={run} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <SoloWeekHeader
        week={run.week}
        maxWeeks={computed?.config.maxWeeks ?? 104}
        museumsFounded={run.museumsFounded}
        advancing={advancing}
        onAdvanceWeek={handleAdvanceWeek}
      />

      {lastEvent && lastCarryPaid > 0 && run.week > 0 && (
        <div className={`text-sm rounded-lg px-4 py-2 ${
          lastEvent === "bankruptcy"
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
            : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
        }`}>
          Week {run.week}: Paid {lastCarryPaid.toLocaleString()} cr in carry costs.
          {lastEvent === "museum_founded" && " Museum founded! Collection reset with bonus credits."}
        </div>
      )}

      <SoloHealthCard
        cash={run.cash}
        weeklyBurn={computed?.weeklyBurn ?? 0}
        runway={computed?.runway ?? Infinity}
        artworkCount={run.artworks.length}
        expertise={run.expertise}
        onBuyPackage={handleBuyPackage}
      />

      {run.pendingLots.length > 0 && (
        <SoloAuctionLots
          lots={run.pendingLots as AuctionLot[]}
          cash={run.cash}
          onBuy={handleBuyLot}
        />
      )}

      {run.pendingLoans.length > 0 && (
        <SoloLoanOffers
          offers={run.pendingLoans as LoanOffer[]}
          artworks={run.artworks as SimArtwork[]}
          onAccept={handleAcceptLoan}
        />
      )}

      {run.quiz && !run.quiz.answered && (
        <SoloQuizCard
          quiz={run.quiz as QuizState}
          onAnswer={handleQuizAnswer}
        />
      )}

      <SoloCollection
        artworks={run.artworks as SimArtwork[]}
        cash={run.cash}
        week={run.week}
        onSell={handleSell}
        onMortgage={handleMortgage}
        onRepayMortgage={handleRepayMortgage}
      />

      {computed && (
        <SoloMuseumProgress
          artworks={run.artworks as SimArtwork[]}
          cash={run.cash}
          expertise={run.expertise}
          achievement={computed.achievement}
          museumEligible={computed.museumEligible}
          museumConfig={computed.config.museum}
          onFoundMuseum={handleFoundMuseum}
        />
      )}
    </div>
  );
}
