import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Save,
  Camera,
  Edit2,
  X,
  Upload
} from "lucide-react";

type SettingsItem = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type MeItem = {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
};

export default function Profile() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "personal";
  const [activeTab, setActiveTab] = useState(initialTab);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      return apiFetch<{ item: MeItem }>("/api/auth/me");
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return apiFetch<{ item: SettingsItem }>("/api/settings");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SettingsItem) => {
      return apiFetch<{ item: any }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      return apiFetch<{ ok: true }>("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  });

  const [draft, setDraft] = useState<SettingsItem | null>(null);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  // File input refs
  const primaryIdFrontRef = useRef<HTMLInputElement>(null);
  const primaryIdBackRef = useRef<HTMLInputElement>(null);
  const secondaryIdRef = useRef<HTMLInputElement>(null);
  const w4FormRef = useRef<HTMLInputElement>(null);
  const handbookSignatureRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [uploadingPrimaryIdFront, setUploadingPrimaryIdFront] = useState(false);
  const [uploadingPrimaryIdBack, setUploadingPrimaryIdBack] = useState(false);
  const [uploadingSecondaryId, setUploadingSecondaryId] = useState(false);
  const [uploadingW4Form, setUploadingW4Form] = useState(false);
  const [uploadingHandbookSignature, setUploadingHandbookSignature] = useState(false);

  // Identity verification form state
  const [secondaryIdType, setSecondaryIdType] = useState("");

  // Onboarding form data
  const [onboardingForm, setOnboardingForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    idType: "",
    idNumber: "",
    ssn: "",
    taxFilingStatus: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
  });

  const loadOnboardingData = async () => {
    setLoadingOnboarding(true);
    try {
      const res = await apiFetch<{ item: any }>("/api/onboarding/me");
      setOnboardingData(res.item);
      if (res.item) {
        setOnboardingForm({
          firstName: res.item.personalInfo?.firstName || "",
          lastName: res.item.personalInfo?.lastName || "",
          phone: res.item.personalInfo?.phone || "",
          address: res.item.personalInfo?.address || "",
          city: res.item.personalInfo?.city || "",
          state: res.item.personalInfo?.state || "",
          zip: res.item.personalInfo?.zip || "",
          country: res.item.personalInfo?.country || "",
          idType: res.item.identityVerification?.idType || "",
          idNumber: res.item.identityVerification?.idNumber || "",
          ssn: res.item.taxInfo?.ssn || "",
          taxFilingStatus: res.item.taxInfo?.taxFilingStatus || "",
          bankName: res.item.bankInfo?.bankName || "",
          accountNumber: res.item.bankInfo?.accountNumber || "",
          routingNumber: res.item.bankInfo?.routingNumber || "",
        });
        setSecondaryIdType(res.item.identityVerification?.secondaryIdType || "");
      }
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (
    file: File | null,
    setUploading: (val: boolean) => void,
    field: string
  ) => {
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      
      if (field === "idFrontUrl" || field === "idBackUrl") {
        setOnboardingData((prev: any) => ({
          ...prev,
          identityVerification: {
            ...prev?.identityVerification,
            [field]: base64,
          },
        }));
      } else if (field === "secondaryIdUrl") {
        setOnboardingData((prev: any) => ({
          ...prev,
          identityVerification: {
            ...prev?.identityVerification,
            secondaryIdUrl: base64,
          },
        }));
      } else if (field === "w4FormUrl" || field === "handbookSignatureUrl") {
        setOnboardingData((prev: any) => ({
          ...prev,
          documents: {
            ...prev?.documents,
            [field]: base64,
          },
        }));
      } else {
        setOnboardingData((prev: any) => ({
          ...prev,
          [field]: base64,
        }));
      }
      
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitOnboarding = async () => {
    setSubmittingOnboarding(true);
    try {
      const payload = {
        personalInfo: {
          firstName: onboardingForm.firstName,
          lastName: onboardingForm.lastName,
          phone: onboardingForm.phone,
          address: onboardingForm.address,
          city: onboardingForm.city,
          state: onboardingForm.state,
          zip: onboardingForm.zip,
          country: onboardingForm.country,
        },
        identityVerification: {
          idType: onboardingForm.idType,
          idNumber: onboardingForm.idNumber,
          idFrontUrl: onboardingData?.identityVerification?.idFrontUrl,
          idBackUrl: onboardingData?.identityVerification?.idBackUrl,
          secondaryIdType: secondaryIdType,
          secondaryIdUrl: onboardingData?.identityVerification?.secondaryIdUrl,
        },
        taxInfo: {
          ssn: onboardingForm.ssn,
          taxFilingStatus: onboardingForm.taxFilingStatus,
        },
        bankInfo: {
          bankName: onboardingForm.bankName,
          accountNumber: onboardingForm.accountNumber,
          routingNumber: onboardingForm.routingNumber,
        },
        documents: {
          w4FormUrl: onboardingData?.documents?.w4FormUrl,
          handbookSignatureUrl: onboardingData?.documents?.handbookSignatureUrl,
        },
      };

      await apiFetch("/api/onboarding/me", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Onboarding submitted successfully");
      loadOnboardingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit onboarding");
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  const getOnboardingProgress = () => {
    if (!onboardingData) return 0;
    let completed = 0;
    const total = 5;
    
    if (onboardingData.personalInfo?.firstName) completed++;
    if (onboardingData.identityVerification?.idType) completed++;
    if (onboardingData.taxInfo?.ssn) completed++;
    if (onboardingData.bankInfo?.bankName) completed++;
    if (onboardingData.documents?.w4FormUrl) completed++;
    
    return Math.round((completed / total) * 100);
  };

  useEffect(() => {
    if (settingsQuery.data?.item) {
      setDraft(settingsQuery.data.item);
    }
  }, [settingsQuery.data]);

  const onSave = () => {
    if (!draft) return;
    saveMutation.mutate({
      fullName: draft.fullName || "",
      email: draft.email || "",
      phone: draft.phone || "",
      role: draft.role || "",
    });
  };

  const onChangePassword = () => {
    const currentPassword = passwordDraft.currentPassword;
    const newPassword = passwordDraft.newPassword;
    const confirmNewPassword = passwordDraft.confirmNewPassword;

    if (!currentPassword || !newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setPasswordError(null);
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordDraft({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        },
        onError: (e) => {
          setPasswordError(e instanceof Error ? e.message : "Failed to change password");
        },
      }
    );
  };

  const me = meQuery.data?.item;
  const roleLabel = String(me?.role || draft?.role || "").trim();

  useEffect(() => {
    if (roleLabel === "admin") {
      loadOnboardingData();
    }
  }, [roleLabel]);

  const renderPersonalTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Account</CardTitle>
            <div className="flex items-center gap-2">
              {roleLabel ? (
                <Badge variant="secondary" className="text-xs">
                  {roleLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">Username</label>
            <Input
              value={String(me?.username || "")}
              disabled
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">Full Name</label>
            <Input
              value={String(draft?.fullName || "")}
              onChange={(e) => setDraft((p) => ({ ...(p || {}), fullName: e.target.value }))}
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">Email</label>
            <Input
              type="email"
              value={String(draft?.email || me?.email || "")}
              onChange={(e) => setDraft((p) => ({ ...(p || {}), email: e.target.value }))}
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">Phone</label>
            <Input
              value={String(draft?.phone || "")}
              onChange={(e) => setDraft((p) => ({ ...(p || {}), phone: e.target.value }))}
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onSave}
              disabled={saveMutation.isPending || !draft}
              className="h-9 sm:h-10 text-sm sm:text-base"
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
          <div className="rounded-md border p-3 sm:p-4 space-y-3">
            <p className="text-sm sm:text-base font-medium">Change Password</p>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwordDraft.currentPassword}
                onChange={(e) => setPasswordDraft((p) => ({ ...p, currentPassword: e.target.value }))}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={passwordDraft.newPassword}
                  onChange={(e) => setPasswordDraft((p) => ({ ...p, newPassword: e.target.value }))}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordDraft.confirmNewPassword}
                  onChange={(e) => setPasswordDraft((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </div>

            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-2">
                <p className="text-xs sm:text-sm text-destructive break-words">{passwordError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={onChangePassword}
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordDraft.currentPassword ||
                  !passwordDraft.newPassword ||
                  !passwordDraft.confirmNewPassword
                }
                className="h-9 sm:h-10 text-sm sm:text-base"
              >
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Manage your account information.
          </p>
        </div>

        {roleLabel === "admin" ? (
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchParams({ tab: v }, { replace: true }); }} className="space-y-4 sm:space-y-6 w-full">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal Information</TabsTrigger>
              <TabsTrigger value="onboarding" className="text-xs sm:text-sm">Onboarding</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 sm:space-y-6 w-full">
              {renderPersonalTab()}
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-4 sm:space-y-6 w-full">
              <Card className="border-0 sm:border shadow-none sm:shadow">
                <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Onboarding Status</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Complete your onboarding to get started</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                  {loadingOnboarding ? (
                    <p className="text-sm text-muted-foreground">Loading onboarding status...</p>
                  ) : (
                    <>
                      {onboardingData && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            {onboardingData.overallStatus === "approved" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm sm:text-base">
                              Status:{" "}
                              <Badge
                                variant={
                                  onboardingData.overallStatus === "approved"
                                    ? "default"
                                    : onboardingData.overallStatus === "submitted"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs sm:text-sm"
                              >
                                {onboardingData.overallStatus}
                              </Badge>
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Progress: {getOnboardingProgress()}%
                          </div>
                        </div>
                      )}

                      {onboardingData?.overallStatus !== "approved" && (
                        <>
                          <div className="space-y-3 sm:space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">Personal Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">First Name *</label>
                                <Input
                                  value={onboardingForm.firstName}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, firstName: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Last Name *</label>
                                <Input
                                  value={onboardingForm.lastName}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, lastName: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Phone *</label>
                                <Input
                                  value={onboardingForm.phone}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Address *</label>
                                <Input
                                  value={onboardingForm.address}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, address: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">City *</label>
                                <Input
                                  value={onboardingForm.city}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, city: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">State *</label>
                                <Input
                                  value={onboardingForm.state}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, state: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">ZIP *</label>
                                <Input
                                  value={onboardingForm.zip}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, zip: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Country *</label>
                                <Input
                                  value={onboardingForm.country}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, country: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">Identity Verification</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">ID Type *</label>
                                <select
                                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-background h-8 sm:h-10"
                                  value={onboardingForm.idType}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, idType: e.target.value })}
                                >
                                  <option value="">Select ID Type</option>
                                  <option value="passport">Passport</option>
                                  <option value="drivers_license">Driver's License</option>
                                  <option value="national_id">National ID</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">ID Number *</label>
                                <Input
                                  value={onboardingForm.idNumber}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, idNumber: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">ID Front *</label>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    ref={primaryIdFrontRef}
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingPrimaryIdFront, "idFrontUrl")}
                                    disabled={uploadingPrimaryIdFront}
                                    className="text-xs sm:text-sm h-8 sm:h-10"
                                  />
                                  {onboardingData?.identityVerification?.idFrontUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) w.document.write(`<img src="${onboardingData.identityVerification.idFrontUrl}" />`);
                                      }}
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">ID Back</label>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    ref={primaryIdBackRef}
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingPrimaryIdBack, "idBackUrl")}
                                    disabled={uploadingPrimaryIdBack}
                                    className="text-xs sm:text-sm h-8 sm:h-10"
                                  />
                                  {onboardingData?.identityVerification?.idBackUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) w.document.write(`<img src="${onboardingData.identityVerification.idBackUrl}" />`);
                                      }}
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Secondary ID Type *</label>
                                <select
                                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-background h-8 sm:h-10"
                                  value={secondaryIdType}
                                  onChange={(e) => setSecondaryIdType(e.target.value)}
                                >
                                  <option value="">Select ID Type</option>
                                  <option value="ss_card">Social Security Card</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Secondary ID *</label>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    ref={secondaryIdRef}
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingSecondaryId, "secondaryIdUrl")}
                                    disabled={uploadingSecondaryId}
                                    className="text-xs sm:text-sm h-8 sm:h-10"
                                  />
                                  {onboardingData?.identityVerification?.secondaryIdUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) w.document.write(`<img src="${onboardingData.identityVerification.secondaryIdUrl}" />`);
                                      }}
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">Tax Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">SSN *</label>
                                <Input
                                  type="password"
                                  value={onboardingForm.ssn}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, ssn: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Tax Filing Status *</label>
                                <select
                                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-background h-8 sm:h-10"
                                  value={onboardingForm.taxFilingStatus}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, taxFilingStatus: e.target.value })}
                                >
                                  <option value="">Select Status</option>
                                  <option value="single">Single</option>
                                  <option value="married_joint">Married Filing Jointly</option>
                                  <option value="married_separate">Married Filing Separately</option>
                                  <option value="head_of_household">Head of Household</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">Bank Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Bank Name *</label>
                                <Input
                                  value={onboardingForm.bankName}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, bankName: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Account Number *</label>
                                <Input
                                  type="password"
                                  value={onboardingForm.accountNumber}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, accountNumber: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Routing Number *</label>
                                <Input
                                  value={onboardingForm.routingNumber}
                                  onChange={(e) => setOnboardingForm({ ...onboardingForm, routingNumber: e.target.value })}
                                  className="text-xs sm:text-sm h-8 sm:h-10"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg">Documents</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">W-4 Form *</label>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    ref={w4FormRef}
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingW4Form, "w4FormUrl")}
                                    disabled={uploadingW4Form}
                                    className="text-xs sm:text-sm h-8 sm:h-10"
                                  />
                                  {onboardingData?.documents?.w4FormUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) w.document.write(`<iframe src="${onboardingData.documents.w4FormUrl}" style="width:100%;height:100%;" />`);
                                      }}
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium">Handbook Signature *</label>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    ref={handbookSignatureRef}
                                    onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingHandbookSignature, "handbookSignatureUrl")}
                                    disabled={uploadingHandbookSignature}
                                    className="text-xs sm:text-sm h-8 sm:h-10"
                                  />
                                  {onboardingData?.documents?.handbookSignatureUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) w.document.write(`<img src="${onboardingData.documents.handbookSignatureUrl}" />`);
                                      }}
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={handleSubmitOnboarding}
                            disabled={submittingOnboarding}
                            className="w-full text-xs sm:text-sm h-8 sm:h-10"
                          >
                            {submittingOnboarding 
                              ? "Submitting..." 
                              : onboardingData?.overallStatus === "submitted"
                              ? "Resubmit Onboarding"
                              : onboardingData?.overallStatus === "rejected"
                              ? "Resubmit Onboarding"
                              : "Submit Onboarding"}
                          </Button>
                        </>
                      )}

                      {onboardingData?.overallStatus === "approved" && (
                        <div className="flex items-start sm:items-center gap-2 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                          <p className="text-xs sm:text-sm text-green-700">Your onboarding has been approved. You can now clock in.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          renderPersonalTab()
        )}
      </div>
    </>
  );
}
