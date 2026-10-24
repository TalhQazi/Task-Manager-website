import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { EmployeeHeroPanel } from "@/components/employee-live/EmployeeHeroPanel";
import { CurrentAssignmentPanel } from "@/components/employee-live/CurrentAssignmentPanel";
import { NextAssignmentPanel } from "@/components/employee-live/NextAssignmentPanel";
import { ActivityTimeline } from "@/components/employee-live/ActivityTimeline";
import { AdditionalDetailsPanel } from "@/components/employee-live/AdditionalDetailsPanel";
import { ManagerActionModal, type ManagerActionType } from "@/components/employee-live/ManagerActionModal";
import { useSingleEmployeeLive } from "@/hooks/useEmployeeLive";
import { cn } from "@/lib/utils";

interface ExpandedEmployeeLiveViewPageProps {
  baseRoutePrefix?: string;
}

export default function ExpandedEmployeeLiveViewPage({
  baseRoutePrefix = "/admin/employees",
}: ExpandedEmployeeLiveViewPageProps) {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ManagerActionType | null>(null);

  const { data, isLoading, refetch, isFetching, transportStatus } = useSingleEmployeeLive(
    employeeId || ""
  );

  const handleBack = () => {
    navigate(`${baseRoutePrefix}/live`);
  };

  const handleOpenAction = (action: ManagerActionType) => {
    setSelectedAction(action);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading live employee snapshot...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Employee Live Record Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested employee record could not be loaded or you do not have permission.
        </p>
        <Button onClick={handleBack} variant="outline" size="sm">
          Return to Workforce Overview
        </Button>
      </div>
    );
  }

  const {
    employee,
    liveStatus,
    currentAssignment,
    nextAssignment,
    queuedAssignments,
    recentActivity,
    metricsToday,
    serverTime,
  } = data;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Real-time sync status header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 text-xs font-semibold gap-1.5 shadow-xs border",
              transportStatus === "live"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            )}
          >
            {transportStatus === "live" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{transportStatus === "live" ? "Real-time Live Sync" : "Polling Sync"}</span>
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Authoritative Server Clock: {new Date(serverTime).toLocaleTimeString()}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Hero Profile Header Panel */}
      <EmployeeHeroPanel
        employee={employee}
        liveStatus={liveStatus}
        currentAssignment={currentAssignment}
        onBack={handleBack}
        onActionClick={handleOpenAction}
      />

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Current Assignment & Next Assignment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <CurrentAssignmentPanel assignment={currentAssignment} serverTime={serverTime} />
          <NextAssignmentPanel
            nextAssignment={nextAssignment}
            queuedAssignments={queuedAssignments}
            onNewAssignment={() => handleOpenAction("new_assignment")}
          />
        </div>

        {/* Right Column: Additional Operational Details & Activity Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <AdditionalDetailsPanel
            employee={employee}
            metricsToday={metricsToday}
            queuedCount={queuedAssignments?.length || 0}
          />
          <ActivityTimeline employeeId={employee.id} initialEvents={recentActivity} />
        </div>
      </div>

      {/* Action Dialog */}
      <ManagerActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        actionType={selectedAction}
        employeeId={employee.id}
        employeeName={employee.name}
        assignmentId={currentAssignment?.id}
        assignmentTitle={currentAssignment?.taskTitle}
        currentProgress={currentAssignment?.progressPercent}
        currentExpectedSeconds={currentAssignment?.expectedActiveSeconds}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
