"use client";

import type { LoanOffer, SimArtwork } from "@/lib/solo-engine";

interface Props {
  offers: LoanOffer[];
  artworks: SimArtwork[];
  onAccept: (loanIndex: number) => void;
}

export function SoloLoanOffers({ offers, artworks, onAccept }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Curator Loan Offers</h2>
      <p className="text-xs text-gray-500 mb-3">Curators want to borrow your artworks. You earn a fee and get reduced carry costs.</p>
      <div className="space-y-2">
        {offers.map((offer) => {
          const artwork = artworks[offer.artworkIndex];
          if (!artwork) return null;
          return (
            <div
              key={offer.index}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mr-1.5">
                    {artwork.tier}
                  </span>
                  IV {artwork.iv.toLocaleString()} cr
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {offer.curatorName} &middot; Fee: {offer.fee.toLocaleString()} cr &middot; {offer.duration} weeks
                </p>
              </div>
              <button
                onClick={() => onAccept(offer.index)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:opacity-90 transition-opacity"
              >
                Accept
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
