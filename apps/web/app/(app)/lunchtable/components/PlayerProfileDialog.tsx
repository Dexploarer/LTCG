"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { ChallengeConfirmDialog } from "./ChallengeConfirmDialog";

// Import profile components
import { ProfileHeader } from "./profile/ProfileHeader";
import { CallingCardSection } from "./profile/CallingCardSection";
import { ProfileTabs } from "./profile/ProfileTabs";
import { StatsTab } from "./profile/StatsTab";
import { BadgesTab } from "./profile/BadgesTab";
import { AgentsTab } from "./profile/AgentsTab";
import { DetailPopup } from "./profile/DetailPopup";

// Import types
import type { DetailItem, PlayerProfile } from "./profile/types";

interface PlayerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  profile: PlayerProfile;
}

export function PlayerProfileDialog({ isOpen, onClose, username, profile }: PlayerProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "badges" | "agents">("stats");
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  const handleChallengeConfirm = (mode: "casual" | "ranked") => {
    console.log(`Challenging ${username} to ${mode} match`);
    setShowChallengeDialog(false);
  };

  const openCardDetail = (
    card: {
      id: string;
      name: string;
      element: "fire" | "water" | "earth" | "wind";
      rarity?: "common" | "rare" | "epic" | "legendary";
      timesPlayed?: number;
      attack?: number;
      defense?: number;
      cost?: number;
      ability?: string;
      flavorText?: string;
    },
    isCallingCard: boolean
  ) => {
    setSelectedDetail({
      type: "card",
      id: card.id,
      name: card.name,
      description: isCallingCard
        ? "This player's signature card - their calling card that represents their playstyle."
        : "This player's most frequently used card in battle.",
      element: card.element,
      rarity: card.rarity,
      timesPlayed: card.timesPlayed,
      attack: card.attack,
      defense: card.defense,
      cost: card.cost,
      ability: card.ability,
      flavorText: card.flavorText,
    });
  };

  const openBadgeDetail = (badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
    rarity?: "common" | "rare" | "epic" | "legendary";
    howToEarn?: string;
  }) => {
    setSelectedDetail({
      type: "badge",
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earnedAt: badge.earnedAt,
      flavorText: badge.howToEarn,
      rarity: badge.rarity,
    });
  };

  const openAchievementDetail = (ach: {
    id: string;
    name: string;
    description: string;
    icon: string;
    progress?: number;
    maxProgress?: number;
    howToComplete?: string;
    reward?: string;
  }) => {
    setSelectedDetail({
      type: "achievement",
      id: ach.id,
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      progress: ach.progress,
      maxProgress: ach.maxProgress,
      flavorText: ach.howToComplete,
      ability: ach.reward,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop overlay for modal */}
      <div
        role="presentation"
        className="fixed inset-0 z-80 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-85 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl tcg-chat-leather border border-[#3d2b1f] shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
          {/* Decorative corners */}
          <div className="ornament-corner ornament-corner-tl" />
          <div className="ornament-corner ornament-corner-tr" />
          <div className="ornament-corner ornament-corner-bl" />
          <div className="ornament-corner ornament-corner-br" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg border border-[#3d2b1f] bg-black/50 text-[#a89f94] hover:text-[#e8e0d5] hover:border-[#d4af37]/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile Header */}
          <ProfileHeader profile={profile} onChallenge={() => setShowChallengeDialog(true)} />

          {/* Calling Card & Most Played */}
          <CallingCardSection profile={profile} onCardClick={openCardDetail} />

          {/* Tabs */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3d2b1f] scrollbar-track-transparent">
            {activeTab === "stats" && (
              <StatsTab profile={profile} onAchievementClick={openAchievementDetail} />
            )}
            {activeTab === "badges" && (
              <BadgesTab profile={profile} onBadgeClick={openBadgeDetail} />
            )}
            {activeTab === "agents" && <AgentsTab profile={profile} />}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#3d2b1f] bg-black/30">
            <p className="text-center text-[10px] text-[#a89f94]">
              Member since{" "}
              {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Popup */}
      <DetailPopup detail={selectedDetail} onClose={() => setSelectedDetail(null)} />

      {/* Challenge Confirm Dialog */}
      <ChallengeConfirmDialog
        isOpen={showChallengeDialog}
        onClose={() => setShowChallengeDialog(false)}
        onConfirm={handleChallengeConfirm}
        opponentUsername={username}
        opponentRank={profile.rank.ranked.tier}
      />
    </>
  );
}
