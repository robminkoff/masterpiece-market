import { z } from "zod";

// ---------- Shared Zod schemas ----------

export const ArtworkTierSchema = z.enum(["A", "B", "C", "D"]);
export const AuctionTypeSchema = z.enum(["regular", "evening", "private", "forced", "estate"]);
export const AuctionStatusSchema = z.enum(["scheduled", "live", "ended", "settled", "cancelled"]);

export const CreateAuctionSchema = z.object({
  artwork_id: z.string().uuid(),
  auction_type: AuctionTypeSchema.default("regular"),
  starting_bid: z.number().int().min(0).default(0),
  reserve_price: z.number().int().min(0).optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
});

export const PlaceBidSchema = z.object({
  bidder_id: z.string().uuid(),
  amount: z.number().int().positive("Bid must be a positive integer"),
});

export const ArtworkFilterSchema = z.object({
  tier: ArtworkTierSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateAuctionInput = z.infer<typeof CreateAuctionSchema>;
export type PlaceBidInput = z.infer<typeof PlaceBidSchema>;
export type ArtworkFilter = z.infer<typeof ArtworkFilterSchema>;
