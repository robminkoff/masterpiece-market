"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Artwork, Npc } from "@/lib/types";

export function NpcModules({ npc, activeTab }: { npc: Npc; activeTab: string }) {
  const data = npc.npc_data as Record<string, unknown>;

  if (npc.role === "curator") {
    if (activeTab === "Exhibitions") return <CuratorExhibitions data={data} />;
    if (activeTab === "Loan Terms") return <CuratorLoanTerms data={data} npcTier={npc.npc_tier} />;
  }

  if (npc.role === "dealer") {
    if (activeTab === "Services") return <DealerServices data={data} />;
    if (activeTab === "Consignment Terms") return <DealerConsignment data={data} />;
    if (activeTab === "Inventory") return <DealerInventory dealerId={npc.id} />;
  }

  if (npc.role === "critic") {
    if (activeTab === "Reviews") return <CriticReviews data={data} />;
  }

  return null;
}

// --- Curator modules ---

function CuratorExhibitions({ data }: { data: Record<string, unknown> }) {
  const exhibitions = (data.exhibitions ?? []) as { title: string; status: string; visitors: number }[];

  if (exhibitions.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No exhibitions on record.</p>;
  }

  return (
    <div className="space-y-3">
      {exhibitions.map((ex) => (
        <div key={ex.title} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{ex.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              ex.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}>
              {ex.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{ex.visitors} visitors</p>
        </div>
      ))}
    </div>
  );
}

function CuratorLoanTerms({ data, npcTier }: { data: Record<string, unknown>; npcTier: string }) {
  const loanFees = data.loan_fees as { base_rate: number } | undefined;
  const rate = loanFees?.base_rate ?? 0;

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h4 className="font-semibold mb-2">Loan Fee Schedule</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-gray-500">Curator Tier</td>
            <td className="py-1 text-right capitalize">{npcTier}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-500">Base Rate</td>
            <td className="py-1 text-right">{(rate * 100).toFixed(2)}% of IV</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// --- Dealer modules ---

function DealerServices({ data }: { data: Record<string, unknown> }) {
  const services = (data.services ?? []) as string[];

  if (services.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No services listed.</p>;
  }

  return (
    <ul className="space-y-2">
      {services.map((s) => (
        <li key={s} className="flex items-center gap-2 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          {s}
        </li>
      ))}
    </ul>
  );
}

function DealerConsignment({ data }: { data: Record<string, unknown> }) {
  const terms = data.consignment_terms as { commission_rate: number; min_iv: number } | undefined;

  if (!terms) {
    return <p className="text-sm text-gray-400 italic py-4">No consignment terms available.</p>;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <h4 className="font-semibold mb-2">Consignment Terms</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-gray-500">Commission Rate</td>
            <td className="py-1 text-right">{(terms.commission_rate * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-500">Minimum IV</td>
            <td className="py-1 text-right">{terms.min_iv.toLocaleString()} cr</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// --- Dealer inventory module ---

interface InventoryItem {
  artwork: Artwork;
  dealer_name: string;
  dealer_slug: string;
  asking_price: number;
}

function DealerInventory({ dealerId }: { dealerId: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dealer-inventory?dealer_id=${dealerId}`)
      .then((r) => r.json())
      .then((data) => setItems(data.inventory ?? []))
      .finally(() => setLoading(false));
  }, [dealerId]);

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading inventory...</p>;
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No inventory.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.artwork.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/artworks/${item.artwork.id}`}
              className="font-semibold text-sm hover:text-[var(--accent-dark)] transition-colors"
            >
              {item.artwork.title}
            </Link>
            <span className="text-sm font-bold text-[var(--accent-dark)]">
              {item.asking_price.toLocaleString()} cr
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {item.artwork.artist} · Tier {item.artwork.tier}
          </p>
        </div>
      ))}
    </div>
  );
}

// --- Critic module ---

function CriticReviews({ data }: { data: Record<string, unknown> }) {
  const posts = (data.posts ?? []) as { title: string; date: string; body: string }[];

  if (posts.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No reviews published.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article key={post.title} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h4 className="font-semibold">{post.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(post.date).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{post.body}</p>
        </article>
      ))}
    </div>
  );
}
