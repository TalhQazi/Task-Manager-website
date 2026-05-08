/**
 * ClearHire® Frontend API Client
 * ───────────────────────────────
 * Typed API functions for all ClearHire endpoints.
 * Uses the existing apiFetch wrapper from apiClient.ts.
 */

import { apiFetch } from "./apiClient";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ClearHireStatus = "PENDING" | "GREEN" | "YELLOW" | "RED";

export interface ClearHireAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  startDate: string;
  endDate?: string | null;
}

export interface ClearHireSubmitPayload {
  userId: string;
  employeeId?: string;
  fullName: string;
  dob: string;
  ssn: string;
  addressHistory: ClearHireAddress[];
  governmentIdUrl?: string;
  selfieUrl?: string;
  fcraConsentGiven: boolean;
}

export interface ClearHireProfile {
  id: string;
  userId: string;
  employeeId?: string | null;
  fullName: string;
  status: ClearHireStatus;
  score: number;
  flags: string[];
  lastChecked: string;
  fcraConsentGiven?: boolean;
  fcraConsentDate?: string;
  adminOverride?: {
    overriddenAt: string;
    previousStatus: string;
    reason: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Submit a new ClearHire background check.
 */
export async function submitClearHire(payload: ClearHireSubmitPayload) {
  return apiFetch<{ item: ClearHireProfile }>("/api/clearhire/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get the ClearHire status for a user.
 */
export async function getClearHireStatus(userId: string) {
  return apiFetch<{ item: ClearHireProfile }>(
    `/api/clearhire/status/${encodeURIComponent(userId)}`
  );
}

/**
 * Re-run a background check for a user.
 */
export async function recheckClearHire(userId: string) {
  return apiFetch<{ item: ClearHireProfile }>("/api/clearhire/recheck", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/**
 * Admin override: change YELLOW → GREEN.
 */
export async function overrideClearHire(userId: string, reason: string) {
  return apiFetch<{ item: ClearHireProfile }>("/api/clearhire/override", {
    method: "POST",
    body: JSON.stringify({ userId, reason }),
  });
}

/**
 * List all ClearHire profiles (admin only).
 */
export async function listClearHireProfiles(status?: ClearHireStatus) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ items: ClearHireProfile[]; total: number }>(
    `/api/clearhire/all${qs}`
  );
}
