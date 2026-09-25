import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Lock,
  FileText,
  Laptop,
  Award,
  History,
  ShieldCheck,
  MessageSquare,
  Printer,
  Sparkles,
  Loader2,
  TrendingUp,
  UserMinus,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// Sub-tabs
import { OverviewTab } from "./tabs/OverviewTab";
import { PersonalTab } from "./tabs/PersonalTab";
import { EmploymentTab } from "./tabs/EmploymentTab";
import { PayrollTaxTab } from "./tabs/PayrollTaxTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { AssetsTab } from "./tabs/AssetsTab";
import { TrainingTab } from "./tabs/TrainingTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { HRNotesTab } from "./tabs/HRNotesTab";

// Modals
import { EmploymentUpdateModal } from "./modals/EmploymentUpdateModal";
import { DocumentUploadModal } from "./modals/DocumentUploadModal";
import { AssetAssignModal } from "./modals/AssetAssignModal";
import { TrainingAddModal } from "./modals/TrainingAddModal";
import { SeparationModal } from "./modals/SeparationModal";

interface EmployeeFileWorkspaceProps {
  employeeId: string;
  onBack: () => void;
}

export function EmployeeFileWorkspace({ employeeId, onBack }: EmployeeFileWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [employmentModalOpen, setEmploymentModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [separationModalOpen, setSeparationModalOpen] = useState(false);

  const fetchEmployeeFile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch<{ item: any }>(`/api/employees/${employeeId}/file`);
      setFileData(res.item);
    } catch (err: any) {
      setError(err?.message || "Failed to load employee file workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeFile();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Opening Secure Employee File...</p>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-400 text-sm">
          {error || "Employee record not found"}
        </div>
        <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Employee Directory
        </Button>
      </div>
    );
  }

  const employeeNumber = fileData.employeeNumber || `EMP-${String(fileData.id || "").slice(-4).toUpperCase()}`;

  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "personal", label: "Personal", icon: Mail },
    { id: "employment", label: "Employment", icon: Briefcase },
    {
      id: "payroll",
      label: "Payroll & Tax",
      icon: Lock,
      restricted: true,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      count: fileData.counts?.documents,
    },
    {
      id: "assets",
      label: "Assets & Access",
      icon: Laptop,
      count: fileData.counts?.assets,
    },
    {
      id: "training",
      label: "Training & Certs",
      icon: Award,
      count: fileData.counts?.training,
    },
    { id: "history", label: "History", icon: History },
    ...(fileData.canEditHR
      ? [{ id: "hr_notes", label: "HR Notes", icon: MessageSquare, count: fileData.counts?.hrNotes }]
      : []),
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-white hover:bg-slate-800/60 gap-2 text-xs h-8 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Employee Directory
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployeeFile}
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8 gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Refresh File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8 gap-1.5"
          >
            <Printer className="h-3 w-3" /> Print Summary
          </Button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-slate-700 shadow-xl ring-4 ring-slate-800/50">
                <AvatarImage src={fileData.avatarUrl} alt={fileData.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl">
                  {fileData.initials || fileData.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {fileData.name}
                  </h1>
                  {fileData.preferredName && (
                    <span className="text-xs text-slate-400 font-normal">
                      (&quot;{fileData.preferredName}&quot;)
                    </span>
                  )}
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs font-mono">
                    {employeeNumber}
                  </Badge>
                  <Badge
                    className={
                      fileData.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/30 text-[11px]"
                    }
                  >
                    {fileData.status?.toUpperCase() || "ACTIVE"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-0.5">
                  <span className="font-semibold text-blue-400 flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                    {fileData.role || "Team Member"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {fileData.department || "General"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {fileData.location || fileData.company || "Primary Site"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-500" />
                    {fileData.email}
                  </span>
                  {fileData.phone && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        {fileData.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmploymentModalOpen(true)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 gap-1.5"
              >
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                Career Update
              </Button>
              {fileData.status === "active" && fileData.canEditHR && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSeparationModalOpen(true)}
                  className="border-rose-900/50 text-rose-300 hover:bg-rose-950/40 text-xs h-9 gap-1.5"
                >
                  <UserMinus className="h-3.5 w-3.5 text-rose-400" />
                  Separation
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation Ribbon */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-blue-500 text-white bg-slate-900/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive
                    ? "text-blue-400"
                    : tab.restricted
                    ? "text-amber-500/70"
                    : "text-slate-500"
                }`}
              />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 border-slate-700 ${
                    isActive ? "bg-blue-500/20 text-blue-300" : "text-slate-500"
                  }`}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab
            data={fileData}
            onTabChange={setActiveTab}
            onOpenEmploymentModal={() => setEmploymentModalOpen(true)}
            onOpenDocModal={() => setDocModalOpen(true)}
            onOpenAssetModal={() => setAssetModalOpen(true)}
            onOpenSeparationModal={() => setSeparationModalOpen(true)}
          />
        )}

        {activeTab === "personal" && (
          <PersonalTab
            employeeId={employeeId}
            initialData={fileData}
            onRefresh={fetchEmployeeFile}
          />
        )}

        {activeTab === "employment" && (
          <EmploymentTab
            employeeId={employeeId}
            employee={fileData}
            onOpenUpdateModal={() => setEmploymentModalOpen(true)}
          />
        )}

        {activeTab === "payroll" && (
          <PayrollTaxTab
            employeeId={employeeId}
            employeeName={fileData.name}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            employeeId={employeeId}
            employeeName={fileData.name}
            onOpenUploadModal={() => setDocModalOpen(true)}
          />
        )}

        {activeTab === "assets" && (
          <AssetsTab
            employeeId={employeeId}
            employeeName={fileData.name}
            onOpenAssignModal={() => setAssetModalOpen(true)}
          />
        )}

        {activeTab === "training" && (
          <TrainingTab
            employeeId={employeeId}
            employeeName={fileData.name}
            onOpenAddModal={() => setTrainingModalOpen(true)}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab employeeId={employeeId} />
        )}

        {activeTab === "hr_notes" && (
          <HRNotesTab
            employeeId={employeeId}
            employeeName={fileData.name}
          />
        )}
      </div>

      {/* Modals */}
      <EmploymentUpdateModal
        isOpen={employmentModalOpen}
        onClose={() => setEmploymentModalOpen(false)}
        employee={fileData}
        onSuccess={fetchEmployeeFile}
      />

      <DocumentUploadModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        employeeId={employeeId}
        onSuccess={fetchEmployeeFile}
      />

      <AssetAssignModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        employeeId={employeeId}
        employeeName={fileData.name}
        onSuccess={fetchEmployeeFile}
      />

      <TrainingAddModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
        employeeId={employeeId}
        employeeName={fileData.name}
        onSuccess={fetchEmployeeFile}
      />

      <SeparationModal
        isOpen={separationModalOpen}
        onClose={() => setSeparationModalOpen(false)}
        employee={{
          id: fileData.id,
          name: fileData.name,
          employeeNumber,
          role: fileData.role,
          department: fileData.department,
        }}
        onSuccess={fetchEmployeeFile}
      />
    </div>
  );
}
