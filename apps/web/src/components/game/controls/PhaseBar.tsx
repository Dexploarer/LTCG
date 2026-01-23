"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "draw", label: "Draw", shortLabel: "D" },
  { id: "standby", label: "Standby", shortLabel: "S" },
  { id: "main1", label: "Main 1", shortLabel: "M1" },
  { id: "battle", label: "Battle", shortLabel: "B" },
  { id: "main2", label: "Main 2", shortLabel: "M2" },
  { id: "end", label: "End", shortLabel: "E" },
] as const;

interface PhaseBarProps {
  currentPhase: string;
  turnNumber: number;
  isPlayerTurn: boolean;
  canAdvancePhase: boolean;
  onAdvancePhase: () => void;
}

export function PhaseBar({
  currentPhase,
  turnNumber,
  isPlayerTurn,
  canAdvancePhase,
  onAdvancePhase,
}: PhaseBarProps) {
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg border">
      {/* Turn indicator */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <span className="text-[8px] sm:text-[10px] text-muted-foreground">Turn</span>
        <span className="text-[10px] sm:text-xs font-bold">{turnNumber}</span>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-0.5">
        {PHASES.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isPast = index < currentPhaseIndex;

          return (
            <div
              key={phase.id}
              className={cn(
                "px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-medium transition-all duration-200",
                isActive &&
                  "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-105",
                isPast && "text-muted-foreground bg-muted/30",
                !isActive && !isPast && "text-muted-foreground/50"
              )}
            >
              <span className="hidden sm:inline">{phase.label}</span>
              <span className="sm:hidden">{phase.shortLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Advance button */}
      {isPlayerTurn && canAdvancePhase && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onAdvancePhase}
          className="ml-auto gap-0.5 h-6 text-[10px] px-2"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}

      {/* Turn indicator */}
      {!isPlayerTurn && (
        <div className="ml-auto px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600 text-[8px] sm:text-[10px] font-medium">
          <span className="hidden sm:inline">Opponent&apos;s Turn</span>
          <span className="sm:hidden">Opp Turn</span>
        </div>
      )}
    </div>
  );
}
