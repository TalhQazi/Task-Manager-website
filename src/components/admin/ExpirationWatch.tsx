import { useQuery } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, TrendingDown } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface ExpiringPatent {
  _id: string;
  patentName: string;
  status: string;
  provisionalExpiration: string;
  daysUntilExpiration: number;
  category?: string;
  applicationNumber?: string;
}

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 border border-red-300",
  high: "bg-orange-500/10 text-orange-700 border border-orange-300",
  medium: "bg-yellow-500/10 text-yellow-700 border border-yellow-300",
  low: "bg-blue-500/10 text-blue-700 border border-blue-300",
};

const getUrgencyLevel = (daysRemaining: number): "critical" | "high" | "medium" | "low" => {
  if (daysRemaining <= 30) return "critical";
  if (daysRemaining <= 60) return "high";
  if (daysRemaining <= 90) return "medium";
  return "low";
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export function ExpirationWatch() {
  const expiringQuery = useQuery<ExpiringPatent[]>({
    queryKey: ["expiring-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: ExpiringPatent[] }>(
        "/api/patents/expiration-watch"
      );
      return res.items || [];
    },
  });

  const patents = expiringQuery.data || [];

  // Group by urgency
  const groupedByUrgency = {
    critical: patents.filter((p) => getUrgencyLevel(p.daysUntilExpiration) === "critical"),
    high: patents.filter((p) => getUrgencyLevel(p.daysUntilExpiration) === "high"),
    medium: patents.filter((p) => getUrgencyLevel(p.daysUntilExpiration) === "medium"),
    low: patents.filter((p) => getUrgencyLevel(p.daysUntilExpiration) === "low"),
  };

  const urgencyGroups = [
    { key: "critical", label: "Critical (≤30 days)", count: groupedByUrgency.critical.length, patents: groupedByUrgency.critical },
    { key: "high", label: "High (31-60 days)", count: groupedByUrgency.high.length, patents: groupedByUrgency.high },
    { key: "medium", label: "Medium (61-90 days)", count: groupedByUrgency.medium.length, patents: groupedByUrgency.medium },
    { key: "low", label: "Low (91+ days)", count: groupedByUrgency.low.length, patents: groupedByUrgency.low },
  ];

  const urgencyStats = [
    { label: "Critical Expirations", count: groupedByUrgency.critical.length, color: "text-red-600" },
    { label: "High Priority", count: groupedByUrgency.high.length, color: "text-orange-600" },
    { label: "Medium Priority", count: groupedByUrgency.medium.length, color: "text-yellow-600" },
    { label: "Low Priority", count: groupedByUrgency.low.length, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Expiration Watch</h2>
        <p className="text-sm text-gray-500">Monitor patent expirations with 180, 120, 90, 60, and 30-day alerts</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {urgencyStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <TrendingDown className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiration Groups */}
      {expiringQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Loading expiration data...
          </CardContent>
        </Card>
      ) : patents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold">No Patents Expiring Soon</p>
              <p className="text-sm text-gray-500">All patents are in good standing</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {urgencyGroups.map(
            (group) =>
              group.count > 0 && (
                <motion.div key={group.key} variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{group.label}</CardTitle>
                        <Badge
                          className={`${urgencyColors[group.key]} font-semibold`}
                        >
                          {group.count} patent{group.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.patents.map((patent) => {
                          const expirationDate = new Date(patent.provisionalExpiration);
                          const today = new Date();
                          const urgency = getUrgencyLevel(patent.daysUntilExpiration);

                          return (
                            <div
                              key={patent._id}
                              className={`p-3 rounded-lg border ${urgencyColors[urgency]} transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <h4 className="font-semibold text-sm">
                                    {patent.patentName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {patent.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {patent.category}
                                      </Badge>
                                    )}
                                    {patent.applicationNumber && (
                                      <span className="text-gray-600">
                                        #{patent.applicationNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                  <div className="flex items-center gap-1 justify-end text-sm font-semibold">
                                    <Clock className="h-4 w-4" />
                                    {patent.daysUntilExpiration} days
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {expirationDate.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
          )}
        </motion.div>
      )}

      {/* Alert Schedule Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Alert Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            Patent expiration alerts are triggered at <strong>180, 120, 90, 60, and 30 days</strong> before expiration. Ensure timely renewal or extension actions are taken to protect intellectual property.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
