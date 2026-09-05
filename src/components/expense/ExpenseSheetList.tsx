import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAuthState } from "@/lib/auth";

export default function ExpenseSheetList({ projectId }: any) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedQuotesItemId, setExpandedQuotesItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { role } = getAuthState();
   const phases = ["concept", "design", "prototype", "testing", "manufacturing", "deployment"];

 const isAdmin = role === "admin" || role === "super-admin";
const isManager = role === "manager";
const isTeamLead = role === "team-lead";
const isEmployee = role === "employee" || role === "developer";

 const isEditable =
  selectedSheet?.status !== "approved" &&
  (isManager || !isManager);

  // 🔍 Filter
  const filteredSheets = sheets.filter((s: any) => {
    const matchesSearch = s.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 📥 Load sheets
  const loadSheets = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/expense-sheets/${projectId}`);
      setSheets(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, [projectId]);

  // 📂 Open sheet
  const openSheet = async (sheet: any) => {
    setSelectedSheet(sheet);

    try {
      const res = await apiFetch(`/api/expense-sheets/items/${sheet._id}`);
      const fetchedItems = res.data || res;

      setItems(fetchedItems);
      setOriginalItems(JSON.parse(JSON.stringify(fetchedItems)));
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Update item
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    updated[i][field] = value;

    updated[i].estimatedTotalCents =
      Number(updated[i].estimatedTotalCents || 0);

    setItems(updated);
  };

  const addQuote = (itemIndex: number) => {
    const updated = [...items];
    if (!updated[itemIndex].quotes) updated[itemIndex].quotes = [];
    updated[itemIndex].quotes.push({ vendorName: "", amountCents: 0, isSelected: false });
    setItems(updated);
  };

  const updateQuote = (itemIndex: number, quoteIndex: number, field: string, value: any) => {
    const updated = [...items];
    updated[itemIndex].quotes[quoteIndex][field] = value;
    setItems(updated);
  };

  const removeQuote = (itemIndex: number, quoteIndex: number) => {
    const updated = [...items];
    updated[itemIndex].quotes.splice(quoteIndex, 1);
    setItems(updated);
  };

  const selectQuote = (itemIndex: number, quoteIndex: number) => {
    const updated = [...items];
    updated[itemIndex].quotes.forEach((q: any, i: number) => {
      q.isSelected = i === quoteIndex;
    });
    // Set paidCents to winning quote amount
    updated[itemIndex].paidCents = updated[itemIndex].quotes[quoteIndex].amountCents;
    updated[itemIndex].vendorName = updated[itemIndex].quotes[quoteIndex].vendorName;
    setItems(updated);
  };

  // ❌ Cancel
  const cancelEdit = () => {
    setItems(JSON.parse(JSON.stringify(originalItems)));
    setEditingIndex(null);
  };

  // 💾 Save
  const saveItem = async (item: any) => {
    try {
      setSaving(true);

      await apiFetch(`/api/expense-sheets/${projectId}/items/${item._id}`, {
        method: "PUT",
        body: JSON.stringify(item),
      });

      setEditingIndex(null);
      setOriginalItems(JSON.parse(JSON.stringify(items)));

    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 🚀 Submit (IMPORTANT FIX)
  const submitSheet = async (id: string) => {
    await apiFetch(`/api/expense-sheets/${id}/submit`, {
      method: "POST",
    });
    loadSheets();
  };

  // ✅ Approve
  const approveSheet = async (id: string) => {
    await apiFetch(`/api/expense-sheets/${id}/approve`, {
      method: "POST",
    });
    loadSheets();
  };

  // ❌ Reject
  const rejectSheet = async (id: string) => {
    await apiFetch(`/api/expense-sheets/${id}/reject`, {
      method: "POST",
    });
    loadSheets();
  };

  return (
    <div className="mt-4 border rounded-lg bg-background shadow-sm">

      {/* HEADER */}
      <div className="p-3 border-b flex flex-col gap-2">

        <div className="flex justify-between">
          <span className="font-semibold text-sm">Expense Sheets</span>
          <span className="text-xs">{filteredSheets.length} Sheets</span>
        </div>

        <div className="flex gap-2">
          <div className="relative w-full">
            <Search className="w-3 h-3 absolute left-2 top-2.5" />
            <Input
              placeholder="Search..."
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

      {/* CONTENT */}
      <div className="max-h-[500px] overflow-y-auto">

        {loading ? (
          <div className="flex justify-center h-40 items-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          filteredSheets.map((sheet: any) => (
            <div key={sheet._id} className="p-3 border-b">

              {/* HEADER */}
              <div
                className="flex justify-between cursor-pointer"
                onClick={() => openSheet(sheet)}
              >
                <div>
                  <p>{sheet.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sheet.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">

                  <span
                    className={`text-xs px-2 py-1 rounded
                      ${sheet.status === "approved" && "bg-green-100 text-green-700"}
                      ${sheet.status === "rejected" && "bg-red-100 text-red-700"}
                      ${sheet.status === "submitted" && "bg-yellow-100 text-yellow-700"}
                      ${sheet.status === "draft" && "bg-gray-200 text-black"}
                    `}
                  >
                    {sheet.status}
                  </span>
                </div>
              </div>

              {/* EXPANDED */}
              {sheet._id === selectedSheet?._id && (
                <div className="mt-3 space-y-2">

                  {/* ITEMS */}
                  {/*items.map((item: any, i: number) => (
                    <div key={item._id} className="grid grid-cols-6 gap-2">

                      <Input
                        disabled={!isEditable || editingIndex !== i}
                        value={item.itemName}
                        onChange={(e) =>
                          updateItem(i, "itemName", e.target.value)
                        }
                      />

                      <Input
                        disabled={!isEditable || editingIndex !== i}
                        value={item.vendor}
                        onChange={(e) =>
                          updateItem(i, "vendor", e.target.value)
                        }
                      />

                      <Input
                        type="number"
                        disabled={!isEditable || editingIndex !== i}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(i, "quantity", e.target.value)
                        }
                      />

                      <Input
                        type="number"
                        disabled={!isEditable || editingIndex !== i}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(i, "unitPrice", e.target.value)
                        }
                      />

                      <div>{item.totalPrice}</div>

                      <div>
                        {editingIndex === i ? (
                          <>
                            <Button size="sm" onClick={() => saveItem(item)}>
                              Save
                            </Button>
                            <Button size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          isEditable && (
                            <Button onClick={() => setEditingIndex(i)}>
                              Edit
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))*/}

                 
{phases.map((phase) => {
  const phaseItems = items.filter((i) => i.phase === phase);

  if (phaseItems.length === 0) return null;

  return (
    <div key={phase} className="border rounded p-2 mt-3">
      <h3 className="font-semibold capitalize mb-2">{phase}</h3>

      {phaseItems.map((item: any, i: number) => {
        const index = items.findIndex(x => x._id === item._id);

        return (
          <React.Fragment key={item._id}>
          <div className="grid grid-cols-7 gap-2 mb-2">

            <Input
              disabled={!isEditable || editingIndex !== index}
              value={item.itemName}
              onChange={(e) =>
                updateItem(index, "itemName", e.target.value)
              }
            />

            <Input
              disabled={!isEditable || editingIndex !== index}
              value={item.vendorName}
              onChange={(e) =>
                updateItem(index, "vendorName", e.target.value)
              }
            />

            <Input
              value={item.partNumber}
              disabled
            />

            <Input
              type="number"
              placeholder="Estimated (Cents)"
              value={item.estimatedTotalCents || 0}
              disabled={!isEditable || editingIndex !== index}
              onChange={(e) => updateItem(index, "estimatedTotalCents", e.target.value)}
            />

            <Input
              type="number"
              placeholder="Paid (Cents)"
              value={item.paidCents || 0}
              disabled
            />

            <Button variant="outline" size="sm" onClick={() => setExpandedQuotesItemId(expandedQuotesItemId === item._id ? null : item._id)}>
              Quotes ({item.quotes?.length || 0})
            </Button>

            <div className="flex gap-1">
              {editingIndex === index ? (
                <>
                  <Button size="sm" onClick={() => saveItem(item)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditingIndex(index)} disabled={!isEditable}>Edit</Button>
              )}
            </div>

          </div>
          
          {expandedQuotesItemId === item._id && (
            <div className="bg-muted/30 p-3 rounded-md mb-3 border ml-4 mr-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Vendor Quotes</h4>
                {editingIndex === index && (
                  <Button size="sm" onClick={() => addQuote(index)}>Add Quote</Button>
                )}
              </div>
              
              {item.quotes?.length === 0 && <p className="text-xs text-muted-foreground">No quotes added yet.</p>}
              
              <div className="space-y-2">
                {item.quotes?.map((quote: any, qIndex: number) => (
                  <div key={qIndex} className={`flex items-center gap-2 p-2 rounded border ${quote.isSelected ? "bg-green-500/10 border-green-500/30" : "bg-background"}`}>
                    <Input
                      placeholder="Vendor Name"
                      value={quote.vendorName}
                      disabled={!isEditable || editingIndex !== index}
                      onChange={(e) => updateQuote(index, qIndex, "vendorName", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount (Cents)"
                      value={quote.amountCents}
                      disabled={!isEditable || editingIndex !== index}
                      onChange={(e) => updateQuote(index, qIndex, "amountCents", Number(e.target.value))}
                      className="w-32"
                    />
                    <Input
                      placeholder="Notes"
                      value={quote.notes || ""}
                      disabled={!isEditable || editingIndex !== index}
                      onChange={(e) => updateQuote(index, qIndex, "notes", e.target.value)}
                      className="flex-1"
                    />
                    
                    {editingIndex === index && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant={quote.isSelected ? "default" : "outline"}
                          className={quote.isSelected ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => selectQuote(index, qIndex)}
                        >
                          {quote.isSelected ? "Selected" : "Select"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeQuote(index, qIndex)}>X</Button>
                      </div>
                    )}
                    {editingIndex !== index && quote.isSelected && (
                      <span className="text-xs font-bold text-green-600 px-2">Winner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </React.Fragment>
        );
      })}
    </div>
  );
})}

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-3">

                    {/* EMPLOYEE SUBMIT */}
                   {!isManager && role === "employee" && sheet.status === "draft" && (
  <Button onClick={() => submitSheet(sheet._id)}>
    Submit
  </Button>
)}

                    {/* MANAGER */}
              {(isAdmin || isManager) && sheet.status !== "approved" && (
  <>
    <Button
      size="sm"
      className="bg-green-600 text-white"
      onClick={() => approveSheet(sheet._id)}
    >
      Approve
    </Button>

    <Button
      size="sm"
      variant="destructive"
      onClick={() => rejectSheet(sheet._id)}
    >
      Reject
    </Button>
  </>
)}

                  </div>

                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}