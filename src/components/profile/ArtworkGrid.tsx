import type { Artwork } from "@/lib/types";
import { ArtworkCard } from "@/components/ArtworkCard";

export function ArtworkGrid({
  artworks,
  emptyMessage = "No artworks in this collection yet.",
}: {
  artworks: Artwork[];
  emptyMessage?: string;
}) {
  if (artworks.length === 0) {
    return <p className="text-sm text-gray-400 italic py-6">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} linkTo="artwork" />
      ))}
    </div>
  );
}
