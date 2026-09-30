import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/admin/ui/button";

/* Reuses the existing, fully-built WIP subsystem (routes/wip.js + WipDashboard).
 * We surface it as a workspace tab rather than duplicating any WIP logic. */
export default function WipView() {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Activity className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Work In Progress</h3>
        <p className="text-muted-foreground max-w-md mt-1">
          Live work sessions, elapsed time, blockers and productivity are tracked in the existing
          WIP Dashboard — reused as-is, no duplicate data.
        </p>
      </div>
      <Button className="gap-2" onClick={() => navigate("/admin/wip")}>
        Open WIP Dashboard <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
