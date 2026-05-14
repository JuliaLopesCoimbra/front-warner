import type { Metadata } from "next";

import { AnswerHistoryView } from "@/components/historico/AnswerHistoryView";

export const metadata: Metadata = {
  title: "Histórico de respostas",
  description: "Registro de respostas no quiz",
};

export default function HistoricoPage() {
  return <AnswerHistoryView />;
}
