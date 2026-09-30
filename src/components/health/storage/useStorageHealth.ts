import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/admin/apiClient";
import type { StorageHealthPayload } from "./types";

interface UseStorageHealthResult {
  data: StorageHealthPayload | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * Polls storage-health telemetry for a server.
 *
 * The backend returns the full payload on every call, so rather than run five
 * separate timers (activity 10-15s / temp 60s / filesystem 60s / SMART 5m /
 * inventory 5m) we poll on the fastest cadence the payload changes at — drive
 * activity, ~12s — which naturally refreshes the slower fields too. This keeps
 * the "live" feel the spec asks for without hammering the API.
 */
export function useStorageHealth(serverId: string = "host"): UseStorageHealthResult {
  const [data, setData] = useState<StorageHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const payload = await apiFetch<StorageHealthPayload>(
        `/api/health/servers/${encodeURIComponent(serverId)}/storage-health`
      );
      if (!mountedRef.current) return;
      setData(payload);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load storage health");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 12000); // drive-activity cadence
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refresh: fetchData };
}
