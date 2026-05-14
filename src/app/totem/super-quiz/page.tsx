import { SuperFaScreen } from "@/components/totem/SuperFaScreen";
import { TotemStage } from "@/components/totem/TotemCanvas";

export default function SuperQuizPage() {
  return (
    <TotemStage>
      <SuperFaScreen displayTitle="Super Quiz" enableQuestionTimer={false} />
    </TotemStage>
  );
}
