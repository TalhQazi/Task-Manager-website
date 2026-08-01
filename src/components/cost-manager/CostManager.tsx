import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  CostItemWarning,
  CostLineItem,
  CostSection,
  CostSheetPayload,
  LineItemInput,
  PURCHASE_STATUS_META,
  PURCHASED_STATUSES,
  PurchaseStatus,
  WARNING_LABELS,
  centsToDollarInput,
  createCostLineItem,
  createCostSection,
  deleteCostLineItem,
  deleteCostSection,
  dollarsToCents,
  formatMoney,
  getProjectCostSheet,
  getTaskCostSheet,
  getCostSheetById,
  updateCostLineItem,
  updateCostSheet,
} from "@/lib/costManager";
import FilesDialog from "./FilesDialog";
import StoreDialog from "./StoreDialog";
import LocationFinder from "./LocationFinder";
import CertificationTracker from "./CertificationTracker";
import { CostReportKind, REPORT_LABELS, exportReportCsv, openPrintView } from "./exportReports";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Download,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";

interface VendorOption {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

interface TaskOption {
  id: string;
  title: string;
}

interface CostManagerProps {
  projectId?: string;
  taskId?: string;
  sheetId?: string;
  projectName?: string;
  tasks?: TaskOption[];
  readOnly?: boolean;
}

const NO_VENDOR = "__none__";
const NO_TASK = "__none__";

// ---------------------------------------------------------------- main

export default function CostManager({
  projectId,
  taskId,
  sheetId,
  projectName = "Cost Manager",
  tasks = [],
  readOnly = false,
}: CostManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = useMemo(() => ["cost-sheet", { projectId, taskId, sheetId }], [projectId, taskId, sheetId]);

  const sheetQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (sheetId) return getCostSheetById(sheetId);
      if (taskId) return getTaskCostSheet(taskId);
      if (projectId) return getProjectCostSheet(projectId);
      return Promise.resolve(null);
    },
    enabled: !!sheetId || !!taskId || !!projectId,
  });

  const vendorsQuery = useQuery({
    queryKey: ["cost-manager-vendors"],
    queryFn: () => apiFetch<{ items: VendorOption[] }>("/api/vendors"),
    staleTime: 5 * 60 * 1000,
  });
  const vendors = vendorsQuery.data?.items || [];

  const applyPayload = (payload: CostSheetPayload) => queryClient.setQueryData(queryKey, payload);

  const onError = (err: unknown) =>
    toast({
      title: "Cost Manager error",
      description: err instanceof Error ? err.message : "Something went wrong",
      variant: "destructive",
    });

  const itemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: LineItemInput }) =>
      updateCostLineItem(itemId, payload),
    onSuccess: applyPayload,
    onError,
  });

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [itemDialog, setItemDialog] = useState<{ sectionId: string; item: CostLineItem | null } | null>(null);
  const [storeDialogItem, setStoreDialogItem] = useState<CostLineItem | null>(null);
  const [filesDialogItemId, setFilesDialogItemId] = useState<string | null>(null);
  const [showLocationFinder, setShowLocationFinder] = useState(false);
  const [buyMode, setBuyMode] = useState(false);

  // What-Can-I-Buy: greedy suggestion — required first, priority order, cheapest remaining first.
  // Must run unconditionally (before any early return) to keep hook order stable across renders.
  const querySections = sheetQuery.data?.sections;
  const queryBudgetCents = sheetQuery.data?.summary.availableBudgetCents ?? 0;
  const buySuggestions = useMemo(() => {
    if (!buyMode || !querySections) return new Set<string>();
    const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const candidates = querySections
      .flatMap((s) => s.items)
      .filter(
        (i) =>
          i.isActive &&
          !PURCHASED_STATUSES.includes(i.purchaseStatus) &&
          i.purchaseStatus !== "canceled" &&
          i.remainingCents > 0
      )
      .sort((a, b) => {
        if (a.requiredForPrototype !== b.requiredForPrototype) return a.requiredForPrototype ? -1 : 1;
        const p = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
        if (p !== 0) return p;
        return a.remainingCents - b.remainingCents;
      });
    let budget = queryBudgetCents;
    const picked = new Set<string>();
    for (const item of candidates) {
      if (item.remainingCents <= budget) {
        picked.add(item.id);
        budget -= item.remainingCents;
      }
    }
    return picked;
  }, [buyMode, querySections, queryBudgetCents]);

  // The sheet can be opened by project, by task, or directly by sheet id
  // (Expense Sheets page / task modal). Bail out only when none is provided.
  if (!projectId && !taskId && !sheetId) return null;

  if (sheetQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading cost sheet...
      </div>
    );
  }

  if (sheetQuery.isError || !sheetQuery.data) {
    return (
      <div className="text-sm text-destructive py-6 text-center">
        Failed to load the cost sheet.{" "}
        <Button variant="link" size="sm" onClick={() => sheetQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { sheet, sections, certifications, summary } = sheetQuery.data;
  const currency = sheet.currency || "USD";
  const allItems = sections.flatMap((s) => s.items);
  const filesDialogItem = filesDialogItemId ? allItems.find((i) => i.id === filesDialogItemId) || null : null;

  const warningCounts = allItems.reduce(
    (acc, i) => {
      for (const w of i.warnings || []) acc[w] = (acc[w] || 0) + 1;
      return acc;
    },
    {} as Record<CostItemWarning, number>
  );
  const warningEntries = Object.entries(warningCounts) as Array<[CostItemWarning, number]>;

  const setStatus = (item: CostLineItem, status: PurchaseStatus) => {
    if (status === "stored") {
      setStoreDialogItem(item);
      return;
    }
    itemMutation.mutate({ itemId: item.id, payload: { purchaseStatus: status } });
  };

  const togglePurchased = (item: CostLineItem, checked: boolean) => {
    itemMutation.mutate({
      itemId: item.id,
      payload: { purchaseStatus: checked ? "purchased" : "not_purchased", ...(checked ? {} : { paidCents: 0 }) },
    });
  };

  return (
    <div className="space-y-4">
      <SummaryCard
        summary={summary}
        currency={currency}
        readOnly={readOnly}
        buyMode={buyMode}
        onToggleBuyMode={() => setBuyMode((v) => !v)}
        onBudgetSave={async (cents) => {
          try {
            applyPayload(await updateCostSheet(sheet.id, { availableBudgetCents: cents }));
          } catch (err) {
            onError(err);
          }
        }}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowLocationFinder(true)}
            >
              <MapPin className="w-3.5 h-3.5" /> Location Finder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs">CSV Reports</DropdownMenuLabel>
                {(Object.keys(REPORT_LABELS) as CostReportKind[]).map((kind) => (
                  <DropdownMenuItem
                    key={kind}
                    className="text-xs"
                    onClick={() => exportReportCsv(kind, sheetQuery.data!, projectName)}
                  >
                    {REPORT_LABELS[kind]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-1.5"
                  onClick={() => openPrintView(sheetQuery.data!, projectName)}
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {warningEntries.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-xs space-y-0.5">
          <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Missing information
          </p>
          {warningEntries.map(([w, count]) => (
            <p key={w} className="text-amber-700 dark:text-amber-400">
              {count} item{count !== 1 ? "s" : ""}: {WARNING_LABELS[w]}
            </p>
          ))}
        </div>
      )}

      {buyMode && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" /> What can I buy now?
          </p>
          <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
            {buySuggestions.size > 0
              ? `With ${formatMoney(summary.availableBudgetCents, currency)} available, the highlighted ${buySuggestions.size} item(s) below fit your budget (required items and blockers first).`
              : "No unpurchased items fit within the current available budget."}
          </p>
        </div>
      )}

      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          currency={currency}
          readOnly={readOnly}
          collapsed={!!collapsedSections[section.id]}
          onToggleCollapse={() =>
            setCollapsedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
          }
          buySuggestions={buySuggestions}
          onAddItem={() => setItemDialog({ sectionId: section.id, item: null })}
          onEditItem={(item) => setItemDialog({ sectionId: section.id, item })}
          onDeleteItem={async (item) => {
            if (!window.confirm(`Delete "${item.itemName}"?`)) return;
            try {
              applyPayload(await deleteCostLineItem(item.id));
            } catch (err) {
              onError(err);
            }
          }}
          onDeleteSection={async () => {
            if (!window.confirm(`Delete section "${section.name}" and all its line items?`)) return;
            try {
              applyPayload(await deleteCostSection(section.id));
            } catch (err) {
              onError(err);
            }
          }}
          onStatusChange={setStatus}
          onTogglePurchased={togglePurchased}
          onOpenFiles={(item) => setFilesDialogItemId(item.id)}
        />
      ))}

      {/* Certifications are project-scoped; hide the tracker for standalone/task sheets */}
      {projectId && (
        <CertificationTracker
          projectId={projectId}
          certifications={certifications || []}
          currency={currency}
          readOnly={readOnly}
          onSaved={applyPayload}
          onError={onError}
        />
      )}

      {!readOnly && (
        <div className="flex items-center gap-2">
          {addingSection ? (
            <>
              <Input
                autoFocus
                placeholder="Section name (e.g. Materials, Testing, Permits)"
                className="h-8 text-sm max-w-xs"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && newSectionName.trim()) {
                    try {
                      applyPayload(await createCostSection(sheet.id, { name: newSectionName.trim() }));
                      setNewSectionName("");
                      setAddingSection(false);
                    } catch (err) {
                      onError(err);
                    }
                  }
                  if (e.key === "Escape") setAddingSection(false);
                }}
              />
              <Button
                size="sm"
                className="h-8"
                disabled={!newSectionName.trim()}
                onClick={async () => {
                  try {
                    applyPayload(await createCostSection(sheet.id, { name: newSectionName.trim() }));
                    setNewSectionName("");
                    setAddingSection(false);
                  } catch (err) {
                    onError(err);
                  }
                }}
              >
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingSection(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setAddingSection(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Cost Section
            </Button>
          )}
        </div>
      )}

      {itemDialog && (
        <ItemDialog
          sectionId={itemDialog.sectionId}
          item={itemDialog.item}
          vendors={vendors}
          tasks={tasks}
          currency={currency}
          onClose={() => setItemDialog(null)}
          onSaved={(payload) => {
            applyPayload(payload);
            setItemDialog(null);
          }}
          onError={onError}
        />
      )}

      {storeDialogItem && (
        <StoreDialog
          item={storeDialogItem}
          onClose={() => setStoreDialogItem(null)}
          onSaved={(payload) => {
            applyPayload(payload);
            setStoreDialogItem(null);
          }}
          onError={onError}
        />
      )}

      {filesDialogItem && (
        <FilesDialog
          item={filesDialogItem}
          readOnly={readOnly}
          onClose={() => setFilesDialogItemId(null)}
          onSaved={applyPayload}
          onError={onError}
        />
      )}

      {showLocationFinder && <LocationFinder onClose={() => setShowLocationFinder(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- summary card

function SummaryCard({
  summary,
  currency,
  readOnly,
  buyMode,
  onToggleBuyMode,
  onBudgetSave,
  actions,
}: {
  summary: CostSheetPayload["summary"];
  currency: string;
  readOnly: boolean;
  buyMode: boolean;
  onToggleBuyMode: () => void;
  onBudgetSave: (cents: number) => void;
  actions?: React.ReactNode;
}) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const stats: Array<{ label: string; value: string; className?: string }> = [
    { label: "Projected Prototype Cost", value: formatMoney(summary.projectedCents, currency) },
    { label: "Amount Spent So Far", value: formatMoney(summary.spentCents, currency), className: "text-green-600" },
    { label: "Remaining to Prototype", value: formatMoney(summary.remainingCents, currency), className: "text-amber-600" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-primary" /> Cost Manager
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={buyMode ? "default" : "outline"}
            className="h-7 text-xs gap-1.5"
            onClick={onToggleBuyMode}
          >
            <ShoppingCart className="w-3.5 h-3.5" /> What Can I Buy Now?
          </Button>
          {actions}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            <p className={`text-lg font-extrabold tracking-tight ${s.className || ""}`}>{s.value}</p>
          </div>
        ))}
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Available Budget
          </p>
          {editingBudget ? (
            <div className="flex items-center gap-1 mt-1">
              <Input
                autoFocus
                className="h-7 text-sm"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onBudgetSave(dollarsToCents(budgetInput));
                    setEditingBudget(false);
                  }
                  if (e.key === "Escape") setEditingBudget(false);
                }}
              />
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onBudgetSave(dollarsToCents(budgetInput));
                  setEditingBudget(false);
                }}
              >
                Save
              </Button>
            </div>
          ) : (
            <button
              className="text-lg font-extrabold tracking-tight text-blue-600 disabled:cursor-default hover:underline text-left"
              disabled={readOnly}
              title={readOnly ? undefined : "Click to edit available budget"}
              onClick={() => {
                setBudgetInput(centsToDollarInput(summary.availableBudgetCents));
                setEditingBudget(true);
              }}
            >
              {formatMoney(summary.availableBudgetCents, currency)}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Purchased ({summary.purchasedCount} of {summary.totalCount} items)</span>
            <span className="font-semibold">{summary.purchasedPct}%</span>
          </div>
          <Progress value={Math.min(100, summary.purchasedPct)} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Build Readiness</span>
            <span className="font-semibold">{summary.buildReadinessPct}%</span>
          </div>
          <Progress value={Math.min(100, summary.buildReadinessPct)} className="h-2" />
        </div>
        <div className="text-[11px] text-muted-foreground sm:text-right">
          {summary.nextBlocker ? (
            <>
              <span className="font-semibold text-foreground">Next Critical Purchase: </span>
              {summary.nextBlocker.itemName} — {formatMoney(summary.nextBlocker.remainingCents, currency)}
            </>
          ) : (
            <span className="text-green-600 font-semibold flex sm:justify-end items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> No open blockers
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- section

function SectionBlock({
  section,
  currency,
  readOnly,
  collapsed,
  buySuggestions,
  onToggleCollapse,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteSection,
  onStatusChange,
  onTogglePurchased,
  onOpenFiles,
}: {
  section: CostSection;
  currency: string;
  readOnly: boolean;
  collapsed: boolean;
  buySuggestions: Set<string>;
  onToggleCollapse: () => void;
  onAddItem: () => void;
  onEditItem: (item: CostLineItem) => void;
  onDeleteItem: (item: CostLineItem) => void;
  onDeleteSection: () => void;
  onStatusChange: (item: CostLineItem, status: PurchaseStatus) => void;
  onTogglePurchased: (item: CostLineItem, checked: boolean) => void;
  onOpenFiles: (item: CostLineItem) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {section.name}
          <span className="text-xs text-muted-foreground font-normal">({section.items.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Paid <span className="font-semibold text-green-600">{formatMoney(section.subtotalPaidCents, currency)}</span>
            {" / "}
            <span className="font-semibold text-foreground">{formatMoney(section.subtotalEstimatedCents, currency)}</span>
          </span>
          {!readOnly && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/60 text-left">
                <th className="px-3 py-1.5 w-8" title="Purchased">✓</th>
                <th className="px-2 py-1.5 min-w-[160px]">Item</th>
                <th className="px-2 py-1.5">Vendor</th>
                <th className="px-2 py-1.5 text-right">Qty</th>
                <th className="px-2 py-1.5 text-right">Unit Cost</th>
                <th className="px-2 py-1.5 text-right">Est. Total</th>
                <th className="px-2 py-1.5 text-right">Paid</th>
                <th className="px-2 py-1.5 text-right">Remaining</th>
                <th className="px-2 py-1.5">Status</th>
                <th className="px-2 py-1.5">Location</th>
                <th className="px-2 py-1.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {section.items.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-4 text-center text-muted-foreground">
                    No line items yet.
                  </td>
                </tr>
              )}
              {section.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  readOnly={readOnly}
                  highlighted={buySuggestions.has(item.id)}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item)}
                  onStatusChange={(s) => onStatusChange(item, s)}
                  onTogglePurchased={(c) => onTogglePurchased(item, c)}
                  onOpenFiles={() => onOpenFiles(item)}
                />
              ))}
            </tbody>
          </table>
          {!readOnly && (
            <div className="px-3 py-2 border-t border-border/40">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary" onClick={onAddItem}>
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- item row

function ItemRow({
  item,
  currency,
  readOnly,
  highlighted,
  onEdit,
  onDelete,
  onStatusChange,
  onTogglePurchased,
  onOpenFiles,
}: {
  item: CostLineItem;
  currency: string;
  readOnly: boolean;
  highlighted: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: PurchaseStatus) => void;
  onTogglePurchased: (checked: boolean) => void;
  onOpenFiles: () => void;
}) {
  const isPurchased = PURCHASED_STATUSES.includes(item.purchaseStatus);
  const meta = PURCHASE_STATUS_META[item.purchaseStatus];
  const canceled = item.purchaseStatus === "canceled";
  const locationText = [item.storage?.locationName, item.storage?.room, item.storage?.aisle, item.storage?.shelf, item.storage?.bin]
    .filter(Boolean)
    .join(" / ");

  return (
    <tr
      className={`border-b border-border/40 last:border-0 ${canceled ? "opacity-50" : ""} ${
        highlighted ? "bg-blue-50 dark:bg-blue-950/30" : ""
      }`}
    >
      <td className="px-3 py-1.5">
        {isPurchased ? (
          <button
            disabled={readOnly}
            title="Purchased — click to undo"
            onClick={() => onTogglePurchased(false)}
            className="text-green-600"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <Checkbox
            disabled={readOnly || canceled}
            checked={false}
            title="Mark as purchased"
            onCheckedChange={(c) => onTogglePurchased(c === true)}
          />
        )}
      </td>
      <td className="px-2 py-1.5">
        <button className="font-medium text-left hover:underline" onClick={onEdit} disabled={readOnly}>
          {item.itemName}
        </button>
        {item.requiredForPrototype && (
          <span className="ml-1.5 text-[10px] text-red-600 font-semibold" title="Required for prototype">
            REQ
          </span>
        )}
        {item.taskId && (
          <span className="ml-1.5 text-[10px] text-indigo-500 font-semibold" title="Linked to a task">
            TASK
          </span>
        )}
        {(item.warnings || []).length > 0 && (
          <span
            className="ml-1.5 inline-flex align-middle text-amber-500"
            title={(item.warnings || []).map((w) => WARNING_LABELS[w]).join("\n")}
          >
            <AlertTriangle className="w-3 h-3" />
          </span>
        )}
      </td>
      <td className="px-2 py-1.5">
        {item.vendor ? <VendorPopover vendor={item.vendor} /> : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-2 py-1.5 text-right whitespace-nowrap">
        {item.qty}
        {item.unit ? ` × ${item.unit}` : ""}
      </td>
      <td className="px-2 py-1.5 text-right whitespace-nowrap">{formatMoney(item.unitCostCents, currency)}</td>
      <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">
        {formatMoney(item.estimatedTotalCents, currency)}
      </td>
      <td className="px-2 py-1.5 text-right text-green-600 whitespace-nowrap">{formatMoney(item.paidCents, currency)}</td>
      <td className="px-2 py-1.5 text-right text-amber-600 whitespace-nowrap">
        {formatMoney(item.remainingCents, currency)}
      </td>
      <td className="px-2 py-1.5">
        {readOnly ? (
          <Badge variant="outline" className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
        ) : (
          <Select value={item.purchaseStatus} onValueChange={(v) => onStatusChange(v as PurchaseStatus)}>
            <SelectTrigger className={`h-6 w-[130px] text-[11px] border rounded-full px-2 ${meta.className}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PURCHASE_STATUS_META) as PurchaseStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {PURCHASE_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </td>
      <td className="px-2 py-1.5 max-w-[160px]">
        {locationText ? (
          <span className="flex items-center gap-1 text-green-700 dark:text-green-400" title={locationText}>
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{locationText}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-0.5 justify-end">
          <Button
            size="icon"
            variant="ghost"
            className={`h-6 w-6 relative ${item.attachments?.length ? "text-primary" : "text-muted-foreground"}`}
            title={`Files (${item.attachments?.length || 0})`}
            onClick={onOpenFiles}
          >
            <Paperclip className="w-3.5 h-3.5" />
            {(item.attachments?.length || 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-primary text-primary-foreground rounded-full w-3 h-3 flex items-center justify-center">
                {item.attachments.length}
              </span>
            )}
          </Button>
          {!readOnly && (
            <>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Edit" onClick={onEdit}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Delete"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------- vendor popover

function VendorPopover({ vendor }: { vendor: NonNullable<CostLineItem["vendor"]> }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-primary hover:underline font-medium flex items-center gap-1">
          <Building2 className="w-3 h-3" /> {vendor.name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm space-y-2" align="start">
        <p className="font-bold">{vendor.name}</p>
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-xs hover:underline">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.phone}
          </a>
        )}
        {vendor.email && (
          <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-xs hover:underline">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.email}
          </a>
        )}
        {vendor.website && (
          <a
            href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs hover:underline"
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.website}
          </a>
        )}
        {vendor.address && (
          <p className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {vendor.address}
          </p>
        )}
        {vendor.notes && <p className="text-xs text-muted-foreground border-t pt-2">{vendor.notes}</p>}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------- item dialog

function ItemDialog({
  sectionId,
  item,
  vendors,
  tasks,
  currency,
  onClose,
  onSaved,
  onError,
}: {
  sectionId: string;
  item: CostLineItem | null;
  vendors: VendorOption[];
  tasks: TaskOption[];
  currency: string;
  onClose: () => void;
  onSaved: (payload: CostSheetPayload) => void;
  onError: (err: unknown) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [isSpecOnly, setIsSpecOnly] = useState(() => {
    if (!item) return false;
    const hasZeroCost = (item.unitCostCents || 0) === 0 && (item.shippingCostCents || 0) === 0 && (item.taxCostCents || 0) === 0;
    return hasZeroCost;
  });
  const [form, setForm] = useState(() => ({
    itemName: item?.itemName || "",
    description: item?.description || "",
    qty: item ? String(item.qty) : "1",
    unit: item?.unit || "",
    unitCost: item ? centsToDollarInput(item.unitCostCents) : "",
    shipping: item ? centsToDollarInput(item.shippingCostCents) : "",
    tax: item ? centsToDollarInput(item.taxCostCents) : "",
    otherFees: item ? centsToDollarInput(item.otherFeesCents) : "",
    paid: item ? centsToDollarInput(item.paidCents) : "",
    vendorId: item?.vendorId || NO_VENDOR,
    quoteNumber: item?.quoteNumber || "",
    taskId: item?.taskId || NO_TASK,
    priority: item?.priority || "medium",
    requiredForPrototype: item?.requiredForPrototype ?? true,
    notes: item?.notes || "",
  }));

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const estimatedPreview = isSpecOnly
    ? 0
    : Math.round(Number(form.qty || 0) * dollarsToCents(form.unitCost)) +
      dollarsToCents(form.shipping) +
      dollarsToCents(form.tax) +
      dollarsToCents(form.otherFees);

  const save = async () => {
    if (!form.itemName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        itemName: form.itemName.trim(),
        description: form.description,
        qty: isSpecOnly ? 0 : Number(form.qty) || 0,
        unit: isSpecOnly ? "" : form.unit,
        unitCostCents: isSpecOnly ? 0 : dollarsToCents(form.unitCost),
        shippingCostCents: isSpecOnly ? 0 : dollarsToCents(form.shipping),
        taxCostCents: isSpecOnly ? 0 : dollarsToCents(form.tax),
        otherFeesCents: isSpecOnly ? 0 : dollarsToCents(form.otherFees),
        paidCents: isSpecOnly ? 0 : dollarsToCents(form.paid),
        vendorId: isSpecOnly || form.vendorId === NO_VENDOR ? null : form.vendorId,
        quoteNumber: isSpecOnly ? "" : form.quoteNumber,
        taskId: form.taskId === NO_TASK ? "" : form.taskId,
        priority: form.priority as "low" | "medium" | "high" | "critical",
        requiredForPrototype: form.requiredForPrototype,
        notes: form.notes,
      };
      const result = item
        ? await updateCostLineItem(item.id, payload)
        : await createCostLineItem(sectionId, payload);
      onSaved(result);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Line Item" : "Add Line Item"}</DialogTitle>
          <DialogDescription>
            {isSpecOnly
              ? "Specification-only entry mode (manufacturing specs & testing requirements). Financial fields are hidden."
              : "Estimated total updates automatically: qty × unit cost + shipping + tax + fees."}
          </DialogDescription>
        </DialogHeader>

        {/* Specification-only toggle switch */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-foreground">Manufacturing / Specification-Only Entry</span>
            <p className="text-muted-foreground text-[11px]">Hide financial & cost fields for specification-only entries</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="specOnlyToggle"
              checked={isSpecOnly}
              onCheckedChange={(c) => setIsSpecOnly(Boolean(c))}
            />
            <label htmlFor="specOnlyToggle" className="font-semibold cursor-pointer">Spec Only (No cost)</label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <Label className="text-xs">Item Name *</Label>
            <Input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} placeholder="e.g. Tungsten powder specification" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[60px]"
              placeholder="Detailed manufacturing specification or testing requirement details..."
            />
          </div>

          <div className="col-span-2">
            <Label className="text-xs">Notes / Technical Specs</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[50px]"
              placeholder="Additional specification notes, tolerance metrics, test requirements..."
            />
          </div>

          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isSpecOnly && (
            <>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min="0" value={form.qty} onChange={(e) => set("qty", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Unit (lbs, pcs, hrs...)</Label>
                <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Unit Cost ($)</Label>
                <Input value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Shipping ($)</Label>
                <Input value={form.shipping} onChange={(e) => set("shipping", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Tax ($)</Label>
                <Input value={form.tax} onChange={(e) => set("tax", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Other Fees ($)</Label>
                <Input value={form.otherFees} onChange={(e) => set("otherFees", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Paid So Far ($)</Label>
                <Input value={form.paid} onChange={(e) => set("paid", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Vendor / Manufacturer</Label>
                <Select value={form.vendorId} onValueChange={(v) => set("vendorId", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VENDOR}>No vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <div>
                <Label className="text-xs">Quote Number</Label>
                <Input value={form.quoteNumber} onChange={(e) => set("quoteNumber", e.target.value)} />
              </div>
            </>
          )}
          {tasks.length > 0 && (
            <div className="col-span-2">
              <Label className="text-xs">Link to Task (rolls up into project totals either way)</Label>
              <Select value={form.taskId} onValueChange={(v) => set("taskId", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Not linked to a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TASK}>Not linked to a task</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="cm-required"
              checked={form.requiredForPrototype}
              onCheckedChange={(c) => set("requiredForPrototype", c === true)}
            />
            <Label htmlFor="cm-required" className="text-xs cursor-pointer">
              Required for workable prototype (counts toward build readiness)
            </Label>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[50px]" />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-sm">
            Estimated Total: <span className="font-bold">{formatMoney(estimatedPreview, currency)}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.itemName.trim()}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {item ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

