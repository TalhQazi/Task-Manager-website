import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Briefcase,
  Search,
  Filter,
} from "lucide-react";
import { getEmployeeSchedule } from "../lib/api";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

interface ScheduleEvent {
  id: string;
  title: string;
  day: string;
  location: string;
  startTime: string;
  endTime: string;
  type: string;
}

export default function EmployeeSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await getEmployeeSchedule();
        setEvents(res.items || []);
      } catch (err) {
        console.error("Failed to load schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const now = new Date();

  // Parse event dates and sort
  const parseEventDate = (event: ScheduleEvent): Date | null => {
    if (!event.day) return null;
    try {
      return parseISO(event.day);
    } catch {
      return null;
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || event.type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = parseEventDate(a);
    const dateB = parseEventDate(b);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  // Group events
  const upcomingEvents = sortedEvents.filter((e) => {
    const date = parseEventDate(e);
    return date && isAfter(date, addDays(now, -1));
  });

  const pastEvents = sortedEvents.filter((e) => {
    const date = parseEventDate(e);
    return date && isBefore(date, now);
  });

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "meeting":
        return "bg-purple-100 text-purple-700";
      case "shift":
        return "bg-blue-100 text-blue-700";
      case "training":
        return "bg-green-100 text-green-700";
      case "overtime":
        return "bg-orange-100 text-orange-700";
      case "holiday":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatEventDate = (day: string) => {
    try {
      const date = parseISO(day);
      return format(date, "MMM d, yyyy");
    } catch {
      return day || "No date";
    }
  };

  const formatEventDay = (day: string) => {
    try {
      const date = parseISO(day);
      const today = new Date();
      const tomorrow = addDays(today, 1);

      if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
        return "Today";
      }
      if (format(date, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) {
        return "Tomorrow";
      }
      return format(date, "EEEE");
    } catch {
      return "";
    }
  };

  const uniqueTypes = Array.from(new Set(events.map((e) => e.type).filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-pulse" />
            <p className="text-muted-foreground">Loading schedule...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <Badge variant="outline" className="text-sm">
          {upcomingEvents.length} upcoming
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Upcoming Events
            {upcomingEvents.length > 0 && (
              <Badge className="bg-[#133767]">{upcomingEvents.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#133767]/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-[#133767]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatEventDate(event.day)}
                            {formatEventDay(event.day) && (
                              <span className="text-[#133767] font-medium">
                                ({formatEventDay(event.day)})
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.startTime || "--:--"} - {event.endTime || "--:--"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location || "No location"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600">
              <CalendarIcon className="h-5 w-5" />
              Past Events
              <Badge variant="outline">{pastEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {pastEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 transition-colors opacity-60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatEventDate(event.day)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.startTime || "--:--"} - {event.endTime || "--:--"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location || "No location"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pastEvents.length > 5 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  +{pastEvents.length - 5} more past events
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
