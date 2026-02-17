"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { SEED_MUSEUMS, SEED_MUSEUM_EXHIBITIONS } from "@/data/seed";
import { MUSEUM_FOUNDING_REQUIREMENTS, MUSEUM_MEMBERSHIP_FEES } from "@/lib/types";
import type { Museum, MuseumExhibition } from "@/lib/types";

// TODO: Fetch from API. Using seed data for v0.

export default function MuseumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const museum: Museum | undefined = SEED_MUSEUMS.find((m) => m.id === id);
  const exhibitions: MuseumExhibition[] = SEED_MUSEUM_EXHIBITIONS.filter((e) => e.museum_id === id);

  if (!museum) {
    return <p className="text-red-500">Museum not found.</p>;
  }

  const minReserve = MUSEUM_FOUNDING_REQUIREMENTS.minEndowmentReserveWeeks;

  return (
    <div>
      <Link href="/museum" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Museums
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{museum.name}</h1>
          <p className="text-gray-500 mt-1">
            Founded {new Date(museum.founded_at).toLocaleDateString()} &middot;{" "}
            <span className="capitalize">{museum.level}</span> Museum
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            museum.status === "active"
              ? "bg-green-100 text-green-800"
              : museum.status === "probation"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {museum.status}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Endowment" value={`${museum.endowment.toLocaleString()} cr`} />
        <StatCard
          label="Min Reserve"
          value={`${minReserve} weeks of carry`}
          subtitle="Must be maintained"
        />
        <StatCard label="Staff Curators" value={`${museum.staff_curator_count} / 3`} />
        <StatCard label="Exhibitions" value={`${exhibitions.length}`} />
      </div>

      {/* Endowment Ledger placeholder */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Endowment Ledger</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 italic">
            {/* TODO: Fetch and display museum_endowment_ledger entries */}
            Endowment transaction history will appear here.
          </p>
        </div>
      </section>

      {/* Exhibitions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Exhibitions</h2>
        {exhibitions.length === 0 ? (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">No exhibitions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exhibitions.map((ex) => (
              <div
                key={ex.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{ex.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      ex.status === "open"
                        ? "bg-green-100 text-green-800"
                        : ex.status === "planned"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
                {ex.theme && <p className="text-sm text-gray-500">{ex.theme}</p>}
                {ex.description && (
                  <p className="text-sm text-gray-400 mt-1">{ex.description}</p>
                )}
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>
                    {new Date(ex.starts_at).toLocaleDateString()} –{" "}
                    {new Date(ex.ends_at).toLocaleDateString()}
                  </span>
                  <span>{ex.visitors} visitors</span>
                  <span>+{ex.prestige_earned} prestige</span>
                </div>
                {/* TODO: List museum_exhibition_loans (artworks in this exhibition) */}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Memberships placeholder */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Memberships</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            {(["visitor", "patron", "benefactor"] as const).map((tier) => (
              <div key={tier} className="text-center">
                <div className="text-sm font-medium capitalize">{tier}</div>
                <div className="text-lg font-bold mt-1">
                  {MUSEUM_MEMBERSHIP_FEES[tier].toLocaleString()} cr
                </div>
                <div className="text-xs text-gray-400">per 4 weeks</div>
                {/* TODO: Join/purchase membership action */}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center italic">
            Membership purchasing will be available once the museum system is fully implemented.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
