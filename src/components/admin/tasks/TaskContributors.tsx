import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { getTaskContributors, getTaskContributionHistory } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface TaskContributorsProps {
  taskId: string;
}

interface Contributor {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  addedAt: string;
  contributionType: string;
  actions: string[];
  stats?: {
    totalTasksCreated?: number;
    totalTasksUpdated?: number;
    totalTasksCompleted?: number;
  };
}

interface Contribution {
  _id: string;
  contributorId: string;
  contributorName: string;
  action: string;
  description: string;
  createdAt: string;
  impact: string;
}

export function TaskContributors({ taskId }: TaskContributorsProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributors();
  }, [taskId]);

  const loadContributors = async () => {
    setLoading(true);
    try {
      const [contributorsRes, contributionsRes] = await Promise.all([
        getTaskContributors(taskId),
        getTaskContributionHistory(taskId, 10),
      ]);
      setContributors(contributorsRes.items || []);
      setContributions(contributionsRes.items || []);
    } catch (err) {
      console.error("Failed to load contributors:", err);
      toast.error("Failed to load contributors");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getContributionTypeColor = (type: string) => {
    switch (type) {
      case "creator":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assignee":
        return "bg-green-100 text-green-800 border-green-200";
      case "updater":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewer":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case "updated":
      case "status_changed":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Calendar className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worked On By
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (contributors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worked On By
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No contributors yet. Contributors will appear here when they interact with this task.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worked On By
          </CardTitle>
          <CardDescription>
            People who have contributed to this task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contributors.map((contributor) => (
              <div
                key={contributor.userId}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contributor.avatar} alt={contributor.name} />
                  <AvatarFallback className="bg-[#133767] text-white text-sm">
                    {getInitials(contributor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{contributor.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getContributionTypeColor(contributor.contributionType)}`}
                    >
                      {contributor.contributionType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contributor.email}
                  </p>
                  {contributor.department && (
                    <p className="text-xs text-muted-foreground">
                      {contributor.department}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {contributor.actions?.map((action) => (
                      <Badge
                        key={action}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {getActionIcon(action)}
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(contributor.addedAt)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {contributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributions.slice(0, 5).map((contribution) => (
                <div
                  key={contribution._id}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="mt-0.5">{getActionIcon(contribution.action)}</div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{contribution.contributorName}</span>{" "}
                      {contribution.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(contribution.createdAt)}
                    </p>
                  </div>
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
                    {contribution.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
