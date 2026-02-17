"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Artwork } from "@/lib/types";
import { TIER_CONFIG, weeklyCarryCost } from "@/lib/types";
import { ArtFrame } from "@/components/ArtFrame";

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  const closeLightbox = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.artworks as Artwork[]).find((a) => a.id === id);
        setArtwork(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!artwork) return <p className="text-red-500">Artwork not found.</p>;

  const cfg = TIER_CONFIG[artwork.tier];
  const cost = weeklyCarryCost(artwork.insured_value, artwork.tier, false, 0);
  const costOnLoan = weeklyCarryCost(artwork.insured_value, artwork.tier, true, 0);

  return (
    <div>
      <Link href="/catalog" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Framed artwork — click to open lightbox */}
        <div className="flex items-start justify-center">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm"
          >
            <ArtFrame src={artwork.image_url} alt={artwork.title} tier={artwork.tier} size="lg" />
          </button>
        </div>

        {/* Details */}
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Tier {artwork.tier} — {cfg.label}
          </span>

          <h1 className="text-3xl font-bold mt-3">{artwork.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {artwork.artist}, {artwork.year}
          </p>
          {artwork.medium && (
            <p className="text-sm text-gray-400 mt-1">{artwork.medium}</p>
          )}

          {artwork.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300">{artwork.description}</p>
          )}

          {/* Cost breakdown */}
          <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Ownership Costs</h3>
            <table className="w-full text-sm">
              <tbody>
                <Row label="Insured Value (IV)" value={`${artwork.insured_value.toLocaleString()} cr`} />
                <Row label="Premium Rate" value={`${(cfg.premiumRate * 100).toFixed(2)}% / week`} />
                <Row label="Storage Fee" value={`${cfg.storageFee} cr / week`} />
                <Row label="Weekly Carry Cost" value={`${cost.toLocaleString()} cr`} highlight />
                <Row label="Weekly Cost (on loan)" value={`${costOnLoan.toLocaleString()} cr`} />
              </tbody>
            </table>
          </div>

          {/* Tags */}
          {artwork.tags.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {artwork.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Provenance timeline placeholder */}
          <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Provenance Timeline</h3>
            <p className="text-sm text-gray-400 italic">
              {/* TODO: Fetch and display provenance_events for this artwork */}
              Provenance tracking will appear here once ownership events are recorded.
            </p>
            <div className="mt-3 space-y-2">
              <TimelineEntry date="—" event="Created / entered market" />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightbox && artwork.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={closeLightbox}
        >
          <div className="absolute top-4 right-4 text-white/60 text-sm select-none pointer-events-none">
            Click or press Esc to close
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="max-h-[90vh] max-w-[90vw] object-contain drop-shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? "font-semibold" : ""}>
      <td className="py-1 text-gray-500 dark:text-gray-400">{label}</td>
      <td className="py-1 text-right">{value}</td>
    </tr>
  );
}

function TimelineEntry({ date, event }: { date: string; event: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 whitespace-nowrap">{date}</span>
      <span>{event}</span>
    </div>
  );
}
