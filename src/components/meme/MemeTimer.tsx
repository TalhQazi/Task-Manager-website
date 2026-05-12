import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";
import { fetchMemeState, fetchNextMeme, logMemeShown, preloadImage, saveMemeState, type MemePayload } from "./MemeService";
import { MemeOverlay } from "./MemeOverlay";
import { MemeModal } from "./MemeModal";

// Spec-required storage keys (keep legacy keys for backward compatibility/migration)
const LS_LAST = "lastMemeTimestamp";
const LS_NEXT = "nextMemeTimestamp";
const LS_LAST_LEGACY = "taskflow_lastMemeTimestamp";
const LS_NEXT_LEGACY = "taskflow_nextMemeTimestamp";
const LS_LOCK = "taskflow_memeLock";
const LS_ACTIVE = "taskflow_memeActive";

type LockPayload = {
  tabId: string;
  expiresAt: number;
};

function now() {
  return Date.now();
}

function randomNextMs() {
  const min = 3 * 60 * 60 * 1000;
  const max = 4 * 60 * 60 * 1000;
  return min + Math.floor(Math.random() * (max - min));
}

function readNumber(key: string): number | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function writeNumber(key: string, value: number) {
  localStorage.setItem(key, String(value));
}

function readWithLegacy(primary: string, legacy: string): number | null {
  const p = readNumber(primary);
  if (p && p > 0) return p;
  const l = readNumber(legacy);
  if (l && l > 0) {
    // migrate forward
    writeNumber(primary, l);
    return l;
  }
  return null;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  const auth = getAuthState();
  const emp = getEmployeeAuth();
  return Boolean((auth.isAuthenticated && auth.token) || emp?.token);
}

function isIdle(lastInteractionAt: number) {
  if (document.visibilityState !== "visible") return true;
  // Consider user idle after 2 minutes without interaction
  return now() - lastInteractionAt > 2 * 60 * 1000;
}

export function MemeTimer() {
  const location = useLocation();
  const tabId = useMemo(() => `${now()}_${Math.random().toString(16).slice(2)}`, []);

  const [open, setOpen] = useState(false);
  const [meme, setMeme] = useState<MemePayload | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastInteractionAtRef = useRef<number>(now());
  const pendingTriggerRef = useRef(false);
  const lockRenewRef = useRef<number | null>(null);

  const isLoginRoute = location.pathname.startsWith("/login");

  const acquireLock = useCallback(() => {
    const raw = localStorage.getItem(LS_LOCK);
    const lock = safeJsonParse<LockPayload>(raw);
    const n = now();
    if (lock && lock.expiresAt > n && lock.tabId !== tabId) return false;

    const next: LockPayload = { tabId, expiresAt: n + 2 * 60 * 1000 };
    localStorage.setItem(LS_LOCK, JSON.stringify(next));
    return true;
  }, [tabId]);

  const releaseLock = useCallback(() => {
    const raw = localStorage.getItem(LS_LOCK);
    const lock = safeJsonParse<LockPayload>(raw);
    if (lock?.tabId === tabId) {
      localStorage.removeItem(LS_LOCK);
    }
  }, [tabId]);

  const setActiveFlag = useCallback((v: boolean) => {
    if (v) localStorage.setItem(LS_ACTIVE, "true");
    else localStorage.removeItem(LS_ACTIVE);
  }, []);

  const isAnyTabActive = useCallback(() => {
    return localStorage.getItem(LS_ACTIVE) === "true";
  }, []);

  const ensureNextSchedule = useCallback(() => {
    const existing = readWithLegacy(LS_NEXT, LS_NEXT_LEGACY);
    if (existing && existing > 0) return existing;
    const next = now() + randomNextMs();
    writeNumber(LS_NEXT, next);
    // also keep legacy updated (safe migration window)
    writeNumber(LS_NEXT_LEGACY, next);

    const last = readWithLegacy(LS_LAST, LS_LAST_LEGACY);
    void saveMemeState({ lastMemeTimestamp: last, nextMemeTimestamp: next });
    return next;
  }, []);

  const scheduleNext = useCallback(async () => {
    const n = now();
    writeNumber(LS_LAST, n);
    writeNumber(LS_LAST_LEGACY, n);
    const next = n + randomNextMs();
    writeNumber(LS_NEXT, next);
    writeNumber(LS_NEXT_LEGACY, next);
    await saveMemeState({ lastMemeTimestamp: n, nextMemeTimestamp: next });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setActiveFlag(false);
    releaseLock();
    void scheduleNext();

    const current = meme;
    setMeme(null);
    if (current) {
      void logMemeShown(current.id, now());
    }
  }, [meme, releaseLock, scheduleNext, setActiveFlag]);

  // Initial sync from backend (multi-device)
  useEffect(() => {
    if (!isAuthenticated()) return;
    if (isLoginRoute) return;

    (async () => {
      try {
        const state = await fetchMemeState();
        const localLast = readWithLegacy(LS_LAST, LS_LAST_LEGACY);
        const localNext = readWithLegacy(LS_NEXT, LS_NEXT_LEGACY);

        const serverLast = typeof state.lastMemeTimestamp === "number" ? state.lastMemeTimestamp : null;
        const serverNext = typeof state.nextMemeTimestamp === "number" ? state.nextMemeTimestamp : null;

        const mergedLast = Math.max(localLast || 0, serverLast || 0) || null;
        const mergedNextRaw = Math.max(localNext || 0, serverNext || 0);
        const mergedNext = mergedNextRaw > 0 ? mergedNextRaw : null;

        if (mergedLast) writeNumber(LS_LAST, mergedLast);
        if (mergedNext) writeNumber(LS_NEXT, mergedNext);
        if (mergedLast) writeNumber(LS_LAST_LEGACY, mergedLast);
        if (mergedNext) writeNumber(LS_NEXT_LEGACY, mergedNext);
        if (!mergedNext) ensureNextSchedule();
      } catch {
        // best-effort; local schedule still works
        ensureNextSchedule();
      }
    })();
  }, [ensureNextSchedule, isLoginRoute]);

  const trigger = useCallback(async () => {
    if (!isAuthenticated()) return;
    if (isLoginRoute) return;
    if (isAnyTabActive()) return;
    if (!acquireLock()) return;

    try {
      const nextMeme = await fetchNextMeme();
      try {
        await preloadImage(nextMeme.imageUrl);
      } catch {
        // If preload fails, still attempt to show (img tag handles fallback through service's fallback)
      }
      setMeme(nextMeme);
      setActiveFlag(true);
      setOpen(true);
    } catch {
      releaseLock();
      setActiveFlag(false);
    }
  }, [acquireLock, isAnyTabActive, isLoginRoute, releaseLock, setActiveFlag]);

  const check = useCallback(() => {
    if (!isAuthenticated()) return;
    if (isLoginRoute) return;

    const next = ensureNextSchedule();
    const n = now();
    if (n < next) return;

    // Multi-tab: if any tab is showing a meme, skip.
    if (isAnyTabActive()) return;

    // Idle guard: delay until user interacts again.
    if (isIdle(lastInteractionAtRef.current)) {
      pendingTriggerRef.current = true;
      return;
    }

    void trigger();
  }, [ensureNextSchedule, isAnyTabActive, isLoginRoute, trigger]);

  // 60s timer loop (setTimeout chaining, not setInterval)
  useEffect(() => {
    if (!isAuthenticated()) return;

    const tick = () => {
      check();
      // align roughly to 60s, but never drift into tight loops
      timerRef.current = window.setTimeout(tick, 60_000);
    };
    timerRef.current = window.setTimeout(tick, 2_000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [check]);

  // Interaction + idle resume
  useEffect(() => {
    const bump = () => {
      lastInteractionAtRef.current = now();
      if (pendingTriggerRef.current && document.visibilityState === "visible") {
        pendingTriggerRef.current = false;
        check();
      }
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    document.addEventListener("visibilitychange", bump);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump as any));
      document.removeEventListener("visibilitychange", bump);
    };
  }, [check]);

  // Keep lock alive while open (avoid another tab stealing)
  useEffect(() => {
    if (!open) return;
    const renew = () => {
      const raw = localStorage.getItem(LS_LOCK);
      const lock = safeJsonParse<LockPayload>(raw);
      if (lock?.tabId !== tabId) return;
      localStorage.setItem(LS_LOCK, JSON.stringify({ tabId, expiresAt: now() + 2 * 60 * 1000 }));
    };
    lockRenewRef.current = window.setInterval(renew, 30_000);
    return () => {
      if (lockRenewRef.current) window.clearInterval(lockRenewRef.current);
      lockRenewRef.current = null;
    };
  }, [open, tabId]);

  // If another tab closes the modal and clears active flag, close here too
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_ACTIVE && e.newValue !== "true" && open) {
        setOpen(false);
        setMeme(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [open]);

  if (!open || !meme) return null;

  return (
    <>
      <MemeOverlay onClick={close} />
      <MemeModal isOpen={open} imageUrl={meme.imageUrl} caption={meme.caption || ""} onClose={close} />
    </>
  );
}
