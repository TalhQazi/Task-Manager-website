import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAuthState } from "@/lib/auth";
import { getEmployeeAuth } from "@/Employee/lib/auth";

/**
 * Role-agnostic meeting entry point used by invite emails / shared links.
 * Sends the user into the correct panel room for their current session.
 */
export function resolveMeetingRoomPath(code: string): string | null {
  const clean = String(code || "").trim();
  if (!clean) return null;

  const employeeAuth = getEmployeeAuth();
  if (employeeAuth?.token) {
    return `/employee/meetings/room/${encodeURIComponent(clean)}`;
  }

  const auth = getAuthState();
  if (auth.isAuthenticated && auth.role) {
    if (auth.role === "admin" || auth.role === "super-admin") {
      return `/admin/meetings/room/${encodeURIComponent(clean)}`;
    }
    if (auth.role === "manager" || auth.role === "team-lead") {
      return `/manager/meetings/room/${encodeURIComponent(clean)}`;
    }
    if (auth.role === "developer") {
      return `/manager/meetings/room/${encodeURIComponent(clean)}`;
    }
  }

  return null;
}

export default function MeetingJoinRedirect() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomCode = useMemo(() => {
    return String(code || searchParams.get("code") || "").trim();
  }, [code, searchParams]);

  const target = useMemo(() => {
    if (!roomCode) return null;
    return resolveMeetingRoomPath(roomCode);
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;
    if (target) {
      navigate(target, { replace: true });
    }
  }, [roomCode, target, navigate]);

  if (!roomCode) {
    return <Navigate to="/" replace />;
  }

  if (!target) {
    // Not logged in — preserve join intent through login
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: `/join/meeting/${encodeURIComponent(roomCode)}` } }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0a0f",
        color: "#e2e8f0",
        fontSize: 14,
      }}
    >
      Joining meeting…
    </div>
  );
}
