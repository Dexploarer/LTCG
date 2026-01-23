"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { MockGameBoard } from "@/components/game";

interface BattlePageProps {
  params: Promise<{
    chapterId: string;
    stageNumber: string;
  }>;
}

export default function BattlePage({ params }: BattlePageProps) {
  const resolvedParams = use(params);
  const { chapterId, stageNumber } = resolvedParams;
  const router = useRouter();

  return (
    <MockGameBoard
      chapterId={chapterId}
      stageNumber={stageNumber}
      onGameEnd={() => {
        router.push(`/play/story/${chapterId}`);
      }}
    />
  );
}
