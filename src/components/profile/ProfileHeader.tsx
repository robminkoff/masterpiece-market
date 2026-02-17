import type { ProfileEntity } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  curator: "bg-blue-100 text-blue-800",
  dealer: "bg-green-100 text-green-800",
  critic: "bg-purple-100 text-purple-800",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({ entity }: { entity: ProfileEntity }) {
  const isUser = entity.kind === "user";
  const name = isUser ? entity.profile.display_name : entity.npc.name;
  const memberSince = isUser ? entity.profile.created_at : entity.npc.created_at;

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl font-bold shrink-0">
        {getInitials(name)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold truncate">{name}</h1>
          {isUser ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Collector
            </span>
          ) : (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${ROLE_COLORS[entity.npc.role] ?? "bg-gray-100 text-gray-800"}`}>
              {entity.npc.role}
            </span>
          )}
        </div>

        {!isUser && entity.npc.specialty && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{entity.npc.specialty}</p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          Member since {new Date(memberSince).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
