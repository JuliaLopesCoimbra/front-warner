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
    <div
      className="h-screen overflow-hidden bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fundo.JPEG')" }}
    >
      <div className="relative mx-auto flex h-full max-w-4xl flex-col px-[clamp(16px,3vw,48px)]" style={{ paddingTop: "clamp(48px,6vh,72px)", paddingBottom: "clamp(12px,2vh,28px)" }}>

        {/* Cabeçalho */}
        <div className="shrink-0">
          <p className="text-center text-[clamp(11px,1.6vh,26px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
            Ranking
          </p>
          <h1 className="mt-1 text-center text-[clamp(16px,3.5vh,60px)] font-bold tracking-tight text-neutral-900">
            Participantes e pontuações
          </h1>
        </div>

        {/* Lista — flex-1 para ocupar o espaço disponível */}
        <div className="mt-[clamp(10px,1.5vh,20px)] flex-1 min-h-0 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <p className="flex h-full items-center justify-center text-[clamp(13px,1.8vh,22px)] text-neutral-400">
              Carregando…
            </p>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-center text-[clamp(13px,1.8vh,22px)] text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-neutral-900 px-6 py-2.5 text-[clamp(13px,1.6vh,20px)] font-bold text-white"
              >
                Tentar de novo
              </button>
            </div>
          ) : !data?.items.length ? (
            <p className="flex h-full items-center justify-center text-[clamp(13px,1.8vh,22px)] text-neutral-400">
              Nenhum participante cadastrado ainda.
            </p>
          ) : (
            <ul className="flex h-full flex-col divide-y divide-neutral-100">
              {data.items.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-1 items-center justify-between gap-[clamp(8px,1.5vw,24px)] px-[clamp(12px,3vw,40px)]"
                >
                  <div className="flex min-w-0 items-center gap-[clamp(8px,2vw,28px)]">
                    <span className="flex h-[clamp(28px,4vh,72px)] w-[clamp(28px,4vh,72px)] shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 bg-white text-[clamp(12px,2vh,34px)] font-bold text-neutral-900">
                      {row.rank}
                    </span>
                    <span className="truncate text-[clamp(14px,2.8vh,48px)] font-semibold text-neutral-900">
                      {row.nickname}
                    </span>
                  </div>
                  <span className="shrink-0 tabular-nums text-[clamp(15px,3.2vh,54px)] font-bold text-neutral-800">
                    {row.score}{" "}
                    <span className="text-[clamp(11px,1.6vh,26px)] font-normal text-neutral-400">pts</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Paginação */}
        {!loading && !error && total > 0 && (
          <div className="mt-[clamp(8px,1.2vh,16px)] shrink-0 flex justify-center gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-1.5 text-[clamp(11px,1.3vh,16px)] font-medium text-neutral-500 disabled:cursor-not-allowed disabled:opacity-35 hover:text-neutral-800"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-1.5 text-[clamp(11px,1.3vh,16px)] font-medium text-neutral-500 disabled:cursor-not-allowed disabled:opacity-35 hover:text-neutral-800"
            >
              Próximo →
            </button>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-[clamp(6px,1vh,14px)] shrink-0 text-center">
          <Link
            href="/"
            className="text-[clamp(11px,1.3vh,16px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
