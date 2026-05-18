import { useMemo, useState } from "react";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import { Progress } from "@/components/manger/ui/progress";
import { Search, FileText, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch } from "@/lib/manger/api";
import { useQuery } from "@tanstack/react-query";

interface OnboardingItem {
  id: string;
  employeeName: string;
  startDate: string;
  progress: number;
  documentsUploaded: number;
  documentsRequired: number;
  overallStatus: string;
}

type OnboardingApi = {
  id: string;
  employeeName: string;
  overallStatus: string;
  progress: number;
  basicInfo?: { completed?: boolean };
  identityVerification?: {
    primaryId?: { status?: string };
    secondaryId?: { status?: string };
  };
  w4Form?: { status?: string };
  employeeHandbook?: { status?: string };
  digitalSignature?: { status?: string };
  workInfo?: { completed?: boolean };
  createdAt?: string;
};

function docDone(s?: string) {
  return s === "submitted" || s === "verified";
}

function normalizeItem(i: OnboardingApi): OnboardingItem {
  let uploaded = 0;
  if (i.basicInfo?.completed) uploaded++;
  if (
    docDone(i.identityVerification?.primaryId?.status) &&
    docDone(i.identityVerification?.secondaryId?.status)
  ) uploaded++;
  if (docDone(i.w4Form?.status)) uploaded++;
  if (docDone(i.employeeHandbook?.status)) uploaded++;
  if (docDone(i.digitalSignature?.status)) uploaded++;

  return {
    id: i.id,
    employeeName: i.employeeName || "—",
    startDate: i.createdAt || "",
    progress: i.progress ?? 0,
    documentsUploaded: uploaded,
    documentsRequired: 5,
    overallStatus: i.overallStatus || "not_started",
  };
}

const statusStyles: Record<string, string> = {
  not_started: "bg-gray-500/10 text-gray-500",
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-blue-500/10 text-blue-600",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const statusLabel: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function OnboardingMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const onboardingQuery = useQuery({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await apiFetch<{ items: OnboardingApi[] }>("/api/onboarding/admin/all");
      return res.items.map(normalizeItem);
    },
  });

  const items = onboardingQuery.data ?? [];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || item.employeeName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.overallStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const approvedCount = items.filter((i) => i.overallStatus === "approved").length;
  const pendingReviewCount = items.filter((i) => i.overallStatus === "submitted").length;
  const inProgressCount = items.filter(
    (i) => i.overallStatus === "in_progress" || i.overallStatus === "not_started"
  ).length;

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">
      <div className="page-header">
        <h1 className="page-title">Onboarding Monitoring</h1>
        <p className="page-subtitle">Track employee onboarding progress and approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground">{pendingReviewCount}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-success/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
            </div>
            <FileText className="w-8 h-8 text-primary/50" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employee or role..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Approval status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {onboardingQuery.isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading onboarding...</div>
      ) : onboardingQuery.isError ? (
        <div className="p-6 text-sm text-destructive">
          {onboardingQuery.error instanceof Error
            ? onboardingQuery.error.message
            : "Failed to load onboarding"}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto px-4">
          <table className="data-table w-full min-w-[800px]">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Progress</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No onboarding records found
                  </td>
                </tr>
              ) : filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td>
                    <p className="font-medium text-foreground">{item.employeeName}</p>
                  </td>
                  <td>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.progress}%</span>
                        <span className={cn(item.progress === 100 ? "text-success" : "text-muted-foreground")}>
                          {item.progress === 100 ? "Complete" : "In progress"}
                        </span>
                      </div>
                      <Progress value={item.progress} />
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {item.documentsUploaded}/{item.documentsRequired}
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant="secondary"
                      className={cn("capitalize whitespace-nowrap", statusStyles[item.overallStatus] ?? "")}
                    >
                      {statusLabel[item.overallStatus] ?? item.overallStatus}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString() : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
