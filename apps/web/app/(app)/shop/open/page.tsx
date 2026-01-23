"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Package,
  Sparkles,
  Store,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/ConvexAuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  type: "creature" | "spell" | "trap";
  element: string;
  attack?: number;
  defense?: number;
  isNew: boolean;
}

const RARITY_CONFIG: Record<Rarity, { color: string; glow: string; bg: string; label: string }> = {
  common: {
    color: "text-gray-300",
    glow: "shadow-gray-400/30",
    bg: "from-gray-600/30 to-gray-800/30",
    label: "Common",
  },
  uncommon: {
    color: "text-green-400",
    glow: "shadow-green-400/30",
    bg: "from-green-600/30 to-green-800/30",
    label: "Uncommon",
  },
  rare: {
    color: "text-blue-400",
    glow: "shadow-blue-400/40",
    bg: "from-blue-600/30 to-blue-800/30",
    label: "Rare",
  },
  epic: {
    color: "text-purple-400",
    glow: "shadow-purple-400/50",
    bg: "from-purple-600/30 to-purple-800/30",
    label: "Epic",
  },
  legendary: {
    color: "text-yellow-400",
    glow: "shadow-yellow-400/60",
    bg: "from-yellow-600/30 to-amber-800/30",
    label: "Legendary",
  },
};

// Mock data - replace with actual pack opening logic
const generateMockCards = (count: number): Card[] => {
  const names = [
    "Flame Drake",
    "Water Sprite",
    "Shadow Knight",
    "Crystal Golem",
    "Thunder Phoenix",
    "Forest Guardian",
    "Ice Wyrm",
    "Storm Elemental",
  ] as const;
  const elements = [
    "Fire",
    "Water",
    "Shadow",
    "Earth",
    "Lightning",
    "Nature",
    "Ice",
    "Wind",
  ] as const;
  const rarities: Rarity[] = [
    "common",
    "common",
    "common",
    "uncommon",
    "uncommon",
    "rare",
    "epic",
    "legendary",
  ];
  const types: Card["type"][] = ["creature", "spell", "trap"];

  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}-${Date.now()}`,
    name: names[Math.floor(Math.random() * names.length)] as string,
    rarity: rarities[Math.floor(Math.random() * rarities.length)] as Rarity,
    type: types[Math.floor(Math.random() * types.length)] as Card["type"],
    element: elements[Math.floor(Math.random() * elements.length)] as string,
    attack: Math.floor(Math.random() * 3000) + 500,
    defense: Math.floor(Math.random() * 2500) + 300,
    isNew: Math.random() > 0.5,
  }));
};

type OpeningPhase = "ready" | "opening" | "revealing" | "complete";

export default function PackOpeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packType = searchParams.get("pack") || "starter";

  const { token } = useAuth();
  const currentUser = useQuery(api.users.currentUser, token ? { token } : "skip");

  const [phase, setPhase] = useState<OpeningPhase>("ready");
  const [cards, setCards] = useState<Card[]>([]);
  const [_currentCardIndex, _setCurrentCardIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [selectedForListing, setSelectedForListing] = useState<Set<string>>(new Set());

  const packInfo = {
    starter: { name: "Starter Pack", cardCount: 5 },
    booster: { name: "Booster Pack", cardCount: 8 },
    premium: { name: "Premium Pack", cardCount: 10 },
  }[packType] || { name: "Card Pack", cardCount: 5 };

  const handleOpenPack = useCallback(async () => {
    setPhase("opening");

    // Simulate pack opening animation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate cards
    const newCards = generateMockCards(packInfo.cardCount);
    setCards(newCards);
    setPhase("revealing");
  }, [packInfo.cardCount]);

  const handleRevealCard = useCallback((index: number) => {
    setRevealedCards((prev) => new Set([...prev, index]));
  }, []);

  const handleRevealAll = useCallback(() => {
    const allIndices = new Set(cards.map((_, i) => i));
    setRevealedCards(allIndices);
  }, [cards]);

  const handleComplete = useCallback(() => {
    setPhase("complete");
  }, []);

  const toggleListingSelection = useCallback((cardId: string) => {
    setSelectedForListing((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const handleListSelected = useCallback(() => {
    // TODO: Implement marketplace listing
    console.log("Listing cards:", Array.from(selectedForListing));
    router.push("/shop?tab=marketplace");
  }, [selectedForListing, router]);

  const allRevealed = revealedCards.size === cards.length && cards.length > 0;

  useEffect(() => {
    if (allRevealed && phase === "revealing") {
      // Auto-transition to complete after a short delay
      const timer = setTimeout(() => handleComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [allRevealed, phase, handleComplete]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0a09] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a09] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-[#0d0a09] to-[#0d0a09]" />
      <div className="absolute inset-0 bg-[url('/assets/backgrounds/noise.png')] opacity-5" />

      {/* Magical particles during opening */}
      <AnimatePresence>
        {phase === "opening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-hidden pointer-events-none z-10"
          >
            {Array.from({ length: 50 }, (_, i) => `particle-${Date.now()}-${i}`).map((id) => (
              <motion.div
                key={id}
                className="absolute w-2 h-2 bg-[#d4af37] rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  x: (Math.random() - 0.5) * 800,
                  y: (Math.random() - 0.5) * 800,
                  opacity: [1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-[#a89f94] hover:text-[#e8e0d5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Shop</span>
          </Link>
          {phase === "complete" && (
            <Button
              onClick={() => router.push("/binder")}
              variant="outline"
              className="border-[#3d2b1f] text-[#a89f94] hover:text-[#e8e0d5]"
            >
              View Collection
            </Button>
          )}
        </div>

        {/* Ready Phase - Pack Display */}
        <AnimatePresence mode="wait">
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-[#d4af37]/20 rounded-2xl blur-xl" />
                <div className="relative w-48 h-64 rounded-2xl bg-linear-to-br from-[#d4af37]/30 to-[#8b4513]/30 border-2 border-[#d4af37]/50 flex items-center justify-center">
                  <Package className="w-20 h-20 text-[#d4af37]" />
                </div>
              </motion.div>

              <h1 className="text-3xl font-black text-[#e8e0d5] mb-2 uppercase tracking-tight">
                {packInfo.name}
              </h1>
              <p className="text-[#a89f94] mb-8">Contains {packInfo.cardCount} cards</p>

              <Button
                onClick={handleOpenPack}
                className="bg-linear-to-r from-[#8b4513] via-[#d4af37] to-[#8b4513] hover:from-[#a0522d] hover:via-[#f9e29f] hover:to-[#a0522d] text-white font-bold px-12 py-6 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Open Pack
              </Button>
            </motion.div>
          )}

          {/* Opening Phase - Animation */}
          {phase === "opening" && (
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1.5, 0],
                  rotateY: [0, 180, 360, 720],
                  opacity: [1, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#d4af37] rounded-2xl blur-2xl animate-pulse" />
                <div className="relative w-48 h-64 rounded-2xl bg-linear-to-br from-[#d4af37] to-[#8b4513] border-2 border-[#d4af37] flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-white animate-spin" />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Revealing Phase - Card Grid */}
          {phase === "revealing" && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-[#e8e0d5] mb-2 uppercase tracking-tight">
                  Your Cards
                </h2>
                <p className="text-[#a89f94]">Click each card to reveal, or reveal all at once</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((card, index) => {
                  const isRevealed = revealedCards.has(index);
                  const config = RARITY_CONFIG[card.rarity];

                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative aspect-3/4"
                    >
                      <motion.button
                        onClick={() => !isRevealed && handleRevealCard(index)}
                        disabled={isRevealed}
                        className={cn(
                          "w-full h-full rounded-xl overflow-hidden transition-all cursor-pointer",
                          isRevealed ? `shadow-lg ${config.glow}` : "hover:scale-105"
                        )}
                        animate={isRevealed ? { rotateY: [0, 180, 360] } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        {isRevealed ? (
                          <div
                            className={cn(
                              "w-full h-full p-3 bg-linear-to-br border-2 flex flex-col",
                              config.bg,
                              card.rarity === "legendary"
                                ? "border-yellow-400"
                                : card.rarity === "epic"
                                  ? "border-purple-400"
                                  : card.rarity === "rare"
                                    ? "border-blue-400"
                                    : card.rarity === "uncommon"
                                      ? "border-green-400"
                                      : "border-gray-500"
                            )}
                          >
                            {card.isNew && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500 text-white">
                                NEW
                              </span>
                            )}
                            <div className="flex-1 flex items-center justify-center">
                              <div className="w-full h-full rounded bg-black/30 flex items-center justify-center">
                                <Package className={cn("w-8 h-8", config.color)} />
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-bold text-[#e8e0d5] truncate">
                                {card.name}
                              </p>
                              <p className={cn("text-[10px] font-medium", config.color)}>
                                {config.label}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-[#3d2b1f] to-[#1a1614] border-2 border-[#d4af37]/30 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-8 h-8 text-[#d4af37]/50" />
                            </motion.div>
                          </div>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {!allRevealed && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleRevealAll}
                    className="bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614] font-bold"
                  >
                    Reveal All Cards
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Complete Phase - Summary with Listing Option */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium mb-4"
                >
                  <CheckCircle className="w-4 h-4" />
                  Pack Opened Successfully
                </motion.div>
                <h2 className="text-2xl font-black text-[#e8e0d5] mb-2 uppercase tracking-tight">
                  Your New Cards
                </h2>
                <p className="text-[#a89f94]">Select cards you want to list on the marketplace</p>
              </div>

              {/* Card Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((card) => {
                  const config = RARITY_CONFIG[card.rarity];
                  const isSelected = selectedForListing.has(card.id);

                  return (
                    <motion.button
                      key={card.id}
                      onClick={() => toggleListingSelection(card.id)}
                      className={cn(
                        "relative aspect-3/4 rounded-xl overflow-hidden transition-all",
                        isSelected ? "ring-2 ring-[#d4af37] scale-95" : "hover:scale-105",
                        `shadow-lg ${config.glow}`
                      )}
                    >
                      <div
                        className={cn(
                          "w-full h-full p-3 bg-linear-to-br border-2 flex flex-col",
                          config.bg,
                          card.rarity === "legendary"
                            ? "border-yellow-400"
                            : card.rarity === "epic"
                              ? "border-purple-400"
                              : card.rarity === "rare"
                                ? "border-blue-400"
                                : card.rarity === "uncommon"
                                  ? "border-green-400"
                                  : "border-gray-500"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#d4af37]/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center">
                              <Tag className="w-4 h-4 text-[#1a1614]" />
                            </div>
                          </div>
                        )}
                        {card.isNew && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500 text-white">
                            NEW
                          </span>
                        )}
                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-full h-full rounded bg-black/30 flex items-center justify-center">
                            <Package className={cn("w-8 h-8", config.color)} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-bold text-[#e8e0d5] truncate">{card.name}</p>
                          <p className={cn("text-[10px] font-medium", config.color)}>
                            {config.label}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {selectedForListing.size > 0 && (
                  <Button
                    onClick={handleListSelected}
                    className="w-full sm:w-auto bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614] font-bold px-8"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    List {selectedForListing.size} Card{selectedForListing.size > 1 ? "s" : ""} on
                    Marketplace
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/binder")}
                  variant="outline"
                  className="w-full sm:w-auto border-[#3d2b1f] text-[#a89f94] hover:text-[#e8e0d5] px-8"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to Collection
                </Button>
                <Button
                  onClick={() => router.push("/shop")}
                  variant="ghost"
                  className="w-full sm:w-auto text-[#a89f94] hover:text-[#e8e0d5]"
                >
                  Open Another Pack
                </Button>
              </div>

              {/* Stats Summary */}
              <div className="mt-12 p-6 rounded-xl bg-black/40 border border-[#3d2b1f]">
                <h3 className="text-lg font-bold text-[#e8e0d5] mb-4">Pack Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {(["common", "uncommon", "rare", "epic", "legendary"] as Rarity[]).map(
                    (rarity) => {
                      const count = cards.filter((c) => c.rarity === rarity).length;
                      const config = RARITY_CONFIG[rarity];
                      return (
                        <div key={rarity} className="text-center">
                          <div className={cn("text-2xl font-black", config.color)}>{count}</div>
                          <div className="text-xs text-[#a89f94]">{config.label}</div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
