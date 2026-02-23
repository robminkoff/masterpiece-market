"use client";

interface Props {
  week: number;
  maxWeeks: number;
  museumsFounded: number;
  advancing: boolean;
  onAdvanceWeek: () => void;
}

export function SoloWeekHeader({ week, maxWeeks, museumsFounded, advancing, onAdvanceWeek }: Props) {
  const isFirstWeek = week === 0;
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">
          {isFirstWeek ? "Solo Mode" : `Week ${week}`}
          <span className="text-sm font-normal text-gray-400 ml-2">/ {maxWeeks}</span>
        </h1>
        {museumsFounded > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {museumsFounded} museum{museumsFounded !== 1 ? "s" : ""} founded
          </p>
        )}
      </div>
      <button
        onClick={onAdvanceWeek}
        disabled={advancing}
        className="px-5 py-2.5 rounded-lg bg-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {advancing ? "Advancing..." : isFirstWeek ? "Start Week 1" : "Advance Week"}
      </button>
    </div>
  );
}
