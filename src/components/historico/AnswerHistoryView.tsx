"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

const PAGE_SIZE = 30;

type Tab = "main" | "superfa";

type MainEntry = {
  id: string;
  answered_at: string;
  participant_id: string | null;
  participant_nickname: string | null;
  question_id: string | null;
  question_prompt: string;
  choice_letter: string;
  choice_text: string;
  is_correct: boolean;
};

type SuperFaEntry = {
  id: string;
  attempted_at: string;
  super_fa_question_id: string | null;
  question_prompt: string;
  choice_letter: string;
  choice_text: string;
  is_correct: boolean;
};

type Paged<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export function AnswerHistoryView() {
  const [tab, setTab] = useState<Tab>("main");
  const [page, setPage] = useState(0);
  const [mainData, setMainData] = useState<Paged<MainEntry> | null>(null);
  const [superData, setSuperData] = useState<Paged<SuperFaEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = page * PAGE_SIZE;

  useEffect(() => {
    setPage(0);
  }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "main") {
        const res = await fetch(
          `${getApiBaseUrl()}/questions/answer-history?limit=${PAGE_SIZE}&offset=${offset}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as Paged<MainEntry> & { detail?: string };
        if (!res.ok) {
          setError(
            typeof json.detail === "string"
              ? json.detail
              : "Não foi possível carregar o histórico."
          );
          setMainData(null);
          return;
        }
        setMainData(json);
      } else {
        const res = await fetch(
          `${getApiBaseUrl()}/super-fa/questions/answer-history?limit=${PAGE_SIZE}&offset=${offset}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as Paged<SuperFaEntry> & { detail?: string };
        if (!res.ok) {
          setError(
            typeof json.detail === "string"
              ? json.detail
              : "Não foi possível carregar o histórico Super Quiz."
          );
          setSuperData(null);
          return;
        }
        setSuperData(json);
      }
    } catch {
      setError("Sem conexão com a API.");
      setMainData(null);
      setSuperData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const data = tab === "main" ? mainData : superData;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : offset + 1;
  const to = total === 0 ? 0 : Math.min(offset + PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/fundo.JPEG')" }}>
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-[clamp(16px,4vw,56px)] py-[clamp(24px,5vw,72px)] pb-24">
      <Link
        href="/ranking"
        className="fixed left-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-[clamp(12px,2vw,28px)] py-[clamp(6px,1.2vw,18px)] text-[clamp(13px,2vw,28px)] font-semibold text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
      >
        Ranking
      </Link>
      <Link
        href="/sorteio"
        className="fixed right-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-[clamp(12px,2vw,28px)] py-[clamp(6px,1.2vw,18px)] text-[clamp(13px,2vw,28px)] font-semibold text-neutral-600 hover:border-neutral-500 hover:text-neutral-900"
      >
        Sorteio
      </Link>
      <p className="text-center text-[clamp(14px,3vw,42px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
        Histórico
      </p>
      <h1 className="mt-2 text-center text-[clamp(28px,7vw,96px)] font-bold text-neutral-900">
        {tab === "main" ? "Quiz totem" : "Super Quiz"}
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[clamp(14px,2.5vw,36px)] text-neutral-500">
        {tab === "main"
          ? "Participante, pergunta, opção escolhida e data/hora."
          : "Tentativas sem cadastro: pergunta, opção escolhida e data/hora."}
      </p>

      <div className="mx-auto mt-6 flex rounded-full border-2 border-neutral-200 bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab("main")}
          className={`rounded-full px-[clamp(20px,3.5vw,52px)] py-[clamp(10px,1.8vw,26px)] text-[clamp(14px,2.5vw,36px)] font-bold transition-colors ${
            tab === "main"
              ? "bg-neutral-900 text-white"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Quiz totem
        </button>
        <button
          type="button"
          onClick={() => setTab("superfa")}
          className={`rounded-full px-[clamp(20px,3.5vw,52px)] py-[clamp(10px,1.8vw,26px)] text-[clamp(14px,2.5vw,36px)] font-bold transition-colors ${
            tab === "superfa"
              ? "bg-neutral-900 text-white"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Super Quiz
        </button>
      </div>

      <div className="mt-8 min-h-[10rem] rounded-2xl border border-neutral-200 bg-white p-[clamp(16px,3vw,48px)] shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-[clamp(16px,3.5vw,50px)] text-neutral-400">Carregando…</p>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-center text-[clamp(15px,3vw,42px)] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-neutral-900 px-[clamp(20px,3.5vw,52px)] py-[clamp(12px,2.2vw,32px)] text-[clamp(14px,2.5vw,36px)] font-bold text-white"
            >
              Tentar de novo
            </button>
          </div>
        ) : !data?.items.length ? (
          <p className="py-12 text-center text-[clamp(16px,3.5vw,50px)] text-neutral-400">Nenhum registro ainda.</p>
        ) : tab === "main" ? (
          <ul className="divide-y divide-neutral-100">
            {(data as Paged<MainEntry>).items.map((row) => (
              <li key={row.id} className="py-[clamp(18px,3.5vw,52px)] first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[clamp(13px,2vw,30px)] text-neutral-400">{formatWhen(row.answered_at)}</p>
                  <span
                    className={
                      row.is_correct
                        ? "rounded-full bg-emerald-100 px-[clamp(10px,1.8vw,26px)] py-0.5 text-[clamp(12px,2vw,28px)] font-bold text-emerald-700"
                        : "rounded-full bg-red-100 px-[clamp(10px,1.8vw,26px)] py-0.5 text-[clamp(12px,2vw,28px)] font-bold text-red-600"
                    }
                  >
                    {row.is_correct ? "Correto" : "Errado"}
                  </span>
                </div>
                <p className="mt-1 text-[clamp(18px,3.5vw,50px)] font-semibold text-neutral-900">
                  {row.participant_nickname ?? "—"}
                  {!row.participant_id ? (
                    <span className="ml-1 font-normal text-neutral-400">
                      (sem participante no totem)
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-[clamp(16px,3vw,44px)] text-neutral-700">{row.question_prompt}</p>
                <p className="mt-1 text-[clamp(14px,2.5vw,36px)] text-neutral-500">
                  Resposta: <strong className="text-neutral-900">{row.choice_letter}</strong>{" "}
                  — {row.choice_text}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(data as Paged<SuperFaEntry>).items.map((row) => (
              <li key={row.id} className="py-[clamp(18px,3.5vw,52px)] first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[clamp(13px,2vw,30px)] text-neutral-400">{formatWhen(row.attempted_at)}</p>
                  <span
                    className={
                      row.is_correct
                        ? "rounded-full bg-emerald-100 px-[clamp(10px,1.8vw,26px)] py-0.5 text-[clamp(12px,2vw,28px)] font-bold text-emerald-700"
                        : "rounded-full bg-red-100 px-[clamp(10px,1.8vw,26px)] py-0.5 text-[clamp(12px,2vw,28px)] font-bold text-red-600"
                    }
                  >
                    {row.is_correct ? "Correto" : "Errado"}
                  </span>
                </div>
                <p className="mt-2 text-[clamp(16px,3vw,44px)] text-neutral-700">{row.question_prompt}</p>
                <p className="mt-1 text-[clamp(14px,2.5vw,36px)] text-neutral-500">
                  Resposta: <strong className="text-neutral-900">{row.choice_letter}</strong> —{" "}
                  {row.choice_text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && total > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4">
          <p className="text-center text-[clamp(14px,2.5vw,36px)] text-neutral-400">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-neutral-300 bg-white px-[clamp(12px,2vw,28px)] py-[clamp(8px,1.5vw,22px)] text-[clamp(14px,2.5vw,36px)] font-semibold text-neutral-500 disabled:opacity-35 hover:text-neutral-800"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-neutral-300 bg-white px-[clamp(12px,2vw,28px)] py-[clamp(8px,1.5vw,22px)] text-[clamp(14px,2.5vw,36px)] font-semibold text-neutral-500 disabled:opacity-35 hover:text-neutral-800"
            >
              Próximo →
            </button>
          </div>
        </div>
      ) : null}

    </div>
    </div>
  );
}
