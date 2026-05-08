import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, AlertTriangle, Plus, Trash2, Upload, FileImage, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { employeeApiFetch } from "../lib/api";

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  startDate: string;
  endDate: string;
}

interface ClearHireStatus {
  status: "PENDING" | "GREEN" | "YELLOW" | "RED";
  lastChecked: string;
}

interface ClearHireOnboardingFormProps {
  onStatusChange?: () => void;
}

export default function ClearHireOnboardingForm({ onStatusChange }: ClearHireOnboardingFormProps) {
  const [status, setStatus] = useState<ClearHireStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [ssn, setSsn] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([
    { street: "", city: "", state: "", zip: "", startDate: "", endDate: "" },
  ]);
  const [fcraConsent, setFcraConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // File Inputs
  const govIdRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await employeeApiFetch<{ item: ClearHireStatus }>("/api/clearhire/status/me");
      setStatus(res.item);
    } catch (e) {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAddAddress = useCallback(() => {
    setAddresses(prev => [...prev, { street: "", city: "", state: "", zip: "", startDate: "", endDate: "" }]);
  }, []);

  const handleRemoveAddress = useCallback((index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddressChange = useCallback((index: number, field: keyof Address, value: string) => {
    setAddresses(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const formatSSN = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,2})(\d{0,4})$/);
    if (!match) return val;
    return !match[2]
      ? match[1]
      : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ""}`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dob || ssn.replace(/\D/g, "").length !== 9) {
      toast.error("Please fill in your name, DOB, and 9-digit SSN.");
      return;
    }
    if (!fcraConsent) {
      toast.error("You must agree to the FCRA background check consent.");
      return;
    }

    const hasEmptyAddress = addresses.some((a) => !a.street || !a.city || !a.state || !a.zip || !a.startDate);
    if (hasEmptyAddress) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: "me",
        fullName,
        dob,
        ssn,
        addressHistory: addresses.map((a) => ({
          ...a,
          endDate: a.endDate ? a.endDate : null,
        })),
        fcraConsentGiven: fcraConsent,
        governmentIdUrl: govIdFile ? "uploaded_url_placeholder" : "",
        selfieUrl: selfieFile ? "uploaded_url_placeholder" : "",
      };

      await employeeApiFetch("/api/clearhire/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Background check submitted successfully.");
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit background check.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (status) {
    const isGreen = status.status === "GREEN";
    const isYellow = status.status === "YELLOW";
    const isRed = status.status === "RED";
    const isPending = status.status === "PENDING";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isGreen ? "bg-green-100 text-green-700" : isRed ? "bg-red-100 text-red-700" : isYellow ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
            }`}>2</div>
            Background Check (ClearHire®)
          </CardTitle>
          <CardDescription>Your pre-employment screening status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 p-4 border rounded-lg ${
            isGreen ? "bg-green-50 border-green-200" : isRed ? "bg-red-50 border-red-200" : isYellow ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
          }`}>
            {isGreen && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            {isRed && <AlertTriangle className="h-8 w-8 text-red-600" />}
            {isYellow && <ShieldAlert className="h-8 w-8 text-yellow-600" />}
            {isPending && <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />}
            
            <div>
              <h4 className="font-semibold text-lg">
                {isGreen && "Cleared for Onboarding"}
                {isRed && "Background Check Failed"}
                {isYellow && "Under Administrative Review"}
                {isPending && "Background Check in Progress"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Last checked: {status.lastChecked ? new Date(status.lastChecked).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className={`${
                isGreen ? "bg-green-100 text-green-700 border-green-200" : 
                isRed ? "bg-red-100 text-red-700 border-red-200" : 
                isYellow ? "bg-yellow-100 text-yellow-700 border-yellow-200" : 
                "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
                {status.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-100 text-blue-700">
            2
          </div>
          Background Check (ClearHire®)
        </CardTitle>
        <CardDescription>
          We use ClearHire® to securely perform a pre-employment background check. Your information is encrypted using AES-256 and will not be shared.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Legal Name</Label>
              <Input
                placeholder="As it appears on your ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Social Security Number
              </Label>
              <Input
                placeholder="XXX-XX-XXXX"
                value={ssn}
                onChange={(e) => setSsn(formatSSN(e.target.value))}
                maxLength={11}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your SSN is securely encrypted and never stored in plain text.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Address History (7 Years)</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAddress}>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>

            {addresses.map((address, index) => (
              <div key={index} className="p-4 border rounded-md space-y-4 relative bg-gray-50/50">
                {addresses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveAddress(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2 pr-8">
                    <Label>Street Address</Label>
                    <Input
                      placeholder="123 Main St"
                      value={address.street}
                      onChange={(e) => handleAddressChange(index, "street", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        placeholder="CA"
                        maxLength={2}
                        value={address.state}
                        onChange={(e) => handleAddressChange(index, "state", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        placeholder="12345"
                        value={address.zip}
                        onChange={(e) => handleAddressChange(index, "zip", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={address.startDate}
                      onChange={(e) => handleAddressChange(index, "startDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (Optional if current)</Label>
                    <Input
                      type="date"
                      value={address.endDate}
                      onChange={(e) => handleAddressChange(index, "endDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
              <Label className="text-sm font-semibold">Government ID (Optional for check)</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => govIdRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {govIdFile ? govIdFile.name : "Upload Document"}
                </Button>
                <input
                  type="file"
                  className="hidden"
                  ref={govIdRef}
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files && setGovIdFile(e.target.files[0])}
                />
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
              <Label className="text-sm font-semibold">Selfie Verification (Optional)</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="w-full" onClick={() => selfieRef.current?.click()}>
                  <FileImage className="h-4 w-4 mr-2" />
                  {selfieFile ? selfieFile.name : "Upload Selfie"}
                </Button>
                <input
                  type="file"
                  className="hidden"
                  ref={selfieRef}
                  accept="image/*"
                  capture="user"
                  onChange={(e) => e.target.files && setSelfieFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <Checkbox
              id="fcra"
              checked={fcraConsent}
              onCheckedChange={(c) => setFcraConsent(c === true)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="fcra" className="font-semibold text-blue-900 cursor-pointer">
                FCRA Background Check Consent
              </Label>
              <p className="text-xs text-blue-800 leading-relaxed">
                I hereby authorize Task Manager and ClearHire® to obtain "consumer reports" and "investigative consumer reports" about me at any time after receipt of this authorization and throughout my employment, if applicable.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#133767] hover:bg-[#1a4585]" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            {submitting ? "Submitting Securely..." : "Submit Background Check"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
