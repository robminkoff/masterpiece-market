"use client";

import { useState } from "react";
import type { Artwork, ProfileEntity } from "@/lib/types";
import { ProfileHeader } from "./ProfileHeader";
import { StatBar } from "./StatBar";
import { ProfileTabs } from "./ProfileTabs";
import { ArtworkGrid } from "./ArtworkGrid";
import { ActivityFeed } from "./ActivityFeed";
import { NpcModules } from "./NpcModules";

export function ProfileShell({
  entity,
  artworks,
}: {
  entity: ProfileEntity;
  artworks: Artwork[];
}) {
  const [activeTab, setActiveTab] = useState("Collection");

  const isUser = entity.kind === "user";
  const credits = isUser ? entity.profile.credits : entity.npc.credits;
  const prestige = isUser ? entity.profile.prestige : entity.npc.prestige;
  const stewardship = isUser ? entity.profile.stewardship : entity.npc.stewardship_score;
  const npcRole = !isUser ? entity.npc.role : undefined;

  // Separate on-loan artworks from collection
  const onLoanArtworkIds = new Set(
    entity.ownerships.filter((o) => o.on_loan).map((o) => o.artwork_id),
  );
  const onLoanArtworks = artworks.filter((a) => onLoanArtworkIds.has(a.id));

  return (
    <div>
      <ProfileHeader entity={entity} />
      <StatBar credits={credits} prestige={prestige} stewardship={stewardship} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} npcRole={npcRole} />

      <div className="mt-6">
        {activeTab === "Collection" && (
          <ArtworkGrid artworks={artworks} emptyMessage="No artworks in collection." />
        )}
        {activeTab === "On Loan" && (
          <ArtworkGrid artworks={onLoanArtworks} emptyMessage="No artworks currently on loan." />
        )}
        {activeTab === "Activity" && <ActivityFeed events={entity.provenance} />}
        {activeTab === "About" && <AboutSection entity={entity} />}
        {!isUser && (
          <NpcModules npc={entity.npc} activeTab={activeTab} />
        )}
      </div>
    </div>
  );
}

function AboutSection({ entity }: { entity: ProfileEntity }) {
  if (entity.kind === "npc") {
    const npc = entity.npc;
    return (
      <div className="space-y-4">
        {npc.description && (
          <p className="text-gray-600 dark:text-gray-300">{npc.description}</p>
        )}
        {npc.specialty && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Specialty</h4>
            <p className="text-sm">{npc.specialty}</p>
          </div>
        )}
        {/* Taste tags from traits */}
        {typeof npc.traits.taste === "string" && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Taste</h4>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {npc.traits.taste}
            </span>
          </div>
        )}
      </div>
    );
  }

  // User about
  const profile = entity.profile;
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-1">Username</h4>
        <p className="text-sm">{profile.username}</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-1">Member since</h4>
        <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-1">Last active</h4>
        <p className="text-sm">{new Date(profile.last_active).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
