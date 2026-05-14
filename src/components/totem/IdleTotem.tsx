"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TotemCanvas } from "@/components/totem/TotemCanvas";
import { totemText } from "@/lib/totem-ui";

type IdleTotemProps = {
  health: { status: string; service: string } | null;
};

export function IdleTotem({ health }: IdleTotemProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/descanso.JPEG')" }}>
      <Link
        href="/totem/super-quiz"
        className="absolute bottom-[3%] left-[3%] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:border-violet-500 hover:text-violet-600"
      >
        Super Quiz
      </Link>
      <Link
        href="/ranking"
        className="absolute bottom-[3%] right-[3%] z-20 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Ranking
      </Link>
      <button
        type="button"
        onClick={() => router.push("/totem/fichas")}
        className="flex h-full min-h-0 w-full cursor-pointer touch-manipulation flex-col border-0 bg-transparent p-0 text-[var(--foreground)] outline-none ring-inset focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <TotemCanvas bgImage="url('/descanso.JPEG')">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[8%]">
            <p className={`font-bold uppercase tracking-[0.16em] text-neutral-400 ${totemText.title}`}>
              Toque para começar
            </p>
          </div>

          {!health ? (
            <p className={`pointer-events-none absolute bottom-[2.8%] left-0 right-0 px-[4%] text-center text-amber-600 ${totemText.health}`}>
              API offline — toque para continuar
            </p>
          ) : null}
        </TotemCanvas>
      </button>
    </div>
  );
}
