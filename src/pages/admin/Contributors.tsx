import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Filter, Award, Clock, CheckCircle, ArrowUpRight, Eye, X, FileText, Calendar, CheckCircle2 } from "lucide-react";
import { getContributors, getTopContributors, getContributor, getContributorContributions, type Contributor, type Contribution } from "@/lib/admin/apiClient";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [contributorDetails, setContributorDetails] = useState<{contributor: Contributor; recentContributions: Contribution[]; tasksWorkedOn: any[]} | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, roleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contributorsRes, topRes] = await Promise.all([
        getContributors({
          search: searchTerm || undefined,
          role: roleFilter === "all" ? undefined : roleFilter,
          page,
          limit: 20,
        }),
        getTopContributors({ limit: 5 }),
      ]);
      setContributors(contributorsRes.items || []);
      setTotalPages(contributorsRes.totalPages || 1);
      setTopContributors(topRes.items || []);
    } catch (err) {
      console.error("Failed to load contributors:", err);
      toast.error("Failed to load contributors");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const openContributorDetails = async (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const [detailsRes, contributionsRes] = await Promise.all([
        getContributor(contributor.userId),
        getContributorContributions(contributor.userId, { limit: 50 }),
      ]);
      setContributorDetails(detailsRes);
      setContributions(contributionsRes.items || []);
    } catch (err) {
      console.error("Failed to load contributor details:", err);
      toast.error("Failed to load contributor details");
    } finally {
      setDetailLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "super-admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "employee":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Contributors
          </h1>
          <p className="text-muted-foreground mt-1">
            Track who did what, when, and at what level
          </p>
        </div>
      </div>

      {/* Top Contributors */}
      {!loading && topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Contributors
            </CardTitle>
            <CardDescription>Most active contributors this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor._id}
                  className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={contributor.avatar} alt={contributor.name} />
                      <AvatarFallback className="bg-[#133767] text-white text-lg">
                        {getInitials(contributor.name)}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-sm mt-3 text-center">{contributor.name || "Unknown"}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${getRoleColor(contributor.role)}`}
                  >
                    {contributor.role}
                  </Badge>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {contributor.stats?.totalTasksCompleted || 0} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {contributor.stats?.totalTimeSpent || 0}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contributors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributors List */}
      <Card>
        <CardHeader>
          <CardTitle>All Contributors</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${contributors.length} contributors found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No contributors found</h3>
              <p className="text-muted-foreground mt-1">
                Contributors will appear here once they start working on tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributors.map((contributor) => (
                <div
                  key={contributor._id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contributor.avatar} alt={contributor.name} />
                    <AvatarFallback className="bg-[#133767] text-white">
                      {getInitials(contributor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{contributor.name || "Unknown"}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleColor(contributor.role)}`}
                      >
                        {contributor.role}
                      </Badge>
                      <Badge
                        variant={contributor.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {contributor.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{contributor.email}</p>
                    {contributor.department && (
                      <p className="text-xs text-muted-foreground">{contributor.department}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{contributor.stats?.totalTasksCreated || 0}</div>
                      <div className="text-xs text-muted-foreground">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{contributor.stats?.totalTasksUpdated || 0}</div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{contributor.stats?.totalTasksCompleted || 0}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{contributor.projects?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Last active</p>
                    <p className="text-sm font-medium">
                      {formatDate(contributor.stats?.lastContributionAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openContributorDetails(contributor)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributor Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contributor Details
            </DialogTitle>
            <DialogDescription>
              View detailed contribution history for this contributor
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedContributor ? (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 py-4">
                {/* Contributor Header */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedContributor.avatar} alt={selectedContributor.name} />
                    <AvatarFallback className="bg-[#133767] text-white text-lg">
                      {getInitials(selectedContributor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedContributor.name || "Unknown"}</h3>
                    <p className="text-sm text-muted-foreground">{selectedContributor.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getRoleColor(selectedContributor.role)}>
                        {selectedContributor.role}
                      </Badge>
                      <Badge variant={selectedContributor.status === "active" ? "default" : "secondary"}>
                        {selectedContributor.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedContributor.stats?.totalTasksCreated || 0}</div>
                      <div className="text-xs text-muted-foreground">Tasks Created</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedContributor.stats?.totalTasksUpdated || 0}</div>
                      <div className="text-xs text-muted-foreground">Tasks Updated</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedContributor.stats?.totalTasksCompleted || 0}</div>
                      <div className="text-xs text-muted-foreground">Tasks Completed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedContributor.projects?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Projects</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contribution History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Contribution History
                    </CardTitle>
                    <CardDescription>
                      Recent activities and contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No contributions recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {contributions.map((contribution) => (
                          <div
                            key={contribution._id}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className="mt-0.5">
                              {contribution.action === "created" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : contribution.action === "completed" ? (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              ) : contribution.action === "updated" || contribution.action === "status_changed" ? (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {contribution.action === "created" && "Created task "}
                                {contribution.action === "completed" && "Completed task "}
                                {contribution.action === "updated" && "Updated task "}
                                {contribution.action === "status_changed" && "Changed status of task "}
                                {contribution.action === "assigned" && "Assigned task "}
                                {contribution.action === "commented" && "Commented on task "}
                                <span className="font-semibold">"{contribution.resourceName}"</span>
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {contribution.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(contribution.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    contribution.impact === "high" || contribution.impact === "critical"
                                      ? "border-red-200 text-red-700"
                                      : contribution.impact === "medium"
                                      ? "border-yellow-200 text-yellow-700"
                                      : "border-gray-200 text-gray-600"
                                  }`}
                                >
                                  {contribution.impact} impact
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projects Worked On */}
                {selectedContributor.projects && selectedContributor.projects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-4 w-4" />
                        Projects Contributed To
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedContributor.projects.map((project, idx) => (
                          <div key={idx} className="p-3 rounded-lg border">
                            <p className="font-medium text-sm">{project.projectName}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.contributionCount} contributions
                            </p>
                            <p className="text-xs text-muted-foreground">
                              First: {new Date(project.firstContributionAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
