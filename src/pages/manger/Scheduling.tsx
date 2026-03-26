import { useMemo, useState } from "react";
import { Button } from "@/components/manger/ui/button";
import { Badge } from "@/components/manger/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/manger/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/manger/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/manger/ui/select";
import { Input } from "@/components/manger/ui/input";
import { toast } from "@/components/manger/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/manger/utils";
import { apiFetch } from "@/lib/manger/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ScheduleEvent {
  id: string;
  title: string;
  assignee: string;
  location: string;
  startTime: string;
  endTime: string;
  type: "task" | "meeting" | "break" | "training";
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

const typeColors = {
  task: "bg-primary/10 border-primary/30 text-primary",
  meeting: "bg-info/10 border-info/30 text-info",
  break: "bg-muted border-muted-foreground/30 text-muted-foreground",
  training: "bg-warning/10 border-warning/30 text-warning",
};

const createEventSchema = z
  .object({
    day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
    title: z.string().min(1, "Title is required"),
    assignee: z.string().min(1, "Assignee is required"),
    location: z.string().min(1, "Location is required"),
    type: z.enum(["task", "meeting", "break", "training"]),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (v) => {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map((x) => Number(x));
        return h * 60 + (Number.isFinite(m) ? m : 0);
      };
      return toMinutes(v.endTime) > toMinutes(v.startTime);
    },
    { message: "End time must be after start time", path: ["endTime"] },
  );

type CreateEventValues = z.infer<typeof createEventSchema>;

type ScheduleEventApi = Omit<ScheduleEvent, "id"> & {
  _id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
};

function normalizeEvent(e: ScheduleEventApi): ScheduleEvent & { day: ScheduleEventApi["day"] } {
  return {
    id: e._id,
    day: e.day,
    title: e.title,
    assignee: e.assignee,
    location: e.location,
    startTime: e.startTime,
    endTime: e.endTime,
    type: e.type,
  };
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map((x) => Number(x));
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

export default function Scheduling() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await apiFetch<{ items: ScheduleEventApi[] }>("/api/events");
      return res.items.map(normalizeEvent);
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (payload: CreateEventValues) => {
      const res = await apiFetch<{ item: ScheduleEventApi }>("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizeEvent(res.item);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, ScheduleEvent[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };

    (eventsQuery.data ?? []).forEach((e) => {
      const day = (e as any).day as string;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({
        id: e.id,
        title: e.title,
        assignee: e.assignee,
        location: e.location,
        startTime: e.startTime,
        endTime: e.endTime,
        type: e.type,
      });
    });

    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    });

    return grouped;
  }, [eventsQuery.data]);

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      day: "Mon",
      title: "",
      assignee: "",
      location: "",
      type: "task",
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  const onCreateEvent = (values: CreateEventValues) => {
    createEventMutation.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
        toast({
          title: "Event scheduled",
          description: "Your event has been added to the schedule.",
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to schedule event",
          description: err instanceof Error ? err.message : "Something went wrong",
        });
      },
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return weekDays.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const today = new Date();

  const weekMonthLabel = useMemo(() => {
    return weekDates[0].toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [weekDates]);

  return (
    <div className="pl-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Scheduling</h1>
          <p className="page-subtitle">Plan and manage team schedules</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>
              Create a new schedule entry.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateEvent)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekDays.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="break">Break</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sarah Williams" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Office" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Week View Grid */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {eventsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading schedule...</div>
        ) : eventsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">
            {eventsQuery.error instanceof Error
              ? eventsQuery.error.message
              : "Failed to load schedule"}
          </div>
        ) : null}

        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(currentWeek);
                prev.setDate(prev.getDate() - 7);
                setCurrentWeek(prev);
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-foreground">{weekMonthLabel}</h3>
            <button
              onClick={() => {
                const next = new Date(currentWeek);
                next.setDate(next.getDate() + 7);
                setCurrentWeek(next);
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Week View */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-4 text-xs font-medium text-muted-foreground uppercase">
                Time
              </div>
              {weekDays.map((day, index) => {
                const date = weekDates[index];
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={day}
                    className={cn(
                      "p-4 text-center border-l border-border",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {day}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-semibold mt-1",
                        isToday ? "text-primary" : "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-border">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[80px]">
                  <div className="p-2 text-xs text-muted-foreground text-right pr-4 pt-0 -mt-2">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const events = (eventsByDay[day] ?? []).filter((event) => {
                      const startMinutes = timeToMinutes(event.startTime);
                      const startHour = Math.floor(startMinutes / 60);
                      return startHour === hour;
                    });
                    const isToday =
                      weekDates[dayIndex].toDateString() === today.toDateString();

                    return (
                      <div
                        key={day}
                        className={cn(
                          "border-l border-border p-1 relative",
                          isToday && "bg-primary/5"
                        )}
                      >
                        {events?.map((event) => {
                          const startMinutes = timeToMinutes(event.startTime);
                          const endMinutes = timeToMinutes(event.endTime);
                          const durationMinutes = Math.max(endMinutes - startMinutes, 15);
                          const startMinuteOfHour = startMinutes % 60;

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute left-1 right-1 p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-md",
                                typeColors[event.type]
                              )}
                              style={{
                                top: `${4 + (startMinuteOfHour / 60) * 80}px`,
                                height: `${(durationMinutes / 60) * 80 - 8}px`,
                              }}
                            >
                              <p className="font-medium truncate">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1 opacity-80">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                              {durationMinutes >= 120 && (
                                <>
                                  <div className="flex items-center gap-1 mt-1 opacity-80">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">
                                      {event.assignee}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 opacity-80">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">
                                      {event.location}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">Event Types:</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary" />
            Task
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-info" />
            Meeting
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-warning" />
            Training
          </span>
        </div>
      </div>
    </div>
  );
}
