import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import {
  fetchEmployeeLiveOverview,
  fetchSingleEmployeeLive,
  fetchEmployeeActivity,
  type EmployeeOverviewFilterParams,
  type LiveOverviewResponse,
  type SingleEmployeeLiveSnapshot,
} from "@/lib/employeeLiveApi";

/**
 * Hook for Live Overview of the Workforce (Screen A)
 */
export function useEmployeeLiveOverview(filters: EmployeeOverviewFilterParams) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [transportStatus, setTransportStatus] = useState<"live" | "polling">(
    isConnected ? "live" : "polling"
  );

  const queryKey = ["employee-live-overview", filters];

  const query = useQuery<LiveOverviewResponse>({
    queryKey,
    queryFn: () => fetchEmployeeLiveOverview(filters),
    refetchInterval: isConnected ? false : 30000, // 30s polling fallback when disconnected
    staleTime: 5000,
  });

  useEffect(() => {
    setTransportStatus(isConnected ? "live" : "polling");
  }, [isConnected]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      // Invalidate query to reconcile authoritative server state
      queryClient.invalidateQueries({ queryKey: ["employee-live-overview"] });
    };

    socket.on("employee.live.updated", handleUpdate);
    socket.on("assignment.timer.started", handleUpdate);
    socket.on("assignment.timer.paused", handleUpdate);
    socket.on("assignment.timer.resumed", handleUpdate);
    socket.on("assignment.timer.completed", handleUpdate);
    socket.on("wip.summary.updated", handleUpdate);
    socket.on("wip.session.started", handleUpdate);
    socket.on("wip.session.paused", handleUpdate);
    socket.on("wip.session.completed", handleUpdate);

    return () => {
      socket.off("employee.live.updated", handleUpdate);
      socket.off("assignment.timer.started", handleUpdate);
      socket.off("assignment.timer.paused", handleUpdate);
      socket.off("assignment.timer.resumed", handleUpdate);
      socket.off("assignment.timer.completed", handleUpdate);
      socket.off("wip.summary.updated", handleUpdate);
      socket.off("wip.session.started", handleUpdate);
      socket.off("wip.session.paused", handleUpdate);
      socket.off("wip.session.completed", handleUpdate);
    };
  }, [socket, queryClient]);

  return {
    ...query,
    transportStatus,
    isConnected,
  };
}

/**
 * Hook for Single Employee Live Snapshot (Screen B)
 */
export function useSingleEmployeeLive(employeeId: string) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [transportStatus, setTransportStatus] = useState<"live" | "polling">(
    isConnected ? "live" : "polling"
  );

  const queryKey = ["employee-live-single", employeeId];

  const query = useQuery<SingleEmployeeLiveSnapshot>({
    queryKey,
    queryFn: () => fetchSingleEmployeeLive(employeeId),
    enabled: Boolean(employeeId),
    refetchInterval: isConnected ? false : 20000,
    staleTime: 5000,
  });

  useEffect(() => {
    setTransportStatus(isConnected ? "live" : "polling");
  }, [isConnected]);

  useEffect(() => {
    if (!socket || !employeeId) return;

    const handleUpdate = (payload: any) => {
      if (!payload?.employeeId || String(payload.employeeId) === String(employeeId)) {
        queryClient.invalidateQueries({ queryKey: ["employee-live-single", employeeId] });
      }
    };

    socket.on("employee.live.updated", handleUpdate);
    socket.on("assignment.timer.started", handleUpdate);
    socket.on("assignment.timer.paused", handleUpdate);
    socket.on("assignment.timer.resumed", handleUpdate);
    socket.on("assignment.timer.completed", handleUpdate);

    return () => {
      socket.off("employee.live.updated", handleUpdate);
      socket.off("assignment.timer.started", handleUpdate);
      socket.off("assignment.timer.paused", handleUpdate);
      socket.off("assignment.timer.resumed", handleUpdate);
      socket.off("assignment.timer.completed", handleUpdate);
    };
  }, [socket, employeeId, queryClient]);

  return {
    ...query,
    transportStatus,
    isConnected,
  };
}

/**
 * Hook for Activity Timeline pagination
 */
export function useEmployeeActivityTimeline(employeeId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["employee-activity-timeline", employeeId, page, limit],
    queryFn: () => fetchEmployeeActivity(employeeId, page, limit),
    enabled: Boolean(employeeId),
    staleTime: 10000,
  });
}
