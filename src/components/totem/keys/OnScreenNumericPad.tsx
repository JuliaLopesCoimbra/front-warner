"use client";

type OnScreenNumericPadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onOk?: () => void;
  showOk?: boolean;
};

const ROWS: (string | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function OnScreenNumericPad({
  onDigit,
  onBackspace,
  onOk,
  showOk = true,
}: OnScreenNumericPadProps) {
  return (
    <div className="grid h-full min-h-0 w-full max-w-full auto-rows-fr content-center gap-3">
      {ROWS.map((row, idx) => (
        <div key={`nrow-${idx}`} className="grid grid-cols-3 gap-3">
          {row.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => k && onDigit(k)}
              className="flex min-h-[clamp(88px,12vmin,152px)] items-center justify-center rounded-xl border-2 border-neutral-300 bg-white text-[clamp(30px,7vmin,58px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onBackspace}
          className="flex min-h-[clamp(88px,12vmin,152px)] items-center justify-center rounded-xl border-2 border-neutral-300 bg-white text-[clamp(22px,5vmin,40px)] font-bold text-neutral-500 shadow-sm active:bg-neutral-100"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => onDigit("0")}
          className="flex min-h-[clamp(88px,12vmin,152px)] items-center justify-center rounded-xl border-2 border-neutral-300 bg-white text-[clamp(30px,7vmin,58px)] font-bold text-neutral-800 shadow-sm active:bg-neutral-100"
        >
          0
        </button>
        {showOk && onOk ? (
          <button
            type="button"
            onClick={onOk}
            className="flex min-h-[clamp(88px,12vmin,152px)] items-center justify-center rounded-xl border-2 border-neutral-900 bg-neutral-900 text-[clamp(16px,3.4vmin,28px)] font-bold uppercase tracking-wide text-white active:bg-neutral-700"
          >
            OK
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
