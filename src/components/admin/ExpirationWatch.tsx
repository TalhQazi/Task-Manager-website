import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Clock,
  TrendingDown,
  DollarSign,
  FileText,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";

export interface ExpiringPatent {
  _id: string;
  patentName: string;
  status: string;
  filingType?: string;
  filingDate?: string;
  provisionalExpiration: string;
  daysUntilExpiration: number;
  category?: string;
  applicationNumber?: string;
  notes?: string;
  // Diagnostics
  expirationReason?: "one-year-clock" | "fees" | "paperwork" | "other" | string;
  expirationReasonDetail?: string;
  feeStatus?: "pending" | "paid" | "overdue" | "na" | string;
  feeAmount?: number;
  feeDueDate?: string;
  paperworkStatus?: "pending" | "complete" | "missing" | "na" | string;
  paperworkDetails?: string;
}

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800",
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800",
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
  const queryClient = useQueryClient();
  const [selectedPatent, setSelectedPatent] = useState<ExpiringPatent | null>(null);

  // Edit fields for selected patent
  const [reasonDraft, setReasonDraft] = useState<string>("one-year-clock");
  const [detailDraft, setDetailDraft] = useState<string>("");
  const [feeStatusDraft, setFeeStatusDraft] = useState<string>("na");
  const [feeAmountDraft, setFeeAmountDraft] = useState<string>("0");
  const [paperworkStatusDraft, setPaperworkStatusDraft] = useState<string>("na");
  const [paperworkDetailsDraft, setPaperworkDetailsDraft] = useState<string>("");
  const [savingUpdates, setSavingUpdates] = useState<boolean>(false);

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

  const handleOpenPatentModal = (patent: ExpiringPatent) => {
    setSelectedPatent(patent);
    setReasonDraft(patent.expirationReason || (patent.filingType === "Provisional" ? "one-year-clock" : "fees"));
    setDetailDraft(patent.expirationReasonDetail || "");
    setFeeStatusDraft(patent.feeStatus || "na");
    setFeeAmountDraft(String(patent.feeAmount || 0));
    setPaperworkStatusDraft(patent.paperworkStatus || "na");
    setPaperworkDetailsDraft(patent.paperworkDetails || "");
  };

  const handleSaveDiagnostics = async () => {
    if (!selectedPatent) return;
    try {
      setSavingUpdates(true);
      const payload = {
        expirationReason: reasonDraft,
        expirationReasonDetail: detailDraft,
        feeStatus: feeStatusDraft,
        feeAmount: Number(feeAmountDraft) || 0,
        paperworkStatus: paperworkStatusDraft,
        paperworkDetails: paperworkDetailsDraft,
      };

      const res = await apiFetch<{ item: ExpiringPatent }>(
        `/api/patents/filed/${encodeURIComponent(selectedPatent._id)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      const updated = res.item || { ...selectedPatent, ...payload };
      setSelectedPatent(updated);
      await queryClient.invalidateQueries({ queryKey: ["expiring-patents"] });
      await queryClient.invalidateQueries({ queryKey: ["patents-filed"] });

      toast({
        title: "Expiration Details Saved",
        description: `Successfully updated reason and tracking for "${selectedPatent.patentName}".`,
      });
    } catch (err) {
      toast({
        title: "Failed to update expiration details",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSavingUpdates(false);
    }
  };

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

  const renderReasonBadge = (patent: ExpiringPatent) => {
    const reason = patent.expirationReason || (patent.filingType === "Provisional" ? "one-year-clock" : "fees");
    switch (reason) {
      case "one-year-clock":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 gap-1 text-[11px] font-semibold hover:bg-amber-500/20">
            <Clock className="h-3 w-3" /> 1-Year Clock Expiring
          </Badge>
        );
      case "fees":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 gap-1 text-[11px] font-semibold hover:bg-emerald-500/20">
            <DollarSign className="h-3 w-3" /> Fees Due
          </Badge>
        );
      case "paperwork":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700/60 gap-1 text-[11px] font-semibold hover:bg-blue-500/20">
            <FileText className="h-3 w-3" /> Paperwork Required
          </Badge>
        );
      default:
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700/60 gap-1 text-[11px] font-semibold hover:bg-purple-500/20">
            <AlertCircle className="h-3 w-3" /> Custom Notice
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Expiration Watch</h2>
        <p className="text-sm text-muted-foreground">
          Monitor patent expirations with reason diagnosis (One-Year Provisional Clock, Government Fees, or Legal Paperwork). Click any patent below to see exactly why it is expiring.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {urgencyStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <TrendingDown className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiration Groups */}
      {expiringQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading expiration diagnostics...</span>
          </CardContent>
        </Card>
      ) : patents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <p className="text-lg font-semibold">No Patents Expiring Soon</p>
              <p className="text-sm text-muted-foreground">All patents are in good standing</p>
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
                        <Badge className={`${urgencyColors[group.key]} font-semibold`}>
                          {group.count} patent{group.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.patents.map((patent) => {
                          const expirationDate = new Date(patent.provisionalExpiration);
                          const urgency = getUrgencyLevel(patent.daysUntilExpiration);

                          return (
                            <div
                              key={patent._id}
                              onClick={() => handleOpenPatentModal(patent)}
                              className={`p-4 rounded-xl border ${urgencyColors[urgency]} transition-all cursor-pointer hover:shadow-md hover:scale-[1.006] active:scale-[0.99] group`}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleOpenPatentModal(patent);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors">
                                      {patent.patentName}
                                    </h4>
                                    {renderReasonBadge(patent)}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {patent.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {patent.category}
                                      </Badge>
                                    )}
                                    {patent.applicationNumber && (
                                      <span className="text-muted-foreground font-mono">
                                        #{patent.applicationNumber}
                                      </span>
                                    )}
                                    {patent.filingType && (
                                      <Badge variant="secondary" className="text-xs">
                                        {patent.filingType}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="pt-1 flex items-center gap-1.5 text-xs text-primary font-medium opacity-90 group-hover:opacity-100">
                                    <span>Click to see why it is expiring & take action</span>
                                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>

                                <div className="text-right whitespace-nowrap pl-2">
                                  <div className="flex items-center gap-1.5 justify-end text-sm font-bold">
                                    <Clock className="h-4 w-4" />
                                    <span>{patent.daysUntilExpiration} days left</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Expires: {expirationDate.toLocaleDateString()}
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
      <Card className="bg-muted/30 border-muted">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Patent Expiration Alert Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Automated alerts are dispatched at <strong>180, 120, 90, 60, and 30 days</strong> prior to expiration.
            Click any patent in the list to diagnose whether expiration is driven by the statutory <strong>One-Year Provisional Clock</strong>, <strong>Maintenance/Renewal Fees</strong>, or <strong>Legal Paperwork</strong> deadlines.
          </p>
        </CardContent>
      </Card>

      {/* Detail & Diagnostics Dialog */}
      <Dialog open={!!selectedPatent} onOpenChange={(open) => !open && setSelectedPatent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPatent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <DialogTitle className="text-xl font-bold">
                    {selectedPatent.patentName}
                  </DialogTitle>
                  {renderReasonBadge(selectedPatent)}
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Application #{selectedPatent.applicationNumber || "Pending"} · Category: {selectedPatent.category || "General"} · Type: {selectedPatent.filingType || "Provisional"}
                </DialogDescription>
              </DialogHeader>

              {/* Urgency Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Days Remaining</span>
                  <span className="font-bold text-sm text-destructive flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedPatent.daysUntilExpiration} days
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Filing Date</span>
                  <span className="font-semibold text-foreground">
                    {selectedPatent.filingDate ? new Date(selectedPatent.filingDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Expiration Date</span>
                  <span className="font-semibold text-foreground">
                    {selectedPatent.provisionalExpiration ? new Date(selectedPatent.provisionalExpiration).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Primary Expiration Cause Card */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-primary" /> Why Is It Expiring?
                </h3>

                {/* Dynamic Reason Explanation */}
                {(() => {
                  const reason = selectedPatent.expirationReason || (selectedPatent.filingType === "Provisional" ? "one-year-clock" : "fees");
                  if (reason === "one-year-clock") {
                    return (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>1-Year Provisional Application Clock Expiring</span>
                        </div>
                        <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                          Under 35 U.S.C. 119(e), a provisional patent application is valid for exactly <strong>12 months from filing</strong>.
                          To claim priority to this application, a corresponding <strong>Non-Provisional Patent Application</strong> (or PCT International application) must be filed before the 1-year clock runs out. Once the 12-month statutory clock expires, priority rights are lost forever.
                        </p>
                      </div>
                    );
                  }
                  if (reason === "fees") {
                    return (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          <DollarSign className="h-4 w-4" />
                          <span>Maintenance or Government Renewal Fees Due</span>
                        </div>
                        <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                          The patent office requires payment of statutory maintenance, annuity, or issuance fees to keep this patent in active legal standing. Failure to remit government fees by the designated deadline results in patent abandonment or expiration.
                        </p>
                        <div className="flex items-center gap-4 pt-1 text-xs font-semibold">
                          <span>Fee Status: <strong className="uppercase">{selectedPatent.feeStatus || "Pending"}</strong></span>
                          {Boolean(selectedPatent.feeAmount) && (
                            <span>Amount: <strong>${selectedPatent.feeAmount}</strong></span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (reason === "paperwork") {
                    return (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-sm">
                          <FileText className="h-4 w-4" />
                          <span>Legal Paperwork or Conversion Filing Required</span>
                        </div>
                        <p className="text-xs text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
                          Critical legal paperwork is required by the patent office (such as Inventor Declarations, Power of Attorney, Assignment documents, or Office Action responses).
                        </p>
                        {selectedPatent.paperworkDetails && (
                          <div className="p-2 rounded bg-background/60 text-xs border border-border">
                            <strong>Required items:</strong> {selectedPatent.paperworkDetails}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Administrative Expiration Notice</span>
                      </div>
                      <p className="text-xs text-purple-900/90 dark:text-purple-200/90 leading-relaxed">
                        {selectedPatent.expirationReasonDetail || "This patent is reaching its scheduled expiration deadline. Review docketing records and renewal status."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Edit / Update Expiration Diagnostics Form */}
              <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Update Tracking & Expiration Reason
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Reason Type */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Primary Expiration Reason</label>
                    <Select value={reasonDraft} onValueChange={setReasonDraft}>
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-year-clock">🕒 1-Year Provisional Clock expiring</SelectItem>
                        <SelectItem value="fees">💰 Government / Maintenance Fees due</SelectItem>
                        <SelectItem value="paperwork">📄 Legal Paperwork / Conversion required</SelectItem>
                        <SelectItem value="other">⚙️ Other / Custom expiration notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee Status */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Fee Status</label>
                    <Select value={feeStatusDraft} onValueChange={setFeeStatusDraft}>
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="na">N/A</SelectItem>
                        <SelectItem value="pending">Pending Payment</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fee Amount */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Fee Amount ($ USD)</label>
                    <Input
                      type="number"
                      value={feeAmountDraft}
                      onChange={(e) => setFeeAmountDraft(e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Paperwork Status */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Paperwork Status</label>
                    <Select value={paperworkStatusDraft} onValueChange={setPaperworkStatusDraft}>
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="na">N/A</SelectItem>
                        <SelectItem value="pending">Pending Preparation</SelectItem>
                        <SelectItem value="missing">Missing Documents</SelectItem>
                        <SelectItem value="complete">Complete & Filed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Paperwork Details */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-muted-foreground">Paperwork Requirements / Action Items</label>
                  <Input
                    value={paperworkDetailsDraft}
                    onChange={(e) => setPaperworkDetailsDraft(e.target.value)}
                    placeholder="e.g. Non-Provisional Conversion draft, Inventor declarations, Power of Attorney..."
                    className="h-8 text-xs"
                  />
                </div>

                {/* Additional Notes / Reason Details */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-muted-foreground">Diagnostic Notes & Expiration Details</label>
                  <Textarea
                    value={detailDraft}
                    onChange={(e) => setDetailDraft(e.target.value)}
                    placeholder="Explain specific deadlines, attorney instructions, or filing details..."
                    className="text-xs min-h-[60px]"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleSaveDiagnostics}
                    disabled={savingUpdates}
                    size="sm"
                    className="gap-1.5 h-8 text-xs font-semibold"
                  >
                    {savingUpdates ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Save Expiration Details</span>
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPatent(null)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
