import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Badge } from "@/components/admin/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import {
  Settings,
  Plus,
  Trash2,
  Check,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  fetchTaxonomies,
  addCustomTaxonomy,
  deleteCustomTaxonomy,
} from "@/lib/paintRegistryApi";
import type { FinishTaxonomies } from "@/types/paintRegistry";
import { toast } from "sonner";

interface TaxonomyManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export const TaxonomyManagerModal: React.FC<TaxonomyManagerModalProps> = ({
  open,
  onOpenChange,
  onUpdated,
}) => {
  const [taxonomies, setTaxonomies] = useState<FinishTaxonomies | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"surface" | "sheen" | "material">("surface");

  // New item inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadTaxonomies();
    }
  }, [open]);

  const loadTaxonomies = async () => {
    try {
      setLoading(true);
      const res = await fetchTaxonomies();
      setTaxonomies(res);
    } catch (err: any) {
      toast.error("Failed to load taxonomies: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error("Please provide a name.");
      return;
    }

    try {
      setSubmitting(true);
      await addCustomTaxonomy({
        category: activeTab,
        name: newItemName.trim(),
        description: newItemDescription.trim(),
      });
      toast.success(`Custom ${activeTab} "${newItemName.trim()}" added successfully.`);
      setNewItemName("");
      setNewItemDescription("");
      loadTaxonomies();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to add custom taxonomy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    try {
      await deleteCustomTaxonomy(id);
      toast.success(`Taxonomy item "${name}" deactivated.`);
      loadTaxonomies();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate taxonomy.");
    }
  };

  const getListForTab = () => {
    if (!taxonomies) return [];
    if (activeTab === "surface") return taxonomies.surfaces || [];
    if (activeTab === "sheen") return taxonomies.sheens || [];
    return taxonomies.materials || [];
  };

  const customItemsForTab = (taxonomies?.customList || []).filter(
    (c) => c.category === activeTab
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Surface & Finish Taxonomy Manager
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Add, configure, and deactivate custom surfaces and coatings
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("surface")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "surface"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Surface Types ({taxonomies?.surfaces?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sheen")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "sheen"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sheens / Finishes ({taxonomies?.sheens?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("material")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "material"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Materials ({taxonomies?.materials?.length || 0})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Add custom form */}
          <form
            onSubmit={handleAddCustom}
            className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold text-slate-800">
                  Add New {activeTab === "surface" ? "Surface" : activeTab === "sheen" ? "Sheen" : "Material"}
                </Label>
                <Input
                  placeholder={`e.g. ${
                    activeTab === "surface"
                      ? "Accent Wood Slats, Epoxy Garage"
                      : activeTab === "sheen"
                      ? "Ultra-Matte, Chalk"
                      : "Stain, Tile"
                  }`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !newItemName.trim()}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold mt-5 px-3"
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* List of items */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Active Taxonomy Values
            </Label>

            {loading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                {getListForTab().map((val, idx) => {
                  const customMatch = customItemsForTab.find((c) => c.name === val);
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs font-medium text-slate-800"
                    >
                      <span className="truncate pr-1">{val}</span>
                      {customMatch ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(customMatch._id, customMatch.name)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Deactivate custom item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-normal">
                          System
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold h-8"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

