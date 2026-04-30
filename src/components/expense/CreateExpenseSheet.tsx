import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

export default function CreateExpenseSheet({ projectId, onClose }: any) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});

  // ➕ Add Row
  const addRow = () => {
    setItems(prev => [
      ...prev,
      { item: "", vendor: "", qty: 1, price: 0, total: 0, category: "", files: [] }
    ]);
  };

  // ❌ Remove Row
  const removeRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // ✏️ Update Row
  const updateRow = (i: number, field: string, value: any) => {
    const updated = [...items];
    updated[i][field] = value;

    updated[i].total =
      Number(updated[i].qty || 0) * Number(updated[i].price || 0);

    setItems(updated);
  };

  // 🧠 Validation
const validate = () => {
  if (!name.trim()) {
    alert("Sheet name is required");
    return false;
  }

  if (items.length === 0) {
    alert("Add at least one item");
    return false;
  }

  for (const item of items) {
    if (!item.item || !item.vendor) {
      alert("Item name & vendor required");
      return false;
    }

    if (Number(item.qty) <= 0 || Number(item.price) < 0) {
      alert("Invalid quantity or price");
      return false;
    }
  }

  return true;
};

  const totalAmount = items.reduce((sum, i) => sum + (i.total || 0), 0);

  // 🚀 Submit
 const handleSubmit = async () => {
  if (!validate()) return;

  try {
    // 1. Create Sheet
    const sheetRes = await apiFetch("/api/expense-sheets", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        name: name.trim(),
      }),
    });

    const sheetId =
      sheetRes?.data?._id ||
      sheetRes?._id ||
      sheetRes?.data?.id ||
      sheetRes?.id;

    if (!sheetId) throw new Error("Sheet ID not returned");

    // 2. Create items + upload files
    await Promise.all(
      items.map(async (item) => {
        const itemRes = await apiFetch("/api/expense-items", {
          method: "POST",
          body: JSON.stringify({
            sheetId,
            itemName: item.item,
            vendor: item.vendor,
            quantity: Number(item.qty),
            unitPrice: Number(item.price),
            totalPrice: Number(item.total),
            category: item.category || "General",
          }),
        });

        const itemId =
          itemRes?.data?._id ||
          itemRes?._id ||
          itemRes?.data?.id ||
          itemRes?.id;

        // ✅ Upload files using FormData
        if (item.files && item.files.length > 0) {
          const formData = new FormData();
          formData.append("itemId", itemId);

          item.files.forEach((file: File) => {
            formData.append("files", file);
          });

          await apiFetch("/api/expense-attachments", {
            method: "POST",
            body: formData,
          });
        }
      })
    );

    onClose();
  } catch (err) {
    console.error("Expense creation failed:", err);
  }
};

  return (
    <div className="space-y-4">

      {/* Sheet Name */}
      <div>
        <Input
          placeholder="Expense Sheet Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
  <thead className="bg-muted/30">
    <tr>
      <th className="p-2 text-left">Item</th>
      <th>Vendor</th>
      <th>Qty</th>
      <th>Unit Price</th>
      <th>Total</th>
      <th></th>
    </tr>
  </thead>

  <tbody>
    {items.length === 0 && (
      <tr>
        <td colSpan={6} className="text-center p-4 text-muted-foreground">
          No items added. Click "Add Row"
        </td>
      </tr>
    )}

    {items.map((row, i) => (
      <tr key={i} className="border-t">

        {/* Item */}
        <td>
          <input
            className="w-full p-2"
            placeholder="Item name"
            value={row.item}
            onChange={(e) => updateRow(i, "item", e.target.value)}
          />
        </td>

        {/* Vendor */}
        <td>
          <input
            className="w-full p-2"
            placeholder="Vendor"
            value={row.vendor}
            onChange={(e) => updateRow(i, "vendor", e.target.value)}
          />
        </td>

        {/* Qty */}
        <td>
          <input
            type="number"
            min="1"
            className="w-16 p-2"
            value={row.qty}
            onChange={(e) => updateRow(i, "qty", e.target.value)}
          />
        </td>

        {/* Unit Price */}
        <td>
          <input
            type="number"
            min="0"
            className="w-20 p-2"
            value={row.price}
            onChange={(e) => updateRow(i, "price", e.target.value)}
          />
        </td>

        {/* Total + Upload */}
        <td className="p-2">
          <div className="flex flex-col gap-1">
            <span className="font-bold"> {row.total}</span>

            {/* Upload Button */}
            <label className="text-xs text-blue-600 cursor-pointer hover:underline">
              Upload Receipt
              

              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    updateRow(i, "files", files);
                }}
                />

            </label>

            {/* File Count */}
            {row.files?.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {row.files.length} file(s)
              </span>
            )}
          </div>
        </td>

        {/* Remove */}
        <td>
          <button
            onClick={() => removeRow(i)}
            className="text-red-500 text-sm hover:text-red-700"
          >
            ✕
          </button>
        </td>

      </tr>
    ))}
  </tbody>
</table>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={addRow}>
          + Add Row
        </Button>

        <div className="font-bold text-lg">
          Total:  {totalAmount}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save Expense
        </Button>
      </DialogFooter>
    </div>
  );
}