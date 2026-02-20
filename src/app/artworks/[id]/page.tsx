"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { EnrichedArtwork, ProvenanceEvent, NpcRole, Ownership } from "@/lib/types";
import { TIER_CONFIG, weeklyCarryCost } from "@/lib/types";
import { ArtFrame } from "@/components/ArtFrame";
import { GalleryNotes } from "@/components/GalleryNotes";
import { SellOptionsPanel } from "@/components/SellOptionsPanel";
import { BuyFromDealerPanel } from "@/components/BuyFromDealerPanel";

const ROLE_BADGE: Record<NpcRole, { label: string; className: string }> = {
  curator: { label: "Curator", className: "bg-purple-100 text-purple-700" },
  dealer: { label: "Dealer", className: "bg-emerald-100 text-emerald-700" },
  critic: { label: "Critic", className: "bg-rose-100 text-rose-700" },
};

function describeEvent(event: ProvenanceEvent): string {
  const meta = event.metadata as Record<string, string>;
  switch (event.event_type) {
    case "purchase":
      return `Purchased${meta.source ? ` via ${meta.source}` : ""}${meta.dealer ? ` via ${meta.dealer}` : ""}${event.price ? ` for ${event.price.toLocaleString()} cr` : ""}`;
    case "loan":
      return `Loaned to ${meta.curator ?? "a curator"}${meta.exhibition ? ` for "${meta.exhibition}"` : ""}`;
    case "exhibition":
      return `Exhibited at "${meta.exhibition ?? "exhibition"}"${meta.museum ? ` (${meta.museum})` : ""}`;
    default:
      return event.event_type;
  }
}

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [artwork, setArtwork] = useState<(EnrichedArtwork & { dealer_price?: number }) | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  // Fetch the authenticated user's ID
  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.id) setCurrentUserId(data.profile.id);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    fetch(`/api/artworks?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setArtwork(data.artwork ?? null);
        setProvenance(data.provenance ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!artwork) return <p className="text-red-500">Artwork not found.</p>;

  const cfg = TIER_CONFIG[artwork.tier];
  const cost = weeklyCarryCost(artwork.insured_value, artwork.tier, false, 0);
  const costOnLoan = weeklyCarryCost(artwork.insured_value, artwork.tier, true, 0);
  const owner = artwork.owner;
  const loan = artwork.loan;
  const isOwnedByUser = !!(currentUserId && owner?.owner_id === currentUserId);
  const isDealerOwned = owner?.role === "dealer";

  // Derive ownership record for SellOptionsPanel from enriched API data
  const ownership: Ownership | undefined = isOwnedByUser && owner
    ? {
        id: `own-derived`,
        artwork_id: artwork.id,
        owner_id: currentUserId!,
        acquired_at: owner.acquired_at,
        acquired_via: "api",
        is_active: true,
        idle_weeks: 0,
        on_loan: !!loan,
      }
    : undefined;

  // Find last purchase price from provenance
  const lastPurchase = provenance.find((e) => e.event_type === "purchase");
  const lastSalePrice = lastPurchase?.price;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block transition-colors"
      >
        ← Back
      </button>

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
          <h1 className="text-3xl font-bold">{artwork.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {artwork.artist}, {artwork.year}
          </p>
          {artwork.medium && (
            <p className="text-sm text-gray-400 mt-1">{artwork.medium}</p>
          )}

          {artwork.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300">{artwork.description}</p>
          )}

          <GalleryNotes notes={artwork.gallery_notes} />

          {/* Ownership panel */}
          <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Current Owner</h3>
            {owner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={owner.owner_type === "user" ? `/u/${owner.slug}` : `/institutions/${owner.slug}`}
                    className="text-lg font-semibold hover:text-[var(--accent-dark)] transition-colors"
                  >
                    {owner.display_name}
                  </Link>
                  {owner.role && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[owner.role].className}`}>
                      {ROLE_BADGE[owner.role].label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Owned since</span>
                    <p>{new Date(owner.acquired_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Last sale price</span>
                    <p>{lastSalePrice ? `${lastSalePrice.toLocaleString()} cr` : "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Unowned — available on the market</p>
            )}
          </div>

          {/* SellOptionsPanel — shown for user-owned artworks */}
          {isOwnedByUser && ownership && (
            <div className="mt-6">
              <SellOptionsPanel artwork={artwork} ownership={ownership} onSold={fetchData} />
            </div>
          )}

          {/* BuyFromDealerPanel — shown for dealer-owned artworks */}
          {isDealerOwned && artwork.dealer_price && owner && (
            <div className="mt-6">
              <BuyFromDealerPanel
                artwork={artwork}
                dealerPrice={artwork.dealer_price}
                dealerName={owner.display_name}
                onBought={fetchData}
              />
            </div>
          )}

          {/* Current Location — shown when artwork is on loan */}
          {loan && (
            <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Location</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  On loan to{" "}
                  <Link
                    href={`/institutions/${loan.borrower_slug}`}
                    className="font-semibold hover:text-[var(--accent-dark)] transition-colors"
                  >
                    {loan.borrower_name}
                  </Link>
                </p>
                {loan.exhibition_title && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Exhibition: &ldquo;{loan.exhibition_title}&rdquo;
                  </p>
                )}
                <Link
                  href={`/institutions/${loan.borrower_slug}`}
                  className="text-xs text-[var(--accent-dark)] hover:underline inline-block mt-1"
                >
                  View Institution →
                </Link>
              </div>
            </div>
          )}

          {/* Cost class + ownership costs */}
          <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            {/* Tier banner — always visible */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Tier {artwork.tier}</span>
                <span className="text-sm text-gray-500">{cfg.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">IV</span>{" "}
                <span className="text-sm font-semibold">{artwork.insured_value.toLocaleString()} cr</span>
              </div>
            </div>
            {/* Detailed cost breakdown — owner only */}
            {isOwnedByUser ? (
              <div className="p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Ownership Costs</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <Row label="Premium Rate" value={`${(cfg.premiumRate * 100).toFixed(2)}% / week`} />
                    <Row label="Storage Fee" value={`${cfg.storageFee} cr / week`} />
                    <Row label="Weekly Carry Cost" value={`${cost.toLocaleString()} cr`} highlight />
                    <Row label="Weekly Cost (on loan)" value={`${costOnLoan.toLocaleString()} cr`} />
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Weekly Carry</span>
                <span className="font-semibold">{cost.toLocaleString()} cr/wk</span>
              </div>
            )}
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

          {/* Provenance timeline */}
          <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Provenance Timeline</h3>
            {provenance.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No provenance events recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {provenance.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="pb-3">
                      <p>{describeEvent(event)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
