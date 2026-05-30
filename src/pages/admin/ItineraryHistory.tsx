import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { apiGet, listResource } from "@/lib/admin/apiClient";
import { Search, MapPin, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ItineraryStop {
  id: string;
  title: string;
  address?: string;
  estimatedDurationMinutes?: number;
  sequenceOrder: number;
  travelTimeToNext?: number;
  completed?: boolean;
  completedAt?: string | null;
}

interface Itinerary {
  id: string;
  userId: string;
  date: string;
  startTime?: string;
  optimized?: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  stops: ItineraryStop[];
}

interface Employee {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
}

const getInitials = (name: string) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ItineraryHistory() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [employees, setEmployees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItineraries, setExpandedItineraries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const [{ items: itineraryItems = [] }, employeeList] = await Promise.all([
          apiGet<{ items: Itinerary[] }>(`/api/itineraries?date=${encodeURIComponent(date)}`),
          listResource<Employee>("employees"),
        ]);

        const map: Record<string, string> = {};
        employeeList.forEach((employee) => {
          const key = employee.id || employee._id || "";
          if (key) {
            map[key] = employee.name;
          }
        });

        setEmployees(map);
        setItineraries(itineraryItems || []);
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message || "Failed to load itinerary history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [date]);

  const employeeCount = useMemo(() => {
    const uniqueIds = new Set(itineraries.map((item) => item.userId));
    return uniqueIds.size;
  }, [itineraries]);

  const totalStops = useMemo(
    () => itineraries.reduce((sum, itinerary) => sum + (itinerary.stops?.length || 0), 0),
    [itineraries],
  );

  const completedStops = useMemo(
    () =>
      itineraries.reduce(
        (sum, itinerary) => sum + itinerary.stops.filter((stop) => stop.completed).length,
        0,
      ),
    [itineraries],
  );

  const remainingStops = Math.max(0, totalStops - completedStops);

  const filteredItineraries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return itineraries;

    return itineraries.filter((itinerary) => {
      const employeeName = (employees[itinerary.userId] || "").toLowerCase();
      const stopMatch = itinerary.stops.some((stop) =>
        `${stop.title ?? ""} ${stop.address ?? ""}`.toLowerCase().includes(query),
      );
      return (
        employeeName.includes(query) ||
        itinerary.date.toLowerCase().includes(query) ||
        stopMatch ||
        itinerary.userId.toLowerCase().includes(query)
      );
    });
  }, [itineraries, employees, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedItineraries((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <>
      <motion.div
        className="pl-6 space-y-4 sm:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Itinerary History</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Review daily route history, completed stops, and live tracking summaries for all field employees.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Search</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Employee or stop..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Itineraries</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{itineraries.length}</CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{employeeCount}</CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Stops Scheduled</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{totalStops}</CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{completedStops}</CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Route history for {filteredItineraries.length} itinerary{filteredItineraries.length === 1 ? "" : "ies"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-9 w-9 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Loading itinerary history...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-destructive">{error}</div>
            ) : filteredItineraries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No itineraries found for this date.</div>
            ) : (
              <div className="divide-y">
                {filteredItineraries.map((itinerary) => {
                  const employeeName = employees[itinerary.userId] || itinerary.userId;
                  const completed = itinerary.stops.filter((stop) => stop.completed).length;
                  const total = itinerary.stops.length;
                  const expanded = !!expandedItineraries[itinerary.id];

                  return (
                    <div key={itinerary.id} className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                                {getInitials(employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{employeeName}</p>
                              <p className="text-xs text-muted-foreground">Start: {itinerary.startTime || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs px-2 py-1 uppercase tracking-[0.18em]">
                              {itinerary.optimized ? "Optimized" : "Manual"}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1 uppercase tracking-[0.18em]">
                              {completed}/{total} stops completed
                            </Badge>
                            {itinerary.lastLocation ? (
                              <Badge variant="outline" className="text-xs px-2 py-1 uppercase tracking-[0.18em]">
                                Live at {itinerary.lastLocation.latitude.toFixed(4)},{itinerary.lastLocation.longitude.toFixed(4)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggleExpanded(itinerary.id)}>
                            {expanded ? (
                              <><ChevronUp className="h-4 w-4" /> Hide details</>
                            ) : (
                              <><ChevronDown className="h-4 w-4" /> View details</>
                            )}
                          </Button>
                          <Badge variant="secondary" className="text-xs uppercase tracking-[0.18em]">
                            {new Date(itinerary.date).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-4 rounded-xl border border-border/60 bg-surface p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Route summary</p>
                              <div className="text-sm">
                                {completed} completed, {total - completed} remaining
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last updated</p>
                              <div className="text-sm">
                                {itinerary.lastLocation ? new Date(itinerary.lastLocation.updatedAt).toLocaleTimeString() : "No live location"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3">
                            {itinerary.stops.map((stop, idx) => (
                              <div key={stop.id || `${itinerary.id}-${idx}`} className="rounded-2xl border border-white/10 bg-black/5 p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold">{idx + 1}. {stop.title || "Untitled stop"}</p>
                                    <p className="text-xs text-muted-foreground">{stop.address || "No address provided"}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="text-[11px] uppercase tracking-[0.18em]">
                                      {stop.completed ? "Completed" : "Pending"}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[11px] uppercase tracking-[0.18em]">
                                      {stop.estimatedDurationMinutes ?? 0} min
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span>{stop.travelTimeToNext ?? 0} min to next</span>
                                  {stop.completedAt && <span>Completed at {new Date(stop.completedAt).toLocaleTimeString()}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-surface">
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live route processing</p>
              <p className="text-sm text-muted-foreground">Itineraries update in real time as field teams complete stops or send GPS pings.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manual review</p>
              <p className="text-sm text-muted-foreground">Open each itinerary in the manager dashboard to replay route history and track deviations.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Historical auditing</p>
              <p className="text-sm text-muted-foreground">Filter by date to see exactly which stops were completed and how routes performed each day.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
