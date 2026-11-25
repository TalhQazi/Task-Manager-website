import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useToast } from "@/hooks/use-toast";
import styles from "./SignaCore.module.css";
import {
  fromEditableFieldDraft,
  parseSignerLines,
  toEditableFieldDraft,
  type AdminDocumentFieldResponse,
  type EditableFieldDraft,
  type SignacoreFieldType,
} from "./signacoreUtils";

const SIGNACORE_API_BASE =
  String(import.meta.env.VITE_SIGNACORE_API_URL || "").trim() ||
  "http://127.0.0.1:8010";
const SIGNACORE_SHARED_SECRET = String(
  import.meta.env.VITE_SIGNACORE_SHARED_SECRET || "",
).trim();

type DocumentStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_SIGNED"
  | "COMPLETED"
  | "VOIDED";

interface SigningRequestRecord {
  id: string;
  signer_email: string;
  signer_name: string | null;
  status: "PENDING" | "OTP_VERIFIED" | "SIGNED" | "EXPIRED";
  otp_expires_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

interface DocumentPagePreview {
  number: number;
  width: number;
  height: number;
  preview_url: string;
}

interface AdminDocumentListItem {
  id: string;
  title: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  signer_count: number;
  signed_count: number;
}

interface AdminDocumentDetail {
  id: string;
  title: string;
  status: DocumentStatus;
  original_pdf: string;
  signed_pdf: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  voided_at: string | null;
  voided_reason: string | null;
  fields: AdminDocumentFieldResponse[];
  signer_count: number;
  signed_count: number;
  signing_requests: SigningRequestRecord[];
  page_count: number;
  pages: DocumentPagePreview[];
  detection_summary?: {
    source: "ACROFORM" | "HEURISTIC";
    field_count: number;
  };
}

interface FieldFormState {
  fieldType: SignacoreFieldType;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isRequired: boolean;
  order: number;
}

const defaultFieldFormState: FieldFormState = {
  fieldType: "TEXT",
  label: "New Field",
  page: 1,
  x: 72,
  y: 120,
  width: 180,
  height: 24,
  isRequired: true,
  order: 1,
};

const emptyDocumentPages: DocumentPagePreview[] = [];

function getStatusClassName(status: DocumentStatus): string {
  switch (status) {
    case "COMPLETED":
      return styles.statusCompleted;
    case "SENT":
      return styles.statusSent;
    case "PARTIALLY_SIGNED":
      return styles.statusPartial;
    case "VOIDED":
      return styles.statusVoided;
    default:
      return styles.statusDraft;
  }
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}

function stringifyApiError(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const values = Object.values(payload as Record<string, unknown>).flatMap((value) =>
      Array.isArray(value) ? value.map(String) : [String(value)]
    );
    if (values.length > 0) return values.join(" ");
  }
  return fallback;
}

async function signacoreFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData =
    typeof FormData !== "undefined" &&
    init?.body instanceof FormData;

  if (!isFormData && init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (SIGNACORE_SHARED_SECRET) {
    headers.set("X-Signacore-Secret", SIGNACORE_SHARED_SECRET);
  }

  const response = await fetch(
    `${SIGNACORE_API_BASE.replace(/\/$/, "")}${path}`,
    {
      ...init,
      headers,
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const payload =
    contentType.includes("application/json")
      ? ((await response.json()) as unknown)
      : await response.text();

  if (!response.ok) {
    throw new Error(stringifyApiError(payload, `Request failed (${response.status})`));
  }

  return payload as T;
}

async function signacoreDownload(path: string, fileName: string): Promise<void> {
  const headers = new Headers();

  if (SIGNACORE_SHARED_SECRET) {
    headers.set("X-Signacore-Secret", SIGNACORE_SHARED_SECRET);
  }

  const response = await fetch(
    `${SIGNACORE_API_BASE.replace(/\/$/, "")}${path}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

async function signacoreFetchBlob(path: string): Promise<Blob> {
  const headers = new Headers();

  if (SIGNACORE_SHARED_SECRET) {
    headers.set("X-Signacore-Secret", SIGNACORE_SHARED_SECRET);
  }

  const response = await fetch(
    `${SIGNACORE_API_BASE.replace(/\/$/, "")}${path}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Preview load failed (${response.status})`);
  }

  return response.blob();
}

function getRequestActionLabel(status: SigningRequestRecord["status"]): string {
  if (status === "SIGNED") return "Request re-sign";
  if (status === "EXPIRED") return "Re-send link";
  return "Re-send request";
}

export default function SignaCore() {
  const { toast } = useToast();

  const [documents, setDocuments] = useState<AdminDocumentListItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AdminDocumentDetail | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFieldDraft[]>([]);
  const [pagePreviewUrls, setPagePreviewUrls] = useState<Record<number, string>>({});
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newField, setNewField] = useState<FieldFormState>(defaultFieldFormState);
  const [signerLines, setSignerLines] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingPreviewPages, setLoadingPreviewPages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [creatingField, setCreatingField] = useState(false);
  const [sendingDocument, setSendingDocument] = useState(false);
  const [voidingDocument, setVoidingDocument] = useState(false);
  const [resendingRequestIds, setResendingRequestIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [savingFieldIds, setSavingFieldIds] = useState<string[]>([]);
  const [deletingFieldIds, setDeletingFieldIds] = useState<string[]>([]);
  const previewUrlCacheRef = useRef<string[]>([]);

  const selectedField = useMemo(
    () =>
      editableFields.find((field) => field.id === activeFieldId) ??
      editableFields[0] ??
      null,
    [activeFieldId, editableFields],
  );
  const documentPages = selectedDocument?.pages ?? emptyDocumentPages;
  const canEditDocument =
    selectedDocument?.status === "DRAFT" ||
    selectedDocument?.status === "SENT" ||
    selectedDocument?.status === "PARTIALLY_SIGNED";
  const canSendDocument =
    selectedDocument?.status === "DRAFT" ||
    selectedDocument?.status === "SENT" ||
    selectedDocument?.status === "PARTIALLY_SIGNED";

  const loadDocumentDetail = useCallback(async (documentId: string): Promise<void> => {
    try {
      setLoadingDetail(true);
      const detail = await signacoreFetch<AdminDocumentDetail>(
        `/api/admin/documents/${documentId}/`,
      );
      setSelectedDocument(detail);
      setTitleDraft(detail.title);
      setVoidReason(detail.voided_reason ?? "");
      setEditableFields(detail.fields.map(toEditableFieldDraft));
      setActiveFieldId((current) =>
        current && detail.fields.some((field) => field.id === current)
          ? current
          : detail.fields[0]?.id ?? null,
      );
      setNewField((current) => ({
        ...current,
        page: detail.fields[0]?.page ?? 1,
        order:
          detail.fields.reduce((highestOrder, field) => Math.max(highestOrder, field.order), 0) + 1,
      }));
    } catch (error) {
      toast({
        title: "Document load failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const loadDocuments = useCallback(async (nextSelectedId?: string | null): Promise<void> => {
    try {
      setLoadingDocuments(true);
      const response = await signacoreFetch<{ items: AdminDocumentListItem[] }>(
        "/api/admin/documents/",
      );
      setDocuments(response.items);

      const selectedId =
        nextSelectedId ??
        selectedDocumentId ??
        response.items[0]?.id ??
        null;
      setSelectedDocumentId(selectedId);
      if (selectedId) {
        await loadDocumentDetail(selectedId);
      } else {
        setSelectedDocument(null);
        setEditableFields([]);
      }
    } catch (error) {
      toast({
        title: "Load failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoadingDocuments(false);
    }
  }, [loadDocumentDetail, selectedDocumentId, toast]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    let cancelled = false;

    async function loadPagePreviews(): Promise<void> {
      if (!selectedDocument || documentPages.length === 0) {
        previewUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlCacheRef.current = [];
        setPagePreviewUrls({});
        return;
      }

      try {
        setLoadingPreviewPages(true);
        const entries = await Promise.all(
          documentPages.map(async (page) => {
            const blob = await signacoreFetchBlob(page.preview_url);
            return [page.number, URL.createObjectURL(blob)] as const;
          }),
        );

        if (cancelled) {
          entries.forEach(([, objectUrl]) => URL.revokeObjectURL(objectUrl));
          return;
        }

        previewUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlCacheRef.current = entries.map(([, objectUrl]) => objectUrl);
        setPagePreviewUrls(Object.fromEntries(entries));
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Preview failed",
            description: getErrorMessage(error),
            variant: "destructive",
          });
          setPagePreviewUrls({});
        }
      } finally {
        if (!cancelled) {
          setLoadingPreviewPages(false);
        }
      }
    }

    void loadPagePreviews();

    return () => {
      cancelled = true;
    };
  }, [documentPages, selectedDocument, toast]);

  useEffect(() => {
    return () => {
      previewUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlCacheRef.current = [];
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setIsUploadModalOpen(false);
      setIsSendModalOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!uploadTitle.trim() || !uploadFile) {
      toast({
        title: "Upload incomplete",
        description: "Add a title and choose a PDF file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadTitle.trim());
    formData.append("pdf_file", uploadFile);

    try {
      setUploading(true);
      const created = await signacoreFetch<AdminDocumentDetail>(
        "/api/admin/documents/",
        {
          method: "POST",
          body: formData,
        },
      );
      setSelectedDocumentId(created.id);
      setSelectedDocument(created);
      setTitleDraft(created.title);
      setEditableFields(created.fields.map(toEditableFieldDraft));
      setActiveFieldId(created.fields[0]?.id ?? null);
      setVoidReason("");
      setSignerLines("");
      setUploadTitle("");
      setUploadFile(null);
      setIsUploadModalOpen(false);
      await loadDocuments(created.id);
      toast({
        title: "Document uploaded",
        description: `${created.fields.length} fields detected.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveTitle(): Promise<void> {
    if (!selectedDocument) return;
    try {
      setSavingTitle(true);
      await signacoreFetch<AdminDocumentDetail>(
        `/api/admin/documents/${selectedDocument.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: titleDraft.trim() }),
        },
      );
      await loadDocuments(selectedDocument.id);
      toast({
        title: "Title updated",
        description: "The document title has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingTitle(false);
    }
  }

  function updateEditableField(fieldId: string, updater: (field: EditableFieldDraft) => EditableFieldDraft): void {
    setEditableFields((current) =>
      current.map((field) => (field.id === fieldId ? updater(field) : field)),
    );
  }

  async function handleSaveField(fieldId: string): Promise<void> {
    if (!selectedDocument) return;
    const field = editableFields.find((entry) => entry.id === fieldId);
    if (!field) return;

    try {
      setSavingFieldIds((current) => [...current, fieldId]);
      await signacoreFetch(
        `/api/admin/documents/${selectedDocument.id}/fields/${fieldId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(fromEditableFieldDraft(field)),
        },
      );
      await loadDocumentDetail(selectedDocument.id);
      toast({
        title: "Field saved",
        description: `${field.label} was updated.`,
      });
    } catch (error) {
      toast({
        title: "Field update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingFieldIds((current) => current.filter((value) => value !== fieldId));
    }
  }

  async function handleDeleteField(fieldId: string): Promise<void> {
    if (!selectedDocument) return;
    try {
      setDeletingFieldIds((current) => [...current, fieldId]);
      await signacoreFetch(
        `/api/admin/documents/${selectedDocument.id}/fields/${fieldId}/`,
        { method: "DELETE" },
      );
      await loadDocumentDetail(selectedDocument.id);
      setActiveFieldId((current) => (current === fieldId ? null : current));
      toast({
        title: "Field removed",
        description: "The field was deleted from the document.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDeletingFieldIds((current) => current.filter((value) => value !== fieldId));
    }
  }

  async function handleCreateField(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedDocument) return;

    try {
      setCreatingField(true);
      await signacoreFetch(
        `/api/admin/documents/${selectedDocument.id}/fields/`,
        {
          method: "POST",
          body: JSON.stringify({
            field_type: newField.fieldType,
            label: newField.label,
            page: newField.page,
            x: newField.x,
            y: newField.y,
            width: newField.width,
            height: newField.height,
            is_required: newField.isRequired,
            order: newField.order,
          }),
        },
      );
      await loadDocumentDetail(selectedDocument.id);
      setNewField((current) => ({
        ...defaultFieldFormState,
        page: current.page,
        order: current.order + 1,
      }));
      toast({
        title: "Field added",
        description: "A new manual field has been created.",
      });
    } catch (error) {
      toast({
        title: "Field creation failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCreatingField(false);
    }
  }

  async function handleSendDocument(): Promise<void> {
    if (!selectedDocument) return;

    const signers = parseSignerLines(signerLines);
    if (signers.length === 0) {
      toast({
        title: "No signers parsed",
        description: "Add one signer per line using email or name, email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingDocument(true);
      await signacoreFetch<AdminDocumentDetail>(
        `/api/admin/documents/${selectedDocument.id}/send/`,
        {
          method: "POST",
          body: JSON.stringify({ signers }),
        },
      );
      setSignerLines("");
      setIsSendModalOpen(false);
      await loadDocuments(selectedDocument.id);
      toast({
        title: "Document sent",
        description: `${signers.length} signer request(s) created.`,
      });
    } catch (error) {
      toast({
        title: "Send failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSendingDocument(false);
    }
  }

  async function handleVoidDocument(): Promise<void> {
    if (!selectedDocument) return;
    try {
      setVoidingDocument(true);
      await signacoreFetch<AdminDocumentDetail>(
        `/api/admin/documents/${selectedDocument.id}/void/`,
        {
          method: "POST",
          body: JSON.stringify({ voided_reason: voidReason.trim() }),
        },
      );
      await loadDocuments(selectedDocument.id);
      toast({
        title: "Document voided",
        description: "Pending signer links were invalidated.",
      });
    } catch (error) {
      toast({
        title: "Void failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setVoidingDocument(false);
    }
  }

  async function handleDownloadSignedPdf(): Promise<void> {
    if (!selectedDocument) return;
    try {
      await signacoreDownload(
        `/api/admin/documents/${selectedDocument.id}/download/`,
        `${selectedDocument.title.replace(/\s+/g, "-").toLowerCase()}-signed.pdf`,
      );
      toast({
        title: "Download started",
        description: "The signed PDF is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  async function handleResendSigningRequest(signingRequestId: string): Promise<void> {
    if (!selectedDocument) return;

    try {
      setResendingRequestIds((current) => [...current, signingRequestId]);
      await signacoreFetch<AdminDocumentDetail>(
        `/api/admin/documents/${selectedDocument.id}/signing-requests/${signingRequestId}/resend/`,
        { method: "POST" },
      );
      await loadDocuments(selectedDocument.id);
      toast({
        title: "Signer reopened",
        description: "The signer received a fresh Signacore request.",
      });
    } catch (error) {
      toast({
        title: "Resend failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setResendingRequestIds((current) => current.filter((value) => value !== signingRequestId));
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Signacore</p>
          <h1 className={styles.title}>Document signing control center.</h1>
          <p className={styles.subtitle}>
            Upload agreements, review each signing field, reopen incomplete submissions, and send fresh signing links
            from one place.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton} onClick={() => setIsUploadModalOpen(true)} type="button">
              Upload document
            </button>
            {selectedDocument && canSendDocument ? (
              <button className={styles.secondaryButton} onClick={() => setIsSendModalOpen(true)} type="button">
                {selectedDocument.signing_requests.length > 0 ? "Add more signers" : "Send document"}
              </button>
            ) : null}
          </div>
        </div>
        <div className={styles.heroMetrics}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{documents.length}</span>
            <span className={styles.metricLabel}>Tracked documents</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>
              {documents.filter((document) => document.status === "COMPLETED").length}
            </span>
            <span className={styles.metricLabel}>Completed</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>
              {documents.filter((document) => document.status === "SENT" || document.status === "PARTIALLY_SIGNED").length}
            </span>
            <span className={styles.metricLabel}>In flight</span>
          </div>
        </div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sectionTitle}>Documents</h2>
            <button className={styles.secondaryButton} onClick={() => void loadDocuments(selectedDocumentId)}>
              Refresh
            </button>
          </div>
          {loadingDocuments ? (
            <div className={styles.emptyState}>Loading documents…</div>
          ) : documents.length === 0 ? (
            <div className={styles.emptyState}>No Signacore documents uploaded yet.</div>
          ) : (
            <div className={styles.documentList}>
              {documents.map((document) => (
                <button
                  key={document.id}
                  className={`${styles.documentCard} ${
                    selectedDocumentId === document.id ? styles.documentCardActive : ""
                  }`}
                  onClick={() => {
                    setSelectedDocumentId(document.id);
                    void loadDocumentDetail(document.id);
                  }}
                  type="button"
                >
                  <div className={styles.documentCardTop}>
                    <span className={`${styles.statusBadge} ${getStatusClassName(document.status)}`}>
                      {document.status.replaceAll("_", " ")}
                    </span>
                    <span className={styles.documentDate}>{formatTimestamp(document.created_at)}</span>
                  </div>
                  <strong className={styles.documentTitle}>{document.title}</strong>
                  <div className={styles.documentMeta}>
                    <span>
                      {document.signed_count} / {document.signer_count} signed
                    </span>
                    <span>Updated {formatTimestamp(document.updated_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className={styles.mainPanel}>
          {!selectedDocument ? (
            <div className={styles.emptyStateLarge}>
              Select a document from the left panel to review detected fields and signer status.
            </div>
          ) : (
            <>
              <section className={styles.detailHeader}>
                <div className={styles.detailHeaderMain}>
                  <div className={styles.detailHeaderRow}>
                    <span className={`${styles.statusBadge} ${getStatusClassName(selectedDocument.status)}`}>
                      {selectedDocument.status.replaceAll("_", " ")}
                    </span>
                    <span className={styles.metaTag}>Created {formatTimestamp(selectedDocument.created_at)}</span>
                    <span className={styles.metaTag}>Updated {formatTimestamp(selectedDocument.updated_at)}</span>
                    {selectedDocument.detection_summary ? (
                      <span className={styles.metaTag}>
                        {selectedDocument.detection_summary.source} · {selectedDocument.detection_summary.field_count} fields
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.titleRow}>
                    <input
                      className={styles.titleInput}
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                    />
                    <button className={styles.secondaryButton} disabled={savingTitle} onClick={() => void handleSaveTitle()}>
                      {savingTitle ? "Saving..." : "Save title"}
                    </button>
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.secondaryButton} onClick={() => setIsUploadModalOpen(true)} type="button">
                    Upload PDF
                  </button>
                  <button className={styles.secondaryButton} onClick={() => void loadDocumentDetail(selectedDocument.id)}>
                    {loadingDetail ? "Refreshing..." : "Refresh detail"}
                  </button>
                  {canSendDocument ? (
                    <button className={styles.primaryButton} disabled={sendingDocument} onClick={() => setIsSendModalOpen(true)} type="button">
                      {selectedDocument.signing_requests.length > 0 ? "Add signer requests" : "Send for signing"}
                    </button>
                  ) : null}
                  {(selectedDocument.status === "SENT" || selectedDocument.status === "PARTIALLY_SIGNED") ? (
                    <button className={styles.warningButton} disabled={voidingDocument} onClick={() => void handleVoidDocument()}>
                      {voidingDocument ? "Voiding..." : "Void document"}
                    </button>
                  ) : null}
                  {selectedDocument.status === "COMPLETED" ? (
                    <button className={styles.primaryButton} onClick={() => void handleDownloadSignedPdf()}>
                      Download signed PDF
                    </button>
                  ) : null}
                </div>
              </section>

              <section className={styles.detailGrid}>
                <div className={styles.previewPanel}>
                  <h2 className={styles.sectionTitle}>Live signing preview</h2>
                  <p className={styles.sectionHint}>
                    Review the document exactly as signers will see it. Select any highlighted field to update whether it
                    is required or remove it from the signing request.
                  </p>
                  {loadingPreviewPages ? (
                    <div className={styles.emptyState}>Rendering page previews…</div>
                  ) : documentPages.length > 0 ? (
                    <div className={styles.previewStage}>
                      {documentPages.map((page) => (
                        <article key={page.number} className={styles.previewPageCard}>
                          <img
                            className={styles.previewPageImage}
                            src={pagePreviewUrls[page.number]}
                            alt={`${selectedDocument.title} page ${page.number}`}
                          />
                          <div className={styles.previewOverlay}>
                            {editableFields
                              .filter((field) => field.page === page.number)
                              .map((field) => {
                                const top = ((page.height - field.y - field.height) / page.height) * 100;
                                const left = (field.x / page.width) * 100;
                                const width = (field.width / page.width) * 100;
                                const height = (field.height / page.height) * 100;
                                const typeClassName =
                                  field.fieldType === "TEXT"
                                    ? styles.previewFieldText
                                    : field.fieldType === "CHECKBOX"
                                      ? styles.previewFieldCheckbox
                                      : styles.previewFieldSignature;

                                return (
                                  <button
                                    key={field.id}
                                    className={`${styles.previewField} ${typeClassName} ${
                                      activeFieldId === field.id ? styles.previewFieldActive : ""
                                    } ${field.isRequired ? styles.previewFieldRequired : ""}`}
                                    onClick={() => setActiveFieldId(field.id)}
                                    style={{
                                      top: `${top}%`,
                                      left: `${left}%`,
                                      width: `${Math.max(width, field.fieldType === "CHECKBOX" ? 1.4 : 4)}%`,
                                      height: `${Math.max(height, field.fieldType === "CHECKBOX" ? 1.4 : field.fieldType === "TEXT" ? 1.2 : 1.8)}%`,
                                    }}
                                    title={`${field.label} (${field.fieldType})`}
                                    type="button"
                                  >
                                    <span className={styles.previewFieldLabel}>{field.label}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>No preview pages available for this document.</div>
                  )}
                </div>

                <div className={styles.inspectorPanel}>
                  <section className={styles.panelSection}>
                    <h2 className={styles.sectionTitle}>Signer requests</h2>
                    {selectedDocument.signing_requests.length === 0 ? (
                      <div className={styles.emptyState}>No signer requests yet.</div>
                    ) : (
                      <div className={styles.requestList}>
                        {selectedDocument.signing_requests.map((request) => (
                          <div key={request.id} className={styles.requestCard}>
                            <div className={styles.requestCardTop}>
                              <strong>{request.signer_name || "Unnamed signer"}</strong>
                              <span className={styles.requestStatus}>{request.status.replaceAll("_", " ")}</span>
                            </div>
                            <div className={styles.requestMeta}>{request.signer_email}</div>
                            <div className={styles.requestMeta}>Signed at {formatTimestamp(request.signed_at)}</div>
                            <div className={styles.requestMeta}>Expires {formatTimestamp(request.expires_at)}</div>
                            {request.ip_address ? (
                              <div className={styles.requestMeta}>Signer IP {request.ip_address}</div>
                            ) : null}
                            <div className={styles.requestCardFooter}>
                              <button
                                className={styles.secondaryButton}
                                disabled={selectedDocument.status === "VOIDED" || resendingRequestIds.includes(request.id)}
                                onClick={() => void handleResendSigningRequest(request.id)}
                                type="button"
                              >
                                {resendingRequestIds.includes(request.id) ? "Sending..." : getRequestActionLabel(request.status)}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={styles.panelSection}>
                    <div className={styles.panelHeadingRow}>
                      <div>
                        <h2 className={styles.sectionTitle}>Field editor</h2>
                        <p className={styles.sectionHint}>
                          Choose a field to rename it, mark it required, adjust its placement, or remove it from the document.
                        </p>
                      </div>
                    </div>
                    {editableFields.length > 0 ? (
                      <div className={styles.fieldRail}>
                        {editableFields.map((field) => (
                          <button
                            key={field.id}
                            className={`${styles.fieldChip} ${selectedField?.id === field.id ? styles.fieldChipActive : ""}`}
                            onClick={() => setActiveFieldId(field.id)}
                            type="button"
                          >
                            {field.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {selectedField ? (
                      <article className={styles.fieldInspector}>
                        <div className={styles.fieldCardHeader}>
                          <div>
                            <strong>{selectedField.label}</strong>
                            <div className={styles.fieldMeta}>
                              {selectedField.fieldType} · page {selectedField.page} · {selectedField.detectionSource}
                            </div>
                          </div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={selectedField.isRequired}
                              onChange={(event) =>
                                updateEditableField(selectedField.id, (current) => ({
                                  ...current,
                                  isRequired: event.target.checked,
                                }))
                              }
                              disabled={!canEditDocument}
                            />
                            Required
                          </label>
                        </div>

                        <div className={styles.fieldGrid}>
                          <label className={styles.fieldBlock}>
                            <span className={styles.fieldLabel}>Label</span>
                            <input
                              className={styles.textInput}
                              value={selectedField.label}
                              onChange={(event) =>
                                updateEditableField(selectedField.id, (current) => ({
                                  ...current,
                                  label: event.target.value,
                                }))
                              }
                              disabled={!canEditDocument}
                            />
                          </label>
                          <label className={styles.fieldBlock}>
                            <span className={styles.fieldLabel}>Type</span>
                            <select
                              className={styles.selectInput}
                              value={selectedField.fieldType}
                              onChange={(event) =>
                                updateEditableField(selectedField.id, (current) => ({
                                  ...current,
                                  fieldType: event.target.value as SignacoreFieldType,
                                }))
                              }
                              disabled={!canEditDocument}
                            >
                              <option value="TEXT">TEXT</option>
                              <option value="SIGNATURE">SIGNATURE</option>
                              <option value="INITIALS">INITIALS</option>
                              <option value="CHECKBOX">CHECKBOX</option>
                            </select>
                          </label>
                          {[
                            ["Page", "page"],
                            ["X", "x"],
                            ["Y", "y"],
                            ["Width", "width"],
                            ["Height", "height"],
                            ["Order", "order"],
                          ].map(([label, key]) => (
                            <label key={key} className={styles.fieldBlock}>
                              <span className={styles.fieldLabel}>{label}</span>
                              <input
                                className={styles.textInput}
                                type="number"
                                value={selectedField[key as keyof EditableFieldDraft] as number}
                                onChange={(event) =>
                                  updateEditableField(selectedField.id, (current) => ({
                                    ...current,
                                    [key]: Number(event.target.value),
                                  }))
                                }
                                disabled={!canEditDocument}
                              />
                            </label>
                          ))}
                        </div>

                        <div className={styles.fieldActions}>
                          <button
                            className={styles.secondaryButton}
                            disabled={!canEditDocument || savingFieldIds.includes(selectedField.id)}
                            onClick={() => void handleSaveField(selectedField.id)}
                            type="button"
                          >
                            {savingFieldIds.includes(selectedField.id) ? "Saving..." : "Save field"}
                          </button>
                          <button
                            className={styles.dangerButton}
                            disabled={!canEditDocument || deletingFieldIds.includes(selectedField.id)}
                            onClick={() => void handleDeleteField(selectedField.id)}
                            type="button"
                          >
                            {deletingFieldIds.includes(selectedField.id) ? "Excluding..." : "Exclude field"}
                          </button>
                        </div>
                      </article>
                    ) : (
                      <div className={styles.emptyState}>No fields available yet.</div>
                    )}
                  </section>
                </div>
              </section>

              <section className={styles.panelSection}>
                <div className={styles.panelHeadingRow}>
                  <div>
                    <h2 className={styles.sectionTitle}>Document controls</h2>
                    <p className={styles.sectionHint}>
                      Manage document-level actions and add any missing fields before sending the document.
                    </p>
                  </div>
                </div>
                <div className={styles.documentControlsGrid}>
                  <div className={styles.controlCard}>
                    <h3 className={styles.subsectionTitle}>Void document</h3>
                    <p className={styles.sectionHint}>
                      Use this when the document was sent in error and every pending link should be shut down.
                    </p>
                    <label className={styles.fieldBlock}>
                      <span className={styles.fieldLabel}>Void reason</span>
                      <input
                        className={styles.textInput}
                        value={voidReason}
                        onChange={(event) => setVoidReason(event.target.value)}
                        placeholder="Sent in error"
                      />
                    </label>
                  </div>

                  <form className={styles.newFieldForm} onSubmit={handleCreateField}>
                    <h3 className={styles.subsectionTitle}>Add manual field</h3>
                  <label className={styles.fieldBlock}>
                    <span className={styles.fieldLabel}>Label</span>
                    <input
                      className={styles.textInput}
                      value={newField.label}
                      onChange={(event) => setNewField((current) => ({ ...current, label: event.target.value }))}
                      disabled={!canEditDocument}
                    />
                  </label>
                  <label className={styles.fieldBlock}>
                    <span className={styles.fieldLabel}>Type</span>
                    <select
                      className={styles.selectInput}
                      value={newField.fieldType}
                      onChange={(event) =>
                        setNewField((current) => ({
                          ...current,
                          fieldType: event.target.value as SignacoreFieldType,
                        }))
                      }
                      disabled={!canEditDocument}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="SIGNATURE">SIGNATURE</option>
                      <option value="INITIALS">INITIALS</option>
                      <option value="CHECKBOX">CHECKBOX</option>
                    </select>
                  </label>
                  {[
                    ["Page", "page"],
                    ["X", "x"],
                    ["Y", "y"],
                    ["Width", "width"],
                    ["Height", "height"],
                    ["Order", "order"],
                  ].map(([label, key]) => (
                    <label key={key} className={styles.fieldBlock}>
                      <span className={styles.fieldLabel}>{label}</span>
                      <input
                        className={styles.textInput}
                        type="number"
                        value={newField[key as keyof FieldFormState] as number}
                        onChange={(event) =>
                          setNewField((current) => ({
                            ...current,
                            [key]: Number(event.target.value),
                          }))
                        }
                        disabled={!canEditDocument}
                      />
                    </label>
                  ))}
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newField.isRequired}
                      onChange={(event) =>
                        setNewField((current) => ({
                          ...current,
                          isRequired: event.target.checked,
                        }))
                      }
                      disabled={!canEditDocument}
                    />
                    Required field
                  </label>
                  <button className={styles.primaryButton} disabled={!canEditDocument || creatingField} type="submit">
                    {creatingField ? "Adding..." : "Add field"}
                  </button>
                  </form>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {isUploadModalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setIsUploadModalOpen(false)} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Upload</p>
                <h2 className={styles.sectionTitle}>Add a source PDF</h2>
              </div>
              <button className={styles.iconButton} onClick={() => setIsUploadModalOpen(false)} type="button">
                ×
              </button>
            </div>
            <form className={styles.uploadForm} onSubmit={handleUpload}>
              <label className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>Document title</span>
                <input
                  className={styles.textInput}
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Employment Agreement"
                />
              </label>
              <label className={styles.fieldBlock}>
                <span className={styles.fieldLabel}>PDF file</span>
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setIsUploadModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className={styles.primaryButton} disabled={uploading} type="submit">
                  {uploading ? "Uploading..." : "Upload and analyse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSendModalOpen && selectedDocument ? (
        <div className={styles.modalBackdrop} onClick={() => setIsSendModalOpen(false)} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Send</p>
                <h2 className={styles.sectionTitle}>Create signer requests</h2>
              </div>
              <button className={styles.iconButton} onClick={() => setIsSendModalOpen(false)} type="button">
                ×
              </button>
            </div>
            <p className={styles.sectionHint}>
              One signer per line. Use `email@example.com` or `Full Name, email@example.com`. Existing requests stay intact;
              this adds fresh signer links for this document.
            </p>
            <textarea
              className={styles.textArea}
              value={signerLines}
              onChange={(event) => setSignerLines(event.target.value)}
              placeholder={"Jane Doe, jane@example.com\njohn@example.com"}
              disabled={!canSendDocument}
            />
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setIsSendModalOpen(false)} type="button">
                Cancel
              </button>
              <button className={styles.primaryButton} disabled={!canSendDocument || sendingDocument} onClick={() => void handleSendDocument()} type="button">
                {sendingDocument ? "Sending..." : "Send signer requests"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
