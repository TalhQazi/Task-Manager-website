import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  ChevronRight,
  Store,
  MapPin,
  User,
  Calendar,
  Package,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/admin/apiClient";
import { toast } from "sonner";
import { getAuthState } from "@/lib/auth";

// Components
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/manger/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import { Badge } from "@/components/manger/ui/badge";
import { Card } from "@/components/manger/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/manger/ui/tabs";
import { ScrollArea } from "@/components/manger/ui/scroll-area";

// --- Types ---
interface ShoppingList {
  id: string;
  name: string;
  companyId?: { id: string; name: string };
  locationId?: { id: string; name: string };
  projectId?: { id: string; name: string };
  assignedEmployeeId?: { id: string; name: string; username: string };
  vendors: { id: string; name: string }[];
  notes: string;
  status: "open" | "completed" | "archived";
  createdAt: string;
}

interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  name: string;
  quantity: string;
  vendorId?: { id: string; name: string };
  category: string;
  priority: "low" | "medium" | "high";
  notes: string;
  isPurchased: boolean;
  purchasedAt?: string;
  aisle: string;
}

// --- Main Component ---
export default function ShoppingLists() {
  const [activeTab, setActiveTab] = useState("my-lists");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const auth = getAuthState();
  const isAdmin = ["admin", "super-admin", "manager"].includes(auth.role);

  // Queries
  const { data: listsData, isLoading } = useQuery({
    queryKey: ["shopping-lists", activeTab, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab === "my-lists") {
        // Handled by backend filter based on auth
      }
      if (searchQuery) params.append("search", searchQuery);
      
      const res = await apiFetch(`/api/shopping-lists?${params.toString()}`);
      return res.items as ShoppingList[];
    },
    refetchInterval: 10000, // Refresh every 10s for "real-time" feel
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-minimal"],
    queryFn: async () => {
      const res = await apiFetch("/api/companies?limit=100");
      return res.items;
    }
  });

  const { data: locations } = useQuery({
    queryKey: ["locations-minimal"],
    queryFn: async () => {
      const res = await apiFetch("/api/locations?limit=100");
      return res.items;
    }
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-minimal"],
    queryFn: async () => {
      const res = await apiFetch("/api/users?limit=100");
      return res.items;
    }
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors-minimal"],
    queryFn: async () => {
      const res = await apiFetch("/api/vendors?limit=100");
      return res.items;
    }
  });

  // Render Helpers
  const renderListCard = (list: ShoppingList) => (
    <Card 
      key={list.id}
      className="group relative overflow-hidden bg-[#161B22]/40 border-white/10 hover:border-[#00C6FF]/30 transition-all duration-300 cursor-pointer"
      onClick={() => {
        setSelectedList(list);
        setIsDetailOpen(true);
      }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00C6FF]/10 to-[#0072FF]/10 text-[#00C6FF]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-[#00C6FF] transition-colors">{list.name}</h3>
              <p className="text-xs text-white/40">{format(new Date(list.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <Badge className={cn(
            "bg-opacity-10 border-0",
            list.status === "open" ? "bg-emerald-500 text-emerald-400" : 
            list.status === "completed" ? "bg-blue-500 text-blue-400" : "bg-gray-500 text-gray-400"
          )}>
            {list.status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2.5">
          {list.locationId && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <MapPin className="w-4 h-4 text-white/30" />
              <span className="truncate">{list.locationId.name}</span>
            </div>
          )}
          {list.assignedEmployeeId && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <User className="w-4 h-4 text-white/30" />
              <span className="truncate">Assigned to: {list.assignedEmployeeId.name || list.assignedEmployeeId.username}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Store className="w-4 h-4 text-white/30" />
            <span className="truncate">
              {list.vendors?.length ? list.vendors.map(v => v.name).join(", ") : "No vendors specified"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/api/shopping-lists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Shopping list deleted");
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiFetch(`/api/shopping-lists/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
    }
  });

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Shopping & Procurement
            </h1>
            <p className="text-white/40 mt-1">Manage vendor lists, assignments, and real-time store tracking.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] hover:shadow-[0_0_20px_rgba(0,198,255,0.4)] transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New List
            </Button>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-[#161B22] border-white/5 p-1 h-12">
                <TabsTrigger 
                  value="my-lists" 
                  className="px-6 data-[state=active]:bg-[#0D1117] data-[state=active]:text-[#00C6FF]"
                >
                  My Assigned Lists
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger 
                    value="all-lists" 
                    className="px-6 data-[state=active]:bg-[#0D1117] data-[state=active]:text-[#00C6FF]"
                  >
                    All Company Lists
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="Search lists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#161B22] border-white/10 focus:border-[#00C6FF]/50 transition-all h-11"
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listsData?.length ? (
              listsData.map(list => (
                <div key={list.id} className="relative group">
                  {renderListCard(list)}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-[#0D1117]/80 hover:bg-white/10 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedList(list);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-[#0D1117]/80 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this list?")) {
                            deleteListMutation.mutate(list.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 rounded-full bg-white/5">
                  <ShoppingCart className="w-12 h-12 text-white/10" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white/60">No lists found</h3>
                  <p className="text-white/30 mt-1">Try adjusting your filters or create a new list.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <CreateListModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        companies={companies}
        locations={locations}
        employees={employees}
        vendors={vendors}
      />

      {isEditModalOpen && selectedList && (
        <EditListModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          list={selectedList}
          companies={companies}
          locations={locations}
          employees={employees}
          vendors={vendors}
        />
      )}

      {selectedList && !isEditModalOpen && (
        <ListDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedList(null);
          }}
          list={selectedList}
          allVendors={vendors}
          employees={employees}
          isAdmin={isAdmin}
          onUpdateStatus={(status: string) => updateStatusMutation.mutate({ id: selectedList.id, status })}
        />
      )}
    </div>
  );
}

// --- Create List Modal ---
function CreateListModal({ isOpen, onClose, companies, locations, employees, vendors }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    companyId: "",
    locationId: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch("/api/shopping-lists", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          vendors: data.vendorIds
        })
      });
    },
    onSuccess: () => {
      toast.success("Shopping list created!");
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      onClose();
      setFormData({ name: "", companyId: "", locationId: "", notes: "" });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1117] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">New Shopping List</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-white/60">List Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Weekly Produce - Downtown" 
              className="bg-[#161B22] border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Company</label>
            <Select onValueChange={v => setFormData({...formData, companyId: v})}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {companies?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Location</label>
            <Select onValueChange={v => setFormData({...formData, locationId: v})}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {locations?.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-white/60">Internal Notes</label>
            <Input 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Any specific instructions..." 
              className="bg-[#161B22] border-white/10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">Cancel</Button>
          <Button 
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending || !formData.name}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF]"
          >
            {mutation.isPending ? "Creating..." : "Create List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- List Detail Modal ---
function ListDetailModal({ isOpen, onClose, list, allVendors, employees, isAdmin, onUpdateStatus }: any) {
  const queryClient = useQueryClient();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortByAisle, setSortByAisle] = useState(false);

  const { data: listWithItems, isLoading } = useQuery({
    queryKey: ["shopping-list", list.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/shopping-lists/${list.id}`);
      return res.item;
    },
    enabled: !!list.id,
    refetchInterval: 5000,
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isPurchased }: { itemId: string, isPurchased: boolean }) => {
      return apiFetch(`/api/shopping-lists/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ isPurchased })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", list.id] });
    },
    onError: () => toast.error("Failed to update item status")
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiFetch(`/api/shopping-lists/items/${itemId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", list.id] });
      toast.success("Item removed");
    }
  });

  const filteredItems = useMemo(() => {
    let items = [...(listWithItems?.items || [])];
    
    if (vendorFilter !== "all") {
      items = items.filter((item: any) => {
        const itemVendorId = item.vendorId?._id || item.vendorId?.id || item.vendorId;
        return itemVendorId === vendorFilter;
      });
    }
    
    if (hideCompleted) {
      items = items.filter((item: any) => !item.isPurchased);
    }
    
    if (sortByAisle) {
      items.sort((a: any, b: any) => {
        const aisleA = a.aisle || "ZZZ";
        const aisleB = b.aisle || "ZZZ";
        return aisleA.localeCompare(aisleB, undefined, { numeric: true });
      });
    } else {
      items.sort((a: any, b: any) => Number(a.isPurchased) - Number(b.isPurchased));
    }
    
    return items;
  }, [listWithItems, vendorFilter, hideCompleted, sortByAisle]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1117] border-white/10 text-white max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header - added pr-12 to avoid overlap with close icon */}
        <div className="p-6 pr-12 border-b border-white/5 flex flex-wrap justify-between items-center bg-[#161B22]/50 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 truncate">
              <ShoppingCart className="w-6 h-6 text-[#00C6FF]" />
              <span className="truncate">{list.name}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {list.locationId?.name}
              </span>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <User className="w-3 h-3" /> {list.assignedEmployeeId?.name || list.assignedEmployeeId?.username || "Unassigned"}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4 ml-1">
                  <Badge 
                    className={cn("cursor-pointer text-[10px] px-1.5 py-0", list.status === "open" ? "bg-emerald-500 text-white" : "bg-white/5 text-white/40")}
                    onClick={() => onUpdateStatus("open")}
                  >
                    OPEN
                  </Badge>
                  <Badge 
                    className={cn("cursor-pointer text-[10px] px-1.5 py-0", list.status === "completed" ? "bg-blue-500 text-white" : "bg-white/5 text-white/40")}
                    onClick={() => onUpdateStatus("completed")}
                  >
                    COMPLETED
                  </Badge>
                  <Badge 
                    className={cn("cursor-pointer text-[10px] px-1.5 py-0", list.status === "archived" ? "bg-gray-500 text-white" : "bg-white/5 text-white/40")}
                    onClick={() => onUpdateStatus("archived")}
                  >
                    ARCHIVE
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <Button 
            onClick={() => setIsAddItemOpen(true)}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="px-6 py-4 bg-[#0D1117] flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">Vendors</label>
            <div className="flex gap-2">
              <Badge 
                className={cn("cursor-pointer px-3 py-1", vendorFilter === "all" ? "bg-[#00C6FF] text-white" : "bg-white/5 text-white/40")}
                onClick={() => setVendorFilter("all")}
              >
                All
              </Badge>
              {list.vendors?.map(v => (
                <Badge 
                  key={v.id}
                  className={cn("cursor-pointer px-3 py-1", vendorFilter === v.id ? "bg-[#00C6FF] text-white" : "bg-white/5 text-white/40")}
                  onClick={() => setVendorFilter(v.id)}
                >
                  {v.name}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("text-xs gap-2", hideCompleted ? "text-[#00C6FF] bg-[#00C6FF]/10" : "text-white/40")}
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hide Completed
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("text-xs gap-2", sortByAisle ? "text-[#00C6FF] bg-[#00C6FF]/10" : "text-white/40")}
              onClick={() => setSortByAisle(!sortByAisle)}
            >
              <Filter className="w-3.5 h-3.5" />
              Sort by Aisle
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems?.length > 0 ? (
                filteredItems.map((item: any) => (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      item.isPurchased 
                        ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" 
                        : "bg-[#161B22]/40 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors",
                        item.isPurchased 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-white/20 hover:border-[#00C6FF]"
                      )}
                      onClick={() => toggleItemMutation.mutate({ itemId: item.id, isPurchased: !item.isPurchased })}
                    >
                      {item.isPurchased && <Check className="w-4 h-4" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-medium", item.isPurchased && "line-through")}>{item.name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase py-0 border-white/10 text-white/40">
                          {item.quantity}
                        </Badge>
                        {item.priority === "high" && <Badge className="bg-red-500/10 text-red-400 border-0 text-[10px]">URGENT</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Store className="w-3 h-3" /> {item.vendorId?.name || "General"}
                        </span>
                        {item.aisle && (
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Aisle {item.aisle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white" onClick={() => {}}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-red-400" onClick={() => deleteItemMutation.mutate(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-white/20 flex flex-col items-center">
                  <Package className="w-12 h-12 mb-3 opacity-10" />
                  No items in this list
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <AddItemModal 
          isOpen={isAddItemOpen} 
          onClose={() => setIsAddItemOpen(false)} 
          listId={list.id} 
          listVendors={list.vendors}
          allVendors={allVendors}
          employees={employees}
          currentAssignedId={list.assignedEmployeeId?._id || list.assignedEmployeeId?.id || list.assignedEmployeeId}
          currentVendorIds={list.vendors?.map((v: any) => v._id || v.id) || []}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Add Item Modal ---
function AddItemModal({ isOpen, onClose, listId, listVendors, allVendors, employees, currentAssignedId, currentVendorIds }: any) {
  const queryClient = useQueryClient();
  const [listData, setListData] = useState({
    assignedEmployeeId: currentAssignedId || "",
    vendorIds: currentVendorIds || []
  });
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    vendorId: "",
    category: "General",
    priority: "medium",
    aisle: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // First update the list properties if they changed
      if (listData.assignedEmployeeId !== currentAssignedId || JSON.stringify(listData.vendorIds.sort()) !== JSON.stringify(currentVendorIds.sort())) {
        await apiFetch(`/api/shopping-lists/${listId}`, {
          method: "PUT",
          body: JSON.stringify({
            assignedEmployeeId: listData.assignedEmployeeId,
            vendors: listData.vendorIds
          })
        });
      }

      const payload = { ...data };
      if (payload.vendorId === "none") payload.vendorId = null;
      return apiFetch(`/api/shopping-lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", listId] });
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      onClose();
      setFormData({ name: "", quantity: "1", vendorId: "", category: "General", priority: "medium", aisle: "", notes: "" });
      toast.success("Item added and list settings updated");
    },
    onError: () => toast.error("Failed to add item. Please try again.")
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1117] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh] pr-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Item Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Avocados (Case)" 
              className="bg-[#161B22] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Quantity</label>
            <Input 
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              placeholder="1 unit" 
              className="bg-[#161B22] border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Priority</label>
              <Select defaultValue="medium" onValueChange={(v: any) => setFormData({...formData, priority: v})}>
                <SelectTrigger className="bg-[#161B22] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161B22] border-white/10 text-white">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Aisle (Optional)</label>
              <Input 
                value={formData.aisle} 
                onChange={e => setFormData({...formData, aisle: e.target.value})}
                placeholder="e.g., 4" 
                className="bg-[#161B22] border-white/10"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
            <h4 className="text-sm font-semibold text-[#00C6FF]">List Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Assign List To</label>
                <Select value={listData.assignedEmployeeId} onValueChange={v => setListData({...listData, assignedEmployeeId: v})}>
                  <SelectTrigger className="bg-[#161B22] border-white/10">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B22] border-white/10 text-white">
                    {employees?.map((e: any) => (
                      <SelectItem key={e._id || e.id} value={e._id || e.id}>{e.name || e.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">List Vendors</label>
                <Select onValueChange={v => {
                  if (!listData.vendorIds.includes(v)) {
                    setListData({...listData, vendorIds: [...listData.vendorIds, v]});
                  }
                }}>
                  <SelectTrigger className="bg-[#161B22] border-white/10">
                    <SelectValue placeholder="Add Vendors to List" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B22] border-white/10 text-white">
                    {allVendors?.map((v: any) => (
                      <SelectItem key={v._id || v.id} value={v._id || v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {listData.vendorIds.map((vid: string) => {
                    const v = allVendors?.find((v: any) => (v._id || v.id) === vid);
                    return (
                      <Badge key={vid} className="bg-[#00C6FF]/10 text-[#00C6FF] border-0 px-2 py-1 flex items-center gap-1">
                        {v?.name || "Vendor"}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setListData({...listData, vendorIds: listData.vendorIds.filter(id => id !== vid)})} />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(formData)} disabled={!formData.name}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit List Modal ---
function EditListModal({ isOpen, onClose, list, companies, locations, employees, vendors }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: list.name,
    companyId: list.companyId?._id || list.companyId?.id || list.companyId || "",
    locationId: list.locationId?._id || list.locationId?.id || list.locationId || "",
    assignedEmployeeId: list.assignedEmployeeId?._id || list.assignedEmployeeId?.id || list.assignedEmployeeId || "",
    vendorIds: list.vendors?.map((v: any) => v._id || v.id || v) || [],
    notes: list.notes || "",
    status: list.status || "open"
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch(`/api/shopping-lists/${list.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          vendors: data.vendorIds
        })
      });
    },
    onSuccess: () => {
      toast.success("Shopping list updated!");
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      onClose();
    },
    onError: () => toast.error("Failed to update list")
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1117] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Shopping List</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-white/60">List Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Weekly Produce" 
              className="bg-[#161B22] border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Company</label>
            <Select value={formData.companyId} onValueChange={v => setFormData({...formData, companyId: v})}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {companies?.map((c: any) => (
                  <SelectItem key={c.id || c._id} value={c.id || c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Location</label>
            <Select value={formData.locationId} onValueChange={v => setFormData({...formData, locationId: v})}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {locations?.map((l: any) => (
                  <SelectItem key={l.id || l._id} value={l.id || l._id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Assign To</label>
            <Select value={formData.assignedEmployeeId} onValueChange={v => setFormData({...formData, assignedEmployeeId: v})}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {employees?.map((e: any) => (
                  <SelectItem key={e._id || e.id} value={e._id || e.id}>{e.name || e.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Vendors</label>
            <Select onValueChange={v => {
              if (!formData.vendorIds.includes(v)) {
                setFormData({...formData, vendorIds: [...formData.vendorIds, v]});
              }
            }}>
              <SelectTrigger className="bg-[#161B22] border-white/10">
                <SelectValue placeholder="Add Vendors" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-white/10 text-white">
                {vendors?.map((v: any) => (
                  <SelectItem key={v._id || v.id} value={v._id || v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.vendorIds.map(vid => {
                const v = vendors?.find((v: any) => (v._id || v.id) === vid);
                return (
                  <Badge key={vid} className="bg-[#00C6FF]/10 text-[#00C6FF] border-0 px-2 py-1 flex items-center gap-1">
                    {v?.name || "Vendor"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFormData({...formData, vendorIds: formData.vendorIds.filter(id => id !== vid)})} />
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">Cancel</Button>
          <Button 
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending || !formData.name}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF]"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
