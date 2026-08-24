import { useQuery } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Timer } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

interface ExpiringPatent {
  _id: string;
  patentName: string;
  status: string;
  provisionalExpiration: string;
  daysUntilExpiration: number;
  category?: string;
  applicationNumber?: string;
  customReminderDays?: number[];
}

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

export function CustomTimerWatch({ globalReminderDays }: { globalReminderDays: number[] }) {
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

  // Filter patents: only those where daysUntilExpiration <= max(customReminderDays || globalReminderDays)
  const filteredPatents = patents.filter((p) => {
    const applicableDays = (p.customReminderDays && p.customReminderDays.length > 0)
      ? p.customReminderDays
      : globalReminderDays;
    
    if (!applicableDays || applicableDays.length === 0) return false;
    
    const maxReminderDay = Math.max(...applicableDays);
    return p.daysUntilExpiration <= maxReminderDay;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Custom Timer View</h2>
        <p className="text-sm text-gray-500">Monitor items that are within their designated reminder schedule.</p>
      </div>

      {expiringQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Loading timer data...
          </CardContent>
        </Card>
      ) : filteredPatents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Timer className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-lg font-semibold">No Items in Custom Timer</p>
              <p className="text-sm text-gray-500">There are no items currently within their reminder schedule.</p>
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
          <Card>
            <CardHeader className="pb-4 border-b border-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="h-5 w-5 text-indigo-600" />
                  Within Reminder Schedule
                </CardTitle>
                <Badge className="bg-indigo-100 text-indigo-800 font-semibold border-indigo-200">
                  {filteredPatents.length} item{filteredPatents.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {filteredPatents.map((patent) => {
                  const expirationDate = new Date(patent.provisionalExpiration);
                  
                  return (
                    <motion.div key={patent._id} variants={itemVariants}>
                      <div className="p-4 rounded-lg border bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-sm text-indigo-950">
                              {patent.patentName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {patent.category && (
                                <Badge variant="outline" className="text-xs bg-white text-indigo-700 border-indigo-200">
                                  {patent.category}
                                </Badge>
                              )}
                              {patent.applicationNumber && (
                                <span className="text-gray-500">
                                  #{patent.applicationNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <div className="flex items-center gap-1 justify-end text-sm font-bold text-indigo-700">
                              <Clock className="h-4 w-4" />
                              {patent.daysUntilExpiration} days
                            </div>
                            <p className="text-xs text-gray-500">
                              {expirationDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
