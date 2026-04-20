import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Briefcase } from "lucide-react";
import { apiFetch, listResource } from "@/lib/api";

type Employee = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role?: string;
  status: "active" | "inactive" | "on-leave";
};

const statusClasses = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground",
  "on-leave": "bg-warning/10 text-warning border-warning/20",
};

export function ActiveEmployees() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const emps = await listResource<Employee>("employees");
        if (!mounted) return;
        // Show only active employees, max 3
        setEmployees(emps.filter(e => e.status === 'active').slice(0, 3));
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load employees");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="shadow-soft border-0 sm:border h-full">
      {/* Card Header - Responsive */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-4 sm:py-5">
        <CardTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active Employee
        </CardTitle>
        <a 
          href="/employees" 
          className="text-xs sm:text-sm text-accent hover:underline inline-flex items-center group"
        >
          View all
          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </a>
      </CardHeader>

      {/* Card Content - Responsive */}
      <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6 pb-5 sm:pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-6 sm:py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-accent/30 animate-pulse" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Loading employees...
              </p>
            </div>
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            </div>
            <p className="text-sm sm:text-base font-medium text-destructive">{apiError}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Please try again later
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base font-medium text-muted-foreground">
              No employees found
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Add employees to see them here
            </p>
            <a 
              href="/employees" 
              className="mt-3 text-xs sm:text-sm text-accent hover:underline inline-flex items-center"
            >
              Go to Employees →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-muted"
              >
                {/* Avatar */}
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {employee.initials}
                  </AvatarFallback>
                </Avatar>
                
                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">
                    {employee.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{employee.role || "No role assigned"}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge 
                  className={`${statusClasses[employee.status]} text-xs border`} 
                  variant="secondary"
                >
                  {employee.status}
                </Badge>
              </div>
            ))}

            {/* Mobile View All Link */}
            <div className="block sm:hidden pt-2">
              <a 
                href="/employees" 
                className="text-xs text-accent hover:underline inline-flex items-center w-full justify-center py-2"
              >
                View all employees
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}