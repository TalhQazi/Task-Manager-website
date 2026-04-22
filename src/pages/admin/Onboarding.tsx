import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Progress } from "@/components/admin/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  X,
  FileText,
  FileImage,
  PenTool,
} from "lucide-react";
import { getAdminOnboardingList, getAdminOnboardingDetails, approveOnboarding, rejectOnboarding } from "@/lib/admin/apiClient";

interface OnboardingData {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  basicInfo: {
    completed: boolean;
    email: string;
    phone: string;
    location: string;
  };
  identityVerification: {
    primaryId: {
      idType: string;
      frontImage: string;
      backImage: string;
      status: "missing" | "submitted" | "verified";
    };
    secondaryId: {
      idType: string;
      image: string;
      status: "missing" | "submitted" | "verified";
    };
  };
  w4Form: {
    file: string;
    status: "missing" | "submitted" | "verified";
  };
  employeeHandbook: {
    acknowledged: boolean;
    signature: string;
    signedAt: string;
    status: "missing" | "submitted" | "verified";
  };
  digitalSignature: {
    signature: string;
    status: "missing" | "submitted" | "verified";
  };
  overallStatus: "not_started" | "in_progress" | "submitted" | "approved" | "rejected";
  progress: number;
  adminReview?: {
    reviewedBy: string;
    reviewedAt: string;
    comments: string;
    rejectionReason: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusClasses = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  submitted: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

const stepStatusClasses = {
  missing: "bg-red-100 text-red-700",
  submitted: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
};

const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [onboardingList, setOnboardingList] = useState<OnboardingData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOnboardingList();
  }, [statusFilter]);

  const loadOnboardingList = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await getAdminOnboardingList(statusFilter === "all" ? undefined : statusFilter);
      setOnboardingList(data.items || []);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load onboarding");
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingDetails = async (id: string) => {
    try {
      const data = await getAdminOnboardingDetails(id);
      setSelectedOnboarding(data.item);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to load details");
    }
  };

  const handleViewDetails = async (onboarding: OnboardingData) => {
    setSelectedOnboarding(onboarding);
    await loadOnboardingDetails(onboarding.id);
    setViewDetailsOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedOnboarding) return;
    try {
      setActionLoading(true);
      await approveOnboarding(selectedOnboarding.id, "");
      await loadOnboardingList();
      await loadOnboardingDetails(selectedOnboarding.id);
      setViewDetailsOpen(false);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedOnboarding) return;
    try {
      setActionLoading(true);
      await rejectOnboarding(selectedOnboarding.id, reason);
      await loadOnboardingList();
      await loadOnboardingDetails(selectedOnboarding.id);
      setViewDetailsOpen(false);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadFile = (base64Data: string, filename: string, mimeType: string) => {
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = filename;
    link.click();
  };

  const summary = {
    total: onboardingList.length,
    not_started: onboardingList.filter((o) => o.overallStatus === "not_started").length,
    in_progress: onboardingList.filter((o) => o.overallStatus === "in_progress").length,
    submitted: onboardingList.filter((o) => o.overallStatus === "submitted").length,
    approved: onboardingList.filter((o) => o.overallStatus === "approved").length,
    rejected: onboardingList.filter((o) => o.overallStatus === "rejected").length,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderStepStatus = (status: string) => {
    const icon = status === "verified" ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
                 status === "submitted" ? <Clock className="h-3 w-3 mr-1" /> :
                 <X className="h-3 w-3 mr-1" />;
    return (
      <Badge className={`${stepStatusClasses[status as keyof typeof stepStatusClasses]} text-xs`} variant="secondary">
        {icon}
        {status}
      </Badge>
    );
  };

  useEffect(() => {
    const viewId = String(searchParams.get("view") || "").trim();
    if (!viewId || viewDetailsOpen) return;
    const match = onboardingList.find((o) => String(o.id) === viewId);
    if (match) {
      handleViewDetails(match);
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next, { replace: true });
    }
  }, [onboardingList, searchParams, setSearchParams, viewDetailsOpen]);

  return (
    <>
      <div className="pl-12 space-y-4 sm:space-y-5 md:space-y-6 pr-2 sm:pr-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Employee Onboarding
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
              Review and approve employee onboarding submissions.
            </p>
          </div>
        </div>

        {apiError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-destructive break-words">{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Submitted</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 sm:border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft border-0 sm:border">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">
              Onboarding Records ({onboardingList.length})
            </CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto rounded-md border px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="text-xs sm:text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-0">
                {onboardingList.map((onboarding) => (
                  <div
                    key={onboarding.id}
                    className="p-4 sm:p-5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent sm:border-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3 sm:flex-1">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                            {getInitials(onboarding.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{onboarding.employeeName}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{onboarding.basicInfo?.email || "No email"}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`${statusClasses[onboarding.overallStatus]} text-xs`} variant="secondary">
                              {statusLabels[onboarding.overallStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto mt-2 sm:mt-0"
                        onClick={() => handleViewDetails(onboarding)}
                      >
                        Review
                      </Button>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{onboarding.progress}%</span>
                      </div>
                      <Progress value={onboarding.progress} className="h-1.5 sm:h-2" />
                    </div>
                  </div>
                ))}
                {onboardingList.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">No onboarding records found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-3xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Onboarding Review</DialogTitle>
          </DialogHeader>

          {selectedOnboarding && (
            <div className="space-y-4 sm:space-y-5">
              <div className="pb-4 border-b">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-base sm:text-xl font-semibold">{selectedOnboarding.employeeName}</p>
                  <Badge className={`${statusClasses[selectedOnboarding.overallStatus]} text-xs sm:text-sm`} variant="secondary">
                    {statusLabels[selectedOnboarding.overallStatus]}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{selectedOnboarding.basicInfo?.email || "No email"}</p>
                <p className="text-xs text-muted-foreground mt-1">Phone: {selectedOnboarding.basicInfo?.phone || "No phone"}</p>
                <p className="text-xs text-muted-foreground">Location: {selectedOnboarding.basicInfo?.location || "No location"}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Onboarding Steps</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Basic Information</span>
                    </div>
                    {renderStepStatus(selectedOnboarding.basicInfo?.completed ? "verified" : "missing")}
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Identity Verification - Primary ID</span>
                      </div>
                      {renderStepStatus(selectedOnboarding.identityVerification?.primaryId?.status || "missing")}
                    </div>
                    {selectedOnboarding.identityVerification?.primaryId?.frontImage && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Front Image:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.identityVerification!.primaryId!.frontImage!, "primary-id-front.png", "image/png")}
                          >
                            Download
                          </Button>
                        </div>
                        <img
                          src={selectedOnboarding.identityVerification.primaryId.frontImage}
                          alt="Primary ID Front"
                          className="max-w-full h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedOnboarding.identityVerification?.primaryId?.backImage && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Back Image:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.identityVerification!.primaryId!.backImage!, "primary-id-back.png", "image/png")}
                          >
                            Download
                          </Button>
                        </div>
                        <img
                          src={selectedOnboarding.identityVerification.primaryId.backImage}
                          alt="Primary ID Back"
                          className="max-w-full h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Identity Verification - Secondary ID</span>
                      </div>
                      {renderStepStatus(selectedOnboarding.identityVerification?.secondaryId?.status || "missing")}
                    </div>
                    {selectedOnboarding.identityVerification?.secondaryId?.image && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Secondary ID Image:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.identityVerification!.secondaryId!.image!, "secondary-id.png", "image/png")}
                          >
                            Download
                          </Button>
                        </div>
                        <img
                          src={selectedOnboarding.identityVerification.secondaryId.image}
                          alt="Secondary ID"
                          className="max-w-full h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">W-4 Tax Form</span>
                      </div>
                      {renderStepStatus(selectedOnboarding.w4Form?.status || "missing")}
                    </div>
                    {selectedOnboarding.w4Form?.file && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">W-4 Form:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.w4Form!.file!, "w4-form.pdf", "application/pdf")}
                          >
                            Download
                          </Button>
                        </div>
                        <a
                          href={selectedOnboarding.w4Form.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View W-4 Form
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Employee Handbook</span>
                      </div>
                      {renderStepStatus(selectedOnboarding.employeeHandbook?.status || "missing")}
                    </div>
                    {selectedOnboarding.employeeHandbook?.signature && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Signature:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.employeeHandbook!.signature!, "handbook-signature.png", "image/png")}
                          >
                            Download
                          </Button>
                        </div>
                        <img
                          src={selectedOnboarding.employeeHandbook.signature}
                          alt="Handbook Signature"
                          className="max-w-full h-24 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Digital Signature</span>
                      </div>
                      {renderStepStatus(selectedOnboarding.digitalSignature?.status || "missing")}
                    </div>
                    {selectedOnboarding.digitalSignature?.signature && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Signature:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6"
                            onClick={() => downloadFile(selectedOnboarding.digitalSignature!.signature!, "digital-signature.png", "image/png")}
                          >
                            Download
                          </Button>
                        </div>
                        <img
                          src={selectedOnboarding.digitalSignature.signature}
                          alt="Digital Signature"
                          className="max-w-full h-24 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOnboarding.adminReview && selectedOnboarding.adminReview.rejectionReason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                  <p className="text-sm text-destructive">{selectedOnboarding.adminReview.rejectionReason}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{selectedOnboarding.progress}%</span>
                </div>
                <Progress value={selectedOnboarding.progress} className="h-1.5 sm:h-2" />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 sm:mt-6 gap-2">
            {selectedOnboarding && (selectedOnboarding.overallStatus === "submitted" || selectedOnboarding.overallStatus === "in_progress") && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason:");
                    if (reason) handleReject(reason);
                  }}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
                <Button
                  className="bg-success hover:bg-success/90"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  Approve
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Onboarding;
