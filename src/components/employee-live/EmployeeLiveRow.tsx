import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Play, Pause, AlertOctagon, CheckCircle2, Clock, TrendingUp, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { Button } from "@/components/admin/ui/button";
import { Progress } from "@/components/admin/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import { LiveStatusBadge } from "./LiveStatusBadge";
import { HealthIndicator } from "./HealthIndicator";
import { WorkTimer } from "./WorkTimer";
import { EtaDisplay } from "./EtaDisplay";
import { cn } from "@/lib/utils";
import type { EmployeeLiveCardData } from "@/lib/employeeLiveApi";
import type { ManagerActionType } from "./ManagerActionModal";

interface EmployeeLiveRowProps {
  card: EmployeeLiveCardData;
  onActionClick: (action: ManagerActionType, card: EmployeeLiveCardData) => void;
  baseRoutePrefix?: string;
}

export function EmployeeLiveRow({
  card,
  onActionClick,
  baseRoutePrefix = "/admin/employees",
}: EmployeeLiveRowProps) {
  const navigate = useNavigate();
  const { employee, liveStatus, currentAssignment, serverTime } = card;

  const handleOpenLiveView = () => {
    navigate(`${baseRoutePrefix}/${employee.id}/live`);
  };

  const isActive = currentAssignment?.isOpenActive || liveStatus === "ACTIVE";

  return (
    <div
      onClick={handleOpenLiveView}
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 border-b",
        "hover:bg-muted/30 transition-colors cursor-pointer select-none",
        isActive && "bg-emerald-500/[0.02]"
      )}
    >
      {/* Employee Identity */}
      <div className="flex items-center gap-3 min-w-[200px] flex-1">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 rounded-full border">
            {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
              {employee.initials || employee.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
            {employee.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {employee.role} • {employee.department}
          </p>
        </div>
      </div>

      {/* Live Status */}
      <div className="shrink-0 w-[110px]">
        <LiveStatusBadge status={liveStatus} size="sm" />
      </div>

      {/* Current Task & Project */}
      <div className="min-w-[180px] flex-1">
        {currentAssignment ? (
          <div>
            <p className="text-xs font-semibold text-foreground truncate" title={currentAssignment.taskTitle}>
              {currentAssignment.taskTitle}
            </p>
            <p className="text-[11px] text-muted-foreground truncate" title={currentAssignment.projectName}>
              {currentAssignment.projectName}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Available</span>
        )}
      </div>

      {/* Timer & Health */}
      <div className="shrink-0 w-[140px] flex flex-col items-start gap-1">
        {currentAssignment ? (
          <>
            <WorkTimer
              initialSeconds={currentAssignment.activeElapsedSeconds}
              isActive={isActive}
              serverTime={serverTime}
              size="sm"
            />
            <HealthIndicator
              health={currentAssignment.health}
              overrunSeconds={currentAssignment.overrunSeconds}
              isOverdue={currentAssignment.isOverdue}
              size="sm"
            />
          </>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">--:--</span>
        )}
      </div>

      {/* Progress & ETA */}
      <div className="shrink-0 w-[130px] space-y-1">
        {currentAssignment ? (
          <>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>{currentAssignment.progressPercent}%</span>
              <EtaDisplay
                expectedCompletionAt={currentAssignment.expectedCompletionAt}
                expectedActiveSeconds={currentAssignment.expectedActiveSeconds}
                remainingActiveSeconds={currentAssignment.remainingActiveSeconds}
                isOverdue={currentAssignment.isOverdue}
                compact
              />
            </div>
            <Progress value={currentAssignment.progressPercent} className="h-1.5" />
          </>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">-</span>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {currentAssignment && currentAssignment.status === "ACTIVE" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-amber-600 dark:text-amber-400 border-amber-500/30"
            onClick={() => onActionClick("pause", card)}
          >
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
        ) : currentAssignment && ["PAUSED", "ASSIGNED"].includes(currentAssignment.status) ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            onClick={() => onActionClick("resume", card)}
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => onActionClick("new_assignment", card)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleOpenLiveView}>
              Open Live View
            </DropdownMenuItem>
            {currentAssignment && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onActionClick("estimate", card)}>
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  Adjust Estimate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onActionClick("progress", card)}>
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Update Progress
                </DropdownMenuItem>
                {currentAssignment.status !== "BLOCKED" ? (
                  <DropdownMenuItem onClick={() => onActionClick("block", card)}>
                    <AlertOctagon className="h-3.5 w-3.5 mr-2 text-rose-500" />
                    Block Work
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onActionClick("unblock", card)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                    Unblock Work
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onActionClick("complete", card)}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  Complete
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onActionClick("new_assignment", card)}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Assignment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
