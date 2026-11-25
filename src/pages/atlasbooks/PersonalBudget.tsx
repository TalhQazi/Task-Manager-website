import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Settings,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Folder,
  History,
  Activity,
  PlusCircle,
  Edit,
  X
} from "lucide-react";
import { toast } from "sonner";

// Types matching Mongoose schemas
interface Category {
  _id: string;
  categoryName: string;
  categoryType: "bill" | "income";
  color: string;
  icon: string;
}

interface Period {
  _id: string;
  month: number;
  year: number;
  status: "active" | "closed";
  startingCash: number;
  notes: string;
}

interface BudgetItem {
  _id: string;
  itemType: "bill" | "income" | "transfer";
  name: string;
  categoryId: Category | string;
  amountPlanned: number;
  amountActual: number;
  dueDate: string;
  status: string;
  recurrenceId?: string;
  notes?: string;
}

interface Profile {
  _id: string;
  displayName: string;
  defaultCurrency: string;
  privacyMode: string;
}

interface LogEntry {
  _id: string;
  action: string;
  recordType: string;
  createdAt: string;
  newValue?: any;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

export const PersonalBudget: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Selected period state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-indexed
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);

  // Tab routing
  const [activeTab, setActiveTab] = useState<"dashboard" | "items" | "charts" | "recurrences" | "logs" | "settings">("dashboard");

  // Modals / forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Quick add form state
  const [formType, setFormType] = useState<"bill" | "income">("bill");
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAmountPlanned, setFormAmountPlanned] = useState("");
  const [formAmountActual, setFormAmountActual] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formFrequency, setFormFrequency] = useState("monthly");

  // Settings form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"bill" | "income">("bill");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatIcon, setNewCatIcon] = useState("Folder");
  const [profileName, setProfileName] = useState("");
  const [profileCurrency, setProfileCurrency] = useState("USD");

  // --- API Handlers ---

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch profile
      const profileData = await apiFetch<{ item: Profile }>("/api/personal-budget/profile");
      setProfile(profileData.item);
      setProfileName(profileData.item.displayName);
      setProfileCurrency(profileData.item.defaultCurrency);

      // Fetch categories
      const catData = await apiFetch<{ items: Category[] }>("/api/personal-budget/categories");
      setCategories(catData.items);

      // Fetch initialized periods
      const periodData = await apiFetch<{ items: Period[] }>("/api/personal-budget/periods");
      setPeriods(periodData.items);

      // Match current selection
      const matched = periodData.items.find(
        (p) => p.month === currentMonth && p.year === currentYear
      );
      if (matched) {
        setActivePeriod(matched);
      } else {
        setActivePeriod(null);
        setItems([]);
      }
    } catch (err: any) {
      toast.error("Failed to load budget data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  // Fetch items for the active period
  useEffect(() => {
    if (activePeriod) {
      apiFetch<{ items: BudgetItem[] }>(`/api/personal-budget/items?periodId=${activePeriod._id}`)
        .then((res) => setItems(res.items))
        .catch((err) => toast.error("Error fetching items: " + err.message));
    } else {
      setItems([]);
    }
  }, [activePeriod]);

  // Load activity logs
  const loadLogs = async () => {
    try {
      const res = await apiFetch<{ items: LogEntry[] }>("/api/personal-budget/activity-logs");
      setLogs(res.items);
    } catch (err: any) {
      toast.error("Failed to load audit logs");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize a new month period
  const handleInitializePeriod = async () => {
    try {
      setIsInitializing(true);
      const res = await apiFetch<{ item: Period }>("/api/personal-budget/periods", {
        method: "POST",
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
        }),
      });
      toast.success(`${MONTHS[currentMonth - 1]} ${currentYear} initialized successfully!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize period");
    } finally {
      setIsInitializing(false);
    }
  };

  // Toggle item status (checklist check/uncheck)
  const handleToggleStatus = async (item: BudgetItem) => {
    try {
      let nextStatus = "";
      let nextActual = 0;

      if (item.itemType === "bill") {
        nextStatus = item.status === "paid" ? "planned" : "paid";
        nextActual = nextStatus === "paid" ? item.amountPlanned : 0;
      } else {
        nextStatus = item.status === "received" ? "expected" : "received";
        nextActual = nextStatus === "received" ? item.amountPlanned : 0;
      }

      const res = await apiFetch<{ item: BudgetItem }>(`/api/personal-budget/items/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: nextStatus,
          amountActual: nextActual,
        }),
      });

      // Update state locally
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, status: nextStatus, amountActual: nextActual } : i)));
      toast.success(`Marked "${item.name}" as ${nextStatus}`);
    } catch (err: any) {
      toast.error("Failed to toggle status: " + err.message);
    }
  };

  // Quick Add / Edit Item Save
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCategoryId || !formAmountPlanned || !formDueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        periodId: activePeriod?._id,
        itemType: formType,
        name: formName,
        categoryId: formCategoryId,
        amountPlanned: parseFloat(formAmountPlanned),
        amountActual: formAmountActual ? parseFloat(formAmountActual) : 0,
        dueDate: formDueDate,
        status: formType === "bill" ? "planned" : "expected",
        notes: formNotes,
        isRecurring: formIsRecurring,
        frequency: formFrequency,
      };

      if (editingItem) {
        // Edit item
        await apiFetch(`/api/personal-budget/items/${editingItem._id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName,
            categoryId: formCategoryId,
            amountPlanned: parseFloat(formAmountPlanned),
            amountActual: formAmountActual ? parseFloat(formAmountActual) : 0,
            dueDate: formDueDate,
            notes: formNotes,
          }),
        });
        toast.success("Budget item updated");
      } else {
        // Create new
        await apiFetch("/api/personal-budget/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Budget item added");
      }

      // Close modal and refresh
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error("Failed to save item: " + err.message);
    }
  };

  const handleEditClick = (item: BudgetItem) => {
    setEditingItem(item);
    setFormType(item.itemType as "bill" | "income");
    setFormName(item.name);
    setFormCategoryId(typeof item.categoryId === "object" ? item.categoryId._id : item.categoryId);
    setFormAmountPlanned(String(item.amountPlanned));
    setFormAmountActual(String(item.amountActual));
    setFormDueDate(new Date(item.dueDate).toISOString().split("T")[0]);
    setFormNotes(item.notes || "");
    setFormIsRecurring(false); // Can't mutate recurrence directly from edit modal easily
    setShowAddModal(true);
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiFetch(`/api/personal-budget/items/${id}`, {
        method: "DELETE",
      });
      toast.success("Item deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete item: " + err.message);
    }
  };

  // Add custom Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      await apiFetch("/api/personal-budget/categories", {
        method: "POST",
        body: JSON.stringify({
          categoryName: newCatName,
          categoryType: newCatType,
          color: newCatColor,
          icon: newCatIcon,
        }),
      });
      toast.success("Category created");
      setNewCatName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete category? Items using it will become unassigned.")) return;
    try {
      await apiFetch(`/api/personal-budget/categories/${id}`, {
        method: "DELETE",
      });
      toast.success("Category deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Save Settings profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/personal-budget/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName: profileName,
          defaultCurrency: profileCurrency,
        }),
      });
      toast.success("Profile saved");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Reset helper
  const resetForm = () => {
    setFormName("");
    setFormAmountPlanned("");
    setFormAmountActual("");
    setFormNotes("");
    setFormIsRecurring(false);
    if (categories.length > 0) {
      setFormCategoryId(categories[0]._id);
    }
    const defaultDate = new Date(currentYear, currentMonth - 1, new Date().getDate() + 1);
    setFormDueDate(defaultDate.toISOString().split("T")[0]);
  };

  // Export period data to CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.warning("No items to export");
      return;
    }

    const headers = ["Item Type", "Name", "Category", "Amount Planned", "Amount Actual", "Due Date", "Status", "Notes"];
    const rows = items.map((item) => {
      const cat = typeof item.categoryId === "object" ? item.categoryId.categoryName : "Unassigned";
      return [
        item.itemType,
        item.name,
        cat,
        item.amountPlanned,
        item.amountActual,
        new Date(item.dueDate).toLocaleDateString(),
        item.status,
        item.notes || "",
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_export_${MONTHS[currentMonth - 1]}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate totals
  const totalPlannedIncome = items
    .filter((i) => i.itemType === "income")
    .reduce((sum, i) => sum + i.amountPlanned, 0);

  const totalActualIncome = items
    .filter((i) => i.itemType === "income" && i.status === "received")
    .reduce((sum, i) => sum + i.amountActual, 0);

  const totalPlannedBills = items
    .filter((i) => i.itemType === "bill")
    .reduce((sum, i) => sum + i.amountPlanned, 0);

  const totalActualBills = items
    .filter((i) => i.itemType === "bill" && i.status === "paid")
    .reduce((sum, i) => sum + i.amountActual, 0);

  const plannedDiff = totalPlannedIncome - totalPlannedBills;
  const actualDiff = totalActualIncome - totalActualBills;

  const totalBillsCount = items.filter((i) => i.itemType === "bill").length;
  const paidBillsCount = items.filter((i) => i.itemType === "bill" && i.status === "paid").length;
  const remainingBills = totalPlannedBills - totalActualBills;
  const paidProgress = totalBillsCount > 0 ? (paidBillsCount / totalBillsCount) * 100 : 0;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Top Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg border border-amber-400/30">
            <Lock className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-amber-400 font-serif uppercase">
              {profile?.displayName || "Personal Budget"}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              Private Personal Finance Chamber • Secure & Encrypted
            </p>
          </div>
        </div>

        {/* Date Selector Banner */}
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-1 text-center min-w-[150px]">
            <span className="font-bold text-sm text-amber-400 font-mono tracking-wide">
              {MONTHS[currentMonth - 1]} {currentYear}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2">
          {activePeriod && (
            <button
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setFormType("bill");
                if (categories.length > 0) {
                  const defaultCat = categories.find((c) => c.categoryType === "bill") || categories[0];
                  setFormCategoryId(defaultCat._id);
                }
                setShowAddModal(true);
              }}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wider flex items-center space-x-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition-all duration-300 transform hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>QUICK ADD</span>
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 rounded-xl transition-colors"
            title="Refresh Budget"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI cards */}
      {activePeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Total Income */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
              <span>Total Income</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {profile?.defaultCurrency === "USD" ? "$" : ""}{totalActualIncome.toLocaleString()}
              </span>
              <span className="block text-[9px] text-zinc-500 font-mono mt-0.5">
                Planned: {profile?.defaultCurrency === "USD" ? "$" : ""}{totalPlannedIncome.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total Bills */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
              <span>Total Bills</span>
              <CreditCard className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-rose-450 font-mono">
                {profile?.defaultCurrency === "USD" ? "$" : ""}{totalActualBills.toLocaleString()}
              </span>
              <span className="block text-[9px] text-zinc-500 font-mono mt-0.5">
                Planned: {profile?.defaultCurrency === "USD" ? "$" : ""}{totalPlannedBills.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Difference / Net Cash Flow */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
              <span>Difference</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2.5">
              <span className={`text-2xl font-black font-mono ${actualDiff >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                {actualDiff < 0 ? "-" : ""}{profile?.defaultCurrency === "USD" ? "$" : ""}{Math.abs(actualDiff).toLocaleString()}
              </span>
              <span className={`block text-[9px] font-mono mt-0.5 ${plannedDiff >= 0 ? "text-emerald-500/80" : "text-rose-500/80"}`}>
                Planned: {plannedDiff < 0 ? "-" : ""}{profile?.defaultCurrency === "USD" ? "$" : ""}{Math.abs(plannedDiff).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Remaining Bills */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
              <span>Remaining Bills</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {profile?.defaultCurrency === "USD" ? "$" : ""}{remainingBills.toLocaleString()}
              </span>
              <span className="block text-[9px] text-zinc-500 font-mono mt-0.5">
                Due: {totalBillsCount - paidBillsCount} / {totalBillsCount} bills
              </span>
            </div>
          </div>

          {/* Paid Progress */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
              <span>Paid Progress</span>
              <CheckSquare className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {Math.round(paidProgress)}%
              </span>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-450 h-full rounded-full transition-all duration-500"
                  style={{ width: `${paidProgress}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Main Tabs Navigation */}
      {activePeriod && (
        <div className="flex border-b border-zinc-800 overflow-x-auto gap-2.5 pb-0.5 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard Checklist", icon: CheckSquare },
            { id: "items", label: "Detailed Entries", icon: DollarSign },
            { id: "charts", label: "Budget vs Actual", icon: TrendingUp },
            { id: "logs", label: "Audit Stream", icon: Activity },
            { id: "settings", label: "Custom Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "logs") loadLogs();
                }}
                className={`flex items-center space-x-1.5 py-3 px-4 border-b-2 font-semibold text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-amber-500 text-amber-400 bg-amber-500/5"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main content body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-transparent">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : !activePeriod ? (
        /* Period not initialized screen */
        <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl max-w-xl mx-auto p-6">
          <Calendar className="w-12 h-12 text-zinc-650 mb-3" />
          <h3 className="text-base font-bold text-zinc-300 font-serif">
            Budget Period Not Initialized
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1.5">
            The budget planning session for <strong className="text-zinc-400">{MONTHS[currentMonth - 1]} {currentYear}</strong> has not been started. Initializing will auto-generate your recurring bills and income templates.
          </p>
          <button
            onClick={handleInitializePeriod}
            disabled={isInitializing}
            className="mt-5 w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold font-mono tracking-widest uppercase shadow-md shadow-amber-500/5 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isInitializing ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            )}
            <span>INITIALIZE MONTH BUDGET</span>
          </button>
        </div>
      ) : (
        /* Tabs rendering */
        <div className="space-y-6">
          {/* TAB 1: CHECKLIST DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Income checklist column */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-emerald-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Income Expected</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    Received: {profile?.defaultCurrency === "USD" ? "$" : ""}{totalActualIncome.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {items.filter((i) => i.itemType === "income").length === 0 ? (
                    <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                      No income records expected.
                    </div>
                  ) : (
                    items
                      .filter((i) => i.itemType === "income")
                      .map((item) => {
                        const isReceived = item.status === "received";
                        const cat = typeof item.categoryId === "object" ? item.categoryId : null;
                        return (
                          <div
                            key={item._id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 group ${
                              isReceived
                                ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-450"
                                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-100"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className={`p-1.5 rounded transition-all text-zinc-550 cursor-pointer ${
                                  isReceived ? "text-emerald-500" : "hover:text-emerald-400"
                                }`}
                              >
                                {isReceived ? (
                                  <CheckSquare className="w-5 h-5" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>

                              <div>
                                <span className={`text-xs font-semibold block ${isReceived ? "line-through text-zinc-500" : ""}`}>
                                  {item.name}
                                </span>
                                <div className="flex items-center space-x-2 mt-1">
                                  {cat && (
                                    <span
                                      className="text-[9px] font-mono px-2 py-0.2 rounded-full border"
                                      style={{ borderColor: `${cat.color}25`, backgroundColor: `${cat.color}10`, color: cat.color }}
                                    >
                                      {cat.categoryName}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-zinc-500 font-mono">
                                    Expected: {new Date(item.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <span className={`text-sm font-bold font-mono block ${isReceived ? "text-emerald-500" : "text-zinc-200"}`}>
                                  {profile?.defaultCurrency === "USD" ? "$" : ""}{item.amountPlanned.toLocaleString()}
                                </span>
                                {item.notes && (
                                  <span className="text-[9px] text-zinc-500 block truncate max-w-[120px]" title={item.notes}>
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleEditClick(item)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-amber-400 transition-all cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Bills checklist column */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-rose-450 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Bills Checklist</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                    Paid: {profile?.defaultCurrency === "USD" ? "$" : ""}{totalActualBills.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {items.filter((i) => i.itemType === "bill").length === 0 ? (
                    <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                      No bills configured for this month.
                    </div>
                  ) : (
                    items
                      .filter((i) => i.itemType === "bill")
                      .map((item) => {
                        const isPaid = item.status === "paid";
                        const cat = typeof item.categoryId === "object" ? item.categoryId : null;
                        
                        // Check if item is late (due in past, and unpaid)
                        const isLate = !isPaid && new Date(item.dueDate) < new Date(new Date().setHours(0,0,0,0));

                        return (
                          <div
                            key={item._id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 group ${
                              isPaid
                                ? "bg-amber-500/5 border-amber-500/20 text-zinc-450"
                                : isLate
                                  ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-900"
                                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-100"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className={`p-1.5 rounded transition-all text-zinc-550 cursor-pointer ${
                                  isPaid ? "text-amber-500" : "hover:text-amber-400"
                                }`}
                              >
                                {isPaid ? (
                                  <CheckSquare className="w-5 h-5 text-amber-500" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>

                              <div>
                                <span className={`text-xs font-semibold block ${isPaid ? "line-through text-zinc-500" : ""}`}>
                                  {item.name}
                                </span>
                                <div className="flex items-center space-x-2 mt-1">
                                  {cat && (
                                    <span
                                      className="text-[9px] font-mono px-2 py-0.2 rounded-full border"
                                      style={{ borderColor: `${cat.color}25`, backgroundColor: `${cat.color}10`, color: cat.color }}
                                    >
                                      {cat.categoryName}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-mono ${isLate ? "text-rose-500 font-bold" : "text-zinc-500"}`}>
                                    {isPaid
                                      ? "Paid"
                                      : isLate
                                        ? "LATE"
                                        : `Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <span className={`text-sm font-bold font-mono block ${isPaid ? "text-amber-500" : "text-zinc-200"}`}>
                                  {profile?.defaultCurrency === "USD" ? "$" : ""}{item.amountPlanned.toLocaleString()}
                                </span>
                                {item.notes && (
                                  <span className="text-[9px] text-zinc-500 block truncate max-w-[120px]" title={item.notes}>
                                    {item.notes}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleEditClick(item)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-amber-400 transition-all cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED ENTRIES LIST */}
          {activeTab === "items" && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
                  All Financial Records ({items.length})
                </h3>
                <button
                  onClick={handleExportCSV}
                  className="py-1 px-3 border border-zinc-700 hover:border-amber-500 rounded bg-zinc-900 text-zinc-400 hover:text-amber-400 font-mono text-[10px] uppercase font-bold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>EXPORT CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-450 uppercase font-black">
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Planned</th>
                      <th className="py-3 px-4 text-right">Actual</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-zinc-600">
                          No budget records found. Add some to get started.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const cat = typeof item.categoryId === "object" ? item.categoryId : null;
                        return (
                          <tr key={item._id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                                item.itemType === "bill"
                                  ? "bg-rose-500/10 text-rose-450 border border-rose-500/25"
                                  : "bg-emerald-500/10 text-emerald-450 border border-emerald-500/25"
                              }`}>
                                {item.itemType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-zinc-200">
                              {item.name}
                            </td>
                            <td className="py-3 px-4">
                              {cat ? (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                >
                                  {cat.categoryName}
                                </span>
                              ) : (
                                <span className="text-zinc-650">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-zinc-200">
                              {profile?.defaultCurrency === "USD" ? "$" : ""}{item.amountPlanned.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-400">
                              {profile?.defaultCurrency === "USD" ? "$" : ""}{item.amountActual.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-zinc-450">
                              {new Date(item.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                                item.status === "paid" || item.status === "received"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-zinc-800 text-zinc-450"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end space-x-1">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                                  title="Edit Entry"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="p-1 hover:bg-zinc-800 rounded text-zinc-550 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET VS ACTUAL */}
          {activeTab === "charts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Breakdown (Bills) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-rose-450 uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  Bills Expenditure vs Budget
                </h4>

                <div className="space-y-4">
                  {categories
                    .filter((c) => c.categoryType === "bill")
                    .map((cat) => {
                      const planned = items
                        .filter((i) => i.itemType === "bill" && (typeof i.categoryId === "object" ? i.categoryId._id : i.categoryId) === cat._id)
                        .reduce((sum, i) => sum + i.amountPlanned, 0);

                      const actual = items
                        .filter((i) => i.itemType === "bill" && (typeof i.categoryId === "object" ? i.categoryId._id : i.categoryId) === cat._id && i.status === "paid")
                        .reduce((sum, i) => sum + i.amountActual, 0);

                      if (planned === 0 && actual === 0) return null;

                      const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;

                      return (
                        <div key={cat._id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-zinc-200">{cat.categoryName}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">
                              {profile?.defaultCurrency === "USD" ? "$" : ""}{actual} / {profile?.defaultCurrency === "USD" ? "$" : ""}{planned}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}

                  {items.filter((i) => i.itemType === "bill").length === 0 && (
                    <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                      No bill entries to display.
                    </div>
                  )}
                </div>
              </div>

              {/* Category Breakdown (Income) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  Income Inflow vs Expected
                </h4>

                <div className="space-y-4">
                  {categories
                    .filter((c) => c.categoryType === "income")
                    .map((cat) => {
                      const planned = items
                        .filter((i) => i.itemType === "income" && (typeof i.categoryId === "object" ? i.categoryId._id : i.categoryId) === cat._id)
                        .reduce((sum, i) => sum + i.amountPlanned, 0);

                      const actual = items
                        .filter((i) => i.itemType === "income" && (typeof i.categoryId === "object" ? i.categoryId._id : i.categoryId) === cat._id && i.status === "received")
                        .reduce((sum, i) => sum + i.amountActual, 0);

                      if (planned === 0 && actual === 0) return null;

                      const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;

                      return (
                        <div key={cat._id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-zinc-200">{cat.categoryName}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">
                              {profile?.defaultCurrency === "USD" ? "$" : ""}{actual} / {profile?.defaultCurrency === "USD" ? "$" : ""}{planned}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}

                  {items.filter((i) => i.itemType === "income").length === 0 && (
                    <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                      No income entries to display.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: AUDIT STREAM LOGS */}
          {activeTab === "logs" && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                  <Activity className="w-4.5 h-4.5" />
                  <span>Audit Trail logs ({logs.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-zinc-550">
                  Last 100 Actions
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                    No activity registered yet.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log._id} className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg text-xs font-mono flex justify-between items-center">
                      <div>
                        <span className={`px-2 py-0.2 rounded font-black text-[9px] uppercase mr-2.5 ${
                          log.action === "create"
                            ? "bg-emerald-500/10 text-emerald-450"
                            : log.action === "update"
                              ? "bg-blue-500/10 text-blue-450"
                              : "bg-rose-500/10 text-rose-450"
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-zinc-200 font-bold">
                          {log.recordType}
                        </span>
                        {log.newValue?.name && (
                          <span className="text-zinc-450 ml-1.5">
                            • "{log.newValue.name}"
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-650 text-[10px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM SETTINGS */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Config */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  Profile Configuration
                </h4>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold block">Chamber Display Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2 text-zinc-150 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold block">Default Currency Code</label>
                    <select
                      value={profileCurrency}
                      onChange={(e) => setProfileCurrency(e.target.value)}
                      className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2 text-zinc-150 focus:border-amber-500 outline-none"
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-zinc-950 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    SAVE PROFILE SETTINGS
                  </button>
                </form>
              </div>

              {/* Custom Categories Setup */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4 lg:col-span-2">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider border-b border-zinc-800 pb-2.5">
                  Category Setup & Rules
                </h4>

                {/* Categories Creation Form */}
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono border-b border-zinc-800 pb-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-zinc-400 font-semibold block">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Electricity, Gym"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2 text-zinc-150 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold block">Category Type</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2 text-zinc-150 focus:border-amber-500 outline-none"
                    >
                      <option value="bill">Bill (Outflow)</option>
                      <option value="income">Income (Inflow)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-400 font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>CREATE</span>
                    </button>
                  </div>
                </form>

                {/* Categories Table List */}
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {categories.map((cat) => (
                      <div key={cat._id} className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: cat.color }} />
                          <span className="font-bold text-zinc-200">{cat.categoryName}</span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">
                            ({cat.categoryType})
                          </span>
                        </div>
                        
                        {!cat.isDefault && (
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-650 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete custom category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* FLOATING QUICK ADD MODAL */}
      {showAddModal && activePeriod && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0c111d] border-l border-amber-500/20 shadow-2xl p-6 flex flex-col justify-between z-55 animate-in slide-in-from-right duration-350 text-zinc-150 font-sans">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/25">
                    <PlusCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-sm tracking-wider uppercase font-serif text-amber-400">
                    {editingItem ? "Edit Budget Entry" : "Quick Add Budget Entry"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form panel */}
              <form id="budget-item-form" onSubmit={handleSaveItem} className="space-y-4 text-xs font-mono">
                {/* Type Selection */}
                {!editingItem && (
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-semibold block">Entry Type</label>
                    <div className="grid grid-cols-2 gap-2 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("bill");
                          const billCat = categories.find((c) => c.categoryType === "bill");
                          if (billCat) setFormCategoryId(billCat._id);
                        }}
                        className={`py-1.5 rounded-md font-bold uppercase transition-all cursor-pointer ${
                          formType === "bill"
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-450 font-extrabold"
                            : "text-zinc-500 hover:text-zinc-350"
                        }`}
                      >
                        Bill / Outflow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("income");
                          const incCat = categories.find((c) => c.categoryType === "income");
                          if (incCat) setFormCategoryId(incCat._id);
                        }}
                        className={`py-1.5 rounded-md font-bold uppercase transition-all cursor-pointer ${
                          formType === "income"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 font-extrabold"
                            : "text-zinc-500 hover:text-zinc-350"
                        }`}
                      >
                        Income / Inflow
                      </button>
                    </div>
                  </div>
                )}

                {/* Entry Label Name */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Item Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RingCentral bill, Developer wage"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Category dropdown */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Category Assignment *</label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 focus:border-amber-500 outline-none"
                  >
                    {categories
                      .filter((c) => c.categoryType === formType)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.categoryName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Planned & Actual Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold block">Planned Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formAmountPlanned}
                        onChange={(e) => setFormAmountPlanned(e.target.value)}
                        className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 pl-7 text-zinc-150 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold block">Actual Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formAmountActual}
                        onChange={(e) => setFormAmountActual(e.target.value)}
                        className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 pl-7 text-zinc-150 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Due Date & Notes */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Expected Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold block">Notes & Details</label>
                  <textarea
                    placeholder="Provide any description details"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-905 border border-zinc-800 rounded-lg p-2.5 text-zinc-150 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Recurrence toggle */}
                {!editingItem && (
                  <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-zinc-200 font-bold block">Recurring Rule</span>
                      <span className="text-[10px] text-zinc-550 block">Auto-generates next month template</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="form-is-recurring"
                        checked={formIsRecurring}
                        onChange={(e) => setFormIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="form-is-recurring" className="text-zinc-400 font-semibold cursor-pointer">Recurring</label>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-zinc-850 pt-4 mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-350 hover:text-zinc-100 rounded-xl font-bold font-mono tracking-wider transition-colors cursor-pointer text-center"
              >
                CANCEL
              </button>
              <button
                type="submit"
                form="budget-item-form"
                className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black font-mono tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer text-center"
              >
                {editingItem ? "UPDATE ENTRY" : "CREATE ENTRY"}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default PersonalBudget;
