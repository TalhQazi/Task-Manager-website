import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostSheetPayload, formatMoney, getCostSheetById } from "@/lib/costManager";
import { Building2, Check, DollarSign, FileText, Loader2, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";

interface QuoteComparisonModalProps {
  sheetIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuoteComparisonModal({ sheetIds, open, onOpenChange }: QuoteComparisonModalProps) {
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<CostSheetPayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || sheetIds.length === 0) {
      setQuotes([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all(sheetIds.map((id) => getCostSheetById(id)))
      .then((results) => {
        if (!mounted) return;
        setQuotes(results.filter(Boolean));
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load quotes for comparison:", err);
        setError("Failed to load some quote sheets.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, sheetIds]);

  if (!open) return null;

  // Calculate lowest quote
  const totals = quotes.map((q) => q.summary.projectedCents);
  const lowestTotal = totals.length ? Math.min(...totals) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Quote & Expense Sheet Comparison</DialogTitle>
                <DialogDescription className="text-indigo-200 text-xs mt-0.5">
                  Direct side-by-side comparison of {quotes.length} vendor quote{quotes.length === 1 ? "" : "s"}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading and analyzing quotes...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive text-sm bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          ) : quotes.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Please select at least 2 expense/quote sheets from the list to compare them side-by-side.
            </div>
          ) : (
            <>
              {/* High-Level Comparison Cards */}
              <div className={`grid grid-cols-1 md:grid-cols-${Math.min(quotes.length, 3)} gap-4`}>
                {quotes.map((q, idx) => {
                  const isLowest = q.summary.projectedCents === lowestTotal && lowestTotal > 0;
                  const diffFromLowest = q.summary.projectedCents - lowestTotal;
                  const diffPct = lowestTotal > 0 ? ((diffFromLowest / lowestTotal) * 100).toFixed(1) : "0";

                  return (
                    <Card
                      key={q.sheet.id || idx}
                      className={`relative overflow-hidden transition-all border ${
                        isLowest
                          ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/20"
                          : "border-border bg-card"
                      }`}
                    >
                      {isLowest && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
                          <Check className="h-3 w-3" /> Lowest Quote
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                          <Building2 className="h-4 w-4 text-indigo-500" />
                          <span>{q.sheet.vendorName || "Unspecified Vendor"}</span>
                        </div>
                        <CardTitle className="text-lg font-bold truncate mt-1" title={q.sheet.name}>
                          {q.sheet.name}
                        </CardTitle>
                        {q.sheet.quoteNumber && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            Quote #: <span className="font-semibold text-foreground">{q.sheet.quoteNumber}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-muted/60 rounded-xl">
                          <div className="text-xs text-muted-foreground">Total Quoted Cost</div>
                          <div className="text-2xl font-black text-foreground mt-0.5">
                            {formatMoney(q.summary.projectedCents, q.sheet.currency)}
                          </div>
                          {!isLowest && diffFromLowest > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>+{formatMoney(diffFromLowest, q.sheet.currency)} (+{diffPct}%) vs lowest</span>
                            </div>
                          )}
                          {isLowest && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                              <TrendingDown className="h-3.5 w-3.5" />
                              <span>Best pricing option</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-background rounded-lg border border-border/60">
                            <span className="text-muted-foreground block text-[11px]">Line Items</span>
                            <span className="font-bold text-sm">{q.summary.totalCount} items</span>
                          </div>
                          <div className="p-2.5 bg-background rounded-lg border border-border/60">
                            <span className="text-muted-foreground block text-[11px]">Sections</span>
                            <span className="font-bold text-sm">{q.sections.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Section-by-Section Subtotal Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Section Cost Breakdown
                </h4>
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs">Section</TableHead>
                        {quotes.map((q) => (
                          <TableHead key={q.sheet.id} className="text-right font-bold text-xs">
                            {q.sheet.vendorName ? `${q.sheet.vendorName} (${q.sheet.name})` : q.sheet.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Extract unique section names across all compared quotes */}
                      {Array.from(new Set(quotes.flatMap((q) => q.sections.map((s) => s.name)))).map((sectionName) => (
                        <TableRow key={sectionName}>
                          <TableCell className="font-medium text-sm">{sectionName}</TableCell>
                          {quotes.map((q) => {
                            const match = q.sections.find((s) => s.name === sectionName);
                            const amount = match ? match.subtotalEstimatedCents : 0;
                            return (
                              <TableCell key={q.sheet.id} className="text-right font-mono text-sm">
                                {match ? formatMoney(amount, q.sheet.currency) : "—"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-bold border-t-2">
                        <TableCell className="text-sm font-bold">TOTAL</TableCell>
                        {quotes.map((q) => (
                          <TableCell key={q.sheet.id} className="text-right font-mono text-base text-primary font-bold">
                            {formatMoney(q.summary.projectedCents, q.sheet.currency)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Detailed Item Breakdown Side-by-Side */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Detailed Line Items
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quotes.map((q) => (
                    <div key={q.sheet.id} className="border border-border rounded-xl p-4 bg-card space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span className="font-bold text-sm block">{q.sheet.vendorName || q.sheet.name}</span>
                          <span className="text-xs text-muted-foreground">{q.sheet.name}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatMoney(q.summary.projectedCents, q.sheet.currency)}
                        </Badge>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {q.sections.flatMap((s) => s.items).length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-3 text-center">No line items in this sheet</p>
                        ) : (
                          q.sections.flatMap((s) => s.items).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-medium text-foreground truncate">{item.itemName}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {item.qty} {item.unit} @ {formatMoney(item.unitCostCents, q.sheet.currency)}
                                  {item.shippingCostCents > 0 ? ` + Ship: ${formatMoney(item.shippingCostCents, q.sheet.currency)}` : ""}
                                </p>
                              </div>
                              <span className="font-mono font-semibold shrink-0">
                                {formatMoney(item.estimatedTotalCents, q.sheet.currency)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
            Close Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
