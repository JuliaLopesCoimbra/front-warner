const STORAGE_KEY = "warner_totem_participant";

export type TotemParticipantSession = {
  id: string;
  nickname: string;
};

export function writeTotemParticipant(p: TotemParticipantSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function readTotemParticipant(): TotemParticipantSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (
      v &&
      typeof v === "object" &&
      "id" in v &&
      "nickname" in v &&
      typeof (v as { id: unknown }).id === "string" &&
      typeof (v as { nickname: unknown }).nickname === "string"
    ) {
      return { id: (v as TotemParticipantSession).id, nickname: (v as TotemParticipantSession).nickname };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearTotemParticipant(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
