import { CpfRetornoScreen } from "@/components/totem/CpfRetornoScreen";
import { TotemStage } from "@/components/totem/TotemCanvas";

export default function NameLookupPage() {
  return (
    <TotemStage>
      <CpfRetornoScreen />
    </TotemStage>
  );
}
