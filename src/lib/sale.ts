// Shared sale execution logic used by listing buy and offer accept routes.

import { ownerships, provenanceEvents, persistState } from "@/data/store";
import type { Ownership, ProvenanceEvent } from "@/lib/types";
import { dealerCommissionAmount, sellerNetProceeds } from "@/lib/types";

interface SaleParams {
  artworkId: string;
  buyerId: string;
  sellerId: string;
  salePrice: number;
  commissionRate: number;
  dealerName: string;
  via: string; // e.g. "dealer_listing" or "dealer_offer"
}

interface SaleResult {
  commission: number;
  netProceeds: number;
  newOwnership: Ownership;
  provenanceEvent: ProvenanceEvent;
}

export function executeSale(params: SaleParams): SaleResult {
  const { artworkId, buyerId, sellerId, salePrice, commissionRate, dealerName, via } = params;

  const commission = dealerCommissionAmount(salePrice, commissionRate);
  const net = sellerNetProceeds(salePrice, commissionRate);

  // Deactivate current ownership
  const current = ownerships.find((o) => o.artwork_id === artworkId && o.is_active);
  if (current) {
    current.is_active = false;
  }

  // Create new ownership
  const newOwnership: Ownership = {
    id: `own-${Date.now()}`,
    artwork_id: artworkId,
    owner_id: buyerId,
    acquired_at: new Date().toISOString(),
    acquired_via: via,
    is_active: true,
    idle_weeks: 0,
    on_loan: false,
  };
  ownerships.push(newOwnership);

  // Record provenance
  const event: ProvenanceEvent = {
    id: `prov-${Date.now()}`,
    artwork_id: artworkId,
    event_type: "purchase",
    from_owner: sellerId,
    to_owner: buyerId,
    price: salePrice,
    metadata: { dealer: dealerName, commission, net_proceeds: net, via },
    created_at: new Date().toISOString(),
  };
  provenanceEvents.push(event);

  persistState();

  return { commission, netProceeds: net, newOwnership, provenanceEvent: event };
}
