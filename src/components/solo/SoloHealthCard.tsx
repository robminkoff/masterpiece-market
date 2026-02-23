"use client";

const SAFE_WEEKS = 8;
const TIGHT_WEEKS = 3;

type HealthStatus = "safe" | "tight" | "at_risk";

function getHealth(rw: number): HealthStatus {
  if (rw >= SAFE_WEEKS) return "safe";
  if (rw >= TIGHT_WEEKS) return "tight";
  return "at_risk";
}

const HEALTH_STYLE: Record<HealthStatus, { label: string; bg: string; text: string; bar: string; dot: string; border: string }> = {
  safe: { label: "SAFE", bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", bar: "bg-green-500", dot: "bg-green-500", border: "border-green-200 dark:border-green-900" },
  tight: { label: "TIGHT", bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", bar: "bg-yellow-500", dot: "bg-yellow-500", border: "border-yellow-200 dark:border-yellow-900" },
  at_risk: { label: "AT RISK", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", bar: "bg-red-500", dot: "bg-red-500", border: "border-red-200 dark:border-red-900" },
};

interface Props {
  cash: number;
  weeklyBurn: number;
  runway: number;
  artworkCount: number;
  expertise: number;
  onBuyPackage: () => void;
}

export function SoloHealthCard({ cash, weeklyBurn, runway, artworkCount, expertise, onBuyPackage }: Props) {
  const health = getHealth(runway);
  const hs = HEALTH_STYLE[health];
  const runwayWeeks = Math.floor(runway * 10) / 10;
  const barPct = Math.min(100, (runway / 12) * 100);

  return (
    <div className={`rounded-xl p-6 ${hs.bg} border ${hs.border}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${hs.dot}`} />
          <span className={`text-sm font-bold tracking-wider ${hs.text}`}>{hs.label}</span>
        </div>
        <button
          onClick={onBuyPackage}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          Buy Package (100k)
        </button>
      </div>

      <div className="text-center mb-5">
        <div className="text-xs text-gray-500 mb-1">Cash</div>
        <div className="text-4xl font-bold">{cash.toLocaleString()} cr</div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-500">Runway</span>
          <span className="font-semibold">
            {runway === Infinity ? "No burn" : `${runwayWeeks} weeks`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`h-full rounded-full ${hs.bar} transition-all`} style={{ width: `${barPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Weekly Burn</div>
          <div className={`text-xl font-bold ${hs.text}`}>{weeklyBurn.toLocaleString()} cr</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">Artworks</div>
          <div className="text-xl font-bold">{artworkCount}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-0.5">Expertise</div>
          <div className="text-xl font-bold">{expertise}</div>
        </div>
      </div>
    </div>
  );
}
