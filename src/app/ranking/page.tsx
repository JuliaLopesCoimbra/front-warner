import type { Metadata } from "next";

import { RankingView } from "@/components/ranking/RankingView";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Participantes e pontuações do quiz",
};

export default function RankingPage() {
  return <RankingView />;
}
