import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
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
  Palette,
  Sparkles,
  Building2,
  Plus,
  Search,
  Layers,
  Settings,
  Filter,
  Eye,
  Camera,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PaintRegistryTab } from "@/components/paint-registry/PaintRegistryTab";
import { WhatPaintDoINeedModal } from "@/components/paint-registry/WhatPaintDoINeedModal";
import { AddEditPaintRecordModal } from "@/components/paint-registry/AddEditPaintRecordModal";
import { PaintRecordDetailModal } from "@/components/paint-registry/PaintRecordDetailModal";
import { TaxonomyManagerModal } from "@/components/paint-registry/TaxonomyManagerModal";
import { listResource } from "@/lib/admin/apiClient";
import { fetchFinishes } from "@/lib/paintRegistryApi";
import type { FinishRecord } from "@/types/paintRegistry";
import { toast } from "sonner";

interface LocationItem {
  id: string;
  name: string;
  type?: string;
  address?: string;
  city?: string;
}

export default function PaintRegistryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId") || "";

  const [properties, setProperties] = useState<LocationItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId);
  const [loadingProps, setLoadingProps] = useState(true);

  // Global finishes summary stats
  const [stats, setStats] = useState({
    total: 0,
    current: 0,
    withPhotos: 0,
    surfacesCount: 0,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoadingProps(true);
      const res = await listResource<any>("locations");
      const items = res.items || [];
      const formatted = items.map((l: any) => ({
        id: String(l.id || l._id),
        name: l.name || "Untitled Site",
        type: l.type,
        address: l.address,
        city: l.city,
      }));
      setProperties(formatted);

      if (!selectedPropertyId && formatted.length > 0) {
        setSelectedPropertyId(formatted[0].id);
      }
    } catch (err: any) {
      toast.error("Failed to load locations: " + err.message);
    } finally {
      setLoadingProps(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Paint & Finish Registry
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized paint specifications, exact mix codes, sheen classifications, and label evidence
              </p>
            </div>
          </div>
        </div>

        {/* Property Selector Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Building2 className="h-4 w-4 text-blue-600 ml-2" />
            <Select
              value={selectedPropertyId}
              onValueChange={(val) => {
                setSelectedPropertyId(val);
                setSearchParams({ propertyId: val });
              }}
            >
              <SelectTrigger className="h-9 w-60 border-0 text-xs font-bold text-slate-800 shadow-none focus:ring-0">
                <SelectValue placeholder="Select Property / Location" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                    {p.name} {p.city ? `(${p.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Registry Component */}
      {selectedPropertyId ? (
        <PaintRegistryTab
          propertyId={selectedPropertyId}
          propertyName={selectedProperty?.name || "Selected Property"}
        />
      ) : loadingProps ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Property Selected</h3>
          <p className="text-xs text-slate-500 mt-1">
            Please select a property from the top right selector to view its paint specifications.
          </p>
        </div>
      )}
    </div>
  );
}

