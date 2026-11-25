export type MaterialCategory =
  | "paint"
  | "flooring"
  | "tile"
  | "grout"
  | "caulk"
  | "stain"
  | "siding"
  | "roofing"
  | "cabinetry"
  | "trim"
  | "wallpaper"
  | "countertops"
  | "other";

export type RecordStatus = "CURRENT" | "PREVIOUS" | "DRAFT" | "ARCHIVED";

export type UseType = "Interior" | "Exterior" | "Both" | "N/A";

export type PhotoType =
  | "paint_can"
  | "color_code_label"
  | "finished_surface"
  | "receipt"
  | "other";

export interface FinishRecordPhoto {
  id?: string;
  _id?: string;
  finishRecordId: string;
  photoType: PhotoType;
  fileId?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  sortOrder?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
    width?: number;
    height?: number;
  };
}

export interface FinishAssignment {
  id?: string;
  _id?: string;
  finishRecordId: string;
  propertyId: string;
  propertyName?: string;
  buildingId?: string;
  buildingName?: string;
  unitAreaId?: string;
  unitAreaName?: string;
  roomZoneId?: string;
  roomZoneName?: string;
  surfaceTypeId: string;
  surfaceTypeName?: string;
  isCurrent: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface FinishRecordAudit {
  id?: string;
  _id?: string;
  finishRecordId: string;
  actorUserId?: string;
  actorUsername?: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "SET_CURRENT"
    | "SUPERSEDE"
    | "ARCHIVE"
    | "RESTORE"
    | "PHOTO_ADD"
    | "PHOTO_DELETE"
    | "ASSIGNMENT_ADD";
  beforeJson?: any;
  afterJson?: any;
  source?: string;
  createdAt: string;
}

export interface FinishRecord {
  id: string;
  _id?: string;
  organizationId?: string;
  propertyId: string;
  propertyName?: string;
  buildingId?: string;
  buildingName?: string;
  unitAreaId?: string;
  unitAreaName?: string;
  roomZoneId?: string;
  roomZoneName?: string;
  surfaceTypeId: string;
  surfaceTypeName: string;
  materialCategory: MaterialCategory;
  recordStatus: RecordStatus;

  manufacturer?: string;
  productLine?: string;
  colorName?: string;
  colorCode?: string;
  customMixFormula?: string;
  sheenFinish?: string;
  useType?: UseType;
  primerUsed?: string;
  coats?: number;
  quantityUsed?: number;
  quantityUnit?: string;
  coverageNotes?: string;

  purchasedFrom?: string;
  storeLocation?: string;
  unitCost?: number;
  currency?: string;

  dateApplied?: string | null;
  appliedBy?: string;
  notes?: string;
  hexColor?: string;

  isSharedTemplate?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;

  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;

  photosCount?: number;
  primaryPhoto?: FinishRecordPhoto | null;
  photos?: FinishRecordPhoto[];
  assignments?: FinishAssignment[];
  audits?: FinishRecordAudit[];
  previousRecords?: FinishRecord[];
}

export interface FinishTaxonomies {
  surfaces: string[];
  sheens: string[];
  materials: string[];
  customList?: Array<{
    _id: string;
    category: string;
    name: string;
    code: string;
    description?: string;
    isCustom?: boolean;
  }>;
}

export interface FinishLookupResult {
  found: boolean;
  message?: string;
  finish?: FinishRecord;
}

export interface FinishFilterState {
  search: string;
  status: RecordStatus | "ALL";
  surface: string;
  unitArea: string;
  useType: string;
  manufacturer: string;
  colorCode: string;
}

