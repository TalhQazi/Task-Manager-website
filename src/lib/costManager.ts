import { apiFetch } from "@/lib/api";

// ---------- Types ----------

export type PurchaseStatus =
  | "not_purchased"
  | "ready_to_buy"
  | "partially_paid"
  | "purchased"
  | "shipped"
  | "received"
  | "stored"
  | "delayed"
  | "canceled";

export type ExpenseType =
  | "material"
  | "manufacturing"
  | "testing"
  | "certification"
  | "permit"
  | "shipping"
  | "tax"
  | "lab"
  | "packaging"
  | "other";

export interface CostVendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notes: string;
}

export interface CostStorage {
  locationName?: string;
  address?: string;
  building?: string;
  room?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  qtyStored?: number;
  notes?: string;
  storedByUsername?: string;
  storedAt?: string | null;
}

export type CostFileType =
  | "quote"
  | "invoice"
  | "receipt"
  | "purchase_order"
  | "spec_sheet"
  | "safety_data_sheet"
  | "lab_report"
  | "photo"
  | "tracking"
  | "other";

export interface CostAttachment {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  fileType: CostFileType;
  uploadedByUsername: string;
  uploadedAt: string;
}

export type CostItemWarning = "missing_vendor" | "missing_receipt" | "not_stored";

export interface InventoryRecord {
  id: string;
  lineItemId: string;
  projectId: string;
  locationName: string;
  address: string;
  building: string;
  room: string;
  aisle: string;
  shelf: string;
  bin: string;
  qtyStored: number;
  unit: string;
  notes: string;
  qrCode: string;
  photoUrl: string;
  storedByUsername: string;
  storedAt: string;
}

export interface InventorySearchResult extends InventoryRecord {
  itemName: string;
  purchaseStatus: PurchaseStatus;
  vendorName: string;
  projectName: string;
}

export type CertificationType = "lab_testing" | "ul_listing" | "permit" | "certification" | "retesting";
export type CertificationStatus =
  | "planned"
  | "quoted"
  | "submitted"
  | "in_progress"
  | "passed"
  | "failed"
  | "approved"
  | "expired";

export interface CertificationRequirement {
  id: string;
  projectId: string;
  lineItemId: string | null;
  requirementType: CertificationType;
  name: string;
  authorityOrLab: string;
  standard: string;
  status: CertificationStatus;
  requiredForPrototype: boolean;
  estimatedCostCents: number;
  paidCents: number;
  dueDate: string | null;
  filingDate: string | null;
  approvalDate: string | null;
  expirationDate: string | null;
  result: string;
  notes: string;
}

export interface CostLineItem {
  id: string;
  costSheetId: string;
  costSectionId: string;
  projectId: string;
  taskId: string;
  itemName: string;
  description: string;
  expenseType: ExpenseType;
  qty: number;
  unit: string;
  unitCostCents: number;
  shippingCostCents: number;
  taxCostCents: number;
  otherFeesCents: number;
  estimatedTotalCents: number;
  paidCents: number;
  remainingCents: number;
  vendorId: string | null;
  vendor: CostVendor | null;
  quoteNumber: string;
  purchaseStatus: PurchaseStatus;
  priority: "low" | "medium" | "high" | "critical";
  requiredForPrototype: boolean;
  isActive: boolean;
  storage: CostStorage;
  attachments: CostAttachment[];
  warnings: CostItemWarning[];
  notes: string;
}

export interface CostSection {
  id: string;
  name: string;
  sortOrder: number;
  isRequired: boolean;
  subtotalEstimatedCents: number;
  subtotalPaidCents: number;
  items: CostLineItem[];
}

export interface CostSummary {
  projectedCents: number;
  spentCents: number;
  remainingCents: number;
  availableBudgetCents: number;
  budgetAfterRemainingCents: number;
  purchasedCount: number;
  totalCount: number;
  purchasedPct: number;
  buildReadinessPct: number;
  nextBlocker: {
    id: string;
    itemName: string;
    remainingCents: number;
    priority: string;
    purchaseStatus: PurchaseStatus;
  } | null;
}

export interface CostSheetPayload {
  sheet: {
    id: string;
    projectId: string;
    name: string;
    currency: string;
    availableBudgetCents: number;
  };
  sections: CostSection[];
  certifications: CertificationRequirement[];
  summary: CostSummary;
}

// ---------- Money helpers (values stored as integer cents) ----------

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export function dollarsToCents(input: string | number): number {
  const n = typeof input === "string" ? Number(input.replace(/[$,\s]/g, "")) : input;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToDollarInput(cents: number): string {
  return ((cents || 0) / 100).toFixed(2);
}

// ---------- API ----------

const BASE = "/api/cost-manager";

export function getProjectCostSheet(projectId: string) {
  return apiFetch<CostSheetPayload | null>(`${BASE}/projects/${encodeURIComponent(projectId)}`);
}

export function getTaskCostSheet(taskId: string) {
  return apiFetch<CostSheetPayload | null>(`${BASE}/tasks/${encodeURIComponent(taskId)}`);
}

export function getCostSheets() {
  return apiFetch<{ items: Array<{ id: string; projectId?: string; taskId?: string; name: string; currency: string; availableBudgetCents: number; createdByUsername?: string; createdAt?: string }> }>(`${BASE}/sheets`);
}

export function createCostSheet(payload: { name: string; availableBudgetCents: number }) {
  return apiFetch<{ id: string; name: string; currency: string; availableBudgetCents: number }>(`${BASE}/sheets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCostSheetById(sheetId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/sheets/${encodeURIComponent(sheetId)}`);
}

export function attachCostSheet(sheetId: string, payload: { projectId: string | null; taskId: string | null }) {
  return apiFetch<{ success: boolean; item: any }>(`${BASE}/sheets/${encodeURIComponent(sheetId)}/attach`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCostSheet(sheetId: string) {
  return apiFetch<{ success: boolean }>(`${BASE}/sheets/${encodeURIComponent(sheetId)}`, {
    method: "DELETE",
  });
}

export function updateCostSheet(sheetId: string, payload: { name?: string; availableBudgetCents?: number }) {
  return apiFetch<CostSheetPayload>(`${BASE}/sheets/${encodeURIComponent(sheetId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createCostSection(sheetId: string, payload: { name: string; isRequired?: boolean }) {
  return apiFetch<CostSheetPayload>(`${BASE}/sheets/${encodeURIComponent(sheetId)}/sections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCostSection(sectionId: string, payload: { name?: string; isRequired?: boolean; sortOrder?: number }) {
  return apiFetch<CostSheetPayload>(`${BASE}/sections/${encodeURIComponent(sectionId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCostSection(sectionId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/sections/${encodeURIComponent(sectionId)}`, {
    method: "DELETE",
  });
}

export type LineItemInput = Partial<{
  itemName: string;
  description: string;
  expenseType: ExpenseType;
  qty: number;
  unit: string;
  unitCostCents: number;
  shippingCostCents: number;
  taxCostCents: number;
  otherFeesCents: number;
  paidCents: number;
  vendorId: string | null;
  quoteNumber: string;
  taskId: string;
  purchaseStatus: PurchaseStatus;
  priority: "low" | "medium" | "high" | "critical";
  requiredForPrototype: boolean;
  isActive: boolean;
  notes: string;
  storage: CostStorage;
}>;

export function createCostLineItem(sectionId: string, payload: LineItemInput & { itemName: string }) {
  return apiFetch<CostSheetPayload>(`${BASE}/sections/${encodeURIComponent(sectionId)}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCostLineItem(itemId: string, payload: LineItemInput) {
  return apiFetch<CostSheetPayload>(`${BASE}/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCostLineItem(itemId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export function getTaskCostItems(taskId: string) {
  return apiFetch<{ items: CostLineItem[] }>(`${BASE}/tasks/${encodeURIComponent(taskId)}/items`);
}

// -- Files (quotes, invoices, receipts, spec sheets, lab reports) --

export function uploadCostItemFiles(
  itemId: string,
  files: Array<{ fileName: string; fileType: CostFileType; dataUrl: string }>
) {
  return apiFetch<CostSheetPayload>(`${BASE}/items/${encodeURIComponent(itemId)}/files`, {
    method: "POST",
    body: JSON.stringify({ files }),
  });
}

export function deleteCostItemFile(itemId: string, fileId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/items/${encodeURIComponent(itemId)}/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });
}

// -- Inventory (split locations, QR codes, global finder) --

export function getItemInventory(itemId: string) {
  return apiFetch<{ items: InventoryRecord[] }>(`${BASE}/items/${encodeURIComponent(itemId)}/inventory`);
}

export function createInventoryRecord(
  itemId: string,
  payload: Partial<InventoryRecord> & { locationName: string; photoDataUrl?: string; markStored?: boolean }
) {
  return apiFetch<CostSheetPayload>(`${BASE}/items/${encodeURIComponent(itemId)}/inventory`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInventoryRecord(recordId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/inventory/${encodeURIComponent(recordId)}`, {
    method: "DELETE",
  });
}

export function searchInventory(search: string) {
  return apiFetch<{ items: InventorySearchResult[] }>(
    `${BASE}/inventory?search=${encodeURIComponent(search)}`
  );
}

// -- Certifications, testing, UL listing, permits --

export type CertificationInput = Partial<{
  requirementType: CertificationType;
  name: string;
  authorityOrLab: string;
  standard: string;
  status: CertificationStatus;
  requiredForPrototype: boolean;
  estimatedCostCents: number;
  paidCents: number;
  dueDate: string | null;
  filingDate: string | null;
  approvalDate: string | null;
  expirationDate: string | null;
  result: string;
  notes: string;
}>;

export function createCertification(
  projectId: string,
  payload: CertificationInput & { requirementType: CertificationType; name: string }
) {
  return apiFetch<CostSheetPayload>(`${BASE}/projects/${encodeURIComponent(projectId)}/certifications`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCertification(certId: string, payload: CertificationInput) {
  return apiFetch<CostSheetPayload>(`${BASE}/certifications/${encodeURIComponent(certId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCertification(certId: string) {
  return apiFetch<CostSheetPayload>(`${BASE}/certifications/${encodeURIComponent(certId)}`, {
    method: "DELETE",
  });
}

// Read a browser File into a base64 data URL for upload.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// ---------- Status display metadata ----------

export const PURCHASE_STATUS_META: Record<PurchaseStatus, { label: string; className: string }> = {
  not_purchased: { label: "Not Purchased", className: "bg-gray-100 text-gray-700 border-gray-200" },
  ready_to_buy: { label: "Ready to Buy", className: "bg-blue-100 text-blue-700 border-blue-200" },
  partially_paid: { label: "Partially Paid", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  purchased: { label: "Purchased", className: "bg-green-100 text-green-700 border-green-200" },
  shipped: { label: "Shipped", className: "bg-sky-100 text-sky-700 border-sky-200" },
  received: { label: "Received", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  stored: { label: "Stored", className: "bg-green-200 text-green-900 border-green-300" },
  delayed: { label: "Delayed", className: "bg-orange-100 text-orange-700 border-orange-200" },
  canceled: { label: "Canceled", className: "bg-red-100 text-red-700 border-red-200" },
};

export const PURCHASED_STATUSES: PurchaseStatus[] = ["purchased", "shipped", "received", "stored"];

export const FILE_TYPE_LABELS: Record<CostFileType, string> = {
  quote: "Quote",
  invoice: "Invoice",
  receipt: "Receipt",
  purchase_order: "Purchase Order",
  spec_sheet: "Spec Sheet",
  safety_data_sheet: "Safety Data Sheet",
  lab_report: "Lab Report",
  photo: "Photo",
  tracking: "Tracking Document",
  other: "Other",
};

export const WARNING_LABELS: Record<CostItemWarning, string> = {
  missing_vendor: "No vendor/contact on a costed item",
  missing_receipt: "Purchased with no invoice or receipt attached",
  not_stored: "Purchased but no storage location recorded",
};

export const CERT_TYPE_LABELS: Record<CertificationType, string> = {
  lab_testing: "Lab Testing",
  ul_listing: "UL Listing",
  permit: "Permit",
  certification: "Certification",
  retesting: "Retesting",
};

export const CERT_STATUS_META: Record<CertificationStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-gray-100 text-gray-700 border-gray-200" },
  quoted: { label: "Quoted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  submitted: { label: "Submitted", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  passed: { label: "Passed", className: "bg-green-100 text-green-700 border-green-200" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
  approved: { label: "Approved", className: "bg-green-200 text-green-900 border-green-300" },
  expired: { label: "Expired", className: "bg-orange-100 text-orange-700 border-orange-200" },
};
