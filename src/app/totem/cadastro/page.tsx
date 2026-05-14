import { Suspense } from "react";

import { CadastroScreen } from "@/components/totem/CadastroScreen";
import { TotemStage } from "@/components/totem/TotemCanvas";

export default function CadastroPage() {
  return (
    <TotemStage>
      <Suspense>
        <CadastroScreen />
      </Suspense>
    </TotemStage>
  );
}
