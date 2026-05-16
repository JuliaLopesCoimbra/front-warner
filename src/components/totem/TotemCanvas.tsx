import type { CSSProperties, ReactNode } from "react";

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
    backgroundImage: bgImage,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  return (
    <div
      className={`totem-canvas relative flex h-auto flex-col items-stretch overflow-hidden border border-neutral-200 shadow-[0_4px_40px_rgba(0,0,0,0.08)] ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

/** Fundo claro full screen + canvas 16:9 centralizado (1920×1080 máx.). */
export function TotemStage({ children }: { children: ReactNode }) {
  return (
    <main className="fixed inset-0 z-0 flex touch-manipulation items-center justify-center bg-neutral-100 p-0 text-[var(--foreground)]">
      <TotemCanvas>{children}</TotemCanvas>
    </main>
  );
}
