"use client";

import { useEffect, useState } from "react";
import { ArtworkCard } from "@/components/ArtworkCard";
import type { Artwork, ArtworkTier } from "@/lib/types";

const TIERS: (ArtworkTier | "all")[] = ["all", "A", "B", "C", "D"];

export default function CatalogPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filter, setFilter] = useState<ArtworkTier | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => setArtworks(data.artworks))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? artworks : artworks.filter((a) => a.tier === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Catalog</h1>
        <div className="flex gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-sm rounded border ${
                filter === t
                  ? "bg-[var(--accent-dark)] text-white border-[var(--accent-dark)]"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {t === "all" ? "All" : `Tier ${t}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading artworks...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {filtered.map((a) => (
            <ArtworkCard key={a.id} artwork={a} />
          ))}
        </div>
      )}
    </div>
  );
}
