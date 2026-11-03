import { ArrowLeft, Play, Pause, AlertOctagon, CheckCircle2, Clock, TrendingUp, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { Button } from "@/components/admin/ui/button";
import { LiveStatusBadge } from "./LiveStatusBadge";
import type { EmployeeInfo, LiveStatusType, CurrentAssignmentMetrics } from "@/lib/employeeLiveApi";
import type { ManagerActionType } from "./ManagerActionModal";

interface EmployeeHeroPanelProps {
  employee: EmployeeInfo;
  liveStatus: LiveStatusType;
  currentAssignment: CurrentAssignmentMetrics | null;
  onBack: () => void;
  onActionClick: (action: ManagerActionType) => void;
}

export function EmployeeHeroPanel({
  employee,
  liveStatus,
  currentAssignment,
  onBack,
  onActionClick,
}: EmployeeHeroPanelProps) {
  const isActive = currentAssignment?.isOpenActive || liveStatus === "ACTIVE";

  return (
    <div className="bg-card/70 border rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-4">
      {/* Top Bar: Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2 h-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workforce Overview</span>
        </Button>
      </div>

      {/* Main Profile Info & Action Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Large Photograph & Identity */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-border shadow-md">
              {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl uppercase rounded-2xl">
                {employee.initials || employee.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-background animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {employee.name}
              </h1>
              <LiveStatusBadge status={liveStatus} size="md" />
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {employee.role || "Team Member"} • {employee.department || "Operations"}
              {employee.company && ` • ${employee.company}`}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>Shift: <strong className="text-foreground">{employee.shift || "Day Shift"}</strong></span>
              {employee.email && <span>• {employee.email}</span>}
              {employee.location && <span>• {employee.location}</span>}
            </div>
          </div>
        </div>

        {/* Right: Primary Manager Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {currentAssignment && currentAssignment.status === "ACTIVE" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onActionClick("pause")}
              className="text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 h-9 gap-1.5 min-w-[100px]"
            >
              <Pause className="h-4 w-4" />
              Pause Work
            </Button>
          ) : currentAssignment && ["PAUSED", "ASSIGNED"].includes(currentAssignment.status) ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => onActionClick("resume")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5 min-w-[100px]"
            >
              <Play className="h-4 w-4" />
              Start Work
            </Button>
          ) : null}

          {currentAssignment && (
            <>
              {currentAssignment.status !== "BLOCKED" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick("block")}
                  className="text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10 h-9 gap-1.5"
                >
                  <AlertOctagon className="h-4 w-4" />
                  Mark Blocked
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onActionClick("unblock")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Resolve Blocker
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick("estimate")}
                className="h-9 gap-1.5"
              >
                <Clock className="h-4 w-4" />
                Adjust Estimate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick("progress")}
                className="h-9 gap-1.5"
              >
                <TrendingUp className="h-4 w-4" />
                Update Progress
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick("complete")}
                className="h-9 gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            </>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => onActionClick("new_assignment")}
            className="h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </div>
    </div>
  );
}
