import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Plus,
  Search,
  Sparkles,
  Layers,
  Building2,
  MapPin,
  ChevronDown,
  ChevronRight,
  Filter,
  Eye,
  Camera,
  AlertCircle,
  Loader2,
  Palette,
  SlidersHorizontal,
  Settings,
} from "lucide-react";
import { PaintSwatch } from "./PaintSwatch";
import { AddEditPaintRecordModal } from "./AddEditPaintRecordModal";
import { PaintRecordDetailModal } from "./PaintRecordDetailModal";
import { WhatPaintDoINeedModal } from "./WhatPaintDoINeedModal";
import { TaxonomyManagerModal } from "./TaxonomyManagerModal";
import { fetchFinishes } from "@/lib/paintRegistryApi";
import type { FinishRecord, RecordStatus } from "@/types/paintRegistry";
import { toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface PaintRegistryTabProps {
  propertyId: string;
  propertyName?: string;
  photoUrl?: string;
  canEdit?: boolean;
}

type ViewMode = "by_unit" | "by_surface" | "all";

export const PaintRegistryTab: React.FC<PaintRegistryTabProps> = ({
  propertyId,
  propertyName = "Selected Property",
  photoUrl,
  canEdit = true,
}) => {
  const [finishes, setFinishes] = useState<FinishRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [surfaceFilter, setSurfaceFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("by_unit");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTargetRecord, setEditTargetRecord] = useState<FinishRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedFinish, setSelectedFinish] = useState<FinishRecord | null>(null);
  const [whatPaintModalOpen, setWhatPaintModalOpen] = useState(false);
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState(false);
  const [modalPrefills, setModalPrefills] = useState<any>(null);

  // Accordion collapsed state for unit / surface groupings
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (propertyId) {
      loadFinishes();
    }
  }, [propertyId, statusFilter, surfaceFilter]);

  const loadFinishes = async () => {
    try {
      setLoading(true);
      const res = await fetchFinishes({
        propertyId,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        surfaceTypeName: surfaceFilter === "ALL" ? undefined : surfaceFilter,
      });
      setFinishes(res.items || []);
    } catch (err: any) {
      toast.error("Failed to load paint finishes: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Filter items in memory for fast search typing
  const filteredFinishes = useMemo(() => {
    return finishes.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (f.colorName || "").toLowerCase().includes(q) ||
          (f.colorCode || "").toLowerCase().includes(q) ||
          (f.manufacturer || "").toLowerCase().includes(q) ||
          (f.surfaceTypeName || "").toLowerCase().includes(q) ||
          (f.unitAreaName || "").toLowerCase().includes(q) ||
          (f.roomZoneName || "").toLowerCase().includes(q) ||
          (f.purchasedFrom || "").toLowerCase().includes(q) ||
          (f.notes || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [finishes, searchQuery]);

  // Groupings
  const groupedByUnit = useMemo(() => {
    const groups: Record<string, FinishRecord[]> = {};
    for (const f of filteredFinishes) {
      const key = f.unitAreaName || "General / Common Areas";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return groups;
  }, [filteredFinishes]);

  const groupedBySurface = useMemo(() => {
    const groups: Record<string, FinishRecord[]> = {};
    for (const f of filteredFinishes) {
      const key = f.surfaceTypeName || "Other Surface";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return groups;
  }, [filteredFinishes]);

  // Unique surfaces for filter dropdown
  const uniqueSurfaces = useMemo(() => {
    const set = new Set<string>();
    finishes.forEach((f) => {
      if (f.surfaceTypeName) set.add(f.surfaceTypeName);
    });
    return Array.from(set).sort();
  }, [finishes]);

  const openDetail = (finish: FinishRecord) => {
    setSelectedFinish(finish);
    setDetailModalOpen(true);
  };

  const openEdit = (finish: FinishRecord) => {
    setEditTargetRecord(finish);
    setModalPrefills(null);
    setAddModalOpen(true);
  };

  const openAddWithPrefills = (pre: any) => {
    setEditTargetRecord(null);
    setModalPrefills(pre);
    setAddModalOpen(true);
  };

  // Status badge styling
  const statusBadges: Record<string, string> = {
    CURRENT: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    PREVIOUS: "bg-slate-100 text-slate-700 border-slate-300 font-semibold",
    DRAFT: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
    ARCHIVED: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Primary Actions Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
            {photoUrl ? (
              <img
                src={toProxiedUrl(photoUrl)}
                alt="Property"
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <Palette className="h-6 w-6 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Paint & Finish Registry
              </h3>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[10px] font-bold">
                {finishes.length} Record{finishes.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Verified paint formulations, sheen codes, and paint-can evidence for {propertyName}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Lookup Button ("What Paint Do I Need?") */}
          <Button
            size="sm"
            onClick={() => setWhatPaintModalOpen(true)}
            className="h-9 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-100" />
            What Paint Do I Need?
          </Button>

          {/* Primary Add Paint Button */}
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditTargetRecord(null);
                setModalPrefills(null);
                setAddModalOpen(true);
              }}
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Paint Record
            </Button>
          )}

          {/* Taxonomy Settings */}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTaxonomyModalOpen(true)}
              className="h-9 px-2.5 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              title="Manage Custom Surfaces & Finishes"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search, Filter Bar, and View Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search color name, code (e.g. SW 7029), surface, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs bg-white border-slate-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Surface Filter */}
          <Select value={surfaceFilter} onValueChange={setSurfaceFilter}>
            <SelectTrigger className="h-9 w-32 text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Surfaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Surfaces</SelectItem>
              {uniqueSurfaces.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-28 text-xs bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="CURRENT" className="text-xs">Current Active</SelectItem>
              <SelectItem value="PREVIOUS" className="text-xs">Previous</SelectItem>
              <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
              <SelectItem value="ARCHIVED" className="text-xs">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("by_unit")}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === "by_unit"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Unit/Area
            </button>
            <button
              type="button"
              onClick={() => setViewMode("by_surface")}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === "by_surface"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Surface
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                viewMode === "all"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Records
            </button>
          </div>
        </div>
      </div>

      {/* Main Records Display */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading paint & finish registry...</p>
        </div>
      ) : filteredFinishes.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">No Paint Records Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No paint records matching "${searchQuery}". Try clearing search filters.`
                : `No finishes logged yet for ${propertyName}. Record paint specifications now to ensure maintenance teams use the exact formulation.`}
            </p>
          </div>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditTargetRecord(null);
                setModalPrefills(null);
                setAddModalOpen(true);
              }}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add First Paint Record
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* VIEW 1: By Unit / Area */}
          {viewMode === "by_unit" && (
            <div className="space-y-3">
              {Object.entries(groupedByUnit).map(([unitName, records]) => {
                const isCollapsed = !!collapsedGroups[unitName];
                return (
                  <div
                    key={unitName}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                  >
                    {/* Unit Group Header */}
                    <div
                      onClick={() => toggleGroup(unitName)}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-bold text-xs text-slate-900">
                          {unitName}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                          {records.length} surface{records.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Swatches preview */}
                        <div className="flex items-center -space-x-1.5 mr-2">
                          {records.slice(0, 4).map((r, i) => (
                            <PaintSwatch
                              key={i}
                              color={r.hexColor}
                              size="sm"
                              allowCopy={false}
                              className="border-2 border-white rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Records List inside Unit */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {records.map((record) => (
                          <RecordRowItem
                            key={record.id || (record as any)._id}
                            record={record}
                            onView={() => openDetail(record)}
                            onEdit={() => openEdit(record)}
                            canEdit={canEdit}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: By Surface Type */}
          {viewMode === "by_surface" && (
            <div className="space-y-3">
              {Object.entries(groupedBySurface).map(([surfName, records]) => {
                const isCollapsed = !!collapsedGroups[surfName];
                return (
                  <div
                    key={surfName}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                  >
                    <div
                      onClick={() => toggleGroup(surfName)}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between border-b border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                        <Layers className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-900">
                          Surface: {surfName}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                          {records.length} location{records.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      <div className="flex items-center -space-x-1.5 mr-2">
                        {records.slice(0, 4).map((r, i) => (
                          <PaintSwatch
                            key={i}
                            color={r.hexColor}
                            size="sm"
                            allowCopy={false}
                            className="border-2 border-white rounded-full"
                          />
                        ))}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {records.map((record) => (
                          <RecordRowItem
                            key={record.id || (record as any)._id}
                            record={record}
                            onView={() => openDetail(record)}
                            onEdit={() => openEdit(record)}
                            canEdit={canEdit}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: All Records (Table / List) */}
          {viewMode === "all" && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-100">
              {filteredFinishes.map((record) => (
                <RecordRowItem
                  key={record.id || (record as any)._id}
                  record={record}
                  onView={() => openDetail(record)}
                  onEdit={() => openEdit(record)}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Paint Modal */}
      <AddEditPaintRecordModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        propertyId={propertyId}
        propertyName={propertyName}
        editRecord={editTargetRecord}
        prefills={modalPrefills}
        onSuccess={() => loadFinishes()}
      />

      {/* Detail Modal */}
      {selectedFinish && (
        <PaintRecordDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          finish={selectedFinish}
          onEdit={(f) => openEdit(f)}
          onRefresh={() => loadFinishes()}
        />
      )}

      {/* Quick Lookup Modal */}
      <WhatPaintDoINeedModal
        open={whatPaintModalOpen}
        onOpenChange={setWhatPaintModalOpen}
        propertyId={propertyId}
        propertyName={propertyName}
        onOpenAddModal={(pre) => openAddWithPrefills(pre)}
        onOpenDetailModal={(f) => openDetail(f)}
      />

      {/* Taxonomy Manager Modal */}
      <TaxonomyManagerModal
        open={taxonomyModalOpen}
        onOpenChange={setTaxonomyModalOpen}
        onUpdated={() => loadFinishes()}
      />
    </div>
  );
};

// Sub-component: Clean row item for a paint record
const RecordRowItem: React.FC<{
  record: FinishRecord;
  onView: () => void;
  onEdit: () => void;
  canEdit?: boolean;
}> = ({ record, onView, onEdit, canEdit }) => {
  const isIncomplete =
    !record.colorCode || !record.manufacturer || !record.purchasedFrom;

  const statusClasses: Record<string, string> = {
    CURRENT: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    PREVIOUS: "bg-slate-100 text-slate-700 border-slate-300 font-semibold",
    DRAFT: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
    ARCHIVED: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
  };

  return (
    <div
      onClick={onView}
      className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <PaintSwatch
          color={record.hexColor}
          size="md"
          allowCopy={true}
          className="shrink-0"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {record.colorName || "Custom Color Formulation"}
            </span>
            <Badge
              className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                statusClasses[record.recordStatus] || ""
              }`}
            >
              {record.recordStatus}
            </Badge>
            {isIncomplete && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[9px] hidden sm:inline-flex items-center gap-0.5">
                <AlertCircle className="h-2.5 w-2.5" /> Incomplete
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
            <span className="font-mono font-bold text-blue-700 text-[11px]">
              {record.colorCode || "No Code"}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{record.surfaceTypeName}</span>
            {record.roomZoneName && (
              <>
                <span>•</span>
                <span>{record.roomZoneName}</span>
              </>
            )}
            <span>•</span>
            <span>{record.manufacturer || "Unspecified"} ({record.sheenFinish || "Eggshell"})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {record.photos && record.photos.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            <Camera className="h-3 w-3 text-slate-500" />
            <span>{record.photos.length}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          View
        </Button>
      </div>
    </div>
  );
};

