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
  const [q, setQ] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [picked, setPicked] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [questionNumber, setQuestionNumber] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOutcome("idle");
    setPicked(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/questions/random`, {
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
        return;
      }
      if (!data.options || data.options.length !== 4 || !data.layout_token) {
        setError("Formato de pergunta inválido na API.");
        setQ(null);
        return;
      }
      setQ(data);
    } catch {
      setError("Sem conexão com a API.");
      setQ(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTotalRounds(readTotemQuizQuestionCount());
    void load();
  }, [load]);

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
            : "Não foi possível validar a resposta."
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

  const answered = outcome !== "idle";
  const hasMoreAfterThis = answered && questionNumber < totalRounds;

  const optionStyle = (letter: "A" | "B" | "C" | "D") => {
    const base = `${totemTouch.optionRow}`;
    if (answered) {
      if (outcome === "correct" && letter === picked)
        return `${base} !border-emerald-500 !bg-emerald-50`;
      return `${base} opacity-40`;
    }
    if (letter === picked)
      return `${base} !border-neutral-900 !bg-neutral-100`;
    return `${base} active:border-neutral-400 enabled:active:bg-neutral-100`;
  };

  const header = (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <p className={`text-center text-neutral-900 ${totemText.kicker}`}>
        04 · Quiz
      </p>
      <p className={`text-neutral-900 ${totemText.caption}`} aria-live="polite">
        Pergunta {questionNumber}/{totalRounds}
      </p>
    </div>
  );

  /* Loading / error-without-question: full-width centered */
  if (loading || (error && !q)) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center px-[4%] pb-[4%] pt-[4%]">
        {header}
        {loading ? (
          <p className={`mt-[8%] text-center text-neutral-400 ${totemText.loading}`}>
            Carregando pergunta…
          </p>
        ) : (
          <div className="mt-[6%] flex flex-col items-center gap-8">
            <p className={`max-w-[95%] text-center text-red-600 ${totemText.error}`}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
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
            <p className={`text-neutral-900 ${totemText.prompt}`}>
              {q.prompt}
            </p>
          </div>
          {/* hint antes de responder; resultado depois — mesmo espaço, sem mover as opções */}
          {outcome === "correct" ? (
            <p className={`mt-3 text-center text-emerald-600 ${totemText.outcome}`}>
              Você acertou!
            </p>
          ) : outcome === "wrong" ? (
            <p className={`mt-3 text-center text-red-600 ${totemText.outcome}`}>
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
              <span className={`${totemTouch.optionBadge} ${
                picked === o.letter && !answered
                  ? "bg-neutral-900 text-white"
                  : answered && outcome === "correct" && picked === o.letter
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-200 text-neutral-900"
              } ${totemText.optionLetter}`}>
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
              disabled={loading}
              onClick={() => { setQuestionNumber((n) => n + 1); void load(); }}
              className={`bg-neutral-900 text-white disabled:opacity-50 ${totemTouch.btnPrimary}`}
            >
              {loading ? "Carregando…" : "Próxima pergunta →"}
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
