import Link from "next/link";
import type { Artwork, EnrichedArtwork, NpcRole } from "@/lib/types";
import { ArtFrame } from "./ArtFrame";

const ROLE_BADGE: Record<NpcRole, { label: string; className: string }> = {
  curator: { label: "Curator", className: "bg-purple-100 text-purple-700" },
  dealer: { label: "Dealer", className: "bg-emerald-100 text-emerald-700" },
  critic: { label: "Critic", className: "bg-rose-100 text-rose-700" },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isEnriched(artwork: Artwork): artwork is EnrichedArtwork {
  return "owner" in artwork;
}

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const owner = isEnriched(artwork) ? artwork.owner : undefined;
  const loan = isEnriched(artwork) ? artwork.loan : undefined;

  const primaryHref = owner
    ? owner.owner_type === "user"
      ? `/u/${owner.slug}`
      : `/institutions/${owner.slug}`
    : `/artworks/${artwork.id}`;

  return (
    <div className="group">
      {/* Primary click area — goes to owner profile (or artwork if unowned) */}
      <Link
        href={primaryHref}
        className="block hover:-translate-y-1 transition-transform duration-200"
      >
        <div className="flex justify-center">
          <ArtFrame src={artwork.image_url} alt={artwork.title} tier={artwork.tier} size="sm" />
        </div>

        {/* Owner chip */}
        {owner && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-dark)] text-white text-[10px] font-bold shrink-0">
              {getInitials(owner.display_name)}
            </span>
            <span className="text-sm font-medium truncate">{owner.display_name}</span>
            {owner.role && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[owner.role].className}`}>
                {ROLE_BADGE[owner.role].label}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Loan line — separate from owner chip, links to borrower */}
      {loan && (
        <div className="px-1 mt-1">
          <Link
            href={`/institutions/${loan.borrower_slug}`}
            className="text-xs text-gray-400 hover:text-[var(--accent-dark)] transition-colors"
          >
            On loan to <span className="font-medium text-gray-500">{loan.borrower_name}</span>
          </Link>
        </div>
      )}

      {/* Artwork info (not wrapped in the primary link) */}
      <div className="pt-3 px-1">
        <h3 className="font-semibold leading-tight">
          {artwork.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {artwork.artist}, {artwork.year}
        </p>
      </div>

      {/* Secondary link to artwork detail (only shown when there's an owner) */}
      {owner && (
        <div className="px-1 mt-2 text-right">
          <Link
            href={`/artworks/${artwork.id}`}
            className="text-xs text-gray-400 hover:text-[var(--accent-dark)] transition-colors"
          >
            View Artwork →
          </Link>
        </div>
      )}
    </div>
  );
}
