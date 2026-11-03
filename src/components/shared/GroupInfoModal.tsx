import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Camera,
  Edit2,
  Check,
  X,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  Search,
  Lock,
  Megaphone,
  MoreVertical,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Badge } from "@/components/admin/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin/ui/avatar";
import { apiFetch, toProxiedUrl } from "@/lib/admin/apiClient";
import { toast } from "sonner";

export interface ChatGroup {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  groupType?: "custom" | "department" | "project" | "task";
  isPrivate?: boolean;
  announcementOnly?: boolean;
  createdBy?: string;
  creatorRole?: string;
  members: string[];
  admins?: string[];
  createdAt?: string;
}

interface Employee {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  department?: string;
  avatarUrl?: string;
  role?: string;
}

interface GroupInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ChatGroup | null;
  currentUser: string;
  currentUserRole?: string;
  employees?: Employee[];
  onGroupUpdated: (updated: ChatGroup) => void;
  onDirectMessage?: (employeeName: string) => void;
}

export default function GroupInfoModal({
  open,
  onOpenChange,
  group,
  currentUser,
  currentUserRole = "admin",
  employees = [],
  onGroupUpdated,
  onDirectMessage,
}: GroupInfoModalProps) {
  if (!group) return null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [groupDesc, setGroupDesc] = useState(group.description || "");
  const [isAnnouncement, setIsAnnouncement] = useState(Boolean(group.announcementOnly));
  const [isPrivate, setIsPrivate] = useState(Boolean(group.isPrivate));
  const [memberSearch, setMemberSearch] = useState("");
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>(employees);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperOrAdmin = ["super-admin", "admin"].includes(currentUserRole.toLowerCase());
  const isGroupAdmin =
    isSuperOrAdmin ||
    (group.admins && group.admins.includes(currentUser)) ||
    group.createdBy === currentUser;

  useEffect(() => {
    setGroupName(group.name || "");
    setGroupDesc(group.description || "");
    setIsAnnouncement(Boolean(group.announcementOnly));
    setIsPrivate(Boolean(group.isPrivate));
    setIsEditingName(false);
    setIsEditingDesc(false);
    setIsAddingMembers(false);
    setSelectedToAdd([]);
  }, [group]);

  // Load employees if not passed
  useEffect(() => {
    if (employees && employees.length > 0) {
      setAllEmployees(employees);
    } else if (open) {
      apiFetch<{ items?: any[]; data?: any[] }>("/api/employees")
        .then((res) => {
          const list = res.items || res.data || (Array.isArray(res) ? res : []);
          setAllEmployees(
            list.map((e: any) => ({
              id: e.id || e._id,
              name: e.name || e.username || "Unknown",
              email: e.email || "",
              department: e.department || "",
              avatarUrl: e.avatarUrl || e.avatarDataUrl || "",
              role: e.role || "",
            }))
          );
        })
        .catch(() => {});
    }
  }, [employees, open]);

  const handleSaveName = async () => {
    if (!groupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: groupName.trim() }),
        }
      );
      toast.success("Group name updated");
      setIsEditingName(false);
      onGroupUpdated(res.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update group name");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      setSaving(true);
      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ description: groupDesc.trim() }),
        }
      );
      toast.success("Group description updated");
      setIsEditingDesc(false);
      onGroupUpdated(res.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update description");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WebP)");
      return;
    }

    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await apiFetch<{ attachment: { url: string } }>("/api/messages/upload", {
        method: "POST",
        body: fd,
      });

      const avatarUrl = uploadRes?.attachment?.url;
      if (!avatarUrl) throw new Error("Failed to upload avatar");

      const updateRes = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ avatarUrl }),
        }
      );

      toast.success("Group picture updated");
      onGroupUpdated(updateRes.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload group picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggleAnnouncement = async () => {
    if (!isGroupAdmin) return;
    const nextVal = !isAnnouncement;
    setIsAnnouncement(nextVal);
    try {
      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ announcementOnly: nextVal }),
        }
      );
      toast.success(nextVal ? "Announcement mode enabled" : "Discussion mode enabled");
      onGroupUpdated(res.item);
    } catch (err) {
      setIsAnnouncement(!nextVal);
      toast.error("Failed to update announcement mode");
    }
  };

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setSaving(true);
      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}/members`,
        {
          method: "POST",
          body: JSON.stringify({ action: "add", members: selectedToAdd }),
        }
      );
      toast.success(`Added ${selectedToAdd.length} member(s) to group`);
      setSelectedToAdd([]);
      setIsAddingMembers(false);
      onGroupUpdated(res.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberName: string) => {
    try {
      setSaving(true);
      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}/members`,
        {
          method: "POST",
          body: JSON.stringify({ action: "remove", memberName }),
        }
      );
      toast.success(`Removed ${memberName} from group`);
      onGroupUpdated(res.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (memberName: string) => {
    try {
      setSaving(true);
      const currentAdmins = group.admins || [];
      const isAdmin = currentAdmins.includes(memberName);
      const newAdmins = isAdmin
        ? currentAdmins.filter((a) => a !== memberName)
        : [...currentAdmins, memberName];

      const res = await apiFetch<{ item: ChatGroup }>(
        `/api/messages/groups/${encodeURIComponent(group.id || group._id || "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ admins: newAdmins }),
        }
      );
      toast.success(isAdmin ? `Dismissed ${memberName} as admin` : `Made ${memberName} group admin`);
      onGroupUpdated(res.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update admin role");
    } finally {
      setSaving(false);
    }
  };

  // Filter existing members
  const currentMembers = group.members || [];
  const filteredCurrentMembers = currentMembers.filter((m) =>
    m.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Available employees to add
  const availableToAdd = allEmployees.filter(
    (emp) =>
      !currentMembers.includes(emp.name) &&
      (emp.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        (emp.department || "").toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white max-h-[90vh] flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative flex-shrink-0">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with Camera Overlay (WhatsApp style) */}
            <div className="relative group/avatar mb-3">
              <Avatar className="h-20 w-20 ring-4 ring-white/10 shadow-xl">
                {group.avatarUrl ? (
                  <AvatarImage
                    src={toProxiedUrl(group.avatarUrl) || group.avatarUrl}
                    alt={group.name}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                  {group.name ? group.name.slice(0, 2).toUpperCase() : "GP"}
                </AvatarFallback>
              </Avatar>

              {isGroupAdmin && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg transition-transform hover:scale-110 border-2 border-slate-900"
                  title="Change group picture"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Group Name (Inline editable) */}
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full max-w-xs mt-1">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="h-8 text-center text-sm font-bold bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  onClick={handleSaveName}
                  disabled={saving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/70 hover:bg-white/10 shrink-0"
                  onClick={() => {
                    setGroupName(group.name || "");
                    setIsEditingName(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {group.name}
                </DialogTitle>
                {isGroupAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
                    title="Edit group name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Badges & Created Info */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
              <Badge variant="outline" className="text-[10px] bg-white/10 border-white/20 text-blue-200">
                {currentMembers.length} member{currentMembers.length !== 1 ? "s" : ""}
              </Badge>
              {group.isPrivate && (
                <Badge variant="outline" className="text-[10px] bg-purple-500/20 border-purple-400/30 text-purple-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </Badge>
              )}
              {isAnnouncement && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-400/30 text-amber-200 flex items-center gap-1">
                  <Megaphone className="h-3 w-3" /> Announcement
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Description Section */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Description
              </label>
              {isGroupAdmin && !isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Add a group description..."
                  rows={2}
                  className="text-xs bg-white border-slate-200 resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setGroupDesc(group.description || "");
                      setIsEditingDesc(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={handleSaveDescription}
                    disabled={saving}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {group.description || (
                  <span className="text-slate-400 italic">No description provided</span>
                )}
              </p>
            )}
          </div>

          {/* Group Settings / Announcement Mode Toggle */}
          {isGroupAdmin && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Only Admins Can Post</p>
                  <p className="text-[10px] text-slate-500">
                    Restrict message sending to group admins only
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAnnouncement}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAnnouncement ? "bg-amber-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAnnouncement ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Members Management Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Group Members ({currentMembers.length})
                </h4>
              </div>

              {isGroupAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                  className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1 rounded-lg font-semibold"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {isAddingMembers ? "Close" : "Add Members"}
                </Button>
              )}
            </div>

            {/* Add Members Panel */}
            {isAddingMembers && (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-900">Select Employees to Add</p>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {selectedToAdd.length} selected
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Search employees to add..."
                    className="h-7 pl-8 text-xs bg-white border-blue-200"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar pr-1 bg-white rounded-lg p-1.5 border border-blue-100">
                  {availableToAdd.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-3">
                      No more employees available to add
                    </p>
                  ) : (
                    availableToAdd.map((emp) => {
                      const isSelected = selectedToAdd.includes(emp.name);
                      return (
                        <div
                          key={emp.id || emp.name}
                          onClick={() => {
                            setSelectedToAdd((prev) =>
                              prev.includes(emp.name)
                                ? prev.filter((n) => n !== emp.name)
                                : [...prev, emp.name]
                            );
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                            isSelected ? "bg-blue-100 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6">
                              {emp.avatarUrl && <AvatarImage src={toProxiedUrl(emp.avatarUrl) || emp.avatarUrl} />}
                              <AvatarFallback className="text-[9px] bg-slate-200">
                                {emp.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{emp.name}</span>
                            {emp.department && (
                              <span className="text-[10px] text-slate-400 font-normal">({emp.department})</span>
                            )}
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedToAdd([]);
                      setIsAddingMembers(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    onClick={handleAddMembers}
                    disabled={selectedToAdd.length === 0 || saving}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Add {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ""}
                  </Button>
                </div>
              </div>
            )}

            {/* Search Members in Group */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search group members..."
                className="h-8 pl-8 text-xs border-slate-200 rounded-lg"
              />
            </div>

            {/* Members List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1 border border-slate-100 rounded-xl p-1.5 bg-slate-50/50">
              {filteredCurrentMembers.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No matching members found</p>
              ) : (
                filteredCurrentMembers.map((memberName) => {
                  const empInfo = allEmployees.find((e) => e.name === memberName);
                  const isUserAdmin = (group.admins || []).includes(memberName);
                  const isCreator = group.createdBy === memberName;
                  const isMe = memberName === currentUser;

                  return (
                    <div
                      key={memberName}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8">
                          {empInfo?.avatarUrl ? (
                            <AvatarImage src={toProxiedUrl(empInfo.avatarUrl) || empInfo.avatarUrl} alt={memberName} />
                          ) : null}
                          <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-blue-700">
                            {memberName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                            <span>{memberName}</span>
                            {isMe && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {empInfo?.department || empInfo?.email || "Team Member"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCreator ? (
                          <Badge className="text-[9px] bg-purple-100 text-purple-800 border-purple-200">
                            Creator
                          </Badge>
                        ) : isUserAdmin ? (
                          <Badge className="text-[9px] bg-blue-100 text-blue-800 border-blue-200">
                            Admin
                          </Badge>
                        ) : null}

                        {/* Actions menu for group admin */}
                        {isGroupAdmin && !isMe ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              {onDirectMessage && (
                                <DropdownMenuItem onClick={() => onDirectMessage(memberName)}>
                                  <MessageSquare className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                  Message {memberName.split(" ")[0]}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggleAdmin(memberName)}>
                                <Shield className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                                {isUserAdmin ? "Dismiss as Admin" : "Make Group Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(memberName)}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Remove from Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          onDirectMessage && !isMe && (
                            <button
                              onClick={() => onDirectMessage(memberName)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                              title={`Message ${memberName}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
