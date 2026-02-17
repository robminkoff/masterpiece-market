export function StatBar({
  credits,
  prestige,
  stewardship,
}: {
  credits: number;
  prestige: number;
  stewardship: number;
}) {
  const barColor =
    stewardship < 25
      ? "bg-red-500"
      : stewardship <= 50
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <Pill label="Credits" value={credits.toLocaleString()} />
      <Pill label="Prestige" value={String(prestige)} />

      {/* Stewardship bar */}
      <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Stewardship</span>
        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, stewardship))}%` }}
          />
        </div>
        <span className="font-semibold">{stewardship}</span>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
