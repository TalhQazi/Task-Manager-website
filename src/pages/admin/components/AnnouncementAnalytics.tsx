import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch } from "@/lib/admin/apiClient";
import { Loader2, TrendingUp, Users, CheckCircle2, Eye } from "lucide-react";

interface AnnouncementAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string;
}

export default function AnnouncementAnalytics({
  isOpen,
  onClose,
  announcementId,
}: AnnouncementAnalyticsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["announcement-analytics", announcementId],
    queryFn: async () => {
      return apiFetch(`/api/announcements/${announcementId}/analytics`);
    },
    enabled: isOpen,
  });

  const announcement = data?.announcement;
  const userList = data?.userList || [];
  const readPercentage = data?.readPercentage || 0;
  const acknowledgedPercentage = data?.acknowledgedPercentage || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00C6FF]" />
            Analytics: {announcement?.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#00C6FF]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Total Recipients</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {announcement?.sentCount || 0}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-[#00C6FF]" />
                  <span className="text-sm text-white/60">Read Rate</span>
                </div>
                <div className="text-3xl font-bold text-[#00C6FF]">
                  {readPercentage}%
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {announcement?.readCount || 0} of {announcement?.sentCount || 0}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/60">Acknowledged</span>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {acknowledgedPercentage}%
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {announcement?.acknowledgedCount || 0} of {announcement?.sentCount || 0}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/80">Read Progress</span>
                  <span className="text-sm text-white/60">{readPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] transition-all duration-300"
                    style={{ width: `${readPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/80">Acknowledgement Progress</span>
                  <span className="text-sm text-white/60">{acknowledgedPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                    style={{ width: `${acknowledgedPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* User Details Table */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">User Details</h3>
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">User</TableHead>
                      <TableHead className="text-white/60">Role</TableHead>
                      <TableHead className="text-white/60">Read At</TableHead>
                      <TableHead className="text-white/60">Acknowledged At</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-white/40 py-4">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      userList.map((user: any) => (
                        <TableRow key={user.userId} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="text-white/80">{user.userName}</TableCell>
                          <TableCell className="text-white/60">{user.userRole}</TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {user.readAt
                              ? new Date(user.readAt).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {user.acknowledgedAt
                              ? new Date(user.acknowledgedAt).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.readAt && (
                                <Badge variant="outline" className="text-xs border-[#00C6FF]/30 bg-[#00C6FF]/10 text-[#00C6FF]">
                                  Read
                                </Badge>
                              )}
                              {user.acknowledged && (
                                <Badge variant="outline" className="text-xs border-green-400/30 bg-green-400/10 text-green-400">
                                  Acked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
