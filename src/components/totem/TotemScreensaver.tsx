"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const IDLE_MS = 60_000;

type ScreenType = "descanso" | "ranking";

function useTotemScreensaverActive(): boolean {
  const pathname = usePathname();
  return pathname === "/" || pathname.startsWith("/totem");
}

export function TotemScreensaver({ children }: { children: React.ReactNode }) {
  const active = useTotemScreensaverActive();
  const [visible, setVisible] = useState(false);
  const [screenType, setScreenType] = useState<ScreenType>("descanso");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextScreenRef = useRef<ScreenType>("descanso");

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const bump = useCallback(() => {
    setVisible(false);
    clearTimer();
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, IDLE_MS);
  }, [clearTimer]);

  // Alterna a tela a cada ativação do screensaver
  useEffect(() => {
    if (visible) {
      setScreenType(nextScreenRef.current);
      nextScreenRef.current =
        nextScreenRef.current === "descanso" ? "ranking" : "descanso";
    }
  }, [visible]);

  useEffect(() => {
    if (!active) {
      clearTimer();
      setVisible(false);
      return undefined;
    }

    bump();
    const onActivity = () => bump();

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      clearTimer();
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [active, bump, clearTimer]);

  return (
    <>
      {children}
      {active && visible ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tela de descanso"
          className="fixed inset-0 z-[9998] touch-manipulation"
          onClick={() => bump()}
        >
          {screenType === "descanso" ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/descanso.JPEG')" }}
            />
          ) : (
            <>
              <iframe
                src="/ranking"
                className="absolute inset-0 h-full w-full border-0 pointer-events-none"
                title="Ranking"
              />
              {/* camada transparente para capturar o toque e dispensar o screensaver */}
              <div className="absolute inset-0" />
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
