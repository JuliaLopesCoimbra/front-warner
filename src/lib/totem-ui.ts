/**
 * Tailwind class fragments for 1080×1920 portrait totem.
 * vmin = min(vw,vh) → on 1080×1920: 1vmin ≈ 10.8px | on 390×844: 1vmin ≈ 3.9px
 *
 * Clamp strategy: low min (mobile OK) · high vmin multiplier (totem scales up) · high max (totem ceiling)
 */

export const totemText = {
  kicker:       "text-[clamp(13px,3vmin,42px)] font-bold uppercase tracking-[0.18em]",
  title:        "text-[clamp(22px,6.5vmin,78px)] font-bold leading-tight",
  lead:         "text-[clamp(15px,3.8vmin,48px)] leading-snug",
  body:         "text-[clamp(15px,3.5vmin,42px)]",
  bodySm:       "text-[clamp(13px,3vmin,34px)]",
  caption:      "text-[clamp(12px,2.8vmin,36px)] font-semibold uppercase tracking-[0.12em]",
  loading:      "text-[clamp(16px,4.5vmin,54px)]",
  timerNum:     "text-[clamp(26px,8vmin,92px)] font-bold tabular-nums",
  prompt:       "text-center text-[clamp(16px,6.5vmin,88px)] font-semibold leading-snug",
  optionLetter: "text-[clamp(16px,4.8vmin,60px)] font-bold",
  optionText:   "min-w-0 text-[clamp(15px,3.8vmin,48px)] leading-snug",
  outcome:      "text-[clamp(16px,4.8vmin,60px)] font-bold",
  error:        "text-[clamp(13px,3vmin,36px)]",
  warn:         "text-[clamp(13px,3vmin,34px)]",
  hint:         "text-center text-[clamp(12px,2.6vmin,34px)] font-semibold uppercase tracking-[0.14em]",
  health:       "text-[clamp(12px,2.4vmin,28px)]",
} as const;

export const totemTouch = {
  timerCircle:
    "flex h-[clamp(64px,15vmin,168px)] w-[clamp(64px,15vmin,168px)] shrink-0 items-center justify-center rounded-full border-[4px]",
  promptBox:
    "rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-5 sm:p-8",
  optionRow:
    "flex min-h-[clamp(70px,19vmin,228px)] w-full shrink-0 items-center gap-4 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-left shadow-sm disabled:cursor-default sm:gap-6 sm:px-7",
  optionBadge:
    "flex h-[clamp(40px,10vmin,122px)] w-[clamp(40px,10vmin,122px)] shrink-0 items-center justify-center rounded-xl",
  btnPrimary:
    "flex min-h-[clamp(68px,15vmin,184px)] w-full items-center justify-center rounded-xl px-6 text-[clamp(17px,4.5vmin,54px)] font-bold uppercase tracking-[0.08em]",
  btnGhost:
    "flex min-h-[clamp(60px,13vmin,162px)] w-full items-center justify-center rounded-xl border-2 border-neutral-300 text-[clamp(15px,4vmin,48px)] font-semibold",
  btnOutline:
    "flex min-h-[clamp(56px,12vmin,152px)] w-full items-center justify-center rounded-xl border border-neutral-300 text-[clamp(14px,3.8vmin,46px)] font-semibold",
  btnRetry:
    "flex min-h-[clamp(68px,13vmin,170px)] w-full max-w-[92%] items-center justify-center rounded-xl px-8 text-[clamp(16px,4vmin,50px)] font-bold",
} as const;
