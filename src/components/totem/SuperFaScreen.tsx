"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";
import { totemText, totemTouch } from "@/lib/totem-ui";

const QUIZ_SECONDS = 15;

type ShuffledOption = { letter: "A" | "B" | "C" | "D"; text: string };

type QuestionPayload = {
  id: string;
  prompt: string;
  options: ShuffledOption[];
  layout_token: string;
};

type View =
  | "intro"
  | "cd3"
  | "cd2"
  | "cd1"
  | "question"
  | "question_loading";

type Outcome = "idle" | "correct" | "wrong" | "timeout";

type SuperFaScreenProps = {
  /** Título exibido (ex.: "Super FA" ou "Super Quiz"). */
  displayTitle?: string;
  /** Contagem por pergunta (Super FA). Super Quiz costuma deixar desligado. */
  enableQuestionTimer?: boolean;
};

export function SuperFaScreen({
  displayTitle = "Super FA",
  enableQuestionTimer = true,
}: SuperFaScreenProps) {
  const [view, setView] = useState<View>("intro");
  const [q, setQ] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [picked, setPicked] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetQuestionState = useCallback(() => {
    clearTick();
    setQ(null);
    setOutcome("idle");
    setPicked(null);
    setSubmitting(false);
    setSecondsLeft(QUIZ_SECONDS);
    setError(null);
    setLoading(false);
  }, [clearTick]);

  const goIntro = useCallback(() => {
    resetQuestionState();
    setView("intro");
  }, [resetQuestionState]);

  const beginQuizTimer = useCallback(() => {
    if (!enableQuestionTimer) return;
    clearTick();
    setSecondsLeft(QUIZ_SECONDS);
    setOutcome("idle");
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTick();
          setOutcome((curr) => (curr === "idle" ? "timeout" : curr));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clearTick, enableQuestionTimer]);

  const loadQuestion = useCallback(async () => {
    clearTick();
    setQ(null);
    setLoading(true);
    setError(null);
    setOutcome("idle");
    setPicked(null);
    setSecondsLeft(QUIZ_SECONDS);
    setView("question_loading");
    try {
      const res = await fetch(`${getApiBaseUrl()}/super-fa/questions/random`, {
        cache: "no-store",
      });
      const data = (await res.json()) as QuestionPayload & { detail?: string };
      if (!res.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Não foi possível carregar a pergunta."
        );
        setQ(null);
        setView("question");
        return;
      }
      if (
        !data.options ||
        data.options.length !== 4 ||
        !data.layout_token
      ) {
        setError("Formato de pergunta inválido na API.");
        setQ(null);
        setView("question");
        return;
      }
      setQ(data);
      setView("question");
    } catch {
      setError("Sem conexão com a API.");
      setQ(null);
      setView("question");
    } finally {
      setLoading(false);
    }
  }, [clearTick]);

  useEffect(() => {
    if (view === "cd3") {
      const t = setTimeout(() => setView("cd2"), 1000);
      return () => clearTimeout(t);
    }
    if (view === "cd2") {
      const t = setTimeout(() => setView("cd1"), 1000);
      return () => clearTimeout(t);
    }
    if (view === "cd1") {
      const t = setTimeout(() => {
        void loadQuestion();
      }, 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [view, loadQuestion]);

  useEffect(() => {
    if (!enableQuestionTimer) return undefined;
    if (view !== "question" || !q || loading) return undefined;
    beginQuizTimer();
    return () => {
      clearTick();
    };
  }, [
    enableQuestionTimer,
    view,
    q?.id,
    q?.layout_token,
    loading,
    beginQuizTimer,
    clearTick,
  ]);

  const submitChoice = useCallback(
    async (choice: "A" | "B" | "C" | "D") => {
      if (!q || outcome !== "idle" || submitting) return;
      if (enableQuestionTimer) clearTick();
      setSubmitting(true);
      setPicked(choice);
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/super-fa/questions/${q.id}/answer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              choice,
              layout_token: q.layout_token,
            }),
          }
        );
        const data = (await res.json()) as { correct?: boolean; detail?: string };
        if (!res.ok) {
          setPicked(null);
          setOutcome("idle");
          setError(
            typeof data.detail === "string"
              ? data.detail
              : "Não foi possível validar a resposta."
          );
          if (enableQuestionTimer) beginQuizTimer();
          return;
        }
        setError(null);
        setOutcome(data.correct ? "correct" : "wrong");
      } catch {
        setPicked(null);
        setOutcome("idle");
        setError("Sem conexão com a API.");
        if (enableQuestionTimer) beginQuizTimer();
      } finally {
        setSubmitting(false);
      }
    },
    [q, outcome, submitting, clearTick, beginQuizTimer, enableQuestionTimer]
  );

  const optionClass = (key: "A" | "B" | "C" | "D", base: string) => {
    if (outcome === "idle") return base;
    if (outcome === "correct" && picked === key) {
      return `${base} !border-emerald-500 !bg-emerald-50 text-emerald-800`;
    }
    return `${base} opacity-40`;
  };

  const answered = outcome !== "idle";
  const timerUrgent =
    enableQuestionTimer &&
    outcome === "idle" &&
    secondsLeft > 0 &&
    secondsLeft <= 5;
  const showCountdown = view === "cd3" || view === "cd2" || view === "cd1";
  const countdownLabel = view === "cd3" ? "3" : view === "cd2" ? "2" : "1";
  const showQuestionUi = view === "question" || view === "question_loading";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col px-[4%] pb-[4%] pt-[4%]">
      {view !== "intro" ? (
        <p className={`text-center text-neutral-900 ${totemText.kicker}`}>
          {displayTitle}
        </p>
      ) : null}

      {view === "intro" ? (
        <button
          type="button"
          onClick={() => setView("cd3")}
          className="flex min-h-0 flex-1 w-full items-center justify-center"
        >
          <p className={`mt-[20%] text-center font-bold uppercase tracking-[0.16em] text-neutral-600 ${totemText.title}`}>
            Toque para iniciar o Super Quiz
          </p>
        </button>
      ) : null}

      {showCountdown ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/90">
          <span className="text-[clamp(100px,34vmin,380px)] font-black tabular-nums text-white">
            {countdownLabel}
          </span>
        </div>
      ) : null}

      {showQuestionUi ? (
        <>
          {loading || view === "question_loading" ? (
            <p className={`mt-[12%] text-center text-neutral-400 ${totemText.loading}`}>
              Carregando pergunta…
            </p>
          ) : error && !q ? (
            <div className="mt-[6%] flex flex-1 flex-col items-center gap-8">
              <p className={`max-w-[95%] text-center text-red-600 ${totemText.error}`}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadQuestion()}
                className={`bg-neutral-900 text-white ${totemTouch.btnRetry}`}
              >
                Tentar de novo
              </button>
              <button
                type="button"
                onClick={goIntro}
                className={`font-semibold text-neutral-500 underline-offset-4 hover:text-neutral-700 hover:underline ${totemText.body}`}
              >
                Voltar ao início
              </button>
            </div>
          ) : q ? (
            <>
              {enableQuestionTimer ? (
                <div className="mt-[2%] flex items-center justify-between gap-4 px-1">
                  <p className={`text-neutral-400 ${totemText.caption}`}>
                    Tempo
                  </p>
                  <div
                    className={`${totemTouch.timerCircle} ${totemText.timerNum} ${
                      answered
                        ? "border-neutral-300 text-neutral-400"
                        : timerUrgent
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-neutral-900 bg-neutral-100 text-neutral-900"
                    }`}
                    aria-live="polite"
                  >
                    {answered ? "—" : secondsLeft}
                  </div>
                </div>
              ) : null}

              <div
                className={`shrink-0 ${totemTouch.promptBox} ${enableQuestionTimer ? "mt-[2%]" : "mt-[6%]"}`}
              >
                <p className={`text-neutral-900 ${totemText.prompt}`}>
                  {q.prompt}
                </p>
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center gap-3">
                {q.options.map((o) => (
                  <button
                    key={o.letter}
                    type="button"
                    disabled={answered || submitting}
                    onClick={() => void submitChoice(o.letter)}
                    className={optionClass(
                      o.letter,
                      `${totemTouch.optionRow} active:border-neutral-400 enabled:active:bg-neutral-100`
                    )}
                  >
                    <span className={`${totemTouch.optionBadge} bg-neutral-200 ${totemText.optionLetter} text-neutral-900`}>
                      {o.letter}
                    </span>
                    <span className={`text-neutral-800 ${totemText.optionText}`}>
                      {o.text}
                    </span>
                  </button>
                ))}
              </div>

              {outcome === "correct" ? (
                <p className={`mt-3 text-center text-emerald-600 ${totemText.outcome}`}>
                  Você acertou!
                </p>
              ) : null}
              {outcome === "wrong" ? (
                <p className={`mt-3 text-center text-red-600 ${totemText.outcome}`}>
                  Você errou
                </p>
              ) : null}
              {outcome === "timeout" ? (
                <p className={`mt-3 text-center text-red-600 ${totemText.outcome}`}>
                  Você não respondeu a tempo
                </p>
              ) : null}

              {error && q ? (
                <p className={`mt-2 text-center text-amber-600 ${totemText.warn}`}>
                  {error}
                </p>
              ) : null}
            </>
          ) : null}

          {q && answered ? (
            <div className="mt-auto flex shrink-0 flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={goIntro}
                className={`bg-neutral-900 text-white active:bg-neutral-700 ${totemTouch.btnPrimary}`}
              >
                Reiniciar
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
