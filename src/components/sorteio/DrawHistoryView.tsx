"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

const PAGE_SIZE = 20;

type DrawEntry = {
  id: string;
  winner_nickname: string;
  winner_score: number;
  participant_count: number;
  drawn_at: string;
};

type DrawHistoryResponse = {
  items: DrawEntry[];
  total: number;
  limit: number;
  offset: number;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export function DrawHistoryView() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<DrawHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = page * PAGE_SIZE;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/sorteio/history?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as DrawHistoryResponse & { detail?: string };
      if (!res.ok) {
        setError(typeof json.detail === "string" ? json.detail : "Não foi possível carregar o histórico.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Sem conexão com a API.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-[clamp(16px,4vw,56px)] py-[clamp(24px,5vw,72px)] pb-24">
      <Link
        href="/ranking"
        className="fixed left-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[clamp(12px,1.5vw,20px)] font-semibold text-neutral-600 hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Ranking
      </Link>
      <Link
        href="/sorteio"
        className="fixed right-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[clamp(12px,1.5vw,20px)] font-semibold text-neutral-600 hover:border-neutral-500 hover:text-neutral-900"
      >
        Sorteio
      </Link>

      <p className="text-center text-[clamp(12px,2vw,28px)] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
        Histórico de Sorteios
      </p>
      <h1 className="mt-2 text-center text-[clamp(24px,5vw,68px)] font-bold text-neutral-900">
        Resultados anteriores
      </h1>

      <div className="mt-[clamp(24px,4vw,56px)] rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="py-16 text-center text-[clamp(15px,2.5vw,36px)] text-neutral-400">
            Carregando…
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-6 py-16">
            <p className="text-center text-[clamp(14px,2vw,28px)] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-[var(--accent)] px-[clamp(16px,2.5vw,36px)] py-[clamp(10px,1.5vw,22px)] text-[clamp(13px,1.8vw,26px)] font-bold text-white"
            >
              Tentar de novo
            </button>
          </div>
        ) : !data?.items.length ? (
          <p className="py-16 text-center text-[clamp(15px,2.5vw,36px)] text-neutral-400">
            Nenhum sorteio realizado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.items.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-[clamp(12px,2vw,32px)] px-[clamp(16px,4vw,60px)] py-[clamp(14px,3vw,44px)]"
              >
                <div className="flex min-w-0 items-center gap-[clamp(12px,2.5vw,36px)]">
                  <span className="flex h-[clamp(32px,6vw,82px)] w-[clamp(32px,6vw,82px)] shrink-0 items-center justify-center rounded-full border-2 border-neutral-200 bg-neutral-50 text-[clamp(12px,2vw,28px)] font-bold text-neutral-400">
                    {offset + idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[clamp(15px,3.5vw,50px)] font-bold text-neutral-900">
                      {row.winner_nickname}
                    </p>
                    <p className="mt-0.5 text-[clamp(11px,1.5vw,22px)] text-neutral-400">
                      {formatWhen(row.drawn_at)} · {row.participant_count} participante{row.participant_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 tabular-nums text-[clamp(14px,2.8vw,40px)] font-bold text-neutral-700">
                  {row.winner_score}{" "}
                  <span className="text-[clamp(11px,1.5vw,20px)] font-normal text-neutral-400">pts</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && total > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4">
          <p className="text-center text-[clamp(13px,1.8vw,26px)] text-neutral-400">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[clamp(13px,1.8vw,26px)] font-semibold text-neutral-500 disabled:opacity-35 hover:text-neutral-800"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[clamp(13px,1.8vw,26px)] font-semibold text-neutral-500 disabled:opacity-35 hover:text-neutral-800"
            >
              Próximo →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
