"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

const PAGE_SIZE = 10;

type RankingEntry = {
  rank: number;
  id: string;
  nickname: string;
  score: number;
};

type RankingResponse = {
  items: RankingEntry[];
  total: number;
  limit: number;
  offset: number;
};

export function RankingView() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = page * PAGE_SIZE;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/participants/ranking?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as RankingResponse & { detail?: string };
      if (!res.ok) {
        setError(
          typeof json.detail === "string"
            ? json.detail
            : "Não foi possível carregar o ranking."
        );
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
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/fundo.JPEG')" }}>
    <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-[clamp(16px,4vw,56px)] py-[clamp(24px,5vw,72px)] pb-24">
      <Link
        href="/historico"
        className="fixed left-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[clamp(12px,1.5vw,20px)] font-semibold text-neutral-600 hover:border-neutral-500 hover:text-neutral-900"
      >
        Histórico
      </Link>
      <Link
        href="/sorteio"
        className="fixed right-[clamp(12px,2vw,28px)] top-[clamp(12px,2vw,28px)] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[clamp(12px,1.5vw,20px)] font-semibold text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
      >
        Sorteio
      </Link>

      {/* Cabeçalho */}
      <p className="text-center text-[clamp(12px,3vw,38px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
        Ranking
      </p>
      <h1 className="mt-3 text-center text-[clamp(24px,8vw,110px)] font-bold tracking-tight text-neutral-900">
        Participantes e pontuações
      </h1>

      {/* Lista */}
      <div className="mt-[clamp(24px,4vw,56px)] rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="py-20 text-center text-[clamp(15px,3vw,42px)] text-neutral-400">
            Carregando…
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <p className="text-center text-[clamp(15px,3vw,42px)] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-neutral-900 px-[clamp(20px,4vw,56px)] py-[clamp(12px,2.5vw,36px)] text-[clamp(14px,2.8vw,40px)] font-bold text-white"
            >
              Tentar de novo
            </button>
          </div>
        ) : !data?.items.length ? (
          <p className="py-20 text-center text-[clamp(15px,3vw,42px)] text-neutral-400">
            Nenhum participante cadastrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-[clamp(12px,2vw,32px)] px-[clamp(16px,4vw,60px)] py-[clamp(14px,4vw,56px)]"
              >
                <div className="flex min-w-0 items-center gap-[clamp(12px,3vw,44px)]">
                  <span className="flex h-[clamp(38px,9vw,122px)] w-[clamp(38px,9vw,122px)] shrink-0 items-center justify-center rounded-full border-[3px] border-neutral-900 bg-white text-[clamp(14px,3.5vw,48px)] font-bold text-neutral-900">
                    {row.rank}
                  </span>
                  <span className="truncate text-[clamp(16px,5vw,70px)] font-semibold text-neutral-900">
                    {row.nickname}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums text-[clamp(18px,5.5vw,76px)] font-bold text-neutral-800">
                  {row.score}{" "}
                  <span className="text-[clamp(12px,2.2vw,30px)] font-normal text-neutral-400">pts</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginação */}
      {!loading && !error && total > 0 ? (
        <div className="mt-[clamp(20px,3.5vw,48px)] flex flex-col items-center gap-5">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 disabled:cursor-not-allowed disabled:opacity-35 hover:text-neutral-800"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 disabled:cursor-not-allowed disabled:opacity-35 hover:text-neutral-800"
            >
              Próximo →
            </button>
          </div>
        </div>
      ) : null}

      {/* Links */}
      <div className="mt-[clamp(28px,5vw,64px)] flex flex-col gap-[clamp(10px,1.8vw,24px)] text-center">
        <Link
          href="/"
          className="text-[clamp(14px,2.2vw,32px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
    </div>
  );
}
