"use client";

type OnScreenAlphaPadProps = {
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onSpace?: () => void;
};

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export function OnScreenAlphaPad({
  onKey,
  onBackspace,
  onSpace,
}: OnScreenAlphaPadProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-center gap-2">
      {ROWS.map((row) => (
        <div
          key={row.join("")}
          className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
        >
          {row.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKey(k)}
              className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[8%] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(16px,3.8vmin,38px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBackspace}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[clamp(72px,14vmin,140px)] items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(18px,4vmin,34px)] font-bold text-neutral-500 shadow-sm active:bg-neutral-100"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => onSpace?.()}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[min(100%,180px)] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(13px,2.6vmin,22px)] font-bold uppercase tracking-wider text-neutral-400 shadow-sm active:bg-neutral-100"
        >
          Espaço
        </button>
        <button
          type="button"
          onClick={() => onKey("0")}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[clamp(56px,10vmin,100px)] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(16px,3.8vmin,34px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onKey("1")}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[clamp(56px,10vmin,100px)] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(16px,3.8vmin,34px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => onKey("2")}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[clamp(56px,10vmin,100px)] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(16px,3.8vmin,34px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => onKey("3")}
          className="flex min-h-[clamp(56px,9.5vmin,104px)] min-w-[clamp(56px,10vmin,100px)] flex-1 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-[clamp(16px,3.8vmin,34px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
        >
          3
        </button>
      </div>
    </div>
  );
}
