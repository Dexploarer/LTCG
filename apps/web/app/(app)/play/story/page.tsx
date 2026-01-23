"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, Loader2, Shield, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ConvexAuthProvider";
import { StoryChapterCard } from "@/components/story/StoryChapterCard";
import { cn } from "@/lib/utils";

// Mock data for UI development
const MOCK_CHAPTERS = [
  {
    chapterId: "ch1",
    name: "Infernal Dragons",
    description:
      "Face the fury of the Fire Dragon Legion. Master aggressive strategies and burn damage mechanics.",
    archetype: "infernal_dragons",
    order: 1,
    requiredLevel: 1,
    isUnlocked: true,
    completedStages: 7,
    totalStages: 10,
    starredStages: 4,
    isCompleted: false,
  },
  {
    chapterId: "ch2",
    name: "Abyssal Horrors",
    description:
      "Descend into the deep. Learn control tactics and master the art of freezing your opponents.",
    archetype: "abyssal_horrors",
    order: 2,
    requiredLevel: 5,
    isUnlocked: true,
    completedStages: 3,
    totalStages: 10,
    starredStages: 2,
    isCompleted: false,
  },
  {
    chapterId: "ch3",
    name: "Celestial Guardians",
    description:
      "Ascend to the heavens. Discover defensive formations and divine protection spells.",
    archetype: "celestial_guardians",
    order: 3,
    requiredLevel: 10,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch4",
    name: "Nature Spirits",
    description: "Connect with the wild. Harness growth mechanics and healing abilities.",
    archetype: "nature_spirits",
    order: 4,
    requiredLevel: 15,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch5",
    name: "Shadow Assassins",
    description: "Strike from the darkness. Master stealth and quick elimination tactics.",
    archetype: "shadow_assassins",
    order: 5,
    requiredLevel: 20,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch6",
    name: "Storm Elementals",
    description: "Command the tempest. Unleash lightning and wind-based combos.",
    archetype: "storm_elementals",
    order: 6,
    requiredLevel: 25,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch7",
    name: "Undead Legion",
    description: "Raise the fallen. Learn resurrection mechanics and army building.",
    archetype: "undead_legion",
    order: 7,
    requiredLevel: 30,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch8",
    name: "Arcane Mages",
    description: "Wield pure magic. Master spell combinations and mana management.",
    archetype: "arcane_mages",
    order: 8,
    requiredLevel: 35,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch9",
    name: "Mechanical Constructs",
    description: "Build the future. Combine units and create powerful mechanical synergies.",
    archetype: "mechanical_constructs",
    order: 9,
    requiredLevel: 40,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
  {
    chapterId: "ch10",
    name: "Divine Knights",
    description: "The final trial. Face the legendary Divine Knights in the ultimate challenge.",
    archetype: "divine_knights",
    order: 10,
    requiredLevel: 45,
    isUnlocked: false,
    completedStages: 0,
    totalStages: 10,
    starredStages: 0,
    isCompleted: false,
  },
];

const MOCK_STATS = {
  completedChapters: 0,
  totalChapters: 10,
  completedStages: 10,
  totalStages: 100,
  starredStages: 6,
};

export default function StoryModePage() {
  const router = useRouter();
  const { token } = useAuth();
  const currentUser = useQuery(api.users.currentUser, token ? { token } : "skip");

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0a09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
          <p className="text-[#a89f94]">Loading story mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a09] relative">
      {/* Background */}
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212, 175, 55, 0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Hero Section */}
      <div className="relative z-10 pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm font-medium mb-6 backdrop-blur-md">
              <BookOpen className="w-4 h-4" />
              <span>Campaign Mode</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-[#e8e0d5] drop-shadow-lg">
              Realm of{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-[#d4af37]">
                Legends
              </span>
            </h1>

            <p className="text-[#a89f94] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Embark on an epic journey through ten distinct realms. Master the elements, defeat
              ancient guardians, and forge your destiny.
            </p>
          </motion.div>

          {/* Player Stats Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
          >
            {[
              {
                label: "Chapters",
                value: `${MOCK_STATS.completedChapters}/${MOCK_STATS.totalChapters}`,
                color: "text-purple-400",
                icon: BookOpen,
              },
              {
                label: "Stages Cleared",
                value: `${MOCK_STATS.completedStages}/${MOCK_STATS.totalStages}`,
                color: "text-blue-400",
                icon: Shield,
              },
              {
                label: "Stars Earned",
                value: MOCK_STATS.starredStages,
                color: "text-yellow-400",
                icon: Star,
              },
              { label: "Badges", value: 3, color: "text-green-400", icon: Trophy },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-black/40 border border-[#3d2b1f] rounded-xl p-4 backdrop-blur-sm flex flex-col items-center"
              >
                <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
                <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
                <div className="text-xs text-[#a89f94] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Chapters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {MOCK_CHAPTERS.map((chapter, index) => (
              <motion.div
                key={chapter.chapterId}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StoryChapterCard
                  chapter={chapter}
                  onClick={() => {
                    if (chapter.isUnlocked) {
                      router.push(`/play/story/${chapter.chapterId}`);
                    }
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Link
          href="/lunchtable"
          className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-[#3d2b1f] rounded-full px-6 py-3 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Return to Hub</span>
        </Link>
      </div>
    </div>
  );
}
