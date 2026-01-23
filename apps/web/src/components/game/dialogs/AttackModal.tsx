// @ts-nocheck
// TODO: This file depends on Convex game APIs that have not been implemented yet.
"use client";

import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Swords, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AttackOption, AttackTarget } from "../hooks/useGameBoard";

interface AttackModalProps {
  isOpen: boolean;
  attacker: AttackOption | null;
  targets: AttackTarget[];
  canDirectAttack: boolean;
  onSelectTarget: (targetId: Id<"cardInstances"> | undefined) => void;
  onClose: () => void;
}

export function AttackModal({
  isOpen,
  attacker,
  targets,
  canDirectAttack,
  onSelectTarget,
  onClose,
}: AttackModalProps) {
  if (!attacker) return null;

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
                  <h3 className="font-semibold text-sm">Declare Attack</h3>
                  <p className="text-xs text-muted-foreground">
                    {attacker.name} (ATK: {attacker.attack})
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Attacker Info */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
                <Swords className="h-6 w-6 text-red-500" />
                <div>
                  <div className="font-medium text-xs">{attacker.name}</div>
                  <div className="text-[10px] text-muted-foreground">Attack: {attacker.attack}</div>
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium mb-1.5">Select Target</p>

                {/* Monster Targets */}
                {targets.map((target) => {
                  const isDefense =
                    target.position === "defense" || target.position === "setDefense";
                  const hasKnownStats =
                    !target.isFaceDown &&
                    target.attack !== undefined &&
                    target.defense !== undefined;
                  const targetStat = hasKnownStats
                    ? isDefense
                      ? target.defense
                      : target.attack
                    : undefined;
                  const attackerWins =
                    hasKnownStats && targetStat !== undefined
                      ? attacker.attack > targetStat
                      : false;
                  const isDraw =
                    hasKnownStats && targetStat !== undefined
                      ? attacker.attack === targetStat
                      : false;

                  return (
                    <Button
                      key={target.instanceId}
                      className="w-full justify-start gap-2 h-auto py-2"
                      variant="outline"
                      onClick={() => onSelectTarget(target.instanceId)}
                    >
                      <Shield
                        className={cn("h-4 w-4", isDefense ? "text-blue-500" : "text-orange-500")}
                      />
                      <div className="text-left flex-1">
                        <div className="font-medium text-xs">{target.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {hasKnownStats
                            ? isDefense
                              ? `DEF: ${target.defense}`
                              : `ATK: ${target.attack}`
                            : "Stats hidden"}
                        </div>
                      </div>
                      {hasKnownStats && (
                        <div className="text-[10px]">
                          {attackerWins ? (
                            <span className="text-green-500">Win</span>
                          ) : isDraw ? (
                            <span className="text-yellow-500">Draw</span>
                          ) : (
                            <span className="text-red-500">Lose</span>
                          )}
                        </div>
                      )}
                    </Button>
                  );
                })}

                {/* Direct Attack */}
                {canDirectAttack && (
                  <Button
                    className="w-full justify-start gap-2 h-auto py-2 border-red-500/50"
                    variant="outline"
                    onClick={() => onSelectTarget(undefined)}
                  >
                    <User className="h-4 w-4 text-red-500" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Direct Attack</div>
                      <div className="text-[10px] text-muted-foreground">
                        Deal {attacker.attack} damage to opponent
                      </div>
                    </div>
                  </Button>
                )}

                {/* No targets available */}
                {targets.length === 0 && !canDirectAttack && (
                  <div className="text-center text-xs text-muted-foreground py-3">
                    No valid attack targets available
                  </div>
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
