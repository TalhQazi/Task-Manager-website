import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";

export type MemePayload = {
  id: string;
  imageUrl: string;
  caption?: string;
  category?: string;
};

export const FALLBACK_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#g)"/>
  <circle cx="540" cy="430" r="120" fill="#111" stroke="#3b82f6" stroke-width="8"/>
  <path d="M420 660c55 52 119 78 192 78s137-26 192-78" fill="none" stroke="#60a5fa" stroke-width="10" stroke-linecap="round"/>
  <text x="540" y="860" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="44" fill="#e5e7eb">
    Keep going — you got this.
  </text>
  <text x="540" y="920" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="26" fill="#94a3b8">
    (Fallback meme)
  </text>
</svg>
`)}`;

export function getFallbackMeme(): MemePayload {
  return {
    id: "fallback",
    imageUrl: FALLBACK_IMAGE_URL,
    caption: "Keep going — you got this.",
    category: "general",
  };
}

export type MemeState = {
  lastMemeTimestamp: number | null;
  nextMemeTimestamp: number | null;
};

export async function fetchMemeState(): Promise<MemeState> {
  return apiFetch<MemeState>("/api/meme/state", { method: "GET" });
}

export async function saveMemeState(state: MemeState): Promise<void> {
  try {
    await apiFetch<{ ok: true }>("/api/meme/state", {
      method: "POST",
      body: JSON.stringify(state),
    });
  } catch {
    // best-effort sync
  }
}

export async function preloadImage(url: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = url;
  });
}

function proxiedMemeImageUrl(url: string): string {
  const proxied = toProxiedUrl(url);
  return proxied && proxied.length > 0 ? proxied : url;
}

export async function fetchNextMeme(): Promise<MemePayload> {
  async function attempt() {
    const raw = await apiFetch<MemePayload>("/api/meme/next", { method: "GET" });
    return {
      ...raw,
      imageUrl: proxiedMemeImageUrl(raw.imageUrl),
    };
  }

  try {
    return await attempt();
  } catch (err) {
    // Retry once
    try {
      return await attempt();
    } catch {
      return getFallbackMeme();
    }
  }
}

export async function logMemeShown(memeId: string, timestamp: number): Promise<void> {
  if (!memeId || memeId === "fallback") return;
  try {
    await apiFetch<{ ok: true }>("/api/meme/log", {
      method: "POST",
      body: JSON.stringify({ memeId, timestamp }),
    });
  } catch {
    // best-effort impression tracking
  }
}