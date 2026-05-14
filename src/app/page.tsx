import { IdleTotem } from "@/components/totem/IdleTotem";
import { getApiBaseUrl } from "@/lib/api";

async function getHealth() {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json() as Promise<{ status: string; service: string }>;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();

  return <IdleTotem health={health} />;
}
