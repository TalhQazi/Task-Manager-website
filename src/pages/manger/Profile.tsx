import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/manger/ui/card";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Label } from "@/components/manger/ui/label";
import { Badge } from "@/components/manger/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manger/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/manger/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Edit2,
  Camera,
  Save,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/manger/api";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status?: string;
  avatarUrl?: string;
  role?: string;
}

interface OnboardingData {
  id?: string;
  overallStatus: "not_started" | "in_progress" | "submitted" | "approved" | "rejected";
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  identityVerification?: {
    idType?: string;
    idNumber?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    secondaryIdType?: string;
    secondaryIdUrl?: string;
  };
  taxInfo?: {
    ssn?: string;
    taxFilingStatus?: string;
  };
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  documents?: {
    w4FormUrl?: string;
    handbookSignatureUrl?: string;
  };
}

export default function Profile() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
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

  useEffect(() => {
    loadProfile();
    loadOnboardingData();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiFetch<{ item: ProfileData }>("/api/employees/me");
      setProfile(res.item);
      setEditedProfile(res.item);
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingData = async () => {
    setLoadingOnboarding(true);
    try {
      const res = await apiFetch<{ item: OnboardingData }>("/api/onboarding/me");
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

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    setSaving(true);
    try {
      await apiFetch(`/api/employees/${editedProfile.id}`, {
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await apiFetch("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            avatarDataUrl: base64String,
          }),
        });

        setEditedProfile({ ...editedProfile!, avatarUrl: base64String });
        setProfile({ ...profile, avatarUrl: base64String });
        await queryClient.invalidateQueries({ queryKey: ["settings"] });
        window.dispatchEvent(new CustomEvent("header-settings-updated"));
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

  const handleFileUpload = async (
    file: File | null,
    setUploading: (val: boolean) => void,
    field: string
  ) => {
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      
      // Save in the correct nested structure
      if (field === "idFrontUrl" || field === "idBackUrl") {
        setOnboardingData((prev) => ({
          ...prev,
          identityVerification: {
            ...prev?.identityVerification,
            [field]: base64,
          },
        }));
      } else if (field === "secondaryIdUrl") {
        setOnboardingData((prev) => ({
          ...prev,
          identityVerification: {
            ...prev?.identityVerification,
            secondaryIdUrl: base64,
          },
        }));
      } else if (field === "w4FormUrl" || field === "handbookSignatureUrl") {
        setOnboardingData((prev) => ({
          ...prev,
          documents: {
            ...prev?.documents,
            [field]: base64,
          },
        }));
      } else {
        setOnboardingData((prev) => ({
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 p-6 text-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Profile</h1>
      </div>

      <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6 w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="personal" className="text-xs sm:text-sm md:text-base">Personal Information</TabsTrigger>
          <TabsTrigger value="onboarding" className="text-xs sm:text-sm md:text-base">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 sm:space-y-6 w-full">
          <Card className="border-0 sm:border shadow-none sm:shadow">
            <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-lg sm:text-xl">
                <span>Profile Information</span>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full sm:w-auto text-xs sm:text-sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} className="w-full sm:w-auto text-xs sm:text-sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto text-xs sm:text-sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
                    <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{profile?.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{profile?.email}</p>
                  <Badge variant="outline" className="mt-2 text-xs sm:text-sm">{profile?.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Name</Label>
                  <Input
                    value={isEditing ? editedProfile?.name : profile?.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile!, name: e.target.value })}
                    disabled={!isEditing}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Email</Label>
                  <Input value={profile?.email} disabled className="text-xs sm:text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Phone</Label>
                  <Input
                    value={isEditing ? editedProfile?.phone : profile?.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile!, phone: e.target.value })}
                    disabled={!isEditing}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Location</Label>
                  <Input
                    value={isEditing ? editedProfile?.location : profile?.location}
                    onChange={(e) => setEditedProfile({ ...editedProfile!, location: e.target.value })}
                    disabled={!isEditing}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4 sm:space-y-6 w-full">
          <Card className="border-0 sm:border shadow-none sm:shadow">
            <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">Onboarding Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">Complete your onboarding to get started</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {onboardingData && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
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
                        <Label className="text-xs sm:text-sm">First Name *</Label>
                        <Input
                          value={onboardingForm.firstName}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, firstName: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Last Name *</Label>
                        <Input
                          value={onboardingForm.lastName}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, lastName: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Phone *</Label>
                        <Input
                          value={onboardingForm.phone}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Address *</Label>
                        <Input
                          value={onboardingForm.address}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, address: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">City *</Label>
                        <Input
                          value={onboardingForm.city}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, city: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">State *</Label>
                        <Input
                          value={onboardingForm.state}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, state: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">ZIP *</Label>
                        <Input
                          value={onboardingForm.zip}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, zip: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Country *</Label>
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
                        <Label className="text-xs sm:text-sm">ID Type *</Label>
                        <select
                          className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-white h-8 sm:h-10"
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
                        <Label className="text-xs sm:text-sm">ID Number *</Label>
                        <Input
                          value={onboardingForm.idNumber}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, idNumber: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">ID Front *</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            ref={primaryIdFrontRef}
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingPrimaryIdFront, "idFrontUrl")}
                            disabled={uploadingPrimaryIdFront}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                          {onboardingData?.identityVerification?.idFrontUrl && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">View</Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">ID Back</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            ref={primaryIdBackRef}
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingPrimaryIdBack, "idBackUrl")}
                            disabled={uploadingPrimaryIdBack}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                          {onboardingData?.identityVerification?.idBackUrl && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">View</Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Secondary ID Type *</Label>
                        <select
                          className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-white h-8 sm:h-10"
                          value={secondaryIdType}
                          onChange={(e) => setSecondaryIdType(e.target.value)}
                        >
                          <option value="">Select ID Type</option>
                          <option value="ss_card">Social Security Card</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Secondary ID *</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            ref={secondaryIdRef}
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingSecondaryId, "secondaryIdUrl")}
                            disabled={uploadingSecondaryId}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                          {onboardingData?.identityVerification?.secondaryIdUrl && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">View</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg">Tax Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">SSN *</Label>
                        <Input
                          type="password"
                          value={onboardingForm.ssn}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, ssn: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Tax Filing Status *</Label>
                        <select
                          className="w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-white h-8 sm:h-10"
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
                        <Label className="text-xs sm:text-sm">Bank Name *</Label>
                        <Input
                          value={onboardingForm.bankName}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, bankName: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Account Number *</Label>
                        <Input
                          type="password"
                          value={onboardingForm.accountNumber}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, accountNumber: e.target.value })}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Routing Number *</Label>
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
                        <Label className="text-xs sm:text-sm">W-4 Form *</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            ref={w4FormRef}
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingW4Form, "w4FormUrl")}
                            disabled={uploadingW4Form}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                          {onboardingData?.documents?.w4FormUrl && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">View</Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Handbook Signature *</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            ref={handbookSignatureRef}
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setUploadingHandbookSignature, "handbookSignatureUrl")}
                            disabled={uploadingHandbookSignature}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                          {onboardingData?.documents?.handbookSignatureUrl && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">View</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitOnboarding}
                    disabled={submittingOnboarding || onboardingData?.overallStatus === "submitted"}
                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                  >
                    {submittingOnboarding ? "Submitting..." : "Submit Onboarding"}
                  </Button>
                </>
              )}

              {onboardingData?.overallStatus === "approved" && (
                <div className="flex items-start sm:items-center gap-2 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm text-green-700">Your onboarding has been approved. You can now clock in.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
