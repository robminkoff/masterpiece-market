import type { NpcRole } from "@/lib/types";

const NPC_ROLE_TABS: Record<NpcRole, string[]> = {
  curator: ["Exhibitions", "Loan Terms"],
  dealer: ["Services", "Consignment Terms"],
  critic: ["Reviews"],
};

export function ProfileTabs({
  activeTab,
  onTabChange,
  npcRole,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  npcRole?: NpcRole;
}) {
  const baseTabs = ["Collection", "On Loan", "Activity", "About"];
  const extraTabs = npcRole ? NPC_ROLE_TABS[npcRole] ?? [] : [];
  const tabs = [...baseTabs, ...extraTabs];

  return (
    <div className="flex gap-1 mt-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === tab
              ? "bg-[var(--accent-dark)] text-white"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
