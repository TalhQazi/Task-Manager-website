export type SignacoreFieldType = "SIGNATURE" | "INITIALS" | "TEXT" | "CHECKBOX";

export interface AdminDocumentFieldResponse {
  id: string;
  field_type: SignacoreFieldType;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  is_required: boolean;
  detection_source: "ACROFORM" | "HEURISTIC" | "MANUAL";
  order: number;
}

export interface EditableFieldDraft {
  id: string;
  fieldType: SignacoreFieldType;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isRequired: boolean;
  detectionSource: "ACROFORM" | "HEURISTIC" | "MANUAL";
  order: number;
}

export interface SignerInput {
  signer_name: string;
  signer_email: string;
}

export function parseSignerLines(value: string): SignerInput[] {
  return value
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
          signer_name: parts.slice(0, -1).join(", "),
          signer_email: parts[parts.length - 1],
        };
      }

      return {
        signer_name: "",
        signer_email: parts[0] ?? "",
      };
    })
    .filter((signer) => /\S+@\S+\.\S+/.test(signer.signer_email));
}

export function resolveSignacoreFileUrl(apiBaseUrl: string, value?: string | null): string {
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function toEditableFieldDraft(field: AdminDocumentFieldResponse): EditableFieldDraft {
  return {
    id: field.id,
    fieldType: field.field_type,
    label: field.label,
    page: field.page,
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    isRequired: field.is_required,
    detectionSource: field.detection_source,
    order: field.order,
  };
}

export function fromEditableFieldDraft(field: EditableFieldDraft) {
  return {
    field_type: field.fieldType,
    label: field.label,
    page: field.page,
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    is_required: field.isRequired,
    order: field.order,
  };
}
