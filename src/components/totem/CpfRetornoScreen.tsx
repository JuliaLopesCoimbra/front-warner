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

  const clearName = useCallback(() => {
    setName("");
    setResults([]);
  }, []);

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
          `${getApiBaseUrl()}/participants/search?q=${encodeURIComponent(trimmed)}&limit=10`,
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
    <div className="flex h-full min-h-0 w-full flex-col px-[4%] pb-[2%] pt-[3%]">
      {/* Header */}
      <p className={`shrink-0 text-center text-neutral-900 ${totemText.kicker}`}>
        03 · Retorno
      </p>
      <h1 className={`mt-[1%] shrink-0 text-center text-neutral-900 ${totemText.title}`}>
        Quem é você?
      </h1>

      {/* Display — totem */}
      <div className="mt-[2%] shrink-0 hidden md:block">
        <div className={`flex items-center justify-between rounded-2xl border-2 px-5 py-[clamp(6px,1.2vmin,14px)] transition-colors ${
          hasInput ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 bg-neutral-50"
        }`}>
          <p className="truncate text-[clamp(18px,4vmin,48px)] font-bold text-neutral-900">
            {name || <span className="text-neutral-300">—</span>}
          </p>
          {hasInput && (
            <button
              type="button"
              onClick={clearName}
              className="ml-3 shrink-0 rounded-full px-2 text-[clamp(13px,2.5vmin,28px)] font-bold text-neutral-400 active:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Input nativo — mobile */}
      <div className="mt-[2%] shrink-0 md:hidden">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="Digite seu nome"
          autoFocus
          autoComplete="off"
          className="w-full rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 py-3 text-[clamp(18px,4vmin,32px)] font-bold text-neutral-900 outline-none placeholder:text-neutral-300"
        />
      </div>

      {/* Resultados — flex-1 ocupa o espaço restante entre display e teclado/botão */}
      <div className="mt-[2%] flex-1 min-h-0 overflow-y-auto">
        {searching ? (
          <p className={`py-3 text-center text-neutral-400 ${totemText.bodySm}`}>
            Buscando…
          </p>
        ) : results.length > 0 ? (
          <ul className="flex flex-col gap-[clamp(3px,0.6vmin,7px)]">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => selectParticipant(r)}
                  className={`w-full rounded-2xl border-2 border-neutral-200 bg-white px-5 text-left font-semibold text-neutral-900 active:border-neutral-400 active:bg-neutral-100 disabled:opacity-50 min-h-[clamp(36px,5vmin,60px)] ${totemText.body}`}
                >
                  {r.nickname}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={goNew}
                className={`w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-5 text-left text-neutral-400 active:bg-neutral-50 min-h-[clamp(30px,4vmin,48px)] ${totemText.bodySm}`}
              >
                + Cadastrar &quot;{trimmed}&quot; como novo
              </button>
            </li>
          </ul>
        ) : hasInput ? (
          <div className="flex flex-col gap-[clamp(6px,1.2vmin,14px)]">
            <p className={`py-1 text-center text-neutral-400 ${totemText.bodySm}`}>
              Nenhum cadastro encontrado
            </p>
            <button
              type="button"
              onClick={goNew}
              className={`w-full rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 text-center font-semibold text-neutral-900 active:bg-neutral-200 min-h-[clamp(52px,9vmin,110px)] ${totemText.body}`}
            >
              + Cadastrar &quot;{trimmed}&quot; como novo →
            </button>
          </div>
        ) : (
          <p className={`text-center text-neutral-300 ${totemText.bodySm}`}>
            Comece a digitar para buscar
          </p>
        )}
      </div>

      {/* Teclado virtual — sempre visível no totem (md+), oculto no mobile */}
      <div className="mt-[2%] shrink-0 hidden md:block">
        <OnScreenAlphaPad
          onKey={appendChar}
          onBackspace={back}
          onSpace={() => appendChar(" ")}
        />
      </div>

      <div className="mt-[2%] shrink-0">
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
