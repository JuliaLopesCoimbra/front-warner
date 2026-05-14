/** `0.0.0.0` é válido para bind do uvicorn, mas fetch (browser ou Node) não usa como destino. */
function normalizeApiHost(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "0.0.0.0") {
      u.hostname = "127.0.0.1";
      return u.origin;
    }
  } catch {
    /* ignore */
  }
  return url;
}

export function getApiBaseUrl(): string {
  const raw =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
      : (process.env.API_URL ??
          process.env.NEXT_PUBLIC_API_URL ??
          "http://localhost:8000");
  return normalizeApiHost(raw);
}