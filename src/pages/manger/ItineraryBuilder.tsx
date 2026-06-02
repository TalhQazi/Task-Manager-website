import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Plus,
  Trash2,
  Check,
  Shuffle,
  ArrowUp,
  ArrowDown,
  Search,
  Users,
  Compass,
  AlertCircle,
  Briefcase,
  Layers,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/manger/ui/button";
import { Input } from "@/components/manger/ui/input";
import { Badge } from "@/components/manger/ui/badge";
import { toast } from "@/components/manger/ui/use-toast";
import { apiFetch } from "@/lib/manger/api";
import { useSocket } from "@/contexts/SocketContext";

interface Employee {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  _id: string;
  title: string;
  status: string;
  assignees?: string[];
}

interface LocationItem {
  id: string;
  _id: string;
  name: string;
  address: string;
  city: string;
}

interface ItineraryStop {
  id?: string;
  _id?: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  estimatedDurationMinutes: number;
  sequenceOrder: number;
  travelTimeToNext: number;
  taskId?: string;
  locationId?: string;
  completed?: boolean;
}

interface Itinerary {
  id: string;
  _id: string;
  userId: string;
  date: string;
  startTime: string;
  optimized: boolean;
  stops: ItineraryStop[];
}

export default function ItineraryBuilder() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [navApp, setNavApp] = useState<'google' | 'apple' | 'waze'>("google");

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { socket } = useSocket();

  // Search & add stop state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);

  // Form input for new custom stop
  const [customTitle, setCustomTitle] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customLat, setCustomLat] = useState("34.0522"); // Los Angeles default
  const [customLng, setCustomLng] = useState("-118.2437");
  const [customDuration, setCustomDuration] = useState("30");

  // Fetch baseline employees, tasks, locations
  useEffect(() => {
    async function fetchBaselines() {
      try {
        const [empRes, taskRes, locRes] = await Promise.all([
          apiFetch<any>("/api/employees"),
          apiFetch<any>("/api/tasks"),
          apiFetch<any>("/api/locations")
        ]);

        const emps = Array.isArray(empRes) ? empRes : (empRes?.items || []);
        const tsk = Array.isArray(taskRes) ? taskRes : (taskRes?.items || []);
        const loc = Array.isArray(locRes) ? locRes : (locRes?.items || []);

        setEmployees(emps);
        setTasks(tsk);
        setLocations(loc);

        if (emps.length > 0) {
          setSelectedEmployeeId(emps[0]._id || emps[0].id);
        }
      } catch (err) {
        console.error("Error loading baseline data:", err);
      }
    }
    fetchBaselines();
  }, []);

  // Fetch itinerary whenever employee or date changes
  useEffect(() => {
    if (!selectedEmployeeId || !selectedDate) return;
    fetchItinerary();
  }, [selectedEmployeeId, selectedDate]);

  useEffect(() => {
    if (!socket || !itinerary) return;

    const handleItineraryUpdate = (payload: { itineraryId: string; userId: string; date: string; stopId?: string; completed?: boolean; }) => {
      if (payload.itineraryId === itinerary._id) {
        fetchItinerary();
        toast({ title: "Live Sync", description: "Itinerary has been updated in real time." });
      }
    };

    const handleLocationPing = (payload: { itineraryId: string; userId: string; latitude: number; longitude: number; reoptimized: boolean; timestamp: string; }) => {
      if (payload.itineraryId === itinerary._id) {
        fetchItinerary();
        toast({ title: "Live GPS", description: payload.reoptimized ? "Route was reoptimized from current location." : "Live location was received." });
      }
    };

    socket.on("itinerary-update", handleItineraryUpdate);
    socket.on("itinerary-location", handleLocationPing);
    return () => {
      socket.off("itinerary-update", handleItineraryUpdate);
      socket.off("itinerary-location", handleLocationPing);
    };
  }, [socket, itinerary]);

  async function fetchItinerary() {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: Itinerary[] }>(
        `/api/itineraries?employeeId=${selectedEmployeeId}&date=${selectedDate}`
      );
      if (res.items && res.items.length > 0) {
        const item = res.items[0];
        setItinerary(item);
        setStartTime(item.startTime || "08:00");
        const sortedStops = [...item.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        setStops(sortedStops);
      } else {
        setItinerary(null);
        setStops([]);
      }
    } catch (err) {
      console.error("Failed to fetch itinerary", err);
    } finally {
      setLoading(false);
    }
  }

  // Create or save daily itinerary
  async function saveItinerary(updatedStops = stops) {
    if (!selectedEmployeeId) {
      toast({ title: "Selection required", description: "Please select an employee.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        userId: selectedEmployeeId,
        date: selectedDate,
        startTime,
        stops: updatedStops.map((s, idx) => ({ ...s, sequenceOrder: idx }))
      };

      const res = await apiFetch<{ item: Itinerary }>("/api/itineraries", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setItinerary(res.item);
      const sortedStops = [...res.item.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setStops(sortedStops);
      toast({ title: "Itinerary Saved", description: "Daily itinerary has been saved successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Unable to save itinerary", variant: "destructive" });
    }
  }

  // Add search matches
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();

    const matchedTasks = tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .map(t => ({
        type: "task" as const,
        id: t._id || t.id,
        title: t.title,
        subtitle: `Task - Status: ${t.status}`,
        address: "Field Location Assigned",
        lat: 34.0522 + (Math.random() - 0.5) * 0.1, // Generate mock close coords for demo consistency
        lng: -118.2437 + (Math.random() - 0.5) * 0.1
      }));

    const matchedLocations = locations
      .filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q))
      .map(l => ({
        type: "location" as const,
        id: l._id || l.id,
        title: l.name,
        subtitle: `Location - ${l.city}`,
        address: l.address || `${l.city}, CA`,
        lat: 34.0622 + (Math.random() - 0.5) * 0.05,
        lng: -118.2537 + (Math.random() - 0.5) * 0.05
      }));

    return [...matchedTasks, ...matchedLocations];
  }, [searchQuery, tasks, locations]);

  // Add stop triggers
  function addStop(item: { title: string; address: string; lat: number; lng: number; type: "task" | "location"; id: string }) {
    const newStop: ItineraryStop = {
      title: item.title,
      address: item.address,
      latitude: item.lat,
      longitude: item.lng,
      estimatedDurationMinutes: 30,
      sequenceOrder: stops.length,
      travelTimeToNext: 0,
      taskId: item.type === "task" ? item.id : undefined,
      locationId: item.type === "location" ? item.id : undefined,
      completed: false
    };

    const nextStops = [...stops, newStop];
    setStops(nextStops);
    setSearchQuery("");
    setShowAddMenu(false);
    toast({ title: "Stop Added", description: `"${item.title}" added to daily stop list.` });
    saveItinerary(nextStops);
  }

  function addCustomStop() {
    if (!customTitle || !customAddress) {
      toast({ title: "Validation Error", description: "Title and Address are required", variant: "destructive" });
      return;
    }

    const newStop: ItineraryStop = {
      title: customTitle,
      address: customAddress,
      latitude: Number(customLat) || 34.0522,
      longitude: Number(customLng) || -118.2437,
      estimatedDurationMinutes: Number(customDuration) || 30,
      sequenceOrder: stops.length,
      travelTimeToNext: 0,
      completed: false
    };

    const nextStops = [...stops, newStop];
    setStops(nextStops);
    setCustomTitle("");
    setCustomAddress("");
    setCustomLat("34.0522");
    setCustomLng("-118.2437");
    setCustomDuration("30");
    setShowAddMenu(false);
    toast({ title: "Custom Stop Added", description: `"${newStop.title}" added successfully.` });
    saveItinerary(nextStops);
  }

  // Remove stop
  function removeStop(index: number) {
    const nextStops = stops.filter((_, idx) => idx !== index);
    setStops(nextStops);
    toast({ title: "Stop Removed", description: "Stop was deleted from list." });
    saveItinerary(nextStops);
  }

  // Manual re-sequence controls
  function moveStop(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === stops.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const nextStops = [...stops];
    const temp = nextStops[index];
    nextStops[index] = nextStops[targetIdx];
    nextStops[targetIdx] = temp;

    // Save ordered stop sequence indices
    const updated = nextStops.map((s, idx) => ({ ...s, sequenceOrder: idx }));
    setStops(updated);
    saveItinerary(updated);
  }

  // Optimize stops trigger
  async function handleOptimize() {
    if (!itinerary || stops.length <= 1) {
      toast({ title: "Insufficient stops", description: "Add at least 2 stops to optimize route.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ item: Itinerary }>(`/api/itineraries/${itinerary._id}/optimize`, {
        method: "POST"
      });

      setItinerary(res.item);
      const sortedStops = [...res.item.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setStops(sortedStops);
      toast({ title: "Route Optimized!", description: "Shortest route sequence computed and timeline updated." });
    } catch (err: any) {
      toast({ title: "Optimization failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function sendLocationPing(reopt = false) {
    if (!itinerary) return toast({ title: 'No itinerary', description: 'Save or load an itinerary first', variant: 'destructive' });
    if (!navigator.geolocation) return toast({ title: 'Geolocation Unavailable', description: 'Browser geolocation not supported', variant: 'destructive' });

    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        setLoading(true);
        const { latitude, longitude } = pos.coords;
        const res = await apiFetch(`/api/itineraries/${itinerary._id}/location`, {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude, reoptimize: reopt })
        });
        setItinerary(res.item);
        const sortedStops = [...res.item.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        setStops(sortedStops);
        toast({ title: 'Location Sent', description: reopt ? 'Re-optimization attempted' : 'Location saved' });
      } catch (err: any) {
        toast({ title: 'Ping failed', description: err.message || 'Unable to send location', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }, err => {
      toast({ title: 'Geolocation Error', description: err.message || 'Unable to get location', variant: 'destructive' });
    });
  }

  // Generate full day timeline display helper
  const timelineData = useMemo(() => {
    if (stops.length === 0) return [];

    let currentMinutes = 0;
    const [h, m] = startTime.split(":").map(Number);
    if (!isNaN(h)) currentMinutes = h * 60 + (m || 0);

    return stops.map((stop, idx) => {
      const startHour = Math.floor(currentMinutes / 60) % 24;
      const startMin = currentMinutes % 60;
      const startStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;

      const workDuration = stop.estimatedDurationMinutes || 30;
      currentMinutes += workDuration;

      const endHour = Math.floor(currentMinutes / 60) % 24;
      const endMin = currentMinutes % 60;
      const endStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

      const travelTime = stop.travelTimeToNext || 0;
      const nextArrivalMinutes = currentMinutes + travelTime;

      const nextStartHour = Math.floor(nextArrivalMinutes / 60) % 24;
      const nextStartMin = nextArrivalMinutes % 60;
      const nextArrivalStr = `${String(nextStartHour).padStart(2, "0")}:${String(nextStartMin).padStart(2, "0")}`;

      // Increment clock for travel time to next stop
      currentMinutes += travelTime;

      return {
        ...stop,
        startTimeStr: startStr,
        endTimeStr: endStr,
        nextArrivalStr,
        workDuration,
        travelTime
      };
    });
  }, [stops, startTime]);

  function getNavLink(stop: ItineraryStop) {
    const lat = stop.latitude;
    const lng = stop.longitude;
    if (navApp === "apple") return `http://maps.apple.com/?daddr=${lat},${lng}`;
    if (navApp === "waze") return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  return (
    <div className="pl-6 space-y-6 text-white min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Smart Daily Itinerary
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build, structure, and optimize staff schedules with GPS route matrices and dynamic TSP solvers.
          </p>
        </div>
      </div>

      {/* Control Filters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Select Employee
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
            >
              {employees.map(emp => (
                <option key={emp.id || emp._id} value={emp.id || emp._id} className="bg-[#0b0c16]">
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Itinerary Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Start Work Day
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Navigation App
          </label>
          <div className="relative">
            <select
              value={navApp}
              onChange={e => setNavApp(e.target.value as any)}
              className="w-full pl-3 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="google">Google Maps</option>
              <option value="apple">Apple Maps</option>
              <option value="waze">Waze</option>
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <Button
            onClick={() => saveItinerary()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-white/10"
          >
            Apply Time Parameters
          </Button>
        </div>
        <div className="col-span-4 mt-2 flex gap-2">
          <Button size="sm" onClick={() => sendLocationPing(false)} className="bg-gray-700/30">
            Simulate GPS Ping
          </Button>
          <Button size="sm" onClick={() => sendLocationPing(true)} className="bg-emerald-600/20">
            Simulate GPS + Re-optimize
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Stop Manager & Visual Map Node Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" /> Itinerary Stops ({stops.length})
              </h2>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  size="sm"
                  className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Stop
                </Button>

                {stops.length > 1 && (
                  <Button
                    onClick={handleOptimize}
                    disabled={loading}
                    size="sm"
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-emerald-300 hover:from-green-500/30 hover:to-emerald-500/30 border border-emerald-500/30 flex items-center gap-1.5"
                  >
                    <Shuffle className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Auto-Optimize (TSP)
                  </Button>
                )}
              </div>
            </div>

            {/* Dynamic Search & Add Popover Panel */}
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-lg bg-black/60 border border-white/10 space-y-4"
                >
                  {/* Tabs */}
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                      <Search className="w-3.5 h-3.5" /> Integrate Tasks & Locations
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search tasks, clients, locations..."
                      className="pl-9 bg-black/40 border-white/10"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery && (
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-gray-500 p-2">No matching tasks or database locations found.</p>
                      ) : (
                        searchResults.map(item => (
                          <div
                            key={item.id}
                            onClick={() => addStop({ ...item, type: item.type as "task" | "location" })}
                            className="p-2 rounded hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors border border-transparent hover:border-white/10"
                          >
                            <div>
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="text-xs text-gray-400">{item.subtitle}</p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none capitalize">
                              Add {item.type}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Custom Add Form */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or Add Custom Coordinates</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Stop Title (e.g. Acme HQ)"
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                        className="bg-black/40 border-white/10 text-xs"
                      />
                      <Input
                        placeholder="Full Address"
                        value={customAddress}
                        onChange={e => setCustomAddress(e.target.value)}
                        className="bg-black/40 border-white/10 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Latitude (e.g. 34.05)"
                        value={customLat}
                        onChange={e => setCustomLat(e.target.value)}
                        className="bg-black/40 border-white/10 text-xs"
                      />
                      <Input
                        placeholder="Longitude (e.g. -118.2)"
                        value={customLng}
                        onChange={e => setCustomLng(e.target.value)}
                        className="bg-black/40 border-white/10 text-xs"
                      />
                      <Input
                        placeholder="Duration (mins)"
                        type="number"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        className="bg-black/40 border-white/10 text-xs"
                      />
                    </div>
                    <Button onClick={addCustomStop} size="sm" className="w-full bg-blue-600 text-xs hover:bg-blue-700">
                      Add Custom Stop
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List of current stops */}
            {stops.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                <Compass className="w-12 h-12 text-gray-500 mx-auto mb-3 animate-pulse" />
                <h3 className="text-md font-bold mb-1">No stops added yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Click 'Add Stop' to select existing assigned tasks, company sites, or custom addresses for this daily route.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {stops.map((stop, idx) => (
                    <motion.div
                      key={idx}
                      layoutId={`stop-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        stop.completed
                          ? "bg-emerald-950/20 border-emerald-500/20 text-gray-400"
                          : "bg-white/[0.01] border-white/10 hover:border-white/20"
                      }`}
                    >
                      {/* Left: Sequence and Description */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-sm text-blue-400 flex-shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold truncate text-sm ${stop.completed ? "line-through text-gray-500" : "text-white"}`}>
                              {stop.title}
                            </h4>
                            {stop.completed && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px]">
                                Completed
                              </Badge>
                            )}
                            {stop.taskId && (
                              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] flex items-center gap-0.5">
                                <Briefcase className="w-2.5 h-2.5" /> Task
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400" /> {stop.address}
                          </p>
                          <div className="flex gap-4 mt-2 text-[11px] text-gray-500">
                            <span>Duration: <strong className="text-gray-300">{stop.estimatedDurationMinutes} mins</strong></span>
                            <span>GPS: <strong className="text-gray-300">{stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Move Up/Down sequence buttons */}
                        <button
                          onClick={() => moveStop(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStop(idx, "down")}
                          disabled={idx === stops.length - 1}
                          className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Open Deep-link */}
                        <a
                          href={getNavLink(stop)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-white/5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          title="Launch Navigation Map Preview"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Quick alternate deep-links */}
                        <a
                          href={`http://maps.apple.com/?daddr=${stop.latitude},${stop.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 ml-1"
                          title="Open in Apple Maps"
                        >
                          Apple
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${stop.latitude},${stop.longitude}&navigate=yes`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 ml-1"
                          title="Open in Waze"
                        >
                          Waze
                        </a>

                        {/* Remove */}
                        <button
                          onClick={() => removeStop(idx)}
                          className="p-1.5 rounded bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Animated SVG Visual Map Path Overlay */}
          {stops.length > 0 && (
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md relative overflow-hidden">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" /> Route Schema Map
              </h3>
              <div className="relative h-60 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center p-4">
                <svg className="w-full h-full max-w-lg" viewBox="0 0 600 240">
                  {/* Lines representing connections */}
                  {stops.map((stop, idx) => {
                    if (idx === stops.length - 1) return null;
                    const spacing = 500 / Math.max(1, stops.length - 1);
                    const x1 = 50 + idx * spacing;
                    const y1 = 120 + (idx % 2 === 0 ? -30 : 30);
                    const x2 = 50 + (idx + 1) * spacing;
                    const y2 = 120 + ((idx + 1) % 2 === 0 ? -30 : 30);
                    return (
                      <g key={`line-${idx}`}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(99, 102, 241, 0.4)"
                          strokeWidth="3"
                          strokeDasharray="6 4"
                        />
                        {/* Animated travel bubble */}
                        <circle r="4" fill="#60a5fa">
                          <animateMotion
                            dur="5s"
                            repeatCount="Infinity"
                            path={`M ${x1} ${y1} L ${x2} ${y2}`}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Nodes representing stops */}
                  {stops.map((stop, idx) => {
                    const spacing = 500 / Math.max(1, stops.length - 1);
                    const x = 50 + idx * spacing;
                    const y = 120 + (idx % 2 === 0 ? -30 : 30);
                    return (
                      <g key={`node-${idx}`}>
                        {/* Outer pulsing ring */}
                        <circle
                          cx={x}
                          cy={y}
                          r="14"
                          fill="rgba(59, 130, 246, 0.15)"
                          stroke="rgba(59, 130, 246, 0.5)"
                          strokeWidth="1.5"
                        />
                        {/* Inner node */}
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill={stop.completed ? "#10b981" : "#3b82f6"}
                        />
                        {/* Label text */}
                        <text
                          x={x}
                          y={y - 20}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="bold"
                          className="drop-shadow-md select-none"
                        >
                          Stop {idx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-2 right-4 flex gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Pending</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Timeline View Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Day Timeline View
            </h2>

            {timelineData.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-600 animate-pulse" />
                <p className="text-xs">Timeline details will compute automatically as stops are populated.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-white/10 space-y-6 py-2">
                {timelineData.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Anchor */}
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[#0b0c16] flex items-center justify-center ${
                      item.completed
                        ? "border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    }`}>
                      {item.completed && <Check className="w-2.5 h-2.5" />}
                    </span>

                    {/* Timeline Block */}
                    <div className="p-4 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.startTimeStr} - {item.endTimeStr}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.workDuration} min task</span>
                      </div>

                      <h4 className={`font-semibold text-sm ${item.completed ? "line-through text-gray-500" : "text-white"}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-1">{item.address}</p>

                      {/* Travel time display link to next stop */}
                      {idx < timelineData.length - 1 && (
                        <div className="mt-3 -mb-3 pt-3 pb-3 relative">
                          {/* Interconnect line */}
                          <div className="absolute left-[-26px] top-0 bottom-0 border-l border-dashed border-indigo-500/30"></div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1 rounded w-fit">
                            <Navigation className="w-3.5 h-3.5 text-indigo-400 rotate-45" />
                            Travel time to Stop {idx + 2}: {item.travelTimeToNext} mins
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Final End Day block */}
                <div className="relative group">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-indigo-400 bg-[#0b0c16] flex items-center justify-center"></span>
                  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-xs font-bold w-fit">
                    🏁 Estimated EOD: {timelineData[timelineData.length - 1]?.nextArrivalStr || "Complete"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
