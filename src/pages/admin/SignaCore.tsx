import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Worker, Viewer, SpecialZoomLevel, RenderPageProps, PageChangeEvent } from "@react-pdf-viewer/core";

import {
  Plus,
  Send,
  Settings2,
  CheckCircle2,
  FileText,
  Type,
  RefreshCw,
  Trash2,
  Upload,
  Check,
  Copy,
  Shield,
  FileSignature,
  Info,
  Maximize2,
  Target,
  Calendar,
  Hash,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Mail,
  User,
  Clock3,
  Link2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const SIGNACORE_API =
  import.meta.env.VITE_SIGNACORE_API_URL ?? "http://localhost:3001";
const SIGNACORE_APP_URL =
  import.meta.env.VITE_SIGNACORE_APP_URL ?? SIGNACORE_API;
const FIELD_DRAG_MIME = "application/signacore-field";
const SNAP_THRESHOLD = 1.4;

type DocumentFieldType =
  | "text"
  | "signature"
  | "date"
  | "number"
  | "select"
  | "checkbox";

type ExtractionSource = "acro" | "layout" | "vector" | "heuristic";
type FieldReviewState = "confirmed" | "suggested";

interface DocumentField {
  id: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  pageIndex: number;
  description?: string;
  options?: { value: string; label: string }[];
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string | number | boolean;
  confidence?: number;
  extractionSource?: ExtractionSource;
  reviewState?: FieldReviewState;
}

interface SignaTemplate {
  _id?: string;
  name: string;
  category: string;
  description: string;
  documentTitle: string;
  documentContent: string;
  documentUrl?: string;
  isDefault: boolean;
  fields: DocumentField[];
}

interface SigningRequestRecord {
  _id: string;
  token: string;
  recipientEmail: string;
  recipientName?: string;
  status: "pending" | "viewed" | "signed" | "expired";
  createdAt: string;
  viewedAt?: string;
  signedAt?: string;
  expiresAt: string;
  documentTitle: string;
  auditTrail: {
    action: string;
    timestamp: string;
    details?: string;
  }[];
}

interface SidebarItem {
  type: DocumentFieldType;
  label: string;
  icon: React.ElementType;
}

interface DragState {
  id: string;
  pageIndex: number;
  offsetXPercent: number;
  offsetYPercent: number;
}

interface ResizeState {
  id: string;
  pageIndex: number;
  startWidth: number;
  startHeight: number;
  startPointerXPercent: number;
  startPointerYPercent: number;
}

interface SnapGuide {
  axis: "x" | "y";
  value: number;
  pageIndex: number;
}

interface DeployDraft {
  recipientsText: string;
}

const FIELD_TYPES: SidebarItem[] = [
  { type: "signature", label: "Signature", icon: FileSignature },
  { type: "text", label: "Text Input", icon: Type },
  { type: "date", label: "Date", icon: Calendar },
  { type: "number", label: "Number", icon: Hash },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
];

const FIELD_DEFAULTS: Record<
  DocumentFieldType,
  { width: number; height: number; label: string }
> = {
  signature: { width: 24, height: 8, label: "Signature" },
  text: { width: 22, height: 4, label: "Text Input" },
  date: { width: 18, height: 4, label: "Date" },
  number: { width: 18, height: 4, label: "Number" },
  select: { width: 22, height: 4, label: "Select" },
  checkbox: { width: 5, height: 5, label: "Checkbox" },
};

function createEmptyTemplate(): SignaTemplate {
  return {
    name: "Standard Employment Agreement",
    category: "HR",
    description: "Define the terms of engagement for new hires.",
    documentTitle: "Employment Agreement",
    documentContent:
      "<h2>Employment Agreement</h2><p>Use the SignaCore architect to position fields over the governing PDF or enrich this fallback HTML contract.</p>",
    documentUrl: "",
    isDefault: false,
    fields: [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatTimestamp(value?: string) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sanitizeDocumentUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|blob:|data:|s3:)/i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function resolvePreviewDocumentUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (/^s3:/i.test(url)) {
    return `${SIGNACORE_API}/api/files/access?ref=${encodeURIComponent(url)}`;
  }
  return `${SIGNACORE_API}${url.startsWith("/") ? url : `/${url}`}`;
}

function buildField(
  type: DocumentFieldType,
  label: string,
  pageIndex: number,
  x: number,
  y: number
): DocumentField {
  const defaults = FIELD_DEFAULTS[type];

  return {
    id: `field_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`,
    label,
    type,
    required: true,
    pageIndex,
    x: clamp(Number(x.toFixed(2)), 0, 100 - defaults.width),
    y: clamp(Number(y.toFixed(2)), 0, 100 - defaults.height),
    width: defaults.width,
    height: defaults.height,
    confidence: 1,
    reviewState: "confirmed",
  };
}

function materializeExtractedFields(
  fields: Array<{
    id?: string;
    label?: string;
    type?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    pageIndex?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    confidence?: number;
    extractionSource?: ExtractionSource;
    reviewState?: FieldReviewState;
  }>
): DocumentField[] {
  return fields.map((field, index) => {
    const resolvedType = Object.prototype.hasOwnProperty.call(
      FIELD_DEFAULTS,
      field.type || ""
    )
      ? (field.type as DocumentFieldType)
      : "text";
    const defaults = FIELD_DEFAULTS[resolvedType];
    const column = index % 2;
    const row = Math.floor(index / 2);
    const confidence =
      typeof field.confidence === "number" ? field.confidence : 1;
    const reviewState =
      field.reviewState ?? (confidence >= 0.75 ? "confirmed" : "suggested");

    return {
      id: field.id || `field_${index + 1}`,
      label: field.label || defaults.label,
      type: resolvedType,
      required: field.required ?? true,
      options: field.options,
      pageIndex: field.pageIndex ?? 0,
      x:
        field.x !== undefined
          ? field.x
          : column === 0
            ? 8
            : 54,
      y: field.y !== undefined ? field.y : 10 + row * 7,
      width: field.width ?? defaults.width,
      height: field.height ?? defaults.height,
      confidence,
      extractionSource: field.extractionSource,
      reviewState,
    };
  });
}

function isSuggestedField(field: Pick<DocumentField, "reviewState">) {
  return field.reviewState === "suggested";
}

function getConfirmedFields(fields: DocumentField[]) {
  return fields.filter((field) => !isSuggestedField(field));
}

function getSuggestedFields(fields: DocumentField[]) {
  return fields.filter(isSuggestedField);
}

function formatConfidence(confidence?: number) {
  if (typeof confidence !== "number") {
    return "Manual";
  }

  return `${Math.round(confidence * 100)}%`;
}

function parseRecipientsInput(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length >= 2) {
        return {
          name: parts.slice(0, -1).join(", "),
          email: parts[parts.length - 1],
        };
      }

      return {
        name: "",
        email: parts[0] ?? "",
      };
    })
    .filter((recipient) => /\S+@\S+\.\S+/.test(recipient.email));
}

function getStatusTone(status: SigningRequestRecord["status"]) {
  switch (status) {
    case "signed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "viewed":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "expired":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  }
}

const SignaCore: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  const [activeTab, setActiveTab] = useState("blueprints");
  const [templates, setTemplates] = useState<SignaTemplate[]>([]);
  const [requests, setRequests] = useState<SigningRequestRecord[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SignaTemplate | null>(
    null
  );
  const [sessionPreviewUrl, setSessionPreviewUrl] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [currentEditPage, setCurrentEditPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [snapActive, setSnapActive] = useState<string[]>([]);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [canvasDropActive, setCanvasDropActive] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [extractingSource, setExtractingSource] = useState(false);
  const [deployTarget, setDeployTarget] = useState<SignaTemplate | null>(null);
  const [deployDraft, setDeployDraft] = useState<DeployDraft>({
    recipientsText: "",
  });

  const activeField = useMemo(
    () =>
      editingTemplate?.fields.find((field) => field.id === activeFieldId) ?? null,
    [activeFieldId, editingTemplate]
  );

  const editingFieldSummary = useMemo(() => {
    const fields = editingTemplate?.fields ?? [];
    return {
      total: fields.length,
      confirmed: getConfirmedFields(fields).length,
      suggested: getSuggestedFields(fields).length,
    };
  }, [editingTemplate?.fields]);

  const previewDocumentUrl = useMemo(
    () =>
      sessionPreviewUrl ||
      resolvePreviewDocumentUrl(editingTemplate?.documentUrl),
    [editingTemplate?.documentUrl, sessionPreviewUrl]
  );

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch(`${SIGNACORE_API}/api/templates`);
      const json = await response.json();
      setTemplates(json.items || []);
    } catch {
      toast({
        title: "Load Error",
        description: "Could not load templates.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  }, [toast]);

  const fetchSigningRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await fetch(`${SIGNACORE_API}/api/signing-requests`);
      const json = await response.json();
      setRequests(json.items || []);
    } catch {
      toast({
        title: "Load Error",
        description: "Could not load sent documents.",
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
    fetchSigningRequests();

    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fetchSigningRequests, fetchTemplates]);

  useEffect(() => {
    if (!dragState && !resizeState) {
      return;
    }

    const handlePointerMove = (event: MouseEvent) => {
      if (!editingTemplate) return;
      const stateId = dragState?.id ?? resizeState?.id;
      const pageIndex = dragState?.pageIndex ?? resizeState?.pageIndex ?? 0;
      const overlay = document.getElementById(`page-overlay-${pageIndex}`);
      if (!overlay || !stateId) return;

      const rect = overlay.getBoundingClientRect();
      const pointerXPercent = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerYPercent = ((event.clientY - rect.top) / rect.height) * 100;

      setEditingTemplate((current) => {
        if (!current) return current;

        const fields = [...current.fields];
        const index = fields.findIndex((field) => field.id === stateId);
        if (index === -1) return current;

        const field = fields[index];

        if (dragState) {
          let nextX = clamp(
            pointerXPercent - dragState.offsetXPercent,
            0,
            100 - field.width
          );
          let nextY = clamp(
            pointerYPercent - dragState.offsetYPercent,
            0,
            100 - field.height
          );

          const pagePeers = fields.filter(
            (candidate) =>
              candidate.id !== field.id && candidate.pageIndex === field.pageIndex
          );

          const guides: SnapGuide[] = [];
          const snappedIds: string[] = [];
          let bestX: { delta: number; guide: number; id: string } | null = null;
          let bestY: { delta: number; guide: number; id: string } | null = null;

          const candidateX = [
            { value: nextX, anchor: "start" },
            { value: nextX + field.width / 2, anchor: "center" },
            { value: nextX + field.width, anchor: "end" },
          ];
          const candidateY = [
            { value: nextY, anchor: "start" },
            { value: nextY + field.height / 2, anchor: "center" },
            { value: nextY + field.height, anchor: "end" },
          ];

          pagePeers.forEach((peer) => {
            const peerX = [
              { value: peer.x, anchor: "start" },
              { value: peer.x + peer.width / 2, anchor: "center" },
              { value: peer.x + peer.width, anchor: "end" },
            ];
            const peerY = [
              { value: peer.y, anchor: "start" },
              { value: peer.y + peer.height / 2, anchor: "center" },
              { value: peer.y + peer.height, anchor: "end" },
            ];

            candidateX.forEach((candidate) => {
              peerX.forEach((target) => {
                const delta = target.value - candidate.value;
                if (Math.abs(delta) <= SNAP_THRESHOLD) {
                  if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
                    bestX = { delta, guide: target.value, id: peer.id };
                  }
                }
              });
            });

            candidateY.forEach((candidate) => {
              peerY.forEach((target) => {
                const delta = target.value - candidate.value;
                if (Math.abs(delta) <= SNAP_THRESHOLD) {
                  if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
                    bestY = { delta, guide: target.value, id: peer.id };
                  }
                }
              });
            });
          });

          if (bestX) {
            nextX = clamp(nextX + bestX.delta, 0, 100 - field.width);
            snappedIds.push(bestX.id);
            guides.push({ axis: "x", value: bestX.guide, pageIndex: field.pageIndex });
          }

          if (bestY) {
            nextY = clamp(nextY + bestY.delta, 0, 100 - field.height);
            snappedIds.push(bestY.id);
            guides.push({ axis: "y", value: bestY.guide, pageIndex: field.pageIndex });
          }

          setSnapActive([...new Set(snappedIds)]);
          setSnapGuides(guides);
          fields[index] = {
            ...field,
            x: Number(nextX.toFixed(2)),
            y: Number(nextY.toFixed(2)),
          };
        }

        if (resizeState) {
          const deltaX = pointerXPercent - resizeState.startPointerXPercent;
          const deltaY = pointerYPercent - resizeState.startPointerYPercent;

          const nextWidth = clamp(
            resizeState.startWidth + deltaX,
            5,
            100 - field.x
          );
          const nextHeight = clamp(
            resizeState.startHeight + deltaY,
            3,
            100 - field.y
          );

          fields[index] = {
            ...field,
            width: Number(nextWidth.toFixed(2)),
            height: Number(nextHeight.toFixed(2)),
          };
        }

        return { ...current, fields };
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
      setResizeState(null);
      setSnapActive([]);
      setSnapGuides([]);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [dragState, resizeState, editingTemplate]);

  const openTemplateEditor = (template?: SignaTemplate) => {
    const nextTemplate = template
      ? {
          ...template,
          documentContent: template.documentContent ?? "",
          documentUrl: template.documentUrl ?? "",
        }
      : createEmptyTemplate();

    setSessionPreviewUrl(null);
    setEditingTemplate(nextTemplate);
    setActiveFieldId(nextTemplate.fields[0]?.id ?? null);
    setCurrentEditPage(0);
    setTotalPages(0);
    setEditorOpen(true);
  };

  const updateEditingTemplate = (updater: (template: SignaTemplate) => SignaTemplate) => {
    setEditingTemplate((current) => (current ? updater(current) : current));
  };

  const updateActiveField = (
    fieldId: string,
    updater: (field: DocumentField) => DocumentField
  ) => {
    updateEditingTemplate((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === fieldId ? updater(field) : field
      ),
    }));
  };

  const addFieldAtCoordinates = (
    type: DocumentFieldType,
    label: string,
    pageIndex: number,
    x: number,
    y: number
  ) => {
    const newField = buildField(type, label, pageIndex, x, y);

    updateEditingTemplate((current) => ({
      ...current,
      fields: [...current.fields, newField],
    }));

    setActiveFieldId(newField.id);
    setCurrentEditPage(pageIndex);
  };

  const addFieldAtCenter = (type: DocumentFieldType, label: string) => {
    const defaults = FIELD_DEFAULTS[type];
    addFieldAtCoordinates(type, label, currentEditPage, 50 - defaults.width / 2, 42);
  };

  const startFieldDrag = (field: DocumentField, event: React.MouseEvent) => {
    event.stopPropagation();
    const overlay = document.getElementById(`page-overlay-${field.pageIndex}`);
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const pointerXPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const pointerYPercent = ((event.clientY - rect.top) / rect.height) * 100;

    setActiveFieldId(field.id);
    setDragState({
      id: field.id,
      pageIndex: field.pageIndex,
      offsetXPercent: pointerXPercent - field.x,
      offsetYPercent: pointerYPercent - field.y,
    });
  };

  const startResize = (field: DocumentField, event: React.MouseEvent) => {
    event.stopPropagation();
    const overlay = document.getElementById(`page-overlay-${field.pageIndex}`);
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    setActiveFieldId(field.id);
    setResizeState({
      id: field.id,
      pageIndex: field.pageIndex,
      startWidth: field.width,
      startHeight: field.height,
      startPointerXPercent: ((event.clientX - rect.left) / rect.width) * 100,
      startPointerYPercent: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleCanvasDrop = (pageIndex: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setCanvasDropActive(false);

    const type = event.dataTransfer.getData(FIELD_DRAG_MIME) as DocumentFieldType;
    const item = FIELD_TYPES.find((field) => field.type === type);
    if (!item) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const defaults = FIELD_DEFAULTS[type];
    const nextX = ((event.clientX - rect.left) / rect.width) * 100 - defaults.width / 2;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100 - defaults.height / 2;

    addFieldAtCoordinates(type, item.label, pageIndex, nextX, nextY);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    const hasPersistablePdf =
      !!editingTemplate.documentUrl && !editingTemplate.documentUrl.startsWith("blob:");
    const payload: SignaTemplate = {
      ...editingTemplate,
      documentUrl: hasPersistablePdf ? sanitizeDocumentUrl(editingTemplate.documentUrl) : "",
      documentContent:
        editingTemplate.documentContent?.trim() ||
        `<p>${editingTemplate.documentTitle || editingTemplate.name}</p>`,
    };

    if (!payload.name.trim()) {
      toast({
        title: "Name Required",
        description: "Add a template name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!payload.documentContent.trim() && !payload.documentUrl) {
      toast({
        title: "File Required",
        description: "Add a PDF link or some text content before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = payload._id ? "PUT" : "POST";
      const url = payload._id
        ? `${SIGNACORE_API}/api/templates/${payload._id}`
        : `${SIGNACORE_API}/api/templates`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      if (editingTemplate.documentUrl?.startsWith("blob:")) {
        toast({
          title: "Saved In Hybrid Mode",
          description:
            "The local PDF preview was not persisted. Add a hosted PDF URL to enable signer-side PDF playback.",
        });
      }

      setEditorOpen(false);
      setEditingTemplate(null);
      await fetchTemplates();
      toast({
        title: "Template Saved",
        description: "Your template was saved.",
      });
    } catch {
      toast({
        title: "Save Error",
        description: "Could not save this template.",
        variant: "destructive",
      });
    }
  };

  const handleSourceFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editingTemplate) return;

    let previewUrl = "";
    if (file.type === "application/pdf") {
      previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setSessionPreviewUrl(previewUrl);
      updateEditingTemplate((current) => ({
        ...current,
        documentTitle: file.name,
      }));
    }

    const fileAsDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    try {
      setExtractingSource(true);
      const response = await fetch(`${SIGNACORE_API}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: fileAsDataUrl,
          fileType: file.type,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract file");
      }

      const extracted = await response.json();

      updateEditingTemplate((current) => ({
        ...current,
        documentTitle: extracted.documentTitle || file.name,
        documentContent: extracted.documentContent || current.documentContent,
        documentUrl: extracted.documentUrl || previewUrl || current.documentUrl,
        fields:
          current.fields.length > 0
            ? current.fields
            : materializeExtractedFields(extracted.fields || []),
      }));

      toast({
        title: "File Added",
        description:
          extracted.documentUrl
            ? "Document stored. Auto-found fields were added as suggestions for review."
            : "Document content extracted. Review the suggested fields before sending.",
      });
    } catch {
      updateEditingTemplate((current) => ({
        ...current,
        documentTitle: file.name,
        documentUrl: previewUrl || current.documentUrl,
        documentContent:
          current.documentContent ||
          `<p>${file.name}</p><p>Extraction is temporarily unavailable. You can still preview the PDF and place fields manually.</p>`,
      }));
      toast({
        title: "Upload Error",
        description:
          "The upload fallback loaded the document preview, but SignaCore could not extract fields right now.",
        variant: "destructive",
      });
    } finally {
      setExtractingSource(false);
      event.target.value = "";
    }
  };

  const openDeployDialog = (template: SignaTemplate) => {
    if (template.documentUrl?.startsWith("blob:")) {
      toast({
        title: "Hosted PDF Required",
        description:
          "This template is using a local preview. Replace it with a hosted PDF URL before sending a signer request.",
        variant: "destructive",
      });
      return;
    }

    const confirmedFields = getConfirmedFields(template.fields);
    if (confirmedFields.length === 0) {
      toast({
        title: "No Confirmed Fields",
        description:
          "Approve at least one extracted field before creating a signing request.",
        variant: "destructive",
      });
      return;
    }

    setDeployTarget(template);
    setDeployDraft({ recipientsText: "" });
    setDeployOpen(true);
  };

  const submitSigningRequest = async () => {
    if (!deployTarget) return;
    const recipients = parseRecipientsInput(deployDraft.recipientsText);

    if (recipients.length === 0) {
      toast({
        title: "Add Recipients",
        description: "Add at least one valid email before sending.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeploying(true);
      const response = await fetch(`${SIGNACORE_API}/api/signing-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          documentTitle: deployTarget.documentTitle,
          documentContent: deployTarget.documentContent,
          documentUrl: deployTarget.documentUrl
            ? sanitizeDocumentUrl(deployTarget.documentUrl)
            : "",
          fields: getConfirmedFields(deployTarget.fields),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to create signing request");
      }

      if (json.signingLink) {
        await navigator.clipboard.writeText(json.signingLink);
      }

      setDeployOpen(false);
      setDeployTarget(null);
      await fetchSigningRequests();
      toast({
        title: "Document Sent",
        description:
          json.createdCount > 1
            ? `${json.createdCount} signing links were created. The first link was copied.`
            : json.signingLink
              ? "Signing link created and copied."
              : "Signing request created.",
      });
    } catch {
      toast({
        title: "Deployment Failed",
        description: "The signing request could not be created.",
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleCopySigningLink = async (token: string) => {
    await navigator.clipboard.writeText(`${SIGNACORE_APP_URL}/sign/${token}`);
    toast({
      title: "Link Copied",
      description: "The secure signing URL is now in your clipboard.",
    });
  };

  const handleResendSigningRequest = async (request: SigningRequestRecord) => {
    try {
      const response = await fetch(
        `${SIGNACORE_API}/api/signing-requests/${request._id}/resend`,
        { method: "POST" }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to resend request");
      }

      if (json.signingLink) {
        await navigator.clipboard.writeText(json.signingLink);
      }

      await fetchSigningRequests();
      toast({
        title: "Request Resent",
        description: json.emailSent
          ? "Invite email resent and refreshed signing link copied."
          : "Request reset and signing link copied.",
      });
    } catch {
      toast({
        title: "Resend Failed",
        description: "SignaCore could not resend that request.",
        variant: "destructive",
      });
    }
  };

  const renderFieldOnPage = (field: DocumentField) => {
    const isActive = activeFieldId === field.id;
    const isSnapped = snapActive.includes(field.id);
    const suggested = isSuggestedField(field);
    const idleClass = suggested
      ? "border-amber-400/70 bg-amber-500/10 hover:border-amber-300"
      : "border-zinc-300 bg-white/80 hover:border-sky-400";
    const activeClass = suggested
      ? "border-amber-400 bg-amber-500/15 ring-4 ring-amber-400/20"
      : "border-sky-500 bg-sky-500/10 ring-4 ring-sky-500/20";
    const snappedClass = suggested
      ? "border-amber-400 bg-amber-500/10"
      : "border-sky-500 bg-sky-500/10";

    return (
      <motion.div
        key={field.id}
        layoutId={field.id}
        initial={false}
        animate={
          isSnapped
            ? {
                scale: [1, 1.02, 1],
                boxShadow: [
                  "0 0 0px rgba(14,165,233,0)",
                  "0 0 22px rgba(14,165,233,0.35)",
                  "0 0 0px rgba(14,165,233,0)",
                ],
              }
            : { scale: 1 }
        }
        transition={isSnapped ? { duration: 1.3, repeat: Infinity } : { duration: 0.16 }}
        className={`absolute z-30 flex select-none items-center justify-center rounded-xl border-2 p-2 shadow-lg backdrop-blur-sm transition-colors ${
          isActive
            ? activeClass
            : isSnapped
              ? snappedClass
              : idleClass
        }`}
        style={{
          left: `${field.x}%`,
          top: `${field.y}%`,
          width: `${field.width}%`,
          height: `${field.height}%`,
          cursor: dragState ? "grabbing" : "grab",
        }}
        onMouseDown={(event) => startFieldDrag(field, event)}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden">
          {field.type === "signature" && (
            <FileSignature className="h-3 w-3 text-sky-600 opacity-70" />
          )}
          <span className="w-full truncate text-center text-[9px] font-black uppercase tracking-tight text-zinc-900">
            {field.label}
          </span>
          {suggested && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-zinc-950">
              Review
            </span>
          )}
          {field.required && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.55)]" />
          )}
        </div>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute -bottom-1.5 -right-1.5 z-[60] flex h-4 w-4 cursor-nwse-resize items-center justify-center rounded-full bg-sky-600 shadow-md"
              onMouseDown={(event) => startResize(field, event)}
            >
              <Maximize2 className="h-2 w-2 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50/50 font-sans selection:bg-sky-100">
      <header className="relative z-10 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/signa-core.png"
              alt="SignaCore"
              className="h-11 w-11 rounded-2xl object-contain"
            />
            <div>
              <h1 className="text-xl font-black tracking-tighter sm:text-2xl">
                <span className="text-sky-600">Signa</span>
                <span className="text-orange-500">Core</span>
                <span className="ml-1 text-xs font-medium italic text-zinc-400">
                  TM
                </span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Contract Integrity Engineered
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest sm:w-auto"
              onClick={() => {
                fetchTemplates();
                fetchSigningRequests();
              }}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loadingTemplates || loadingRequests ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              className="h-10 w-full rounded-xl bg-sky-600 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-sky-600/20 hover:bg-sky-700 sm:w-auto sm:px-8"
              onClick={() => openTemplateEditor()}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          <div className="w-full rounded-2xl border bg-white/50 p-1.5 shadow-sm sm:w-fit">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent sm:flex sm:w-auto">
              <TabsTrigger
                value="blueprints"
                className="w-full min-w-0 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-sky-600 data-[state=active]:text-white sm:px-10"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="w-full min-w-0 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-sky-600 data-[state=active]:text-white sm:px-10"
              >
                Sent
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="blueprints"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {templates.map((template) => (
              <Card
                key={template._id}
                className="group relative overflow-hidden border-zinc-200/60 bg-white shadow-xl shadow-zinc-200/20 transition-all hover:-rotate-1 hover:scale-[1.02] hover:shadow-sky-600/10"
              >
                <CardHeader className="pb-2">
                  <div className="mb-4 flex items-start justify-between">
                    <Badge className="border-sky-100 bg-sky-50 px-3 text-[9px] font-black uppercase tracking-widest text-sky-600">
                      {template.category}
                    </Badge>
                    {template.isDefault && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 shadow-lg">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="min-h-[3rem] text-xs italic leading-relaxed text-zinc-500 line-clamp-2">
                    {template.description || "Premium signature-ready orchestration."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 border-y border-zinc-100 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      {template.documentUrl ? "PDF" : "HTML"}
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-600">
                      <Target className="h-3 w-3" />
                      {getConfirmedFields(template.fields).length} Live Nodes
                    </span>
                    {!!getSuggestedFields(template.fields).length && (
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <Sparkles className="h-3 w-3" />
                        {getSuggestedFields(template.fields).length} Suggested
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <Button
                      variant="secondary"
                      className="rounded-xl bg-zinc-100 text-[9px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-200"
                      onClick={() => openTemplateEditor(structuredClone(template))}
                    >
                      <Settings2 className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      className="rounded-xl bg-sky-500 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600"
                      onClick={() => openDeployDialog(template)}
                    >
                      <Send className="mr-2 h-3 w-3" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openTemplateEditor()}
              className="group flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-sky-200 bg-white/40 p-10 text-sky-600 transition-colors hover:bg-sky-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-sky-100 transition-all group-hover:rotate-12 group-hover:bg-sky-600">
                <Plus className="h-10 w-10 text-sky-600 group-hover:text-white" />
              </div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.3em]">
                New Template
              </p>
            </motion.button>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              {loadingRequests ? (
                <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                  Pulling audit records from the SignaCore ledger...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                  <Clock3 className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-500">
                    No signing requests have been deployed yet.
                  </p>
                </div>
              ) : (
                requests.map((request) => (
                  <Card
                    key={request._id}
                    className="overflow-hidden border-zinc-200/70 bg-white shadow-sm"
                  >
                    <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="min-w-0 break-words text-lg font-black tracking-tight text-zinc-950">
                            {request.documentTitle}
                          </h3>
                          <Badge
                            className={`border text-[9px] font-black uppercase tracking-widest ${getStatusTone(request.status)}`}
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <div className="grid gap-3 text-xs font-semibold text-zinc-500 sm:grid-cols-2">
                          <span className="flex min-w-0 items-start gap-2">
                            <Mail className="h-3.5 w-3.5 text-sky-500" />
                            <span className="min-w-0 break-all">
                              {request.recipientEmail}
                            </span>
                          </span>
                          <span className="flex min-w-0 items-start gap-2">
                            <User className="h-3.5 w-3.5 text-sky-500" />
                            <span className="min-w-0 break-words">
                              {request.recipientName || "Signer not named yet"}
                            </span>
                          </span>
                          <span className="flex min-w-0 items-start gap-2 sm:col-span-2">
                            <Clock3 className="h-3.5 w-3.5 text-sky-500" />
                            <span className="min-w-0 break-words">
                              Created {formatTimestamp(request.createdAt)}
                            </span>
                          </span>
                        </div>
                        <p className="break-words text-xs text-zinc-500">
                          Latest event:{" "}
                          <span className="font-semibold text-zinc-700">
                            {request.auditTrail?.[request.auditTrail.length - 1]?.details ||
                              "Awaiting first signer interaction"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-start justify-end lg:justify-self-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-xl border-zinc-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => handleResendSigningRequest(request)}
                              className="text-xs font-semibold"
                            >
                              <RefreshCw className="mr-2 h-3.5 w-3.5" />
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopySigningLink(request.token)}
                              className="text-xs font-semibold"
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `${SIGNACORE_APP_URL}/sign/${request.token}`,
                                  "_blank"
                                )
                              }
                              className="text-xs font-semibold"
                            >
                              <Link2 className="mr-2 h-3.5 w-3.5" />
                              Open Signer View
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="flex h-screen w-screen max-w-none flex-col overflow-y-auto rounded-none border-0 bg-zinc-950 p-0 lg:overflow-hidden">
          <header className="z-[100] flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900 px-4 py-4 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <Button
                variant="ghost"
                className="text-white hover:bg-zinc-800"
                onClick={() => setEditorOpen(false)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-3">
                <img
                  src="/signa-core.png"
                  alt="SignaCore"
                  className="h-9 w-9 rounded-xl object-contain"
                />
                <div>
                  <h2 className="font-black tracking-tight text-white">
                    <span className="text-sky-400">Signa</span>
                    <span className="text-orange-500">Core</span>
                  </h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Document Builder
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 border-sky-500/20 bg-sky-500/10 text-sky-500"
                >
                  v2.0 Stable
                </Badge>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Button
                variant="outline"
                className="h-9 w-full rounded-lg border-zinc-700 px-6 text-[9px] font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 hover:text-white sm:w-auto"
                onClick={() => setEditorOpen(false)}
              >
                Discard
              </Button>
              <Button
                className="h-9 w-full rounded-lg bg-sky-600 px-8 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:bg-sky-700 sm:w-auto"
                onClick={saveTemplate}
              >
                Save Template
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col lg:overflow-hidden xl:flex-row">
            <aside className="z-[80] flex w-full shrink-0 flex-col border-b border-zinc-800 bg-zinc-900 xl:h-full xl:w-80 xl:border-b-0 xl:border-r">
              <div className="max-h-[50vh] space-y-8 overflow-y-auto p-4 sm:p-6 xl:max-h-none">
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    <Sparkles className="h-3 w-3" />
                    Fields
                  </h3>
                  <div className="grid gap-2">
                    {FIELD_TYPES.map((item) => (
                      <motion.button
                        key={item.type}
                        draggable
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(FIELD_DRAG_MIME, item.type);
                          event.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => addFieldAtCenter(item.type, item.label)}
                        className="group flex w-full items-center gap-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-left transition-all hover:border-sky-500/50 hover:bg-zinc-800"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 transition-colors group-hover:bg-sky-500/10">
                          <item.icon className="h-5 w-5 text-zinc-400 group-hover:text-sky-500" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white">
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 border-t border-zinc-800 pt-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    Document
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Template Name
                      </Label>
                      <Input
                        value={editingTemplate?.name ?? ""}
                        onChange={(event) =>
                          updateEditingTemplate((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="h-10 border-zinc-800 bg-zinc-950 text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Category
                      </Label>
                      <Input
                        value={editingTemplate?.category ?? ""}
                        onChange={(event) =>
                          updateEditingTemplate((current) => ({
                            ...current,
                            category: event.target.value,
                          }))
                        }
                        className="h-10 border-zinc-800 bg-zinc-950 text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Document Title
                      </Label>
                      <Input
                        value={editingTemplate?.documentTitle ?? ""}
                        onChange={(event) =>
                          updateEditingTemplate((current) => ({
                            ...current,
                            documentTitle: event.target.value,
                          }))
                        }
                        className="h-10 border-zinc-800 bg-zinc-950 text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        PDF URL
                      </Label>
                      <Input
                        placeholder="https://... or /23.pdf"
                        value={editingTemplate?.documentUrl ?? ""}
                        onChange={(event) => {
                          setSessionPreviewUrl(null);
                          updateEditingTemplate((current) => ({
                            ...current,
                            documentUrl: event.target.value,
                          }));
                        }}
                        className="h-10 border-zinc-800 bg-zinc-950 text-xs font-bold text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-sky-500/20 bg-sky-500/10 text-[9px] font-black uppercase tracking-widest text-sky-400">
                            {editingFieldSummary.confirmed} Confirmed
                          </Badge>
                          {!!editingFieldSummary.suggested && (
                            <Badge className="border-amber-500/20 bg-amber-500/10 text-[9px] font-black uppercase tracking-widest text-amber-400">
                              {editingFieldSummary.suggested} Pending Review
                            </Badge>
                          )}
                          <Badge className="border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            {editingFieldSummary.total} Total
                          </Badge>
                        </div>
                        <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
                          Auto-found fields are only suggestions. Review them before sending anything out.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Description
                      </Label>
                      <Textarea
                        value={editingTemplate?.description ?? ""}
                        onChange={(event) =>
                          updateEditingTemplate((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="min-h-[80px] border-zinc-800 bg-zinc-950 text-xs font-medium text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Text Content
                      </Label>
                      <Textarea
                        value={editingTemplate?.documentContent ?? ""}
                        onChange={(event) =>
                          updateEditingTemplate((current) => ({
                            ...current,
                            documentContent: event.target.value,
                          }))
                        }
                        className="min-h-[160px] border-zinc-800 bg-zinc-950 text-xs font-medium text-white"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/50 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleSourceFileSelected}
                />
                <Button
                  variant="outline"
                  className="h-12 w-full border-dashed border-zinc-700 bg-transparent text-[9px] font-black uppercase tracking-widest text-zinc-500 transition-all hover:border-sky-500 hover:text-sky-500"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extractingSource}
                >
                  {extractingSource ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {extractingSource ? "Uploading File" : "Upload File"}
                </Button>
                <p className="text-[9px] leading-relaxed text-zinc-500">
                  Uploaded source files are persisted into SignaCore so templates can be reused, deployed, and rendered again in the signer flow.
                </p>
              </div>
            </aside>

            <main className="relative flex min-h-[55vh] flex-1 flex-col overflow-hidden bg-zinc-950">
              <div className="z-[60] flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-zinc-800/50 bg-zinc-900/50 px-4 py-3 backdrop-blur-md sm:px-6">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Preview Only
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      PDF Preview
                    </span>
                  </div>
                </div>

                <Badge className="border-zinc-700 bg-zinc-800 p-1 px-4 font-bold uppercase italic text-zinc-400">
                  {previewDocumentUrl ? "PDF View" : "Text View"}
                </Badge>
              </div>

              <div className="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto bg-black/40 p-4 sm:p-6 lg:p-12">
                {previewDocumentUrl ? (
                  <div className="relative w-full max-w-5xl rounded-sm border-4 border-zinc-800 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <iframe
                      key={previewDocumentUrl}
                      title="PDF preview"
                      src={previewDocumentUrl}
                      className="h-[70vh] min-h-[480px] w-full bg-white lg:h-[900px]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center space-y-8 py-40">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="absolute -inset-10 rounded-full border-2 border-dashed border-sky-500/20"
                      />
                      <div className="flex h-40 w-40 items-center justify-center rounded-[3rem] border-2 border-zinc-800 bg-zinc-900">
                        <Upload className="h-12 w-12 animate-bounce text-zinc-700" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-black text-white">No file loaded</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                        Upload a file or add a PDF link to start
                      </p>
                    </div>
                    <Button
                      className="h-14 rounded-2xl bg-sky-600 px-12 text-xs font-black uppercase tracking-widest shadow-2xl shadow-sky-600/10 hover:bg-sky-500"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={extractingSource}
                    >
                      {extractingSource ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading File
                        </>
                      ) : (
                        "Upload File"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </main>

            <aside className="z-[80] flex w-full shrink-0 flex-col border-t border-zinc-800 bg-zinc-900 xl:h-full xl:w-80 xl:border-l xl:border-t-0">
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  Field Settings
                </h3>

                {activeField ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <section className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Core Label
                      </Label>
                      <Input
                        value={activeField.label}
                        onChange={(event) =>
                          updateActiveField(activeField.id, (field) => ({
                            ...field,
                            label: event.target.value,
                          }))
                        }
                        className="h-12 border-zinc-800 bg-zinc-950 font-bold text-white"
                      />
                    </section>

                    <section className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Extraction Status
                      </Label>
                      <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">
                            Review State
                          </span>
                          <Badge
                            className={`text-[9px] font-black uppercase ${
                              isSuggestedField(activeField)
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {isSuggestedField(activeField) ? "Suggested" : "Confirmed"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">
                            Confidence
                          </span>
                          <span className="text-[11px] font-black text-white">
                            {formatConfidence(activeField.confidence)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">
                            Source
                          </span>
                          <Badge className="border-zinc-700 bg-zinc-900 text-[9px] font-black uppercase text-zinc-300">
                            {activeField.extractionSource ?? "manual"}
                          </Badge>
                        </div>
                      </div>
                    </section>

                    {isSuggestedField(activeField) && (
                      <section className="space-y-3">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                          <p className="text-[10px] leading-relaxed text-amber-100">
                            This field was inferred from the document and is waiting for approval before it can be sent to a signer.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            className="h-11 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500"
                            onClick={() =>
                              updateActiveField(activeField.id, (field) => ({
                                ...field,
                                reviewState: "confirmed",
                                confidence: field.confidence ?? 0.75,
                              }))
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11 rounded-xl border-amber-500/30 bg-transparent text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/10"
                            onClick={() => {
                              updateEditingTemplate((current) => ({
                                ...current,
                                fields: current.fields.filter(
                                  (field) => field.id !== activeField.id
                                ),
                              }));
                              setActiveFieldId(null);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      </section>
                    )}

                    <section className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Interaction Logic
                      </Label>
                      <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">
                            Input Node Required
                          </span>
                          <Switch
                            checked={activeField.required}
                            onCheckedChange={(required) =>
                              updateActiveField(activeField.id, (field) => ({
                                ...field,
                                required,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-zinc-400">
                            Input Type
                          </span>
                          <Badge className="border-sky-500/20 bg-sky-500/10 text-[9px] font-black uppercase text-sky-500">
                            {activeField.type}
                          </Badge>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Node Constraints (Perc)
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Pos-X", value: `${activeField.x.toFixed(2)}%` },
                          { label: "Pos-Y", value: `${activeField.y.toFixed(2)}%` },
                          { label: "Width", value: `${activeField.width.toFixed(2)}%` },
                          { label: "Height", value: `${activeField.height.toFixed(2)}%` },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                          >
                            <div className="text-[8px] font-black uppercase text-zinc-600">
                              {item.label}
                            </div>
                            <div className="font-mono text-sm text-sky-500">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <Button
                      variant="destructive"
                      className="h-12 w-full rounded-xl border border-red-900/50 bg-red-900/10 text-[10px] font-black uppercase text-red-500 transition-all hover:bg-red-900 hover:text-white"
                      onClick={() => {
                        updateEditingTemplate((current) => ({
                          ...current,
                          fields: current.fields.filter(
                            (field) => field.id !== activeField.id
                          ),
                        }));
                        setActiveFieldId(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Field
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-20 text-center opacity-20">
                    <Target className="h-16 w-16 text-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                      Select a node to view deployment properties.
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 space-y-4 border-t border-zinc-800 p-6">
                {!!editingTemplate?.fields.length && (
                  <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Fields
                      </span>
                      <Badge className="border-zinc-700 bg-zinc-900 text-[9px] text-zinc-300">
                        {editingTemplate.fields.length}
                      </Badge>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {editingTemplate.fields.map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => {
                            setActiveFieldId(field.id);
                            setCurrentEditPage(field.pageIndex);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                            activeFieldId === field.id
                              ? isSuggestedField(field)
                                ? "border-amber-500/40 bg-amber-500/10"
                                : "border-sky-500/40 bg-sky-500/10"
                              : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-white">
                                {field.label}
                              </div>
                              {isSuggestedField(field) && (
                                <Badge className="border-amber-500/20 bg-amber-500/10 px-2 py-0 text-[8px] font-black uppercase tracking-widest text-amber-400">
                                  Suggested
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                                {field.type} • Page {field.pageIndex + 1}
                              </div>
                              {typeof field.confidence === "number" && (
                                <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                                  {formatConfidence(field.confidence)}
                                </div>
                              )}
                            </div>
                          </div>
                          {field.required && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <Info className="h-4 w-4 text-sky-500" />
                    <span className="text-[10px] font-black uppercase italic text-white">
                      Tip
                    </span>
                  </div>
                  <p className="text-[9px] leading-relaxed text-zinc-400 italic">
                    Fields snap to each other while you move them.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">
              Send Document
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Create signing links for {deployTarget?.documentTitle || "this template"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Recipients
              </Label>
              <Textarea
                value={deployDraft.recipientsText}
                onChange={(event) =>
                  setDeployDraft((current) => ({
                    ...current,
                    recipientsText: event.target.value,
                  }))
                }
                className="min-h-[120px] border-zinc-800 bg-zinc-900 text-white"
                placeholder={"jane@example.com\nJohn Doe, john@example.com"}
              />
              <p className="text-[10px] text-zinc-500">
                One per line. Use just an email, or name and email.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-200">
                Fields ready: {getConfirmedFields(deployTarget?.fields ?? []).length}
              </p>
              {!!getSuggestedFields(deployTarget?.fields ?? []).length && (
                <p className="mt-1 text-amber-300">
                  {getSuggestedFields(deployTarget?.fields ?? []).length} suggested fields will stay out until you approve them.
                </p>
              )}
              <p className="mt-1">
                Opened, viewed, and signed events are tracked automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              onClick={() => setDeployOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-sky-600 text-white hover:bg-sky-700"
              onClick={submitSigningRequest}
              disabled={deploying}
            >
              {deploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignaCore;
