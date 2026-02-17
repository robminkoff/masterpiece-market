import Link from "next/link";
import type { Artwork } from "@/lib/types";
import { TIER_CONFIG, weeklyCarryCost } from "@/lib/types";
import { ArtFrame } from "./ArtFrame";

const TIER_COLORS: Record<string, string> = {
  A: "bg-amber-100 text-amber-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-green-100 text-green-800",
  D: "bg-gray-100 text-gray-800",
};

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const cost = weeklyCarryCost(artwork.insured_value, artwork.tier, false, 0);
  const cfg = TIER_CONFIG[artwork.tier];

  return (
    <Link
      href={`/artworks/${artwork.id}`}
      className="group block hover:-translate-y-1 transition-transform duration-200"
    >
      <div className="flex justify-center">
        <ArtFrame src={artwork.image_url} alt={artwork.title} tier={artwork.tier} size="sm" />
      </div>

      <div className="pt-3 px-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TIER_COLORS[artwork.tier]}`}>
            Tier {artwork.tier}
          </span>
          <span className="text-xs text-gray-400">{cfg.label}</span>
        </div>
        <h3 className="font-semibold mt-1 leading-tight group-hover:text-[var(--accent-dark)] transition-colors">
          {artwork.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {artwork.artist}, {artwork.year}
        </p>
        <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>IV: {artwork.insured_value.toLocaleString()} cr</span>
          <span>{cost.toLocaleString()} cr/wk</span>
        </div>
      </div>
    </Link>
  );
}
