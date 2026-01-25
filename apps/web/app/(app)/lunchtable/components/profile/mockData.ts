/**
 * Profile Component Mock Data
 * Mock data for development and testing
 */

import type { PlayerProfile, DetailItem } from "./types";

// Extended mock data for cards
export const MOCK_CARD_DETAILS: Record<string, Partial<DetailItem>> = {
  "card-1": {
    attack: 7,
    defense: 4,
    cost: 5,
    ability: "When this card enters play, deal 3 damage to all enemy creatures.",
    flavorText: '"The skies burn red when the drake awakens." - Fire Sage Pyralis',
  },
  "card-2": {
    attack: 9,
    defense: 6,
    cost: 8,
    ability:
      "Resurrection: When this card is destroyed, return it to play with half its original stats at the end of your next turn.",
    flavorText: '"From ashes, glory rises eternal." - The Phoenix Codex',
  },
};

// Extended badge details
export const MOCK_BADGE_DETAILS: Record<string, { howToEarn: string; rarity: string }> = {
  "badge-1": {
    howToEarn: "Complete all 5 chapters of the main story campaign, defeating all boss encounters.",
    rarity: "Epic",
  },
  "badge-2": {
    howToEarn: "Win 100 ranked or casual matches using a deck with at least 20 fire element cards.",
    rarity: "Rare",
  },
  "badge-3": {
    howToEarn: "Win your very first ranked match against another player.",
    rarity: "Common",
  },
};

// Extended achievement details
export const MOCK_ACHIEVEMENT_DETAILS: Record<string, { howToComplete: string; reward: string }> = {
  "ach-1": {
    howToComplete:
      "Collect unique cards through packs, crafting, or trading. Duplicates don't count.",
    reward: "500 Gold + Exclusive Card Back",
  },
  "ach-2": {
    howToComplete: "Win 10 consecutive matches in ranked or casual mode without losing.",
    reward: '"Unstoppable" Title + 1000 Gold',
  },
  "ach-3": {
    howToComplete: "Send and accept friend requests to build your network of allies.",
    reward: '"Social Star" Badge + 250 Gold',
  },
};

// Mock profile data
export const MOCK_PROFILE: PlayerProfile = {
  id: "1",
  username: "DragonSlayer",
  rank: {
    casual: { tier: "Diamond", division: 2 },
    ranked: { tier: "Master", division: 1, lp: 78 },
  },
  stats: {
    totalGames: 342,
    wins: 198,
    losses: 144,
    winStreak: 5,
    longestWinStreak: 12,
  },
  socials: {
    twitter: "dragonslayer_tcg",
    discord: "DragonSlayer#1234",
    twitch: "dragonslayer_live",
  },
  agents: [
    {
      id: "agent-1",
      name: "Pyro",
      avatar: "🔥",
      wins: 45,
      losses: 23,
      personality: "Aggressive",
    },
  ],
  mostPlayedCard: {
    id: "card-1",
    name: "Inferno Drake",
    element: "fire",
    timesPlayed: 892,
  },
  callingCard: {
    id: "card-2",
    name: "Phoenix Ascendant",
    element: "fire",
    rarity: "legendary",
  },
  badges: [
    {
      id: "badge-1",
      name: "Story Champion",
      description: "Completed the main story campaign",
      icon: "crown",
      earnedAt: Date.now() - 86400000 * 30,
    },
    {
      id: "badge-2",
      name: "Fire Master",
      description: "Win 100 games with fire decks",
      icon: "flame",
      earnedAt: Date.now() - 86400000 * 15,
    },
    {
      id: "badge-3",
      name: "First Blood",
      description: "Win your first ranked match",
      icon: "swords",
      earnedAt: Date.now() - 86400000 * 60,
    },
  ],
  achievements: [
    {
      id: "ach-1",
      name: "Card Collector",
      description: "Collect 500 unique cards",
      icon: "star",
      progress: 423,
      maxProgress: 500,
    },
    {
      id: "ach-2",
      name: "Streak Demon",
      description: "Achieve a 10-game win streak",
      icon: "zap",
    },
    {
      id: "ach-3",
      name: "Social Butterfly",
      description: "Add 50 friends",
      icon: "heart",
      progress: 34,
      maxProgress: 50,
    },
  ],
  joinedAt: Date.now() - 86400000 * 120,
  status: "online",
};
