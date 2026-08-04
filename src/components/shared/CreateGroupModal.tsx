import React, { useState } from "react";
import { Users, Lock, Megaphone, Check, Plus, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  avatarUrl?: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onGroupCreated: (newGroup: any) => void;
}

export default function CreateGroupModal({
  open,
  onOpenChange,
  employees,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState<"custom" | "department">("custom");
  const [isPrivate, setIsPrivate] = useState(false);
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchMember, setSearchMember] = useState("");

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchMember.toLowerCase())
  );

  const toggleMember = (empName: string) => {
    if (selectedMembers.includes(empName)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== empName));
    } else {
      setSelectedMembers([...selectedMembers, empName]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member for the group");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch<{ item: any }>("/api/messages/groups", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          groupType,
          isPrivate,
          announcementOnly,
          members: selectedMembers,
        }),
      });

      toast.success(`Group '${name}' created successfully`);
      onGroupCreated(res.item);
      onOpenChange(false);
      setName("");
      setDescription("");
      setSelectedMembers([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white">
        <div className="bg-slate-900 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Create Enterprise Group</DialogTitle>
              <DialogDescription className="text-blue-300 text-xs mt-0.5">
                Restricted to Admin & Super Admin accounts
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Group Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Team Alpha or Product Updates"
              className="border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of channel purpose..."
              rows={2}
              className="border-slate-200 resize-none text-xs"
            />
          </div>

          {/* Settings Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isPrivate ? "border-purple-500 bg-purple-50/50 text-purple-900" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Lock className={`h-4 w-4 ${isPrivate ? "text-purple-600" : "text-slate-400"}`} />
                {isPrivate && <Badge className="bg-purple-600 text-[9px] px-1.5 py-0">Private</Badge>}
              </div>
              <span className="text-xs font-bold">Private Channel</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Only invited members can view</span>
            </button>

            <button
              type="button"
              onClick={() => setAnnouncementOnly(!announcementOnly)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                announcementOnly ? "border-amber-500 bg-amber-50/50 text-amber-900" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Megaphone className={`h-4 w-4 ${announcementOnly ? "text-amber-600" : "text-slate-400"}`} />
                {announcementOnly && <Badge className="bg-amber-600 text-[9px] px-1.5 py-0">Announce</Badge>}
              </div>
              <span className="text-xs font-bold">Announcement Only</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Only Admins can post messages</span>
            </button>
          </div>

          {/* Member Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600">Select Group Members ({selectedMembers.length})</label>
              <span className="text-[10px] text-slate-400">Click to select</span>
            </div>

            <Input
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Search members or departments..."
              className="h-8 text-xs border-slate-200 mb-2"
            />

            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 p-2 rounded-xl bg-slate-50/50 custom-scrollbar">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedMembers.includes(emp.name);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleMember(emp.name)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? "bg-blue-100/70 border border-blue-300" : "hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        {emp.avatarUrl && <AvatarImage src={toProxiedUrl(emp.avatarUrl) || emp.avatarUrl} alt={emp.name} />}
                        <AvatarFallback className="text-[10px] bg-slate-200">{emp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{emp.name}</p>
                        <p className="text-[10px] text-slate-500">{emp.department || "Staff"}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-500/20"
          >
            {submitting ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
