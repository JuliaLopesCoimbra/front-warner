"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OnScreenAlphaPad } from "@/components/totem/keys/OnScreenAlphaPad";
import { getApiBaseUrl } from "@/lib/api";
import { writeTotemParticipant } from "@/lib/totem-participant-storage";
import { totemText, totemTouch } from "@/lib/totem-ui";

export function CadastroScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nickname, setNickname] = useState(() => {
    const pre = searchParams.get("nome");
    return pre ? decodeURIComponent(pre).slice(0, 60) : "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendNick = useCallback((ch: string) => {
    setError(null);
    setNickname((n) => (n.length >= 60 ? n : n + ch));
  }, []);

  const backNick = useCallback(() => {
    setNickname((n) => n.slice(0, -1));
  }, []);

  const enviar = useCallback(async () => {
    const nick = nickname.trim();
    if (nick.length < 2) {
      setError("Informe o nome completo (mínimo 2 caracteres).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/participants/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nick }),
      });
      const data = (await res.json()) as {
        id?: string;
        nickname?: string;
        detail?: string | { msg?: string }[];
      };
      if (!res.ok) {
        const detail = data.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((x: { msg?: string }) => x.msg).filter(Boolean).join(" ")
              : "Não foi possível cadastrar.";
        setError(msg || "Não foi possível cadastrar.");
        return;
      }
      if (data.id && data.nickname) {
        writeTotemParticipant({ id: data.id, nickname: data.nickname });
      }
      router.push("/totem/quiz");
    } catch {
      setError("Sem conexão com a API.");
    } finally {
      setLoading(false);
    }
  }, [nickname, router]);

  // Teclado físico — ignora quando o foco está num <input> nativo (mobile)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Backspace") { backNick(); return; }
      if (e.key === " ") { e.preventDefault(); appendNick(" "); return; }
      if (e.key === "Enter") { void enviar(); return; }
      if (e.key.length === 1 && /^[a-zA-ZÀ-ÿ0-9]$/.test(e.key)) {
        appendNick(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, appendNick, backNick, enviar]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-[4%] pb-[3%] pt-[4%]">
      <p className={`text-center text-neutral-900 ${totemText.kicker}`}>
        03 · Cadastro
      </p>
      <h1 className={`mt-[2%] text-center text-neutral-900 ${totemText.title}`}>
        Complete seu cadastro
      </h1>

      {/* Display do nome — visível no totem */}
      <div className="mt-[2.5%] shrink-0 hidden md:block">
        <div className="rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 py-5 sm:px-6 sm:py-6">
          <p className={`text-neutral-400 ${totemText.caption}`}>Nome completo</p>
          <p className="mt-1 truncate text-[clamp(22px,4.6vmin,44px)] font-bold text-neutral-900">
            {nickname || <span className="text-neutral-300">—</span>}
          </p>
        </div>
      </div>

      {/* Input nativo — apenas em mobile */}
      <div className="mt-[3%] shrink-0 md:hidden">
        <input
          type="text"
          value={nickname}
          onChange={(e) => {
            setError(null);
            setNickname(e.target.value.slice(0, 60));
          }}
          onKeyDown={(e) => { if (e.key === "Enter") void enviar(); }}
          placeholder="Digite seu nome completo"
          autoComplete="off"
          className="w-full rounded-2xl border-2 border-neutral-900 bg-neutral-100 px-5 py-4 text-[clamp(18px,4vmin,32px)] font-bold text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-700"
        />
      </div>

      {error ? (
        <p className={`mx-auto mt-2 max-h-[14vh] overflow-y-auto px-1 text-center text-red-600 ${totemText.error}`}>
          {error}
        </p>
      ) : (
        <div className="min-h-[1rem]" />
      )}

      {/* Teclado virtual — apenas no totem (md+) */}
      <div className="mt-2 hidden min-h-0 flex-1 overflow-hidden md:block">
        <OnScreenAlphaPad
          onKey={(ch) => appendNick(ch)}
          onBackspace={backNick}
          onSpace={() => appendNick(" ")}
        />
      </div>

      <div className="mt-2 flex shrink-0 flex-col gap-3">
        <button
          type="button"
          disabled={loading || nickname.trim().length < 2}
          onClick={enviar}
          className={`bg-neutral-900 text-white disabled:opacity-50 ${totemTouch.btnPrimary}`}
        >
          {loading ? "Enviando…" : "Começar o quiz →"}
        </button>
        <Link
          href="/totem/name"
          className={`text-neutral-600 active:bg-neutral-100 ${totemTouch.btnGhost}`}
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
