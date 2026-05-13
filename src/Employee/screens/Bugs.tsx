import { useEffect, useMemo, useState } from "react";
import { employeeApiFetch } from "../lib/api";
import { getEmployeeAuth } from "../lib/auth";
import { toProxiedUrl } from "@/lib/manger/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BugStatus = "open" | "closed";

type BugItem = {
  id: string;
  title: string;
  description: string;
  status?: BugStatus;
  taskTitle?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdAt?: string;
  source?: { panel?: string; path?: string };
  attachments?: { fileName?: string; url?: string; mimeType?: string; size?: number }[];
};

function toText(v: unknown) {
  return typeof v === "string" ? v : "";
}

export default function EmployeeBugs() {
  const auth = getEmployeeAuth();
  const currentUsername = auth?.username || "";

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BugItem[]>([]);
  const [q, setQ] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<BugItem | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const res = await employeeApiFetch<{ items?: any[] }>("/api/bugs");
    const list = Array.isArray(res?.items) ? res.items : [];

    const mapped: BugItem[] = list
      .map((x: any) => ({
        id: String(x.id || x._id || ""),
        title: toText(x.title),
        description: toText(x.description),
        status: (x.status === "closed" ? "closed" : "open") as BugStatus,
        taskTitle: toText(x.taskTitle),
        createdByUsername: toText(x.createdByUsername),
        createdByRole: toText(x.createdByRole),
        createdAt: toText(x.createdAt),
        source: x.source && typeof x.source === "object" ? x.source : undefined,
        attachments: Array.isArray(x.attachments) ? x.attachments : [],
      }))
      .filter((x) => Boolean(x.id) && x.createdByUsername === currentUsername);

    setItems(mapped);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setApiError(null);
        await load();
      } catch (e) {
        if (!mounted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load bugs");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((b) => {
      const where = `${b.title} ${b.description} ${b.taskTitle || ""} ${b.source?.path || ""}`.toLowerCase();
      return where.includes(query);
    });
  }, [items, q]);

  const openBug = async (b: BugItem) => {
    setSelected(b);
    setViewOpen(true);
    try {
      const res = await employeeApiFetch<{ item: BugItem }>(`/api/bugs/${encodeURIComponent(b.id)}`);
      if (res?.item) {
        setSelected((prev) => (prev?.id === b.id ? { ...prev, ...res.item } : prev));
      }
    } catch (e) {
      console.error("Failed to load bug details", e);
    }
  };

  const updateStatus = async (next: BugStatus) => {
    if (!selected) return;
    try {
      setUpdating(true);
      setApiError(null);
      const res = await employeeApiFetch<{ item?: any }>(`/api/bugs/${encodeURIComponent(selected.id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      const updated = res?.item;
      const merged: BugItem = {
        ...selected,
        status: (updated?.status === "closed" ? "closed" : "open") as BugStatus,
      };
      setSelected(merged);
      setItems((prev) => prev.map((x) => (x.id === merged.id ? { ...x, status: merged.status } : x)));
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to update bug");
    } finally {
      setUpdating(false);
    }
  };

  const openCount = items.filter((b) => b.status === "open").length;

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Bug Reports</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Bugs you have submitted. {openCount > 0 ? `${openCount} open.` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>

      {apiError && (
        <div className="rounded-md bg-destructive/10 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-destructive break-words">{apiError}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-3 sm:p-6">
          <Input
            placeholder="Search your bugs..."
            className="h-9 sm:h-10 text-sm sm:text-base max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-base sm:text-lg font-semibold">
            My Bugs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported From</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow
                        key={b.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => openBug(b)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-base line-clamp-1">{b.title}</p>
                            {b.taskTitle && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                Task: {b.taskTitle}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === "closed" ? "secondary" : "default"} className="text-xs">
                            {b.status === "closed" ? "Closed" : "Open"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.source?.path || b.source?.panel || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm italic">
                          {items.length === 0
                            ? "You haven't reported any bugs yet."
                            : "No bugs match your search."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-3">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border bg-card hover:border-blue-500/50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    onClick={() => openBug(b)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant={b.status === "closed" ? "secondary" : "default"}
                        className="text-[10px] uppercase"
                      >
                        {b.status === "closed" ? "Closed" : "Open"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {b.source?.path?.split("/").pop() || "System"}
                      </span>
                    </div>
                    <h3 className="font-bold text-base leading-tight mb-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{b.description}</p>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm italic">
                    {items.length === 0
                      ? "You haven't reported any bugs yet."
                      : "No bugs match your search."}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">{selected?.title || "Bug"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selected?.source?.path || selected?.source?.panel || ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selected.status === "closed" ? "secondary" : "default"}>
                  {selected.status === "closed" ? "Closed" : "Open"}
                </Badge>
                {selected.taskTitle && (
                  <span className="text-xs text-muted-foreground">Task: {selected.taskTitle}</span>
                )}
              </div>

              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
              </div>

              {selected.attachments && selected.attachments.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm font-medium">
                    Attachments ({selected.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selected.attachments.map((att, i) => (
                      <div key={i} className="w-full overflow-hidden rounded-lg border bg-muted/20">
                        <img
                          src={toProxiedUrl(String(att.url))}
                          alt={String(att.fileName || `Attachment ${i + 1}`)}
                          className="w-full h-auto max-h-[65vh] object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
              className="w-full sm:w-auto"
              disabled={updating}
            >
              Close
            </Button>
            {selected?.status === "closed" ? (
              <Button
                onClick={() => void updateStatus("open")}
                className="w-full sm:w-auto"
                disabled={updating}
              >
                Reopen
              </Button>
            ) : (
              <Button
                onClick={() => void updateStatus("closed")}
                className="w-full sm:w-auto"
                disabled={updating}
              >
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
