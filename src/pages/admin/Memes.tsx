import React, { useEffect, useMemo, useState, useRef } from "react";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { resizeImageIfNeeded } from "@/lib/imageResizer";

type MemeItem = {
  id: string;
  imageUrl: string;
  caption?: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
};

type Stats = {
  totalMemes: number;
  activeMemes: number;
  totalViews: number;
  top: Array<{
    memeId: string;
    views: number;
    imageUrl: string;
    caption?: string;
    category?: string;
    isActive: boolean;
  }>;
};

const categories = ["motivational", "funny", "productivity", "general"] as const;

export default function Memes() {
  const [items, setItems] = useState<MemeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setLoading(true);
    setErr("");
    try {
      const compressed = await resizeImageIfNeeded(selectedFile, 1080, 1080, 0.85);
      setFile(compressed);
    } catch (error: any) {
      console.error("Failed to resize image:", error);
      setErr("Failed to process image. Using original file.");
      setFile(selectedFile);
    } finally {
      setLoading(false);
    }
  };
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("motivational");
  const [active, setActive] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const [list, s] = await Promise.all([
        apiFetch<{ items: any[] }>("/api/meme/admin/list", { method: "GET" }),
        apiFetch<Stats>("/api/meme/admin/stats", { method: "GET" }),
      ]);
      setItems(
        (list.items || []).map((m) => ({
          id: String(m.id || m._id || ""),
          imageUrl: String(m.imageUrl || ""),
          caption: String(m.caption || ""),
          category: String(m.category || "general"),
          isActive: Boolean(m.isActive),
          createdAt: m.createdAt ? String(m.createdAt) : undefined,
        }))
      );
      setStats(s);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload() {
    if (!file) {
      setErr("Please choose an image (JPG/PNG, max 500KB).");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("caption", caption);
      fd.set("category", category);
      fd.set("isActive", active ? "true" : "false");

      await apiFetch<{ item: MemeItem }>("/api/meme/admin/upload", {
        method: "POST",
        body: fd,
      });

      setFile(null);
      setCaption("");
      setCategory("motivational");
      setActive(true);
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setLoading(true);
    setErr("");
    try {
      await apiFetch<{ item: MemeItem }>(`/api/meme/admin/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this meme?")) return;
    setLoading(true);
    setErr("");
    try {
      await apiFetch<{ ok: true }>(`/api/meme/admin/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Memes</h1>
          <p className="text-white/60 mt-1">Upload, activate/deactivate, delete, and view delivery stats.</p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100">
          {err}
        </div>
      ) : null}

      {stats ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-white/60 text-sm">Total memes</div>
            <div className="text-2xl font-bold mt-1">{stats.totalMemes}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-white/60 text-sm">Active memes</div>
            <div className="text-2xl font-bold mt-1">{stats.activeMemes}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-white/60 text-sm">Total views (impressions)</div>
            <div className="text-2xl font-bold mt-1">{stats.totalViews}</div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-semibold">Upload meme</h2>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div
              className={`rounded-xl border border-dashed p-6 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer ${
                dragOver
                  ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/5 scale-[1.02]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  void handleFileSelection(f);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-sm font-medium">Drag & drop your meme here</div>
              <div className="text-white/40 text-xs mt-1">or click to browse files</div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  void handleFileSelection(f);
                }}
                className="hidden"
              />
            </div>
            <div className="mt-3 text-xs text-white/60">JPG/PNG, auto-resized & compressed under S3 limit. Preferred 1080×1080.</div>

            {previewUrl ? (
              <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                <img src={previewUrl} alt="Preview" className="w-full h-auto block" />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70">Caption (optional)</label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-2 w-full h-10 rounded-lg bg-black/30 border border-white/10 px-3 outline-none focus:border-white/20"
                placeholder="Stay sharp."
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-2 w-full h-10 rounded-lg bg-black/30 border border-white/10 px-3 outline-none focus:border-white/20"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label htmlFor="active" className="text-sm text-white/80">
                Active
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={onUpload}
                disabled={loading}
                className="h-10 px-4 rounded-lg bg-blue-500/90 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">All memes</h2>
          <div className="text-sm text-white/60">{items.length} items</div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((m) => {
            const img = toProxiedUrl(m.imageUrl) || m.imageUrl;
            return (
              <div key={m.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/25">
                <div className="aspect-square bg-black/40">
                  <img src={img} alt={m.caption || "meme"} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-white/70">{m.category || "general"}</div>
                    <div className={`text-xs px-2 py-1 rounded-full border ${m.isActive ? "border-green-500/30 text-green-200 bg-green-500/10" : "border-white/10 text-white/60 bg-white/5"}`}>
                      {m.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  {m.caption ? <div className="mt-2 text-sm">{m.caption}</div> : <div className="mt-2 text-sm text-white/50">(no caption)</div>}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(m.id, m.isActive)}
                      disabled={loading}
                      className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
                    >
                      {m.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      disabled={loading}
                      className="h-9 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stats?.top?.length ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-semibold">Top viewed</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.top.map((t) => {
              const img = toProxiedUrl(t.imageUrl) || t.imageUrl;
              return (
                <div key={t.memeId} className="rounded-xl overflow-hidden border border-white/10 bg-black/25">
                  <div className="aspect-square bg-black/40">
                    <img src={img} alt={t.caption || "meme"} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-white/70">{t.category || "general"}</div>
                    <div className="mt-1 text-sm">{t.caption || "(no caption)"}</div>
                    <div className="mt-3 text-xs text-white/60">{t.views} views</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

