import {
  CERT_STATUS_META,
  CERT_TYPE_LABELS,
  CostSheetPayload,
  PURCHASE_STATUS_META,
  PURCHASED_STATUSES,
  formatMoney,
} from "@/lib/costManager";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(fileName: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const money = (cents: number) => ((cents || 0) / 100).toFixed(2);

function locationOf(item: { storage?: { locationName?: string; building?: string; room?: string; aisle?: string; shelf?: string; bin?: string } }) {
  const s = item.storage || {};
  return [s.locationName, s.building, s.room, s.aisle, s.shelf, s.bin].filter(Boolean).join(" / ");
}

export type CostReportKind =
  | "summary"
  | "purchase_needed"
  | "purchased"
  | "locations"
  | "certifications"
  | "vendor_spend";

export const REPORT_LABELS: Record<CostReportKind, string> = {
  summary: "Project Cost Summary",
  purchase_needed: "Purchase Needed Report",
  purchased: "Purchased Items Report",
  locations: "Location Finder Report",
  certifications: "Certification Cost Report",
  vendor_spend: "Vendor Spend Report",
};

export function exportReportCsv(kind: CostReportKind, payload: CostSheetPayload, projectName: string) {
  const { sections, certifications, summary } = payload;
  const allItems = sections.flatMap((s) => s.items.map((i) => ({ ...i, sectionName: s.name })));
  const active = allItems.filter((i) => i.isActive && i.purchaseStatus !== "canceled");
  const stamp = new Date().toISOString().slice(0, 10);
  const prefix = `${projectName.replace(/[^\w-]+/g, "_")}_${stamp}`;

  if (kind === "summary") {
    const rows: (string | number)[][] = [
      ["Project Cost Summary", projectName],
      [],
      ["Projected Prototype Cost", money(summary.projectedCents)],
      ["Amount Spent So Far", money(summary.spentCents)],
      ["Remaining to Prototype", money(summary.remainingCents)],
      ["Available Budget", money(summary.availableBudgetCents)],
      ["Purchased Items", `${summary.purchasedCount} of ${summary.totalCount}`],
      ["Purchased %", `${summary.purchasedPct}%`],
      ["Build Readiness %", `${summary.buildReadinessPct}%`],
      ["Next Critical Purchase", summary.nextBlocker ? `${summary.nextBlocker.itemName} (${money(summary.nextBlocker.remainingCents)})` : "None"],
      [],
      ["Section", "Estimated", "Paid"],
      ...sections.map((s) => [s.name, money(s.subtotalEstimatedCents), money(s.subtotalPaidCents)]),
    ];
    return downloadCsv(`${prefix}_cost_summary.csv`, rows);
  }

  if (kind === "purchase_needed") {
    const items = active.filter((i) => !PURCHASED_STATUSES.includes(i.purchaseStatus));
    const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    items.sort((a, b) => {
      if (a.requiredForPrototype !== b.requiredForPrototype) return a.requiredForPrototype ? -1 : 1;
      return (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
    });
    return downloadCsv(`${prefix}_purchase_needed.csv`, [
      ["Section", "Item", "Vendor", "Priority", "Required", "Status", "Qty", "Estimated", "Paid", "Remaining"],
      ...items.map((i) => [
        i.sectionName,
        i.itemName,
        i.vendor?.name || "",
        i.priority,
        i.requiredForPrototype ? "Yes" : "No",
        PURCHASE_STATUS_META[i.purchaseStatus].label,
        i.qty,
        money(i.estimatedTotalCents),
        money(i.paidCents),
        money(i.remainingCents),
      ]),
    ]);
  }

  if (kind === "purchased") {
    const items = active.filter((i) => PURCHASED_STATUSES.includes(i.purchaseStatus));
    return downloadCsv(`${prefix}_purchased_items.csv`, [
      ["Section", "Item", "Vendor", "Status", "Qty", "Paid", "Remaining", "Invoice/Receipt Files", "Location"],
      ...items.map((i) => [
        i.sectionName,
        i.itemName,
        i.vendor?.name || "",
        PURCHASE_STATUS_META[i.purchaseStatus].label,
        i.qty,
        money(i.paidCents),
        money(i.remainingCents),
        i.attachments.filter((a) => ["invoice", "receipt"].includes(a.fileType)).map((a) => a.fileName).join("; "),
        locationOf(i),
      ]),
    ]);
  }

  if (kind === "locations") {
    const items = active.filter((i) => locationOf(i));
    return downloadCsv(`${prefix}_locations.csv`, [
      ["Item", "Section", "Status", "Qty Stored", "Location", "Stored By", "Stored At"],
      ...items.map((i) => [
        i.itemName,
        i.sectionName,
        PURCHASE_STATUS_META[i.purchaseStatus].label,
        i.storage?.qtyStored || "",
        locationOf(i),
        i.storage?.storedByUsername || "",
        i.storage?.storedAt ? new Date(i.storage.storedAt).toLocaleDateString() : "",
      ]),
    ]);
  }

  if (kind === "certifications") {
    return downloadCsv(`${prefix}_certifications.csv`, [
      ["Requirement", "Type", "Authority/Lab", "Standard", "Status", "Required", "Due Date", "Estimated", "Paid", "Result"],
      ...certifications.map((c) => [
        c.name,
        CERT_TYPE_LABELS[c.requirementType],
        c.authorityOrLab,
        c.standard,
        CERT_STATUS_META[c.status].label,
        c.requiredForPrototype ? "Yes" : "No",
        c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "",
        money(c.estimatedCostCents),
        money(c.paidCents),
        c.result,
      ]),
    ]);
  }

  // vendor_spend
  const byVendor = new Map<string, { estimated: number; paid: number; count: number }>();
  for (const i of active) {
    const key = i.vendor?.name || "(no vendor)";
    const entry = byVendor.get(key) || { estimated: 0, paid: 0, count: 0 };
    entry.estimated += i.estimatedTotalCents;
    entry.paid += i.paidCents;
    entry.count += 1;
    byVendor.set(key, entry);
  }
  return downloadCsv(`${prefix}_vendor_spend.csv`, [
    ["Vendor", "Line Items", "Estimated Total", "Paid Total"],
    ...[...byVendor.entries()]
      .sort((a, b) => b[1].paid - a[1].paid)
      .map(([name, v]) => [name, v.count, money(v.estimated), money(v.paid)]),
  ]);
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// One-page executive print view (print-to-PDF covers the PDF requirement).
export function openPrintView(payload: CostSheetPayload, projectName: string) {
  const { sections, certifications, summary } = payload;
  const currency = payload.sheet.currency || "USD";
  const fm = (cents: number) => formatMoney(cents, currency);

  const sectionRows = sections
    .map(
      (s) => `
      <tr class="section"><td colspan="5">${esc(s.name)}</td><td class="num">${fm(s.subtotalEstimatedCents)}</td><td class="num">${fm(s.subtotalPaidCents)}</td></tr>
      ${s.items
        .filter((i) => i.isActive && i.purchaseStatus !== "canceled")
        .map(
          (i) => `
        <tr>
          <td>${esc(i.itemName)}${i.requiredForPrototype ? " *" : ""}</td>
          <td>${esc(i.vendor?.name || "")}</td>
          <td>${esc(PURCHASE_STATUS_META[i.purchaseStatus].label)}</td>
          <td>${esc(i.qty)}${esc(i.unit ? ` × ${i.unit}` : "")}</td>
          <td>${esc(locationOf(i))}</td>
          <td class="num">${fm(i.estimatedTotalCents)}</td>
          <td class="num">${fm(i.paidCents)}</td>
        </tr>`
        )
        .join("")}`
    )
    .join("");

  const certRows = certifications
    .map(
      (c) => `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${esc(CERT_TYPE_LABELS[c.requirementType])}</td>
        <td>${esc(c.authorityOrLab)}</td>
        <td>${esc(CERT_STATUS_META[c.status].label)}</td>
        <td>${c.dueDate ? new Date(c.dueDate).toLocaleDateString() : ""}</td>
        <td class="num">${fm(c.estimatedCostCents)}</td>
        <td class="num">${fm(c.paidCents)}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(projectName)} — Cost Summary</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 32px; color: #111; font-size: 12px; }
    h1 { font-size: 20px; margin-bottom: 2px; }
    h2 { font-size: 14px; margin: 20px 0 6px; }
    .meta { color: #666; margin-bottom: 16px; }
    .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; min-width: 150px; }
    .card p { margin: 0; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    .card strong { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.04em; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    tr.section td { background: #f4f4f5; font-weight: 700; }
    .footnote { color: #666; margin-top: 12px; font-size: 10px; }
    @media print { body { margin: 12mm; } }
  </style></head><body>
  <h1>${esc(projectName)} — Project Cost Summary</h1>
  <p class="meta">Generated ${new Date().toLocaleString()} · Currency ${esc(currency)}</p>
  <div class="cards">
    <div class="card"><p>Projected Prototype Cost</p><strong>${fm(summary.projectedCents)}</strong></div>
    <div class="card"><p>Amount Spent So Far</p><strong>${fm(summary.spentCents)}</strong></div>
    <div class="card"><p>Remaining to Prototype</p><strong>${fm(summary.remainingCents)}</strong></div>
    <div class="card"><p>Available Budget</p><strong>${fm(summary.availableBudgetCents)}</strong></div>
    <div class="card"><p>Purchased</p><strong>${summary.purchasedCount} of ${summary.totalCount} (${summary.purchasedPct}%)</strong></div>
    <div class="card"><p>Build Readiness</p><strong>${summary.buildReadinessPct}%</strong></div>
  </div>
  ${summary.nextBlocker ? `<p><strong>Next Critical Purchase:</strong> ${esc(summary.nextBlocker.itemName)} — ${fm(summary.nextBlocker.remainingCents)}</p>` : ""}
  <h2>Cost Sections</h2>
  <table>
    <thead><tr><th>Item</th><th>Vendor</th><th>Status</th><th>Qty</th><th>Location</th><th class="num">Estimated</th><th class="num">Paid</th></tr></thead>
    <tbody>${sectionRows}</tbody>
  </table>
  ${certifications.length > 0 ? `
  <h2>Certifications, Testing &amp; Permits</h2>
  <table>
    <thead><tr><th>Requirement</th><th>Type</th><th>Authority/Lab</th><th>Status</th><th>Due</th><th class="num">Estimated</th><th class="num">Paid</th></tr></thead>
    <tbody>${certRows}</tbody>
  </table>` : ""}
  <p class="footnote">* Required for workable prototype. Use your browser's Print dialog to save as PDF.</p>
  <script>window.onload = function () { window.print(); };</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
