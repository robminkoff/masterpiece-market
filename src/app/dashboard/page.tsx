"use client";

import Link from "next/link";
import { STUB_USER } from "@/lib/supabase";
import { TIER_CONFIG, MUSEUM_FOUNDING_REQUIREMENTS, weeklyCarryCost } from "@/lib/types";
import { SEED_MUSEUMS } from "@/data/seed";

// TODO: Fetch real data from API. For v0, show stubbed dashboard.

const MOCK_OWNED = [
  { title: "Nighthawks", tier: "C" as const, iv: 75_000, idleWeeks: 2, onLoan: false },
  { title: "Composition VIII (Lithograph)", tier: "D" as const, iv: 5_000, idleWeeks: 0, onLoan: true },
];

export default function DashboardPage() {
  const user = STUB_USER;
  const totalWeekly = MOCK_OWNED.reduce(
    (sum, a) => sum + weeklyCarryCost(a.iv, a.tier, a.onLoan, a.idleWeeks),
    0,
  );
  const weeksUntilBroke = Math.floor(user.credits / totalWeekly);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Credits Available" value={`${user.credits.toLocaleString()} cr`} />
        <StatCard label="Next Weekly Bill" value={`${totalWeekly.toLocaleString()} cr`} accent />
        <StatCard label="Weeks of Runway" value={`${weeksUntilBroke} weeks`} />
        <StatCard label="Tier" value={user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} />
      </div>

      {/* Collection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Collection</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium">Artwork</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-right p-3 font-medium">IV</th>
                <th className="text-right p-3 font-medium">Weekly Cost</th>
                <th className="text-center p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_OWNED.map((a) => {
                const cost = weeklyCarryCost(a.iv, a.tier, a.onLoan, a.idleWeeks);
                return (
                  <tr key={a.title} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-3 font-medium">{a.title}</td>
                    <td className="p-3">
                      {a.tier} — {TIER_CONFIG[a.tier].label}
                    </td>
                    <td className="p-3 text-right">{a.iv.toLocaleString()} cr</td>
                    <td className="p-3 text-right">{cost.toLocaleString()} cr</td>
                    <td className="p-3 text-center">
                      {a.onLoan ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">On Loan</span>
                      ) : a.idleWeeks >= 6 ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Idle ({a.idleWeeks}wks)
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Museum Progress */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Museum Progress</h2>
        {(() => {
          const myMuseum = SEED_MUSEUMS.find((m) => m.owner_id === user.id && m.status !== "dissolved");
          if (myMuseum) {
            return (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{myMuseum.name}</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    {myMuseum.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Endowment: {myMuseum.endowment.toLocaleString()} cr</span>
                  <span>Level: {myMuseum.level}</span>
                  <span>Staff: {myMuseum.staff_curator_count}/3</span>
                </div>
                <Link
                  href={`/museum/${myMuseum.id}`}
                  className="text-sm text-[var(--accent-dark)] mt-2 inline-block hover:underline"
                >
                  Manage Museum →
                </Link>
              </div>
            );
          }

          // Show founding requirements progress
          const reqs = MUSEUM_FOUNDING_REQUIREMENTS;
          const ownedByTier = { A: 0, B: 0, C: 0, D: 0 };
          const tags = new Set<string>();
          // TODO: Use real collection data. Stubbed with MOCK_OWNED for v0.
          // For now show a placeholder progress tracker.
          return (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">
                Found a museum by meeting these requirements:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ProgressRow label="Whale Tier" current={user.tier === "whale" ? "Yes" : "No"} target="Required" met={user.tier === "whale"} />
                <ProgressRow label="Tier A Works" current={`${ownedByTier.A}`} target={`${reqs.minTierA}`} met={ownedByTier.A >= reqs.minTierA} />
                <ProgressRow label="Tier B Works" current={`${ownedByTier.B}`} target={`${reqs.minTierB}`} met={ownedByTier.B >= reqs.minTierB} />
                <ProgressRow label="Tier C Works" current={`${ownedByTier.C}`} target={`${reqs.minTierC}`} met={ownedByTier.C >= reqs.minTierC} />
                <ProgressRow label="Tag Diversity" current="0" target={`${reqs.minTagDiversity}`} met={false} />
                <ProgressRow label="Prestige" current={`${user.prestige}`} target={`${reqs.minPrestige}`} met={user.prestige >= reqs.minPrestige} />
                <ProgressRow label="Stewardship" current={`${user.stewardship}`} target={`${reqs.minStewardship}`} met={user.stewardship >= reqs.minStewardship} />
              </div>
              <Link
                href="/museum"
                className="text-sm text-[var(--accent-dark)] mt-3 inline-block hover:underline"
              >
                Browse Museums →
              </Link>
            </div>
          );
        })()}
      </section>

      {/* At Risk */}
      <section>
        <h2 className="text-xl font-semibold mb-4">At Risk</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 italic">
            {/* TODO: Show artworks approaching idle surcharge or delinquency */}
            No items currently at risk. Keep your collection active to avoid surcharges!
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-[var(--accent-dark)]" : ""}`}>{value}</div>
    </div>
  );
}

function ProgressRow({ label, current, target, met }: { label: string; current: string; target: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-500">{label}</span>
      <span className={met ? "text-green-600 font-medium" : "text-gray-400"}>
        {current} / {target} {met ? "✓" : ""}
      </span>
    </div>
  );
}
