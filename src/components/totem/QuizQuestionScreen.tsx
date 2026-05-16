"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";
import { readTotemParticipant } from "@/lib/totem-participant-storage";
import { readTotemQuizQuestionCount } from "@/lib/totem-quiz-storage";
import { totemText, totemTouch } from "@/lib/totem-ui";

type ShuffledOption = { letter: "A" | "B" | "C" | "D"; text: string };

type QuestionPayload = {
  id: string;
  prompt: string;
  options: ShuffledOption[];
  layout_token: string;
};

type Outcome = "idle" | "correct" | "wrong";

export function QuizQuestionScreen() {
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [picked, setPicked] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);

  const q = questions[questionIndex] ?? null;
  const questionNumber = questionIndex + 1;

  const loadSession = useCallback(async (count: number) => {
    setLoading(true);
    setError(null);
    setOutcome("idle");
    setPicked(null);
    setQuestionIndex(0);
    setQuestions([]);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/questions/session?count=${count}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as
        | QuestionPayload[]
        | { detail?: string };
      if (!res.ok) {
        const detail = (data as { detail?: string }).detail;
        setError(
          typeof detail === "string"
            ? detail
            : "Não foi possível carregar as perguntas.",
        );
        return;
      }
      const list = data as QuestionPayload[];
      if (
        !Array.isArray(list) ||
        list.length === 0 ||
        !list[0].options ||
        list[0].options.length !== 4
      ) {
        setError("Formato de perguntas inválido na API.");
        return;
      }
      setQuestions(list);
    } catch {
      setError("Sem conexão com a API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const count = readTotemQuizQuestionCount();
    setTotalRounds(count);
    void loadSession(count);
  }, [loadSession]);

  const enviar = useCallback(async () => {
    if (!q || !picked || outcome !== "idle" || submitting) return;
    setSubmitting(true);
    try {
      const participant = readTotemParticipant();
      const res = await fetch(`${getApiBaseUrl()}/questions/${q.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice: picked,
          layout_token: q.layout_token,
          ...(participant ? { participant_id: participant.id } : {}),
        }),
      });
      const data = (await res.json()) as { correct?: boolean; detail?: string };
      if (!res.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Não foi possível validar a resposta.",
        );
        return;
      }
      setError(null);
      setOutcome(data.correct ? "correct" : "wrong");
    } catch {
      setError("Sem conexão com a API.");
    } finally {
      setSubmitting(false);
    }
  }, [q, picked, outcome, submitting]);

  const nextQuestion = useCallback(() => {
    setOutcome("idle");
    setPicked(null);
    setError(null);
    setQuestionIndex((i) => i + 1);
  }, []);

  const answered = outcome !== "idle";
  const hasMoreAfterThis = answered && questionNumber < totalRounds;

  const optionStyle = (letter: "A" | "B" | "C" | "D") => {
    const base = `${totemTouch.optionRow}`;
    if (answered) {
      if (outcome === "correct" && letter === picked)
        return `${base} !border-emerald-500 !bg-emerald-50`;
      return `${base} opacity-40`;
    }
    if (letter === picked) return `${base} !border-neutral-900 !bg-neutral-100`;
    return `${base} active:border-neutral-400 enabled:active:bg-neutral-100`;
  };

  const header = (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <p className={`text-center text-neutral-900 ${totemText.kicker}`}>
        04 · Quiz
      </p>
      <p
        className={`text-neutral-900 ${totemText.caption}`}
        aria-live="polite"
      >
        Pergunta {questionNumber}/{totalRounds}
      </p>
    </div>
  );

  if (loading || (error && !q)) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center px-[4%] pb-[4%] pt-[4%]">
        {header}
        {loading ? (
          <p
            className={`mt-[8%] text-center text-neutral-400 ${totemText.loading}`}
          >
            Carregando pergunta…
          </p>
        ) : (
          <div className="mt-[6%] flex flex-col items-center gap-8">
            <p
              className={`max-w-[95%] text-center text-red-600 ${totemText.error}`}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadSession(totalRounds)}
              className={`bg-neutral-900 text-white ${totemTouch.btnRetry}`}
            >
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col landscape:flex-row">
      {/* LEFT: header + prompt */}
      <div className="flex flex-col px-[4%] pb-[3%] pt-[4%] landscape:w-[50%]">
        {header}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className={`w-full ${totemTouch.promptBox}`}>
            <p className={`text-neutral-900 ${totemText.prompt}`}>{q.prompt}</p>
          </div>
          {outcome === "correct" ? (
            <p
              className={`mt-3 text-center text-emerald-600 ${totemText.outcome}`}
            >
              Você acertou!
            </p>
          ) : outcome === "wrong" ? (
            <p
              className={`mt-3 text-center text-red-600 ${totemText.outcome}`}
            >
              Você errou
            </p>
          ) : (
            <p className={`mt-3 text-neutral-900 ${totemText.hint}`}>
              Selecione uma opção e toque em Enviar
            </p>
          )}
        </div>
      </div>

      {/* divider — totem only */}
      <div className="hidden landscape:block landscape:w-px landscape:self-stretch landscape:bg-neutral-200" />

      {/* RIGHT: options + buttons */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-[4%] pb-5 pt-5 landscape:w-[50%]">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {q.options.map((o) => (
            <button
              key={o.letter}
              type="button"
              disabled={answered || submitting}
              onClick={() => setPicked(o.letter)}
              className={optionStyle(o.letter)}
            >
              <span
                className={`${totemTouch.optionBadge} ${
                  picked === o.letter && !answered
                    ? "bg-neutral-900 text-white"
                    : answered && outcome === "correct" && picked === o.letter
                      ? "bg-emerald-500 text-white"
                      : "bg-neutral-200 text-neutral-900"
                } ${totemText.optionLetter}`}
              >
                {o.letter}
              </span>
              <span className={`text-neutral-800 ${totemText.optionText}`}>
                {o.text}
              </span>
            </button>
          ))}
        </div>

        {error && q ? (
          <p className={`text-center text-amber-600 ${totemText.warn}`}>
            {error}
          </p>
        ) : null}

        <div className="flex shrink-0 flex-col gap-3">
          {!answered ? (
            <button
              type="button"
              disabled={!picked || submitting}
              onClick={enviar}
              className={`bg-neutral-900 text-white disabled:opacity-40 ${totemTouch.btnPrimary}`}
            >
              {submitting ? "Enviando…" : "Enviar →"}
            </button>
          ) : null}
          {hasMoreAfterThis ? (
            <button
              type="button"
              onClick={nextQuestion}
              className={`bg-neutral-900 text-white ${totemTouch.btnPrimary}`}
            >
              Próxima pergunta →
            </button>
          ) : null}
          {answered && !hasMoreAfterThis ? (
            <Link
              href="/"
              className={`bg-neutral-900 text-white active:bg-neutral-700 ${totemTouch.btnPrimary}`}
            >
              Reiniciar
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
