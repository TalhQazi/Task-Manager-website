import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ExpenseSheetList({ projectId }: any) {
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSheets = sheets.filter((s: any) => {
  const matchesSearch =
    s.name?.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "all" || s.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  // ✅ Load all sheets
  const loadSheets = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/expense-sheets/${projectId}`);
      setSheets(res.data || res);
    } catch (err) {
      console.error("Failed to load sheets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, [projectId]);

  // ✅ Open sheet details
const openSheet = async (sheet: any) => {
  setSelectedSheet(sheet);

  try {
    const res = await apiFetch(`/api/expense-items/${sheet._id}`);
    const fetchedItems = res.data || res;

    // 🔥 Attachments MUST be fetched separately OR exist on item
    const itemsWithAttachments = await Promise.all(
      fetchedItems.map(async (item: any) => {
        const attRes = await apiFetch(
          `/api/expense-attachments/${item._id}`
        );
        console.log("Attachments for item", item._id, attRes);

        return {
          ...item,
          attachments: attRes.data || attRes,
        };
      })
    );

    const attachments = itemsWithAttachments.flatMap((item: any) =>
      (item.attachments || []).map((att: any) => ({
        ...att,
        itemName: item.itemName,
      }))
    );

    setItems(itemsWithAttachments);

    setSelectedSheet({
      ...sheet,
      allAttachments: attachments,
    });
  } catch (err) {
    console.error("Failed to load items", err);
  }
};

  // ✅ Calculate total per sheet
  const getSheetTotal = (sheetId: string) => {
    return items
      .filter((i) => i.sheetId === sheetId)
      .reduce((sum, i) => sum + (i.totalPrice || 0), 0);
  };

 return (
  <div className="mt-4 border rounded-lg bg-background shadow-sm">

    {/* Header */}
    <div className="p-3 border-b flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">Expense Sheets</span>
        <span className="text-muted-foreground text-xs">
          {filteredSheets.length} Sheets
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative w-full">
          <Search className="w-3 h-3 absolute left-2 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search sheets..."
            className="pl-7 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="text-xs border rounded px-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>

    {/* Scrollable Content */}
    <div className="max-h-[400px] overflow-y-auto">

      {/* ✅ Loader */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-sm">
          No expense sheets found
        </div>
      ) : (
        <div className="divide-y">
          {filteredSheets.map((sheet: any) => (
            <div
              key={sheet._id}
              className="p-3 hover:bg-muted/20 transition cursor-pointer"
              onClick={() => openSheet(sheet)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{sheet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sheet.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm">
                     {sheet.totalAmount || 0}
                  </p>
                  <span className="text-xs capitalize text-muted-foreground">
                    {sheet.status}
                  </span>
                </div>
              </div>

              {/* Attachments */}
              {sheet._id === selectedSheet?._id &&
  selectedSheet?.allAttachments?.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-2">
      {selectedSheet.allAttachments.slice(0, 5).map((att: any, i: number) => {
        const url = att.fileUrl?.startsWith("http")
                    ? att.fileUrl
                    : `http://localhost:5002${att.fileUrl}`;

        const isImage = att.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        const isPdf = att.fileUrl.match(/\.pdf$/i);

        return (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1 border rounded-md bg-muted/20 text-xs cursor-pointer hover:bg-muted transition"
            onClick={(e) => {
              e.stopPropagation();
              window.open(url, "_blank");
            }}
          >
            {/* 🔥 Preview */}
            {isImage ? (
              <img
                src={url}
                className="w-8 h-8 object-cover rounded"
              />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
                {isPdf ? "📄" : "📎"}
              </div>
            )}

            {/* File Name */}
            <span className="truncate max-w-[100px]">
              {att.fileName || "File"}
            </span>
          </div>
        );
      })}
    </div>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}