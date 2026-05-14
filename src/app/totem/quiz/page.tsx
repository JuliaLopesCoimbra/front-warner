import { QuizQuestionScreen } from "@/components/totem/QuizQuestionScreen";
import { TotemStage } from "@/components/totem/TotemCanvas";

export default function QuizPage() {
  return (
    <TotemStage>
      <QuizQuestionScreen />
    </TotemStage>
  );
}
