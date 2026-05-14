import type { CSSProperties, ReactNode } from "react";

export const totemCanvasStyle = {
  width: "min(1080px, min(100vw, calc(100dvh * 9 / 16)))",
} as const;

const totemCanvasClassName =
  "relative flex aspect-[9/16] h-auto max-h-[1920px] flex-col items-stretch overflow-hidden border border-neutral-200 shadow-[0_4px_40px_rgba(0,0,0,0.08)]";

export function TotemCanvas({
  children,
  className = "",
  bgImage = "url('/fundo.JPEG')",
}: {
  children: ReactNode;
  className?: string;
  bgImage?: string;
}) {
  const style: CSSProperties = {
    ...totemCanvasStyle,
    backgroundImage: bgImage,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  return (
    <div
      className={`${totemCanvasClassName} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

/** Fundo claro full screen + canvas 9:16 centralizado (1080×1920 máx.). */
export function TotemStage({ children }: { children: ReactNode }) {
  return (
    <main className="fixed inset-0 z-0 flex touch-manipulation items-center justify-center bg-neutral-100 p-0 text-[var(--foreground)]">
      <TotemCanvas>{children}</TotemCanvas>
    </main>
  );
}
