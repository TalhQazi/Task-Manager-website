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
} from "lucide-react";

import { getEmployeeProfile, employeeApiFetch, updateBankInfo, updateTaxInfo, getDocuments,toProxiedUrl } from "../lib/api";


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
const [refresh, setRefresh] = useState(0);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getEmployeeProfile();
      console.log("Profile data:", res);
      setProfile(res.item);
      setEditedProfile(res.item);
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



  const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  function DocumentList() {
  const [docs, setDocs] = useState([]);


useEffect(() => {
  getDocuments().then((res) => setDocs(res?.items || []));
}, [refresh]);
  

  return (
    <div className="space-y-2 mt-4">
      {docs.map((d: any) => (
        <div key={d.id} className="flex justify-between border p-2 rounded">
          <div>
            <p className="font-medium">{d.docType}</p>
            <p className="text-sm text-gray-500">{d.status}</p>
          </div>

          <a href={d.fileUrl} target="_blank">
            <Button size="sm">View</Button>
          </a>
        </div>
      ))}
    </div>
  );
}

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
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="work">Work Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Details Tab */}
        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
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
                    value={profile.jobTitle || "Not assigned"} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Department
                  </Label>
                  <Input 
                    value={profile.department || "Not assigned"} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Join Date
                  </Label>
                  <Input 
                    value={profile.joinDate || "Not set"} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Employee ID
                  </Label>
                  <Input 
                    value={profile.employeeId || profile.id} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
              </div>
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

        <TabsContent value="documents">
  <Card>
    <CardHeader>
      <CardTitle>Document Center</CardTitle>
    </CardHeader>

    <CardContent>
    

      <DocumentList />
    </CardContent>
  </Card>
</TabsContent>
      </Tabs>
    </div>
  );
}
