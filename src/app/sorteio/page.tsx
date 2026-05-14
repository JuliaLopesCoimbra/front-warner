import type { Metadata } from "next";

import { SorteioWizard } from "@/components/sorteio/SorteioWizard";

export const metadata: Metadata = {
  title: "Sorteio",
  description: "Seleção e sorteio entre participantes",
};

export default function SorteioPage() {
  return <SorteioWizard />;
}
