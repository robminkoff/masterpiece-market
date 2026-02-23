export function StatBar({
  credits,
  expertise,
}: {
  credits: number;
  expertise: number;
}) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <Pill label="Credits" value={credits.toLocaleString()} />
      <Pill label="Expertise" value={String(expertise)} />
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
