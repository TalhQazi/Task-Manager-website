import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

export default function CreateExpenseSheet({ projectId, onClose }: any) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // 🔥 Load Vendors
  useEffect(() => {
    apiFetch("/api/vendors").then((res) => {
      setVendors(res.items || res);
    });
  }, []);

  // ➕ Add Row
  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        item: "",
        vendorId: "",
        vendorName: "",
        qty: 1,
        price: 0,
        total: 0,
        files: [],
      },
    ]);
  };

  // ❌ Remove Row
  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ✏️ Update Row
  const updateRow = (i: number, field: string, value: any) => {
    const updated = [...items];

    updated[i][field] = value;

    // auto calc
    updated[i].total =
      Number(updated[i].qty || 0) * Number(updated[i].price || 0);

    setItems(updated);
  };

  // 🧠 Vendor Select
  const handleVendorChange = (i: number, vendorId: string) => {
    const vendor = vendors.find((v) => v._id === vendorId);

    const updated = [...items];
    updated[i].vendorId = vendorId;
    updated[i].vendorName = vendor?.name || "";

    setItems(updated);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.total || 0), 0);

  // 🚀 Submit
  const handleSubmit = async () => {
    try {
      // 1️⃣ Create Sheet
      const sheetRes = await apiFetch("/api/expense-sheets", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          name,
        }),
      });

      const sheetId = sheetRes?._id || sheetRes?.data?._id;

      // 2️⃣ Create Items
      await Promise.all(
        items.map(async (item) => {
          const itemRes = await apiFetch("/api/expense-items", {
            method: "POST",
            body: JSON.stringify({
              sheetId,
              itemName: item.item,
              vendorId: item.vendorId,
              vendorName: item.vendorName,
              quantity: item.qty,
              unitCost: item.price,
              estimatedCost: item.total,
            }),
          });

          const itemId = itemRes?._id || itemRes?.data?._id;

          // 3️⃣ Upload files
          if (item.files?.length > 0) {
            const formData = new FormData();
            formData.append("expenseId", itemId); // ⚠️ IMPORTANT KEY
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
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">

      {/* Sheet Name */}
      <Input
        placeholder="Expense Sheet Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* TABLE */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Item</th>
              <th>Vendor</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((row, i) => (
              <tr key={i}>

                {/* Item */}
                <td>
                  <input
                    value={row.item}
                    onChange={(e) =>
                      updateRow(i, "item", e.target.value)
                    }
                  />
                </td>

                {/* ✅ Vendor Dropdown */}
                <td>
                  <select
                    value={row.vendorId}
                    onChange={(e) =>
                      handleVendorChange(i, e.target.value)
                    }
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  {/* Auto-fill preview */}
                  {row.vendorId && (
                    <div className="text-xs text-gray-500">
                      {
                        vendors.find(v => v._id === row.vendorId)?.phone
                      }
                    </div>
                  )}
                </td>

                {/* Qty */}
                <td>
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) =>
                      updateRow(i, "qty", e.target.value)
                    }
                  />
                </td>

                {/* Price */}
                <td>
                  <input
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      updateRow(i, "price", e.target.value)
                    }
                  />
                </td>

                {/* Total */}
                <td>
                  {row.total}
                  <br />

                  {/* FILE UPLOAD */}
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      updateRow(i, "files", Array.from(e.target.files || []));
                    }}
                  />
                </td>

                {/* Remove */}
                <td>
                  <button onClick={() => removeRow(i)}>❌</button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={addRow}>+ Add Row</Button>
        <div>Total: {totalAmount}</div>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogFooter>
    </div>
  );
}