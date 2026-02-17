import type { ProvenanceEvent } from "@/lib/types";

function describeEvent(event: ProvenanceEvent): string {
  const meta = event.metadata as Record<string, string>;
  switch (event.event_type) {
    case "purchase":
      return `Purchased artwork${meta.source ? ` via ${meta.source}` : ""}${event.price ? ` for ${event.price.toLocaleString()} cr` : ""}`;
    case "loan":
      return `Loaned to ${meta.curator ?? "a curator"}${meta.exhibition ? ` for "${meta.exhibition}"` : ""}`;
    case "exhibition":
      return `Exhibited at "${meta.exhibition ?? "exhibition"}"${meta.museum ? ` (${meta.museum})` : ""}`;
    default:
      return event.event_type;
  }
}

export function ActivityFeed({ events }: { events: ProvenanceEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 italic py-6">No activity recorded yet.</p>;
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-3">
      {sorted.map((event) => (
        <div key={event.id} className="flex gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
            <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="pb-3">
            <p>{describeEvent(event)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(event.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
