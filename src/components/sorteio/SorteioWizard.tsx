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

function getItemHPx(): number {
  if (typeof window === "undefined") return 100;
  return Math.min(206, Math.max(70, window.innerWidth * 0.15));
}

export function SorteioWizard() {
  const [step, setStep] = useState<Step>("select");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slot machine state
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

    const itemH = getItemHPx();
    const schedule = buildSchedule();
    scheduleRef.current = schedule;
    tickIdxRef.current = 0;

    const pickedWinner = pool[pickRandomIndex(pool.length)]!;
    pickedWinnerRef.current = pickedWinner;

    // Build tape: random items, winner placed near end
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

  const pool = selectedList;
  const truncated = totalRegistered > candidates.length;

  const btnBase =
    "min-h-[clamp(48px,10vw,140px)] rounded-xl px-[clamp(16px,4.5vw,64px)] text-[clamp(14px,3vw,44px)] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const btnPrimary = `${btnBase} bg-neutral-900 text-white hover:opacity-90`;
  const btnGhost = `${btnBase} border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`;

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/fundo.JPEG')" }}>
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-[clamp(16px,4vw,56px)] py-[clamp(24px,5vw,72px)] pb-24">
      {step !== "draw" ? (
        <>
          <p className="text-center text-[clamp(12px,3.5vw,48px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
            Sorteio
          </p>
          <h1 className="mt-2 text-center text-[clamp(24px,8vw,112px)] font-bold text-neutral-900">
            {step === "select" ? "Selecione os participantes" : "Revisar seleção"}
          </h1>
        </>
      ) : null}

      {loading ? (
        <p className="mt-16 text-center text-[clamp(15px,3vw,42px)] text-neutral-400">
          Carregando cadastros…
        </p>
      ) : error ? (
        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-center text-[clamp(14px,2.5vw,36px)] text-red-600">{error}</p>
          <button type="button" className={btnPrimary} onClick={() => void load()}>
            Tentar de novo
          </button>
        </div>
      ) : step === "select" ? (
        <>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[clamp(13px,2.5vw,36px)] text-neutral-500">
            Lista ordenada por{" "}
            <strong className="text-neutral-800">maior pontuação</strong>. Marque quem entra no
            sorteio e toque em <strong className="text-neutral-800">Próximo</strong>.
          </p>
          <p className="mt-2 text-center text-[clamp(12px,2vw,28px)] text-neutral-400">
            Total cadastrados: {totalRegistered}
            {truncated
              ? ` · exibindo primeiros ${candidates.length} (limite 10.000 nesta tela)`
              : ` · ${candidates.length} na lista`}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <button type="button" className={btnGhost} onClick={selectAll}>
              Selecionar todos
            </button>
            <button type="button" className={btnGhost} onClick={selectNone}>
              Limpar seleção
            </button>
          </div>

          <ul className="mt-6 max-h-[min(52vh,640px)] divide-y divide-neutral-100 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {candidates.map((c, idx) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-[clamp(10px,3vw,44px)] px-[clamp(12px,3.5vw,52px)] py-[clamp(14px,3vw,44px)] hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-[clamp(18px,3.5vw,50px)] w-[clamp(18px,3.5vw,50px)] shrink-0 rounded border-neutral-300 accent-neutral-900"
                  />
                  <span className="w-[clamp(24px,4vw,56px)] shrink-0 text-right text-[clamp(12px,2.2vw,32px)] text-neutral-400">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[clamp(14px,3.2vw,46px)] font-semibold text-neutral-900">
                      {c.nickname}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              className={btnPrimary}
              onClick={() => setStep("review")}
            >
              Próximo →
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/sorteio-historico"
              className="text-[clamp(13px,1.8vw,26px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
            >
              Ver histórico de sorteios →
            </Link>
            <Link
              href="/"
              className="text-[clamp(13px,1.8vw,26px)] text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
            >
              ← Voltar ao início
            </Link>
          </div>
        </>
      ) : step === "review" ? (
        <>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[clamp(13px,2.5vw,36px)] text-neutral-500">
            Confira os selecionados. Ao confirmar, a animação começa e um ganhador aleatório é sorteado.
          </p>

          <ul className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {selectedList.map((c) => (
              <li
                key={c.id}
                className="px-[clamp(12px,3.5vw,52px)] py-[clamp(14px,3vw,44px)]"
              >
                <p className="text-[clamp(14px,3.2vw,46px)] font-semibold text-neutral-900">
                  {c.nickname}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button type="button" className={btnGhost} onClick={() => setStep("select")}>
              ← Voltar
            </button>
            <button type="button" className={btnPrimary} onClick={confirmReview}>
              Confirmar e sortear
            </button>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-[clamp(16px,4vw,56px)] bg-white px-[clamp(16px,4vw,56px)]">
          {/* Title */}
          <p className="text-center text-[clamp(12px,3.5vw,48px)] font-bold uppercase tracking-[0.22em] text-neutral-900">
            {winner ? "Resultado" : animRunning ? "Sorteando…" : "Veja o resultado!"}
          </p>

          {/* Slot machine */}
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg h-[clamp(210px,45vw,620px)]">
            {/* Center highlight band */}
            <div className="pointer-events-none absolute inset-x-0 top-1/3 h-1/3 border-y-2 border-neutral-900 bg-neutral-900/5 z-10" />

            {/* Scrolling strip */}
            <div
              style={{
                transform: `translateY(${slotOffset}px)`,
                transition: slotAnimating ? `transform ${slotTransMs}ms linear` : "none",
              }}
            >
              {slotItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex h-[clamp(70px,15vw,206px)] items-center justify-center px-[clamp(16px,4vw,56px)]"
                >
                  <span
                    className={`max-w-full truncate text-center font-black ${
                      idx === 1
                        ? "text-[clamp(22px,7vw,100px)] text-neutral-900"
                        : "text-[clamp(14px,4vw,56px)] text-neutral-300"
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
              <p className="text-center text-[clamp(22px,6.5vw,92px)] font-black uppercase tracking-[0.12em] text-emerald-600">
                Você ganhou!
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
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
