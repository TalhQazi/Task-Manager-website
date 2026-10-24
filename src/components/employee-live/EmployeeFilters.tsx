import { Search, LayoutGrid, Rows3, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Badge } from "@/components/admin/ui/badge";
import { cn } from "@/lib/utils";

interface EmployeeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  health: string;
  onHealthChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortDir: "asc" | "desc";
  onSortDirToggle: () => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  departments?: string[];
  totalCount?: number;
  onResetFilters?: () => void;
}

export function EmployeeFilters({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  health,
  onHealthChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirToggle,
  viewMode,
  onViewModeChange,
  departments = [],
  totalCount = 0,
  onResetFilters,
}: EmployeeFiltersProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    department !== "all" ||
    status !== "all" ||
    health !== "all";

  return (
    <div className="space-y-3 bg-card/60 backdrop-blur-sm border rounded-xl p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, project, task, or role..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-10 text-sm bg-background border-border/80 focus:border-primary transition-all rounded-lg"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="h-10 text-xs w-[150px] sm:w-[170px] bg-background">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="activeDuration">Longest Active</SelectItem>
                <SelectItem value="eta">Soonest ETA</SelectItem>
                <SelectItem value="overdue">Most Overdue</SelectItem>
                <SelectItem value="priority">Highest Priority</SelectItem>
                <SelectItem value="availability">Availability</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSortDirToggle}
              className="h-10 px-2.5 bg-background text-xs"
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          {/* Grid vs List Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "h-9 px-2.5 rounded text-xs transition-colors",
                viewMode === "grid" ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "text-muted-foreground"
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4 mr-1 sm:inline hidden" />
              <span>Grid</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "h-9 px-2.5 rounded text-xs transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "text-muted-foreground"
              )}
              title="Compact List View"
            >
              <Rows3 className="h-4 w-4 mr-1 sm:inline hidden" />
              <span>List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters:
        </span>

        {/* Status Filter */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="BREAK">Break</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
            <SelectValue placeholder="Dept: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Dept: All</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Health Filter */}
        <Select value={health} onValueChange={onHealthChange}>
          <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
            <SelectValue placeholder="Health: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Health: All</SelectItem>
            <SelectItem value="on-track">On Track</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters button if any are active */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Clear Filters
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <span>Total:</span>
          <Badge variant="secondary" className="font-semibold text-xs py-0 px-2">
            {totalCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}
