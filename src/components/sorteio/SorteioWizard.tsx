"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

const TICK_START_MS = 80;
const TICK_END_MS = 650;

type Candidate = {
  id: string;
  nickname: string;
  score: number;
};

type ApiResponse = {
  items: Candidate[];
  total_registered: number;
};

type Step = "select" | "review" | "draw";

function pickRandomIndex(n: number): number {
  if (n <= 0) return 0;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % n;
}

function buildSchedule(): number[] {
  const delays: number[] = [];
  let elapsed = 0;
  let delay = TICK_START_MS;
  while (elapsed < 5_500) {
    const d = Math.round(delay);
    delays.push(d);
    elapsed += d;
    delay = Math.min(TICK_END_MS, delay * 1.065);
  }
  return delays;
}

// Matches CSS h-[clamp(66px,17.3vh,187px)]
function getItemHPx(): number {
  if (typeof window === "undefined") return 100;
  return Math.min(187, Math.max(66, window.innerHeight * 0.173));
}

export function SorteioWizard() {
  const [step, setStep] = useState<Step>("select");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [winner, setWinner] = useState<Candidate | null>(null);
  const [slotItems, setSlotItems] = useState<Candidate[]>([]);
  const [slotOffset, setSlotOffset] = useState(0);
  const [slotTransMs, setSlotTransMs] = useState(TICK_START_MS);
  const [slotAnimating, setSlotAnimating] = useState(false);
  const [animRunning, setAnimRunning] = useState(false);

  const animTickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapeRef = useRef<Candidate[]>([]);
  const tapePosRef = useRef(1);
  const scheduleRef = useRef<number[]>([]);
  const tickIdxRef = useRef(0);
  const pickedWinnerRef = useRef<Candidate | null>(null);

  const selectedList = useMemo(
    () => candidates.filter((c) => selectedIds.has(c.id)),
    [candidates, selectedIds]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/participants/draw-candidates`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse & { detail?: string };
      if (!res.ok) {
        setError(
          typeof json.detail === "string"
            ? json.detail
            : "Não foi possível carregar os participantes."
        );
        setCandidates([]);
        setTotalRegistered(0);
        return;
      }
      setCandidates(json.items ?? []);
      setTotalRegistered(json.total_registered ?? json.items?.length ?? 0);
    } catch {
      setError("Sem conexão com a API.");
      setCandidates([]);
      setTotalRegistered(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (animTickRef.current !== null) clearTimeout(animTickRef.current);
    };
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(candidates.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  const confirmReview = () => {
    const pool = selectedList;
    if (pool.length === 0) return;

    if (animTickRef.current !== null) clearTimeout(animTickRef.current);

    const schedule = buildSchedule();
    scheduleRef.current = schedule;
    tickIdxRef.current = 0;

    const pickedWinner = pool[pickRandomIndex(pool.length)]!;
    pickedWinnerRef.current = pickedWinner;

    const tapeLen = schedule.length + 6;
    const tape: Candidate[] = [];
    for (let i = 0; i < tapeLen; i++) {
      tape.push(pool[pickRandomIndex(pool.length)]!);
    }
    tape[tapeLen - 2] = pickedWinner;
    tapeRef.current = tape;
    tapePosRef.current = 1;

    const getItem = (i: number) =>
      tape[Math.max(0, Math.min(tape.length - 1, i))]!;

    setSlotItems([getItem(0), getItem(1), getItem(2), getItem(3)]);
    setSlotOffset(0);
    setSlotAnimating(false);
    setSlotTransMs(TICK_START_MS);
    setWinner(null);
    setAnimRunning(true);
    setStep("draw");

    function runTick() {
      const tape = tapeRef.current;
      const pos = tapePosRef.current;
      const si = tickIdxRef.current;
      const delay = scheduleRef.current[si] ?? TICK_END_MS;
      const iH = getItemHPx();

      setSlotTransMs(delay);
      setSlotAnimating(true);
      setSlotOffset(-iH);

      animTickRef.current = setTimeout(() => {
        const newPos = pos + 1;
        tapePosRef.current = newPos;
        tickIdxRef.current = si + 1;

        const getI = (i: number) =>
          tape[Math.max(0, Math.min(tape.length - 1, i))]!;

        setSlotAnimating(false);
        setSlotOffset(0);
        setSlotItems([getI(newPos - 1), getI(newPos), getI(newPos + 1), getI(newPos + 2)]);

        if (newPos >= tape.length - 2) {
          setAnimRunning(false);
          setTimeout(() => {
            const w = pickedWinnerRef.current;
            setWinner(w);
            if (w) {
              void fetch(`${getApiBaseUrl()}/sorteio/record`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  winner_nickname: w.nickname,
                  winner_score: w.score,
                  participant_count: pool.length,
                }),
              });
            }
          }, 400);
          return;
        }

        requestAnimationFrame(() => requestAnimationFrame(runTick));
      }, delay);
    }

    animTickRef.current = setTimeout(runTick, 200);
  };

  const truncated = totalRegistered > candidates.length;

  const btnBase =
    "min-h-[clamp(44px,7vh,84px)] rounded-xl px-[clamp(16px,3vw,48px)] text-[clamp(14px,2.2vh,26px)] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const btnPrimary = `${btnBase} bg-neutral-900 text-white hover:opacity-90`;
  const btnGhost = `${btnBase} border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`;

  return (
    <div
      className="h-screen overflow-hidden bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fundo.JPEG')" }}
    >
      <div className="mx-auto flex h-full max-w-5xl flex-col px-[clamp(16px,3vw,48px)] pt-[clamp(20px,3vh,44px)] pb-[clamp(12px,2vh,24px)]">

        {step !== "draw" ? (
          <>
            <p className="shrink-0 text-center text-[clamp(12px,2vh,26px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
              Sorteio
            </p>
            <h1 className="mt-[1vh] shrink-0 text-center text-[clamp(20px,5vh,60px)] font-bold text-neutral-900">
              {step === "select" ? "Selecione os participantes" : "Revisar seleção"}
            </h1>
          </>
        ) : null}

        {loading ? (
          <p className="mt-[4vh] text-center text-[clamp(14px,2.5vh,28px)] text-neutral-400">
            Carregando cadastros…
          </p>
        ) : error ? (
          <div className="mt-[3vh] flex flex-col items-center gap-4">
            <p className="text-center text-[clamp(13px,2vh,24px)] text-red-600">{error}</p>
            <button type="button" className={btnPrimary} onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        ) : step === "select" ? (
          <>
            <p className="mx-auto mt-[1vh] shrink-0 max-w-3xl text-center text-[clamp(12px,1.8vh,20px)] text-neutral-500">
              Lista ordenada por{" "}
              <strong className="text-neutral-800">maior pontuação</strong>. Marque quem entra no
              sorteio e toque em <strong className="text-neutral-800">Próximo</strong>.
            </p>
            <p className="mt-[0.5vh] shrink-0 text-center text-[clamp(11px,1.5vh,18px)] text-neutral-400">
              Total cadastrados: {totalRegistered}
              {truncated
                ? ` · exibindo primeiros ${candidates.length} (limite 10.000 nesta tela)`
                : ` · ${candidates.length} na lista`}
            </p>

            <div className="mt-[2vh] flex shrink-0 flex-wrap justify-center gap-3">
              <button type="button" className={btnGhost} onClick={selectAll}>
                Selecionar todos
              </button>
              <button type="button" className={btnGhost} onClick={selectNone}>
                Limpar seleção
              </button>
            </div>

            <ul className="mt-[2vh] min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {candidates.map((c, idx) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-[clamp(10px,2vw,28px)] px-[clamp(12px,3vw,44px)] py-[clamp(10px,1.8vh,22px)] hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-[clamp(16px,2.5vh,28px)] w-[clamp(16px,2.5vh,28px)] shrink-0 rounded border-neutral-300 accent-neutral-900"
                    />
                    <span className="w-[clamp(22px,3vw,42px)] shrink-0 text-right text-[clamp(12px,1.8vh,20px)] text-neutral-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[clamp(13px,2.2vh,26px)] font-semibold text-neutral-900">
                        {c.nickname}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-[2vh] shrink-0 flex justify-center">
              <button
                type="button"
                disabled={selectedIds.size === 0}
                className={btnPrimary}
                onClick={() => setStep("review")}
              >
                Próximo →
              </button>
            </div>

            <div className="mt-[1vh] shrink-0 flex flex-col items-center gap-2">
              <Link
                href="/sorteio-historico"
                className="text-[clamp(12px,1.6vh,18px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
              >
                Ver histórico de sorteios →
              </Link>
              <Link
                href="/"
                className="text-[clamp(12px,1.6vh,18px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
              >
                ← Voltar ao início
              </Link>
            </div>
          </>
        ) : step === "review" ? (
          <>
            <p className="mx-auto mt-[1vh] shrink-0 max-w-3xl text-center text-[clamp(12px,1.8vh,20px)] text-neutral-500">
              Confira os selecionados. Ao confirmar, a animação começa e um ganhador aleatório é sorteado.
            </p>

            <ul className="mt-[2vh] min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {selectedList.map((c) => (
                <li
                  key={c.id}
                  className="px-[clamp(12px,3vw,44px)] py-[clamp(10px,1.8vh,22px)]"
                >
                  <p className="text-[clamp(13px,2.2vh,26px)] font-semibold text-neutral-900">
                    {c.nickname}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-[2vh] shrink-0 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" className={btnGhost} onClick={() => setStep("select")}>
                ← Voltar
              </button>
              <button type="button" className={btnPrimary} onClick={confirmReview}>
                Confirmar e sortear
              </button>
            </div>
          </>
        ) : (
          /* Draw step — full-screen overlay */
          <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-[clamp(12px,3vh,40px)] bg-white px-[clamp(16px,4vw,56px)] py-[clamp(16px,3vh,44px)]">
            <p className="text-center text-[clamp(12px,2.5vh,30px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
              {winner ? "Resultado" : animRunning ? "Sorteando…" : "Veja o resultado!"}
            </p>

            {/* Slot machine — 3 itens visíveis (container = 3 × item height) */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg h-[clamp(200px,52vh,562px)]">
              <div className="pointer-events-none absolute inset-x-0 top-1/3 h-1/3 border-y-2 border-neutral-900 bg-neutral-900/5 z-10" />
              <div
                style={{
                  transform: `translateY(${slotOffset}px)`,
                  transition: slotAnimating ? `transform ${slotTransMs}ms linear` : "none",
                }}
              >
                {slotItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex h-[clamp(66px,17.3vh,187px)] items-center justify-center px-[clamp(16px,4vw,56px)]"
                  >
                    <span
                      className={`max-w-full truncate text-center font-black ${
                        idx === 1
                          ? "text-[clamp(22px,5vh,60px)] text-neutral-900"
                          : "text-[clamp(14px,3vh,36px)] text-neutral-300"
                      }`}
                    >
                      {item.nickname}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {winner ? (
              <>
                <p className="text-center text-[clamp(20px,5vh,60px)] font-black uppercase tracking-[0.12em] text-emerald-600">
                  Você ganhou!
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      selectNone();
                      setStep("select");
                    }}
                  >
                    Novo sorteio (limpar seleção)
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => confirmReview()}
                  >
                    Sortear de novo (mesma seleção)
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
