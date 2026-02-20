import { create } from "zustand";
import type { Artwork, Auction, Profile } from "./types";

interface AppState {
  // Current user
  user: Profile | null;
  setUser: (u: Profile) => void;

  // Catalog
  artworks: Artwork[];
  setArtworks: (a: Artwork[]) => void;

  // Auctions
  auctions: Auction[];
  setAuctions: (a: Auction[]) => void;

  // Live auction
  liveAuctionId: string | null;
  currentBid: number;
  currentBidder: string | null;
  bidHistory: { bidder: string; amount: number; time: string }[];
  setLiveAuction: (id: string, bid: number, bidder: string | null) => void;
  addBid: (bidder: string, amount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  artworks: [],
  setArtworks: (artworks) => set({ artworks }),

  auctions: [],
  setAuctions: (auctions) => set({ auctions }),

  liveAuctionId: null,
  currentBid: 0,
  currentBidder: null,
  bidHistory: [],
  setLiveAuction: (id, bid, bidder) =>
    set({ liveAuctionId: id, currentBid: bid, currentBidder: bidder, bidHistory: [] }),
  addBid: (bidder, amount) =>
    set((s) => ({
      currentBid: amount,
      currentBidder: bidder,
      bidHistory: [{ bidder, amount, time: new Date().toISOString() }, ...s.bidHistory],
    })),
}));
