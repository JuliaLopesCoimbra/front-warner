const STORAGE_KEY = "warner_totem_quiz_question_count";

const MIN = 1;
const MAX = 10;

export function readTotemQuizQuestionCount(): number {
  if (typeof window === "undefined") return MIN;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  const n = parseInt(raw ?? String(MIN), 10);
  if (Number.isNaN(n)) return MIN;
  return Math.min(MAX, Math.max(MIN, n));
}

export function writeTotemQuizQuestionCount(n: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    STORAGE_KEY,
    String(Math.min(MAX, Math.max(MIN, Math.floor(n)))),
  );
}
