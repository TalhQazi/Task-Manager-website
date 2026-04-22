import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Edit2,
  Camera,
  Lock,
  Bell,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { getEmployeeProfile, employeeApiFetch, updateBankInfo, updateTaxInfo, toProxiedUrl } from "../lib/api";


interface EmployeeProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status?: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  joinDate?: string;
  employeeId?: string;

  bankInfo?: {
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };

  
  taxSettings?: {
    pan?: string;
    tds?: string | number;
    regime?: string;
  };
}

export default function EmployeeProfile() {
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [editedProfile, setEditedProfile] = useState<EmployeeProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bank, setBank] = useState({
  accountName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
});

const [tax, setTax] = useState({
  pan: "",
  tds: "",
  regime: "",
});

const [uploading, setUploading] = useState(false);

  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  // File input refs
  const primaryIdFrontRef = useRef<HTMLInputElement>(null);
  const primaryIdBackRef = useRef<HTMLInputElement>(null);
  const secondaryIdRef = useRef<HTMLInputElement>(null);
  const w4FormRef = useRef<HTMLInputElement>(null);
  const handbookSignatureRef = useRef<HTMLInputElement>(null);
  const digitalSignatureRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [uploadingPrimaryIdFront, setUploadingPrimaryIdFront] = useState(false);
  const [uploadingPrimaryIdBack, setUploadingPrimaryIdBack] = useState(false);
  const [uploadingSecondaryId, setUploadingSecondaryId] = useState(false);
  const [uploadingW4Form, setUploadingW4Form] = useState(false);
  const [uploadingHandbookSignature, setUploadingHandbookSignature] = useState(false);
  const [uploadingDigitalSignature, setUploadingDigitalSignature] = useState(false);

  // Identity verification form state
  const [primaryIdType, setPrimaryIdType] = useState("");
  const [secondaryIdType, setSecondaryIdType] = useState("");

  // Uploaded file data (stored before saving)
  const [primaryIdFrontData, setPrimaryIdFrontData] = useState("");
  const [primaryIdBackData, setPrimaryIdBackData] = useState("");
  const [secondaryIdData, setSecondaryIdData] = useState("");

  // Save loading states
  const [savingPrimaryId, setSavingPrimaryId] = useState(false);
  const [savingSecondaryId, setSavingSecondaryId] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Work information edit state
  const [editingWorkInfo, setEditingWorkInfo] = useState(false);
  const [editedWorkInfo, setEditedWorkInfo] = useState<any>(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  const hasBankInfo =
  !!profile?.bankInfo &&
  (profile.bankInfo.accountNumber ||
    profile.bankInfo.ifsc ||
    profile.bankInfo.bankName);

const hasTaxInfo =
  !!profile?.taxSettings &&
  (profile.taxSettings.pan || profile.taxSettings.tds);


  useEffect(() => {
    loadProfile();
    loadOnboardingData();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getEmployeeProfile();
      console.log("Profile data:", res);
      setProfile(res.item);
      setEditedProfile(res.item);
      setEditedWorkInfo(res.item);
      setBank(res.item.bankInfo || {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    });

    setTax(res.item.taxSettings || {
      pan: "",
      tds: "",
      regime: "",
    });
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    setSaving(true);
    try {
      // Update profile via API
      await employeeApiFetch(`/api/employees/${editedProfile.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editedProfile.name,
          phone: editedProfile.phone,
          location: editedProfile.location,
        }),
      });
      
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully");
      
      // Refresh to get updated data
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Save to settings/avatar
        const res = await employeeApiFetch<{ item?: { avatarUrl?: string; avatarDataUrl?: string } }>("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            avatarDataUrl: base64String,
          }),
        });

        const nextUrl = String(res?.item?.avatarUrl || res?.item?.avatarDataUrl || base64String);
        const proxiedUrl = toProxiedUrl(nextUrl) || nextUrl;
        setEditedProfile({ ...editedProfile!, avatarUrl: proxiedUrl });
        setProfile({ ...profile, avatarUrl: proxiedUrl });
        toast.success("Profile image updated");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
      setUploadingImage(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const loadOnboardingData = async () => {
    try {
      setLoadingOnboarding(true);
      const res = await employeeApiFetch("/api/onboarding/me");
      setOnboardingData(res.item);
      if (res.item) {
        setPrimaryIdType(res.item.identityVerification?.primaryId?.idType || "");
        setSecondaryIdType(res.item.identityVerification?.secondaryId?.idType || "");
        // Set local file data from saved data
        setPrimaryIdFrontData(res.item.identityVerification?.primaryId?.frontImage || "");
        setPrimaryIdBackData(res.item.identityVerification?.primaryId?.backImage || "");
        setSecondaryIdData(res.item.identityVerification?.secondaryId?.image || "");
      }
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        // No onboarding data yet, that's ok
        setOnboardingData(null);
      } else {
        console.error("Failed to load onboarding data:", err);
      }
    } finally {
      setLoadingOnboarding(false);
    }
  };

  const calculateProgress = () => {
    if (!onboardingData) return 0;
    let completed = 0;
    const total = 5; // 5 sections total

    // Basic Information
    if (onboardingData.basicInfo?.completed) completed++;

    // Identity Verification (both primary and secondary must be submitted)
    if (onboardingData.identityVerification?.primaryId?.status === "submitted" ||
        onboardingData.identityVerification?.primaryId?.status === "verified") {
      if (onboardingData.identityVerification?.secondaryId?.status === "submitted" ||
          onboardingData.identityVerification?.secondaryId?.status === "verified") {
        completed++;
      }
    }

    // W-4 Form
    if (onboardingData.w4Form?.status === "submitted" || onboardingData.w4Form?.status === "verified") {
      completed++;
    }

    // Employee Handbook
    if (onboardingData.employeeHandbook?.status === "submitted" || onboardingData.employeeHandbook?.status === "verified") {
      completed++;
    }

    // Digital Signature
    if (onboardingData.digitalSignature?.status === "submitted" || onboardingData.digitalSignature?.status === "verified") {
      completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const handleFileUpload = async (
    file: File,
    setUploading: (loading: boolean) => void,
    setDataFn: (data: string) => void
  ) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setDataFn(base64);
      toast.success("File selected. Click Save to upload.");
    } catch (err: any) {
      toast.error(err.message || "Failed to process file");
    } finally {
      setUploading(false);
    }
  };

  const handlePrimaryIdFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, setUploadingPrimaryIdFront, setPrimaryIdFrontData);
  };

  const handlePrimaryIdBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, setUploadingPrimaryIdBack, setPrimaryIdBackData);
  };

  const handleSecondaryIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, setUploadingSecondaryId, setSecondaryIdData);
  };

  const handleW4FormUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleFileUpload(file, setUploadingW4Form, async (base64) => {
        await employeeApiFetch("/api/onboarding/me/w4", {
          method: "PUT",
          body: JSON.stringify({ file: base64 }),
        });
        toast.success("W-4 form uploaded successfully");
        await loadOnboardingData();
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload W-4 form");
    }
  };

  const handleHandbookSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleFileUpload(file, setUploadingHandbookSignature, async (base64) => {
        await employeeApiFetch("/api/onboarding/me/handbook", {
          method: "PUT",
          body: JSON.stringify({
            acknowledged: true,
            signature: base64,
          }),
        });
        toast.success("Handbook signature uploaded successfully");
        await loadOnboardingData();
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload handbook signature");
    }
  };

  const handleDigitalSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleFileUpload(file, setUploadingDigitalSignature, async (base64) => {
        await employeeApiFetch("/api/onboarding/me/signature", {
          method: "PUT",
          body: JSON.stringify({ signature: base64 }),
        });
        toast.success("Digital signature uploaded successfully");
        await loadOnboardingData();
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload digital signature");
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!editedProfile) return;
    try {
      await employeeApiFetch("/api/onboarding/me/basic-info", {
        method: "PUT",
        body: JSON.stringify({
          email: editedProfile.email,
          phone: editedProfile.phone,
          location: editedProfile.location,
        }),
      });
      toast.success("Basic info saved");
      await loadOnboardingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save basic info");
    }
  };

  const handleSavePrimaryId = async () => {
    if (!primaryIdType) {
      toast.error("Please select an ID type");
      return;
    }
    if (!primaryIdFrontData) {
      toast.error("Please upload the front side of your ID");
      return;
    }
    if (!primaryIdBackData) {
      toast.error("Please upload the back side of your ID");
      return;
    }

    setSavingPrimaryId(true);
    try {
      await employeeApiFetch("/api/onboarding/me/identity", {
        method: "PUT",
        body: JSON.stringify({
          primaryId: {
            idType: primaryIdType,
            frontImage: primaryIdFrontData,
            backImage: primaryIdBackData,
          },
        }),
      });
      toast.success("Primary ID saved successfully");
      await loadOnboardingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save primary ID");
    } finally {
      setSavingPrimaryId(false);
    }
  };

  const handleSaveSecondaryId = async () => {
    if (!secondaryIdType) {
      toast.error("Please select an ID type");
      return;
    }
    if (!secondaryIdData) {
      toast.error("Please upload your secondary ID");
      return;
    }

    setSavingSecondaryId(true);
    try {
      await employeeApiFetch("/api/onboarding/me/identity", {
        method: "PUT",
        body: JSON.stringify({
          secondaryId: {
            idType: secondaryIdType,
            image: secondaryIdData,
          },
        }),
      });
      toast.success("Secondary ID saved successfully");
      await loadOnboardingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save secondary ID");
    } finally {
      setSavingSecondaryId(false);
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      await employeeApiFetch("/api/onboarding/me/submit", { method: "POST" });
      toast.success("Onboarding submitted for review");
      await loadOnboardingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit onboarding");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await employeeApiFetch("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEditWorkInfo = () => {
    setEditedWorkInfo({ ...profile });
    setEditingWorkInfo(true);
  };

  const handleCancelEditWorkInfo = () => {
    setEditedWorkInfo(profile);
    setEditingWorkInfo(false);
  };

  const handleSaveWorkInfo = async () => {
    try {
      const employeeId = profile.id || profile._id;
      if (!employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      await employeeApiFetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify(editedWorkInfo),
      });
      setProfile(editedWorkInfo);
      setEditingWorkInfo(false);
      toast.success("Work information updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update work information");
    }
  };



  const handleSaveNotifications = async () => {
    try {
      await employeeApiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          taskReminders,
        }),
      });
      toast.success("Notification preferences saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#133767]" />
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load profile</p>
            <Button onClick={loadProfile} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden file inputs for onboarding */}
      <input
        type="file"
        ref={primaryIdFrontRef}
        onChange={handlePrimaryIdFrontUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={primaryIdBackRef}
        onChange={handlePrimaryIdBackUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={secondaryIdRef}
        onChange={handleSecondaryIdUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={w4FormRef}
        onChange={handleW4FormUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={handbookSignatureRef}
        onChange={handleHandbookSignatureUpload}
        accept="image/*,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={digitalSignatureRef}
        onChange={handleDigitalSignatureUpload}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-[#133767]/20">
                <AvatarImage src={toProxiedUrl(profile.avatarUrl)} alt={profile.name} crossOrigin="anonymous" />
                <AvatarFallback className="bg-gradient-to-br from-[#133767] to-blue-500 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#133767] text-white rounded-full hover:bg-[#1a4585] transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <Badge className="bg-green-100 text-green-700 w-fit mx-auto md:mx-0">
                  {profile.status || "Active"}
                </Badge>
              </div>
              <p className="text-gray-500 mb-2">{profile.jobTitle || "Employee"}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {profile.company || "SE7EN Inc."}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location || "Not set"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="gap-2 bg-[#133767] hover:bg-[#1a4585]"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="onboarding" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          {/* Overall Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Onboarding Status
              </CardTitle>
              <CardDescription>Complete all steps to unlock full system access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold text-[#133767]">{calculateProgress()}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#133767] rounded-full transition-all duration-500" style={{ width: `${calculateProgress()}%` }} />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    onboardingData?.overallStatus === "approved" ? "bg-green-100" :
                    onboardingData?.overallStatus === "submitted" ? "bg-yellow-100" :
                    onboardingData?.overallStatus === "rejected" ? "bg-red-100" :
                    "bg-gray-100"
                  }`}>
                    {onboardingData?.overallStatus === "approved" ? <CheckCircle2 className="h-6 w-6 text-green-600" /> :
                     onboardingData?.overallStatus === "submitted" ? <Clock className="h-6 w-6 text-yellow-600" /> :
                     onboardingData?.overallStatus === "rejected" ? <X className="h-6 w-6 text-red-600" /> :
                     <X className="h-6 w-6 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-lg capitalize">
                      {onboardingData?.overallStatus === "approved" ? `Onboarding ${calculateProgress()}% and Approved` :
                       onboardingData?.overallStatus === "submitted" ? "Submitted for Admin Approval" :
                       onboardingData?.overallStatus === "rejected" ? "Onboarding Rejected" :
                       "Not Started"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {onboardingData?.overallStatus === "approved" ? "Your onboarding is complete" :
                       onboardingData?.overallStatus === "submitted" ? "Waiting for admin to review your submission" :
                       onboardingData?.overallStatus === "rejected" ? "Please resubmit your onboarding" :
                       "Complete all required steps"}
                    </p>
                  </div>
                </div>
                <Badge className={`${
                  onboardingData?.overallStatus === "approved" ? "bg-green-100 text-green-700" :
                  onboardingData?.overallStatus === "submitted" ? "bg-yellow-100 text-yellow-700" :
                  onboardingData?.overallStatus === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-700"
                } px-4 py-2 text-sm font-semibold`}>
                  {onboardingData?.overallStatus === "approved" ? "Complete" :
                   onboardingData?.overallStatus === "submitted" ? "Pending" :
                   onboardingData?.overallStatus === "rejected" ? "Rejected" :
                   "Incomplete"}
                </Badge>
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Important Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You must complete all onboarding steps and receive admin approval before you can check in to work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  onboardingData?.basicInfo?.completed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>1</div>
                Basic Information
              </CardTitle>
              <CardDescription>Your personal contact details</CardDescription>
              {onboardingData?.basicInfo?.completed && (
                <Badge className="bg-green-100 text-green-700">Completed</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={editedProfile.name || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={editedProfile.phone || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, phone: e.target.value })
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={editedProfile.location || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, location: e.target.value })
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                {!onboardingData?.basicInfo?.completed && (
                  <Button onClick={handleSaveBasicInfo} className="bg-[#133767] hover:bg-[#1a4585]">
                    <Save className="h-4 w-4 mr-2" />
                    Save for Onboarding
                  </Button>
                )}
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                    <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#133767] hover:bg-[#1a4585]">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#133767] hover:bg-[#1a4585]">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Information
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">2</div>
                Work Information
              </CardTitle>
              <CardDescription>Your employment and work details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    Job Title
                  </Label>
                  <Input
                    value={editedWorkInfo?.jobTitle || ""}
                    onChange={(e) => setEditedWorkInfo({ ...editedWorkInfo, jobTitle: e.target.value })}
                    disabled={!editingWorkInfo}
                    className={!editingWorkInfo ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Department
                  </Label>
                  <Input
                    value={editedWorkInfo?.department || ""}
                    onChange={(e) => setEditedWorkInfo({ ...editedWorkInfo, department: e.target.value })}
                    disabled={!editingWorkInfo}
                    className={!editingWorkInfo ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Join Date
                  </Label>
                  <Input
                    value={editedWorkInfo?.joinDate || ""}
                    onChange={(e) => setEditedWorkInfo({ ...editedWorkInfo, joinDate: e.target.value })}
                    disabled={!editingWorkInfo}
                    className={!editingWorkInfo ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Employee ID
                  </Label>
                  <Input
                    value={editedWorkInfo?.employeeId || editedWorkInfo?.id || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                {editingWorkInfo ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEditWorkInfo}>Cancel</Button>
                    <Button onClick={handleSaveWorkInfo} disabled={saving} className="bg-[#133767] hover:bg-[#1a4585]">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleEditWorkInfo} className="bg-[#133767] hover:bg-[#1a4585]">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Information
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Identity Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  onboardingData?.identityVerification?.primaryId?.status === "verified" &&
                  onboardingData?.identityVerification?.secondaryId?.status === "verified"
                    ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>3</div>
                Identity Verification
              </CardTitle>
              <CardDescription>Upload 2 different government IDs (Required)</CardDescription>
              {onboardingData?.identityVerification?.primaryId?.status === "verified" &&
               onboardingData?.identityVerification?.secondaryId?.status === "verified" && (
                <Badge className="bg-green-100 text-green-700">Verified</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ID #1 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Primary ID</p>
                    <p className="text-sm text-gray-500">Driver License or Passport</p>
                  </div>
                  <Badge className={`${
                    onboardingData?.identityVerification?.primaryId?.status === "verified" ? "bg-green-100 text-green-700" :
                    onboardingData?.identityVerification?.primaryId?.status === "submitted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {onboardingData?.identityVerification?.primaryId?.status === "verified" ? "Verified" :
                     onboardingData?.identityVerification?.primaryId?.status === "submitted" ? "Submitted" :
                     "Missing"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={primaryIdType}
                    onChange={(e) => setPrimaryIdType(e.target.value)}
                  >
                    <option value="">Select ID Type</option>
                    <option value="driver_license">Driver License</option>
                    <option value="passport">Passport</option>
                  </select>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => primaryIdFrontRef.current?.click()}
                      disabled={uploadingPrimaryIdFront}
                    >
                      {uploadingPrimaryIdFront ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {primaryIdFrontData || onboardingData?.identityVerification?.primaryId?.frontImage ? "Replace Front" : "Upload Front"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => primaryIdBackRef.current?.click()}
                      disabled={uploadingPrimaryIdBack}
                    >
                      {uploadingPrimaryIdBack ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {primaryIdBackData || onboardingData?.identityVerification?.primaryId?.backImage ? "Replace Back" : "Upload Back"}
                    </Button>
                  </div>
                  {(primaryIdFrontData || onboardingData?.identityVerification?.primaryId?.frontImage) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Front Image:</p>
                      <img
                        src={primaryIdFrontData || onboardingData.identityVerification.primaryId.frontImage}
                        alt="Primary ID Front"
                        className="h-24 w-auto rounded border object-cover"
                      />
                    </div>
                  )}
                  {(primaryIdBackData || onboardingData?.identityVerification?.primaryId?.backImage) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Back Image:</p>
                      <img
                        src={primaryIdBackData || onboardingData.identityVerification.primaryId.backImage}
                        alt="Primary ID Back"
                        className="h-24 w-auto rounded border object-cover"
                      />
                    </div>
                  )}
                  <Button
                    className="w-full bg-[#133767] hover:bg-[#1a4585]"
                    onClick={handleSavePrimaryId}
                    disabled={savingPrimaryId}
                  >
                    {savingPrimaryId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Primary ID
                  </Button>
                </div>
              </div>

              {/* ID #2 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Secondary ID</p>
                    <p className="text-sm text-gray-500">Social Security Card or Secondary ID</p>
                  </div>
                  <Badge className={`${
                    onboardingData?.identityVerification?.secondaryId?.status === "verified" ? "bg-green-100 text-green-700" :
                    onboardingData?.identityVerification?.secondaryId?.status === "submitted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {onboardingData?.identityVerification?.secondaryId?.status === "verified" ? "Verified" :
                     onboardingData?.identityVerification?.secondaryId?.status === "submitted" ? "Submitted" :
                     "Missing"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={secondaryIdType}
                    onChange={(e) => setSecondaryIdType(e.target.value)}
                  >
                    <option value="">Select ID Type</option>
                    <option value="ss_card">Social Security Card</option>
                    <option value="other">Other ID</option>
                  </select>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => secondaryIdRef.current?.click()}
                    disabled={uploadingSecondaryId}
                  >
                    {uploadingSecondaryId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {secondaryIdData || onboardingData?.identityVerification?.secondaryId?.image ? "Replace ID" : "Upload ID"}
                  </Button>
                  {(secondaryIdData || onboardingData?.identityVerification?.secondaryId?.image) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Secondary ID Image:</p>
                      <img
                        src={secondaryIdData || onboardingData.identityVerification.secondaryId.image}
                        alt="Secondary ID"
                        className="h-24 w-auto rounded border object-cover"
                      />
                    </div>
                  )}
                  <Button
                    className="w-full bg-[#133767] hover:bg-[#1a4585]"
                    onClick={handleSaveSecondaryId}
                    disabled={savingSecondaryId}
                  >
                    {savingSecondaryId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Secondary ID
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500">Allowed formats: JPG, PNG, PDF (Max 10MB)</p>
            </CardContent>
          </Card>

          {/* Step 4: W-4 Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  onboardingData?.w4Form?.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>4</div>
                W-4 Tax Form
              </CardTitle>
              <CardDescription>Complete your tax withholding information</CardDescription>
              {onboardingData?.w4Form?.status === "verified" && (
                <Badge className="bg-green-100 text-green-700">Verified</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className={`${
                    onboardingData?.w4Form?.status === "verified" ? "bg-green-100 text-green-700" :
                    onboardingData?.w4Form?.status === "submitted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {onboardingData?.w4Form?.status === "verified" ? "Verified" :
                     onboardingData?.w4Form?.status === "submitted" ? "Submitted" :
                     "Missing"}
                  </Badge>
                  <span className="text-sm">W-4 Form</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => w4FormRef.current?.click()}
                  disabled={uploadingW4Form}
                >
                  {uploadingW4Form ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {onboardingData?.w4Form?.file ? "Replace Form" : "Upload Form"}
                </Button>
              </div>
              {onboardingData?.w4Form?.file && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">W-4 Form uploaded</p>
                  {onboardingData.w4Form.file.startsWith("data:image") && (
                    <img
                      src={onboardingData.w4Form.file}
                      alt="W-4 Form"
                      className="h-24 w-auto rounded border object-cover"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 5: Employee Handbook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  onboardingData?.employeeHandbook?.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>5</div>
                Employee Handbook
              </CardTitle>
              <CardDescription>Read and acknowledge the employee handbook</CardDescription>
              {onboardingData?.employeeHandbook?.status === "verified" && (
                <Badge className="bg-green-100 text-green-700">Verified</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className={`${
                    onboardingData?.employeeHandbook?.status === "verified" ? "bg-green-100 text-green-700" :
                    onboardingData?.employeeHandbook?.status === "submitted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {onboardingData?.employeeHandbook?.status === "verified" ? "Verified" :
                     onboardingData?.employeeHandbook?.status === "submitted" ? "Submitted" :
                     "Missing"}
                  </Badge>
                  <span className="text-sm">Handbook Acknowledgment</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handbookSignatureRef.current?.click()}
                  disabled={uploadingHandbookSignature}
                >
                  {uploadingHandbookSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {onboardingData?.employeeHandbook?.signature ? "Replace Signature" : "Upload Signature"}
                </Button>
              </div>
              {onboardingData?.employeeHandbook?.signature && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Signature uploaded</p>
                  {onboardingData.employeeHandbook.signature.startsWith("data:image") && (
                    <img
                      src={onboardingData.employeeHandbook.signature}
                      alt="Handbook Signature"
                      className="h-24 w-auto rounded border object-cover"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 6: Digital Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  onboardingData?.digitalSignature?.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>6</div>
                Digital Signature
              </CardTitle>
              <CardDescription>Add your digital signature for official documents</CardDescription>
              {onboardingData?.digitalSignature?.status === "verified" && (
                <Badge className="bg-green-100 text-green-700">Verified</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500 mb-2">Upload your signature image</p>
                <p className="text-xs text-gray-400">Allowed formats: JPG, PNG (Max 10MB)</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => digitalSignatureRef.current?.click()}
                  disabled={uploadingDigitalSignature}
                >
                  {uploadingDigitalSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {onboardingData?.digitalSignature?.signature ? "Replace Signature" : "Upload Signature"}
                </Button>
              </div>
              {onboardingData?.digitalSignature?.signature && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Signature uploaded:</p>
                  <img
                    src={onboardingData.digitalSignature.signature}
                    alt="Digital Signature"
                    className="h-24 w-auto rounded border object-contain bg-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 7: Review & Submit */}
          <Card className="border-2 border-[#133767]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-700">7</div>
                Review & Submit
              </CardTitle>
              <CardDescription>Review all information and submit for admin approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {onboardingData?.basicInfo?.completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>Basic Information - {onboardingData?.basicInfo?.completed ? "Completed" : "Not completed"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profile?.jobTitle && profile?.department ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>Work Information - {profile?.jobTitle && profile?.department ? "Completed" : "Not completed"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {onboardingData?.identityVerification?.primaryId?.status === "submitted" && onboardingData?.identityVerification?.secondaryId?.status === "submitted" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>Identity Verification - {onboardingData?.identityVerification?.primaryId?.status === "submitted" && onboardingData?.identityVerification?.secondaryId?.status === "submitted" ? "Completed" : "Not completed"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {onboardingData?.w4Form?.status === "submitted" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>W-4 Form - {onboardingData?.w4Form?.status === "submitted" ? "Completed" : "Not completed"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {onboardingData?.employeeHandbook?.status === "submitted" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>Employee Handbook - {onboardingData?.employeeHandbook?.status === "submitted" ? "Completed" : "Not completed"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {onboardingData?.digitalSignature?.status === "submitted" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                  <span>Digital Signature - {onboardingData?.digitalSignature?.status === "submitted" ? "Completed" : "Not completed"}</span>
                </div>
              </div>
              <Button
                className="w-full bg-[#133767] hover:bg-[#1a4585]"
                disabled={
                  !onboardingData?.basicInfo?.completed ||
                  !onboardingData?.identityVerification?.primaryId?.status === "submitted" ||
                  !onboardingData?.identityVerification?.secondaryId?.status === "submitted" ||
                  !onboardingData?.w4Form?.status === "submitted" ||
                  !onboardingData?.employeeHandbook?.status === "submitted" ||
                  !onboardingData?.digitalSignature?.status === "submitted" ||
                  onboardingData?.overallStatus === "submitted" ||
                  onboardingData?.overallStatus === "approved"
                }
                onClick={handleSubmitOnboarding}
              >
                {onboardingData?.overallStatus === "submitted" ? "Submitted for Review" :
                 onboardingData?.overallStatus === "approved" ? "Already Approved" :
                 "Submit for Admin Approval"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
 <Separator />
            {/* Bank Information */}       
          <Card>
              <CardHeader>
                <CardTitle>Bank Information</CardTitle>
                <CardDescription>Secure payment details</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Input
  placeholder="Account Holder Name"
  value={bank.accountName}
  onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
/>

<Input
  placeholder="Account Number"
  value={bank.accountNumber}
  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
/>

<Input
  placeholder="IFSC Code"
  value={bank.ifsc}
  onChange={(e) => setBank({ ...bank, ifsc: e.target.value })}
/>

<Input
  placeholder="Bank Name"
  value={bank.bankName}
  onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
/>
               <Button
  className="bg-[#133767] hover:bg-[#1a4585]"
  onClick={async () => {
    await updateBankInfo({ bankInfo: bank });
    toast.success("Bank info updated");
  }}
>
 {hasBankInfo ? "Update Bank Info" : "Add Bank Info"}
</Button>
              </CardContent>
          </Card>

          <Separator />

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taskReminders">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming tasks
                  </p>
                </div>
                <Switch
                  id="taskReminders"
                  checked={taskReminders}
                  onCheckedChange={setTaskReminders}
                />
              </div>
              <Button
                onClick={handleSaveNotifications}
                className="bg-[#133767] hover:bg-[#1a4585]"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
