"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Shield, Sword, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { CardInZone } from "../hooks/useGameBoard";

interface SummonModalProps {
  isOpen: boolean;
  card: CardInZone | null;
  canSummonAttack: boolean;
  canSummonDefense: boolean;
  canSet: boolean;
  canActivate?: boolean;
  onSummon: (position: "attack" | "defense") => void;
  onSet: () => void;
  onActivate?: () => void;
  onClose: () => void;
}

export function SummonModal({
  isOpen,
  card,
  canSummonAttack,
  canSummonDefense,
  canSet,
  canActivate = false,
  onSummon,
  onSet,
  onActivate,
  onClose,
}: SummonModalProps) {
  if (!card) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs"
          >
            <div className="bg-background border rounded-xl shadow-2xl p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{card.name}</h3>
                  {card.monsterStats && (
                    <p className="text-xs text-muted-foreground">
                      Lv.{card.monsterStats.level} | ATK {card.monsterStats.attack} / DEF{" "}
                      {card.monsterStats.defense}
                    </p>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Card Preview */}
              <div className="flex justify-center mb-3">
                <div className="w-20 h-28 rounded-lg border-2 overflow-hidden">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                      <span className="text-[10px] text-white/80 text-center px-2">
                        {card.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Effects */}
              {card.effects && card.effects.length > 0 && (
                <div className="mb-3 max-h-24 overflow-y-auto space-y-1">
                  {card.effects.map((effect, index) => (
                    <div key={`effect-${effect.name}-${index}`} className="p-2 border rounded-md bg-muted/30 text-xs">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium">{effect.name}</span>
                        {effect.effectType && (
                          <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded">
                            {effect.effectType}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[10px]">{effect.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Summon Options */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Choose how to play this card
                </p>

                {/* Activate */}
                {canActivate && (
                  <Button
                    className="w-full justify-start gap-2 h-auto py-2"
                    variant="outline"
                    onClick={onActivate}
                  >
                    <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[8px]">
                      ✨
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-xs text-amber-200">Activate Effect</div>
                      <div className="text-[10px] text-muted-foreground">
                        Play this card and trigger its effects
                      </div>
                    </div>
                  </Button>
                )}

                {/* Attack Position */}
                {canSummonAttack && (
                  <Button
                    className="w-full justify-start gap-2 h-auto py-2"
                    variant="outline"
                    onClick={() => onSummon("attack")}
                  >
                    <Sword className="h-4 w-4 text-red-500" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Summon in Attack Position</div>
                      <div className="text-[10px] text-muted-foreground">
                        ATK: {card.monsterStats?.attack ?? 0}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Defense Position */}
                {canSummonDefense && (
                  <Button
                    className="w-full justify-start gap-2 h-auto py-2"
                    variant="outline"
                    onClick={() => onSummon("defense")}
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Summon in Defense Position</div>
                      <div className="text-[10px] text-muted-foreground">
                        DEF: {card.monsterStats?.defense ?? 0}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Set face-down */}
                {canSet && (
                  <Button
                    className="w-full justify-start gap-2 h-auto py-2"
                    variant="outline"
                    onClick={onSet}
                  >
                    <div className="h-4 w-4 rounded border-2 border-dashed border-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Set Face-Down</div>
                      <div className="text-[10px] text-muted-foreground">
                        {card.cardType === "monster"
                          ? "Place in defense position face-down"
                          : "Place face-down in the backrow"}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Cancel */}
                <Button className="w-full mt-2" variant="ghost" onClick={onClose} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
