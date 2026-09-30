import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import {
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  UserCheck,
  ShieldCheck,
  FileText,
  Laptop,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  Mail,
  Phone,
  UserMinus,
  Sparkles,
} from "lucide-react";

interface OverviewTabProps {
  data: any;
  onTabChange: (tab: string) => void;
  onOpenEmploymentModal: () => void;
  onOpenDocModal: () => void;
  onOpenAssetModal: () => void;
  onOpenSeparationModal: () => void;
}

export function OverviewTab({
  data,
  onTabChange,
  onOpenEmploymentModal,
  onOpenDocModal,
  onOpenAssetModal,
  onOpenSeparationModal,
}: OverviewTabProps) {
  const calculateTenure = (hireDateStr?: string, joinDateStr?: string) => {
    const raw = hireDateStr || joinDateStr;
    if (!raw) return "New Hire";
    const start = new Date(raw);
    if (!Number.isFinite(start.getTime())) return "Active";
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return "Less than 1 month";
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    const years = Math.floor(diffMonths / 12);
    const remMonths = diffMonths % 12;
    return `${years} yr${years > 1 ? "s" : ""}${remMonths > 0 ? ` ${remMonths} mo` : ""}`;
  };

  const tenure = calculateTenure(data.hireDate, data.joinDate);

  return (
    <div className="space-y-6">
      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Tenure</div>
              <div className="text-lg font-bold text-white mt-0.5">{tenure}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Hired {data.hireDate || (data.joinDate ? new Date(data.joinDate).toLocaleDateString() : "Recent")}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Document Vault</div>
              <div className="text-lg font-bold text-white mt-0.5">{data.counts?.documents || 0} files</div>
              <button
                onClick={() => onTabChange("documents")}
                className="text-[11px] text-violet-400 hover:text-violet-300 mt-1 flex items-center gap-0.5"
              >
                View Vault <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Assigned Assets</div>
              <div className="text-lg font-bold text-white mt-0.5">{data.counts?.assets || 0} items</div>
              <button
                onClick={() => onTabChange("assets")}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 mt-1 flex items-center gap-0.5"
              >
                View Assets <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Laptop className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Certifications</div>
              <div className="text-lg font-bold text-white mt-0.5">{data.counts?.training || 0} active</div>
              <button
                onClick={() => onTabChange("training")}
                className="text-[11px] text-amber-400 hover:text-amber-300 mt-1 flex items-center gap-0.5"
              >
                View Records <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Organization & Reporting */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Organization & Reporting Structure
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onOpenEmploymentModal}
                  className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                >
                  Edit Position
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                    Department & Unit
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {data.department || "General"}
                  </div>
                  <div className="text-xs text-slate-400">{data.role || "Team Member"}</div>
                </div>

                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    Work Location
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {data.location || data.company || "Primary Facility"}
                  </div>
                  <div className="text-xs text-slate-400">{data.shift || "Regular Schedule"}</div>
                </div>
              </div>

              {/* Direct Supervisor Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-xs">
                    {data.supervisor?.name ? data.supervisor.name.slice(0, 2).toUpperCase() : "HR"}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Reports Directly To</div>
                    <div className="text-sm font-semibold text-white">
                      {data.supervisor?.name || "Senior Management"}
                    </div>
                  </div>
                </div>
                {data.supervisor?.email && (
                  <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                    {data.supervisor.email}
                  </Badge>
                )}
              </div>

              {/* Recent Career Milestones Preview */}
              {data.recentCareerEvents && data.recentCareerEvents.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                    Recent Position Changes
                  </div>
                  <div className="space-y-2">
                    {data.recentCareerEvents.slice(0, 2).map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{event.title}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{event.department || "General"}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(event.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Compliance & Quick Actions */}
        <div className="space-y-6">
          {/* ClearHire & Onboarding Verification Status */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Compliance & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-300">ClearHire® Background</div>
                <Badge
                  className={
                    data.clearHireStatus === "GREEN"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : data.clearHireStatus === "YELLOW"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  }
                >
                  {data.clearHireStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-300">Onboarding Status</div>
                <Badge
                  className={
                    data.onboardingStatus === "approved" || data.onboardingStatus === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }
                >
                  {data.onboardingStatus === "approved" ? "Completed (100%)" : `${data.onboardingProgress || 0}% Progress`}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Quick Workspace Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDocModal}
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 h-9 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-violet-400" />
                Upload Document to Vault
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAssetModal}
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 h-9 text-xs"
              >
                <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                Assign Hardware or System Access
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEmploymentModal}
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 h-9 text-xs"
              >
                <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                Record Career or Wage Promotion
              </Button>
              {data.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenSeparationModal}
                  className="w-full justify-start border-rose-900/50 text-rose-300 hover:bg-rose-950/40 gap-2 h-9 text-xs"
                >
                  <UserMinus className="h-3.5 w-3.5 text-rose-400" />
                  Process Employee Separation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
