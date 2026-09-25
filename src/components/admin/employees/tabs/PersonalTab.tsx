import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PersonalTabProps {
  employeeId: string;
  initialData: any;
  onRefresh: () => void;
}

export function PersonalTab({ employeeId, initialData, onRefresh }: PersonalTabProps) {
  const [legalName, setLegalName] = useState(initialData.legalName || initialData.name || "");
  const [preferredName, setPreferredName] = useState(initialData.preferredName || "");
  const [personalEmail, setPersonalEmail] = useState(initialData.personalEmail || "");
  const [personalPhone, setPersonalPhone] = useState(initialData.personalPhone || "");
  const [birthDate, setBirthDate] = useState(initialData.birthDate || "");
  const [street, setStreet] = useState(initialData.address?.street || "");
  const [city, setCity] = useState(initialData.address?.city || "");
  const [state, setState] = useState(initialData.address?.state || "");
  const [zip, setZip] = useState(initialData.address?.zip || "");
  const [country, setCountry] = useState(initialData.address?.country || "US");
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>(
    initialData.emergencyContacts || []
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAddEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: "", relationship: "", phone: "", email: "", isPrimary: emergencyContacts.length === 0 },
    ]);
  };

  const handleRemoveEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const handleEmergencyContactChange = (index: number, field: string, value: any) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await apiFetch(`/api/employees/${employeeId}/personal`, {
        method: "PUT",
        body: JSON.stringify({
          legalName,
          preferredName,
          personalEmail,
          personalPhone,
          birthDate,
          address: { street, city, state, zip, country },
          emergencyContacts,
        }),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update personal details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner Message */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Personal details and emergency contacts saved successfully.
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity & Personal Contact Card */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Personal Identity & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Legal Full Name</label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Legal Full Name"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Preferred Name</label>
                <Input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Nick / Preferred Name"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-slate-400" />
                  Personal Email
                </label>
                <Input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="personal@example.com"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  Personal Mobile
                </label>
                <Input
                  type="tel"
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-slate-400" />
                Date of Birth
              </label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Residential Address Card */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Residential Address
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Street Address</label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 Main St, Apt 4B"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">State / Region</label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Zip / Postal Code</label>
                <Input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="00000"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Country</label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country (e.g. US)"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts Section */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-400" />
            Emergency Contacts
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddEmergencyContact}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Contact
          </Button>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {emergencyContacts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No emergency contacts recorded. Click &quot;Add Contact&quot; to add next of kin or emergency numbers.
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Full Name</label>
                    <Input
                      value={contact.name}
                      onChange={(e) => handleEmergencyContactChange(index, "name", e.target.value)}
                      placeholder="Contact Name"
                      className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Relationship</label>
                    <Input
                      value={contact.relationship}
                      onChange={(e) => handleEmergencyContactChange(index, "relationship", e.target.value)}
                      placeholder="e.g. Spouse, Parent, Sibling"
                      className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Phone Number</label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => handleEmergencyContactChange(index, "phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmergencyContact(index)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium gap-2 shadow-lg shadow-blue-600/20"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Personal Information
        </Button>
      </div>
    </form>
  );
}
