import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyItinerary, completeItineraryStop, Itinerary, ItineraryStop } from "../lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Map, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EmployeeItinerary() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [dateStr] = useState(() => {
    // Generates standard YYYY-MM-DD using local timezone to avoid server offsets
    return new Date().toLocaleDateString("en-CA");
  });

  const [loadingStopId, setLoadingStopId] = useState<string | null>(null);

  // Fetch today's itinerary
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["employee-itinerary", dateStr],
    queryFn: async () => {
      const res = await getMyItinerary(dateStr);
      return res.item;
    },
    refetchOnWindowFocus: true,
  });

  // Listen to live socket updates for real-time manager syncing or background changes
  useEffect(() => {
    if (!socket) return;

    const handleItineraryUpdate = (payload: {
      itineraryId: string;
      userId: string;
      date: string;
      stopId: string;
      completed: boolean;
    }) => {
      // Invalidate if this matches today's itinerary
      if (data && data._id === payload.itineraryId) {
        queryClient.invalidateQueries({ queryKey: ["employee-itinerary", dateStr] });
      }
    };

    socket.on("itinerary-update", handleItineraryUpdate);
    return () => {
      socket.off("itinerary-update", handleItineraryUpdate);
    };
  }, [socket, data, queryClient, dateStr]);

  // Handler to toggle check-in completion
  const handleToggleComplete = async (stopId: string, currentCompletedStatus: boolean) => {
    if (!data) return;
    try {
      setLoadingStopId(stopId);
      await completeItineraryStop(data._id || data.id, stopId, !currentCompletedStatus);
      // Update local query cache immediately for responsive UI feel
      queryClient.setQueryData(["employee-itinerary", dateStr], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          stops: oldData.stops.map((s: ItineraryStop) => 
            s._id === stopId ? { ...s, completed: !currentCompletedStatus, completedAt: !currentCompletedStatus ? new Date().toISOString() : null } : s
          )
        };
      });
    } catch (err) {
      console.error("Failed to update stop status", err);
    } finally {
      setLoadingStopId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-gray-400 font-medium">Retrieving your route plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">Failed to load route</h3>
        <p className="text-gray-400 max-w-md">There was a problem retrieving today's itinerary. Please try again.</p>
        <Button onClick={() => refetch()} className="bg-indigo-600 hover:bg-indigo-700">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const stops = data?.stops || [];
  const sortedStops = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  
  // Find current active stop (first uncompleted stop in order)
  const activeStop = sortedStops.find(s => !s.completed);
  // Calculate stats
  const completedCount = stops.filter(s => s.completed).length;
  const totalCount = stops.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate cumulative ETA starting from itinerary startTime
  const calculateTimelineTimes = () => {
    let currentHour = 8;
    let currentMinute = 0;
    
    if (data?.startTime) {
      const parts = data.startTime.split(":");
      if (parts.length >= 2) {
        currentHour = parseInt(parts[0], 10);
        currentMinute = parseInt(parts[1], 10);
      }
    }

    const timeline: Array<{ stopId: string; eta: string; end: string }> = [];

    sortedStops.forEach((stop) => {
      const etaStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      
      // Add duration to get end time
      currentMinute += stop.estimatedDurationMinutes || 30;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
      
      const endStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      
      timeline.push({ stopId: stop._id, eta: etaStr, end: endStr });

      // Add travel time to set up next stop ETA
      currentMinute += stop.travelTimeToNext || 0;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    });

    return timeline;
  };

  const timelineTimes = calculateTimelineTimes();

  // GPS link generators
  const getGoogleMapsUrl = (stop: ItineraryStop) => 
    `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
  
  const getAppleMapsUrl = (stop: ItineraryStop) => 
    `http://maps.apple.com/?daddr=${stop.latitude},${stop.longitude}`;
  
  const getWazeUrl = (stop: ItineraryStop) => 
    `https://waze.com/ul?ll=${stop.latitude},${stop.longitude}&navigate=yes`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Header section with modern background glow */}
      <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
          style={{
            background: "radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.4) 0%, transparent 60%)"
          }}
        />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5 px-2.5 py-0.5">
                Route Engine v1.0
              </Badge>
              <span className="text-xs text-gray-400 font-mono">Date: {dateStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              My Daily Itinerary
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {totalCount > 0 
                ? `You have ${totalCount} stops scheduled for today. Start time is ${data?.startTime || "08:00"}.` 
                : "No itinerary scheduled for today."}
            </p>
          </div>
          
          {totalCount > 0 && (
            <div className="w-full md:w-auto bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col items-end justify-center min-w-[200px]">
              <div className="flex justify-between items-center w-full mb-1">
                <span className="text-xs text-gray-400">Route Progress</span>
                <span className="text-sm font-semibold text-indigo-400 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 self-start flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>{completedCount} of {totalCount} stops checked in</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {totalCount === 0 ? (
        <Card className="border-dashed border-white/10 bg-black/20 backdrop-blur-sm p-12 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Map className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Route Scheduled</h3>
              <p className="text-gray-400 max-w-sm text-sm">
                Your manager hasn't published an itinerary for you today. If this is an error, please contact dispatch.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Focused Active Stop Card */}
          <div className="lg:col-span-7 space-y-4">
            {activeStop ? (
              <div 
                className="relative rounded-2xl border-2 border-indigo-500/50 bg-[#1e1b4b]/20 backdrop-blur-md overflow-hidden p-6 shadow-2xl transition-all"
                style={{
                  boxShadow: "inset 0 0 24px rgba(99, 102, 241, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.4)"
                }}
              >
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-indigo-600/90 text-white font-bold animate-pulse px-3 py-1">
                    UP NEXT
                  </Badge>
                </div>
                
                <div className="flex items-start gap-4 mt-2">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 pr-16">
                    <h3 className="text-xl font-bold text-white tracking-wide">{activeStop.title}</h3>
                    <p className="text-sm text-gray-300 font-medium flex items-center gap-1.5">
                      <span>Stop #{activeStop.sequenceOrder + 1}</span>
                      <span className="text-gray-500">•</span>
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{activeStop.estimatedDurationMinutes} mins duration</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Stop Address</p>
                  <p className="text-sm text-white font-medium mt-0.5">{activeStop.address || "No address provided"}</p>
                </div>

                {/* GPS Launch Buttons */}
                <div className="mt-6 space-y-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> Launch GPS Navigation
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <a 
                      href={getGoogleMapsUrl(activeStop)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-indigo-500/50 transition text-center group"
                    >
                      <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">Google Maps</span>
                      <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-indigo-400 mt-1" />
                    </a>
                    
                    <a 
                      href={getAppleMapsUrl(activeStop)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-indigo-500/50 transition text-center group"
                    >
                      <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">Apple Maps</span>
                      <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-indigo-400 mt-1" />
                    </a>

                    <a 
                      href={getWazeUrl(activeStop)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-indigo-500/50 transition text-center group"
                    >
                      <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">Waze GPS</span>
                      <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-indigo-400 mt-1" />
                    </a>
                  </div>
                </div>

                {/* Big Complete Button */}
                <div className="mt-8 pt-4 border-t border-white/5">
                  <Button 
                    onClick={() => handleToggleComplete(activeStop._id, false)}
                    disabled={loadingStopId === activeStop._id}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                  >
                    {loadingStopId === activeStop._id ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    <span>Complete & Check-In Stop</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="border border-emerald-500/30 bg-emerald-500/5 p-8 text-center rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Check className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">All Done!</h3>
                    <p className="text-gray-400 max-w-sm text-sm">
                      You have successfully checked in and completed all stops scheduled for today. Great work!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General tips */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-300 font-semibold uppercase tracking-wider">Dynamic Schedule Notes</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  The schedule times and stop orders are auto-calculated for the shortest duration. Toggling a stop complete updates your dashboard and logs the check-in immediately.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Timeline */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Route Progress Timeline</h3>
            
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 overflow-hidden">
              <div className="absolute left-9 top-10 bottom-10 w-[2px] bg-gradient-to-b from-indigo-500/60 via-indigo-500/20 to-transparent pointer-events-none" />

              <div className="space-y-6 relative">
                {sortedStops.map((stop, index) => {
                  const isCompleted = stop.completed;
                  const isActive = activeStop && activeStop._id === stop._id;
                  const timeItem = timelineTimes.find(t => t.stopId === stop._id);

                  return (
                    <div 
                      key={stop._id}
                      className={cn(
                        "relative flex gap-4 items-start group rounded-xl p-2 transition",
                        isActive && "bg-white/5 border border-white/10 shadow-md"
                      )}
                    >
                      {/* Left: Stop time or checkmark indicator */}
                      <div className="flex flex-col items-center mt-1 z-10">
                        {isCompleted ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-black border-2 border-black shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                            <Check className="h-3.5 w-3.5 stroke-[3px]" />
                          </div>
                        ) : isActive ? (
                          <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white border-2 border-black animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                            <Circle className="h-3 w-3 fill-current" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-black border-[2px] border-gray-600 flex items-center justify-center text-gray-500">
                            <Circle className="h-2 w-2" />
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-gray-400 mt-2 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                          {timeItem?.eta || "08:00"}
                        </span>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 
                            className={cn(
                              "text-sm font-bold truncate transition-all",
                              isCompleted ? "text-gray-500 line-through font-normal" : "text-white",
                              isActive && "text-indigo-400"
                            )}
                          >
                            {stop.title}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">
                            {stop.estimatedDurationMinutes}m
                          </span>
                        </div>
                        
                        <p className={cn(
                          "text-xs truncate", 
                          isCompleted ? "text-gray-600" : "text-gray-400"
                        )}>
                          {stop.address}
                        </p>

                        {!isCompleted && (
                          <div className="pt-2 flex items-center gap-3">
                            <Button 
                              size="sm"
                              variant="ghost" 
                              onClick={() => handleToggleComplete(stop._id, isCompleted)}
                              disabled={loadingStopId === stop._id}
                              className={cn(
                                "h-7 px-2 text-xs font-semibold rounded-md border",
                                isActive 
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20" 
                                  : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/5"
                              )}
                            >
                              {loadingStopId === stop._id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                "Check In"
                              )}
                            </Button>

                            <a
                              href={getGoogleMapsUrl(stop)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-gray-400 hover:text-indigo-400 flex items-center gap-0.5 transition font-semibold"
                            >
                              <span>Navigate</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Done
                            </span>
                            <button
                              onClick={() => handleToggleComplete(stop._id, isCompleted)}
                              disabled={loadingStopId === stop._id}
                              className="text-[10px] text-gray-500 hover:text-red-400 transition"
                            >
                              (Undo)
                            </button>
                          </div>
                        )}

                        {/* Travel time to next stop */}
                        {index < sortedStops.length - 1 && stop.travelTimeToNext > 0 && !isCompleted && (
                          <div className="mt-2 text-[10px] text-gray-400 bg-black/40 border border-white/5 rounded-md p-1.5 flex items-center gap-1.5 w-fit">
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                            <span>🚗 Drive ~{stop.travelTimeToNext} mins to next stop</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
