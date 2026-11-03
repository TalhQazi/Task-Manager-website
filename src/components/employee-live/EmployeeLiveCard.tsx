import { useNavigate } from "react-router-dom";
import { 
  MoreVertical, 
  Play, 
  Pause, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  FolderKanban, 
  CheckSquare, 
  TrendingUp, 
  ArrowRight,
  Plus
} from "lucide-react";
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

interface EmployeeLiveCardProps {
  card: EmployeeLiveCardData;
  onActionClick: (action: ManagerActionType, card: EmployeeLiveCardData) => void;
  baseRoutePrefix?: string;
}

export function EmployeeLiveCard({
  card,
  onActionClick,
  baseRoutePrefix = "/admin/employees",
}: EmployeeLiveCardProps) {
  const navigate = useNavigate();
  const { employee, liveStatus, currentAssignment, nextAssignment, serverTime } = card;

  const handleOpenLiveView = () => {
    navigate(`${baseRoutePrefix}/${employee.id}/live`);
  };

  const isActive = currentAssignment?.isOpenActive || liveStatus === "ACTIVE";

  return (
    <div
      onClick={handleOpenLiveView}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-card/70 p-4 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:border-primary/40 backdrop-blur-xs select-none",
        isActive && "border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-card/70",
        liveStatus === "BLOCKED" && "border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-card/70"
      )}
    >
      {/* Top Header: Avatar, Name, Title, Live Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <Avatar className="h-11 w-11 rounded-full border-2 border-border/80 shadow-xs shrink-0">
              {employee.avatarUrl && (
                <AvatarImage src={employee.avatarUrl} alt={employee.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                {employee.initials || employee.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{employee.name}</span>
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {employee.role || "Team Member"} • {employee.department || "General"}
            </p>
          </div>
        </div>

        {/* Overflow Menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <LiveStatusBadge status={liveStatus} size="sm" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleOpenLiveView}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Open Live View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {currentAssignment && (
                <>
                  {currentAssignment.status === "ACTIVE" ? (
                    <DropdownMenuItem onClick={() => onActionClick("pause", card)}>
                      <Pause className="h-4 w-4 mr-2 text-amber-500" />
                      Pause Work
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onActionClick("resume", card)}>
                      <Play className="h-4 w-4 mr-2 text-emerald-500" />
                      Resume Work
                    </DropdownMenuItem>
                  )}

                  {currentAssignment.status !== "BLOCKED" ? (
                    <DropdownMenuItem onClick={() => onActionClick("block", card)}>
                      <AlertOctagon className="h-4 w-4 mr-2 text-rose-500" />
                      Mark as Blocked
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onActionClick("unblock", card)}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                      Resolve Blocker
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => onActionClick("estimate", card)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Adjust Estimate
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onActionClick("progress", card)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Update Progress
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onActionClick("complete", card)}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                    Complete Assignment
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onActionClick("new_assignment", card)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign New Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Middle Section: Current Project, Task & Work Timer */}
      <div className="my-3 space-y-2.5 rounded-lg bg-muted/40 p-2.5 border border-border/40">
        {currentAssignment ? (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <FolderKanban className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {currentAssignment.projectName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium truncate">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{currentAssignment.taskTitle}</span>
              </div>
            </div>

            {/* Live Ticking Timer + Health */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <WorkTimer
                  initialSeconds={currentAssignment.activeElapsedSeconds}
                  isActive={isActive}
                  serverTime={serverTime}
                  size="sm"
                />
              </div>

              <HealthIndicator
                health={currentAssignment.health}
                overrunSeconds={currentAssignment.overrunSeconds}
                isOverdue={currentAssignment.isOverdue}
                size="sm"
              />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Progress ({currentAssignment.progressSource})</span>
                <span className="font-mono font-semibold text-foreground">
                  {currentAssignment.progressPercent}%
                </span>
              </div>
              <Progress value={currentAssignment.progressPercent} className="h-1.5" />
            </div>

            {/* ETA */}
            <div className="pt-0.5">
              <EtaDisplay
                expectedCompletionAt={currentAssignment.expectedCompletionAt}
                expectedActiveSeconds={currentAssignment.expectedActiveSeconds}
                remainingActiveSeconds={currentAssignment.remainingActiveSeconds}
                isOverdue={currentAssignment.isOverdue}
                compact
              />
            </div>
          </>
        ) : (
          <div className="py-4 text-center space-y-1">
            <p className="text-xs font-medium text-muted-foreground">No Active Assignment</p>
            <p className="text-[11px] text-muted-foreground/80">Available for assignment</p>
          </div>
        )}
      </div>

      {/* Bottom Footer: Next Queued Assignment or Quick Action */}
      <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
        {nextAssignment ? (
          <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={`Next: ${nextAssignment.taskTitle}`}>
            <span className="font-semibold text-foreground shrink-0">Next:</span>
            <span className="truncate">{nextAssignment.taskTitle}</span>
          </div>
        ) : (
          <span className="text-[11px] italic">No queued task</span>
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {currentAssignment && currentAssignment.status === "ACTIVE" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30"
              onClick={() => onActionClick("pause", card)}
            >
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          ) : currentAssignment && ["PAUSED", "ASSIGNED"].includes(currentAssignment.status) ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              onClick={() => onActionClick("resume", card)}
            >
              <Play className="h-3 w-3" />
              Start
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              onClick={() => onActionClick("new_assignment", card)}
            >
              <Plus className="h-3 w-3" />
              Assign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
