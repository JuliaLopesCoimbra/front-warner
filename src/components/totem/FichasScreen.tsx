"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { writeTotemQuizQuestionCount } from "@/lib/totem-quiz-storage";
import { totemText, totemTouch } from "@/lib/totem-ui";

const MIN = 1;
const MAX = 10;

export function FichasScreen() {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const dec = useCallback(() => setQty((q) => Math.max(MIN, q - 1)), []);
  const inc = useCallback(() => setQty((q) => Math.min(MAX, q + 1)), []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-[5%] pb-[6%] pt-[7%]">
      <p className={`text-center text-neutral-900 ${totemText.kicker} tracking-[0.2em]`}>
        01 · Fichas
      </p>

      <h1 className={`mt-[4%] text-center tracking-tight text-neutral-900 ${totemText.title} leading-[1.15]`}>
        Quantas fichas você entregou?
      </h1>
      <p className={`mx-auto mt-[3%] max-w-[90%] text-center text-neutral-500 ${totemText.lead}`}>
        Esse número define quantas perguntas você vai responder no quiz.
      </p>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[5%] py-[4%]">
        <p className={`text-center text-neutral-400 ${totemText.caption} tracking-[0.18em]`}>
          Quantidade
        </p>
        <p
          className="text-center text-[clamp(60px,22vmin,248px)] font-bold leading-none text-neutral-900"
          aria-live="polite"
        >
          {qty}
        </p>

        <div className="flex w-full max-w-[92%] gap-[4%]">
          <button
            type="button"
            onClick={dec}
            disabled={qty <= MIN}
            className="flex min-h-[clamp(96px,18vmin,240px)] min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-neutral-300 bg-neutral-100 text-[clamp(44px,15vmin,168px)] font-bold leading-none text-neutral-700 transition-colors active:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-35"
          >
            −
          </button>
          <button
            type="button"
            onClick={inc}
            disabled={qty >= MAX}
            className="flex min-h-[clamp(96px,18vmin,240px)] min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-neutral-100 text-[clamp(44px,15vmin,168px)] font-bold leading-none text-neutral-900 transition-colors active:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-35"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            writeTotemQuizQuestionCount(qty);
            router.push("/totem/name");
          }}
          className={`bg-neutral-900 text-white transition-colors active:bg-neutral-700 ${totemTouch.btnPrimary} tracking-[0.12em]`}
        >
          Continuar →
        </button>
        <Link
          href="/"
          className={`bg-transparent text-neutral-600 transition-colors active:bg-neutral-100 ${totemTouch.btnGhost}`}
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
