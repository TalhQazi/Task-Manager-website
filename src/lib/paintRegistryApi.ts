import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import type {
  FinishRecord,
  FinishRecordPhoto,
  FinishTaxonomies,
  FinishLookupResult,
} from "@/types/paintRegistry";

// ---------------------------------------------------------------------------
// Telemetry Support
// ---------------------------------------------------------------------------
export type PaintTelemetryEvent =
  | "paint_registry_opened"
  | "paint_record_created"
  | "paint_record_updated"
  | "paint_record_set_current"
  | "paint_record_copied"
  | "paint_photo_added"
  | "paint_lookup_started"
  | "paint_lookup_completed"
  | "paint_search_used"
  | "paint_record_archived";

export function trackPaintTelemetry(
  eventName: PaintTelemetryEvent,
  metadata?: Record<string, any>
) {
  try {
    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };
    if (typeof window !== "undefined") {
      // Local telemetry bus
      window.dispatchEvent(
        new CustomEvent("paint_telemetry", { detail: payload })
      );
    }
  } catch {
    // Fail-safe telemetry
  }
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

export interface FetchFinishesParams {
  propertyId?: string;
  unitAreaName?: string;
  surfaceTypeName?: string;
  status?: string;
  useType?: string;
  manufacturer?: string;
  colorCode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchFinishesResponse {
  success: boolean;
  items: FinishRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchFinishes(
  params: FetchFinishesParams = {}
): Promise<FetchFinishesResponse> {
  const query = new URLSearchParams();
  if (params.propertyId) query.set("propertyId", params.propertyId);
  if (params.unitAreaName) query.set("unitAreaName", params.unitAreaName);
  if (params.surfaceTypeName) query.set("surfaceTypeName", params.surfaceTypeName);
  if (params.status) query.set("status", params.status);
  if (params.useType) query.set("useType", params.useType);
  if (params.manufacturer) query.set("manufacturer", params.manufacturer);
  if (params.colorCode) query.set("colorCode", params.colorCode);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const url = `/api/finishes?${query.toString()}`;
  return apiFetch<FetchFinishesResponse>(url);
}

export async function fetchFinishById(id: string): Promise<{ success: boolean; finish: FinishRecord }> {
  return apiFetch<{ success: boolean; finish: FinishRecord }>(`/api/finishes/${id}`);
}

export async function createFinish(payload: Partial<FinishRecord>): Promise<{
  success: boolean;
  finish: FinishRecord;
  supersededRecordId?: string | null;
}> {
  const res = await apiFetch<{
    success: boolean;
    finish: FinishRecord;
    supersededRecordId?: string | null;
  }>("/api/finishes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  trackPaintTelemetry("paint_record_created", {
    propertyId: payload.propertyId,
    colorCode: payload.colorCode,
    surface: payload.surfaceTypeName,
  });
  return res;
}

export async function updateFinish(
  id: string,
  payload: Partial<FinishRecord>
): Promise<{ success: boolean; finish: FinishRecord }> {
  const res = await apiFetch<{ success: boolean; finish: FinishRecord }>(`/api/finishes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  trackPaintTelemetry("paint_record_updated", { id, colorCode: payload.colorCode });
  return res;
}

export async function setCurrentFinish(
  id: string
): Promise<{ success: boolean; finish: FinishRecord; supersededId?: string | null }> {
  const res = await apiFetch<{ success: boolean; finish: FinishRecord; supersededId?: string | null }>(
    `/api/finishes/${id}/set-current`,
    {
      method: "POST",
    }
  );
  trackPaintTelemetry("paint_record_set_current", { id });
  return res;
}

export async function archiveFinish(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/finishes/${id}/archive`, {
    method: "POST",
  });
  trackPaintTelemetry("paint_record_archived", { id });
  return res;
}

export async function restoreFinish(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/finishes/${id}/restore`, {
    method: "POST",
  });
}

export interface ApplyToAreasPayload {
  destinations: Array<{
    propertyId?: string;
    propertyName?: string;
    buildingName?: string;
    unitAreaName?: string;
    roomZoneName?: string;
    surfaceTypeId?: string;
    surfaceTypeName?: string;
  }>;
  setCurrent?: boolean;
  makeIndependentCopies?: boolean;
}

export async function applyToOtherAreas(
  id: string,
  payload: ApplyToAreasPayload
): Promise<{ success: boolean; message: string; assignmentsCount: number; copiesCount: number }> {
  const res = await apiFetch<{
    success: boolean;
    message: string;
    assignmentsCount: number;
    copiesCount: number;
  }>(`/api/finishes/${id}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  trackPaintTelemetry("paint_record_copied", {
    id,
    destinationCount: payload.destinations.length,
    makeIndependentCopies: payload.makeIndependentCopies,
  });
  return res;
}

export async function uploadFinishPhotos(
  finishId: string,
  formData: FormData
): Promise<{ success: boolean; photos: FinishRecordPhoto[] }> {
  const res = await apiFetch<{ success: boolean; photos: FinishRecordPhoto[] }>(
    `/api/finishes/${finishId}/photos`,
    {
      method: "POST",
      body: formData,
    }
  );
  trackPaintTelemetry("paint_photo_added", { finishId });
  return res;
}

export async function deleteFinishPhoto(
  finishId: string,
  photoId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/api/finishes/${finishId}/photos/${photoId}`,
    {
      method: "DELETE",
    }
  );
}

export async function updateFinishPhoto(
  finishId: string,
  photoId: string,
  data: { caption?: string; photoType?: string; sortOrder?: number }
): Promise<{ success: boolean; photo: FinishRecordPhoto }> {
  return apiFetch<{ success: boolean; photo: FinishRecordPhoto }>(
    `/api/finishes/${finishId}/photos/${photoId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export interface QuickLookupParams {
  propertyId: string;
  surfaceTypeName: string;
  unitAreaName?: string;
  roomZoneName?: string;
}

export async function quickLookupFinish(
  params: QuickLookupParams
): Promise<FinishLookupResult> {
  trackPaintTelemetry("paint_lookup_started", params);
  const query = new URLSearchParams({
    propertyId: params.propertyId,
    surfaceTypeName: params.surfaceTypeName,
  });
  if (params.unitAreaName) query.set("unitAreaName", params.unitAreaName);
  if (params.roomZoneName) query.set("roomZoneName", params.roomZoneName);

  const res = await apiFetch<FinishLookupResult>(`/api/finishes/lookup?${query.toString()}`);
  trackPaintTelemetry("paint_lookup_completed", { found: res.found, ...params });
  return res;
}

export async function fetchTaxonomies(): Promise<FinishTaxonomies> {
  const res = await apiFetch<{
    success: boolean;
    surfaces: string[];
    sheens: string[];
    materials: string[];
    customList?: any[];
  }>("/api/finishes/taxonomies");
  return {
    surfaces: res.surfaces || [],
    sheens: res.sheens || [],
    materials: res.materials || [],
    customList: res.customList || [],
  };
}

export async function addCustomTaxonomy(payload: {
  category: "surface" | "sheen" | "material";
  name: string;
  description?: string;
}): Promise<{ success: boolean; item: any }> {
  return apiFetch<{ success: boolean; item: any }>("/api/finishes/taxonomies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomTaxonomy(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/finishes/taxonomies/${id}`, {
    method: "DELETE",
  });
}

export { toProxiedUrl };

