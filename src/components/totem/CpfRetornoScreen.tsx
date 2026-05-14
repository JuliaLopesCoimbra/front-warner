"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OnScreenAlphaPad } from "@/components/totem/keys/OnScreenAlphaPad";
import { getApiBaseUrl } from "@/lib/api";
import { writeTotemParticipant } from "@/lib/totem-participant-storage";
import { totemText, totemTouch } from "@/lib/totem-ui";

type SearchResult = { id: string; nickname: string };

export function CpfRetornoScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const appendChar = useCallback((ch: string) => {
    setName((prev) => (prev.length >= 60 ? prev : prev + ch));
  }, []);

  const back = useCallback(() => {
    setName((prev) => prev.slice(0, -1));
  }, []);

  // Busca com debounce
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/participants/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as { items?: SearchResult[] };
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [name]);

  const selectParticipant = useCallback(
    (p: SearchResult) => {
      if (submitting) return;
      setSubmitting(true);
      writeTotemParticipant({ id: p.id, nickname: p.nickname });
      router.push("/totem/quiz");
    },
    [submitting, router]
  );

  const goNew = useCallback(() => {
    router.push(`/totem/cadastro?nome=${encodeURIComponent(name.trim())}`);
  }, [name, router]);

  // Teclado físico
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (submitting) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Backspace") { back(); return; }
      if (e.key === " ") { e.preventDefault(); appendChar(" "); return; }
      if (e.key === "Enter") {
        if (results.length === 1) selectParticipant(results[0]!);
        return;
      }
      if (e.key.length === 1 && /^[a-zA-ZÀ-ÿ0-9]$/.test(e.key)) {
        appendChar(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitting, appendChar, back, results, selectParticipant]);

  const trimmed = name.trim();
  const hasInput = trimmed.length >= 2;

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-[4%] pb-[3%] pt-[4%]">
      <p className={`text-center text-neutral-900 ${totemText.kicker}`}>
        03 · Retorno
      </p>
      <h1 className={`mt-[2%] text-center text-neutral-900 ${totemText.title}`}>
        Quem é você?
      </h1>

      {/* Display — totem */}
      <div className="mt-[2.5%] shrink-0 hidden md:block">
        <div className={`rounded-2xl border-2 px-5 py-4 transition-colors sm:px-6 sm:py-5 ${
          hasInput ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 bg-neutral-50"
        }`}>
          <p className={`text-neutral-400 ${totemText.caption}`}>Nome</p>
          <p className="mt-1 truncate text-[clamp(22px,4.6vmin,56px)] font-bold text-neutral-900">
            {name || <span className="text-neutral-300">—</span>}
          </p>
        </div>
      </div>

      {/* Input nativo — mobile */}
      <div className="mt-[3%] shrink-0 md:hidden">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="Digite seu nome"
          autoFocus
          autoComplete="off"
          className="w-full rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 py-4 text-[clamp(18px,4vmin,32px)] font-bold text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-700"
        />
      </div>

      {/* Lista de resultados */}
      {hasInput ? (
        <div className="mt-[2%] overflow-y-auto shrink-0 max-h-[clamp(150px,26vmin,300px)]">
          {searching ? (
            <p className={`py-3 text-center text-neutral-400 ${totemText.bodySm}`}>
              Buscando…
            </p>
          ) : results.length > 0 ? (
            <ul className="flex flex-col gap-[clamp(6px,1.2vmin,14px)]">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => selectParticipant(r)}
                    className={`w-full rounded-2xl border-2 border-neutral-200 bg-white px-5 text-left font-semibold text-neutral-900 active:border-neutral-400 active:bg-neutral-100 disabled:opacity-50 min-h-[clamp(52px,10vmin,120px)] ${totemText.body}`}
                  >
                    {r.nickname}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={goNew}
                  className={`w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-5 text-left text-neutral-400 active:bg-neutral-50 min-h-[clamp(44px,8vmin,100px)] ${totemText.bodySm}`}
                >
                  + Cadastrar "{trimmed}" como novo
                </button>
              </li>
            </ul>
          ) : (
            <div className="flex flex-col gap-[clamp(6px,1.2vmin,14px)]">
              <p className={`py-1 text-center text-neutral-400 ${totemText.bodySm}`}>
                Nenhum cadastro encontrado
              </p>
              <button
                type="button"
                onClick={goNew}
                className={`w-full rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 text-center font-semibold text-neutral-900 active:bg-neutral-200 min-h-[clamp(52px,10vmin,120px)] ${totemText.body}`}
              >
                + Cadastrar "{trimmed}" como novo →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-[2%] shrink-0">
          <p className={`text-center text-neutral-300 ${totemText.bodySm}`}>
            Comece a digitar para buscar
          </p>
        </div>
      )}

      {/* Teclado virtual — totem */}
      <div className="mt-auto hidden min-h-0 shrink-0 md:block">
        <OnScreenAlphaPad
          onKey={appendChar}
          onBackspace={back}
          onSpace={() => appendChar(" ")}
        />
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-3">
        <Link
          href="/totem/fichas"
          className={`text-neutral-600 active:bg-neutral-100 ${totemTouch.btnGhost}`}
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
