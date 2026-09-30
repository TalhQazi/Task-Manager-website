import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  emitTyping: (taskId: string, username: string) => void;
  emitStopTyping: (taskId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    // Return safe default instead of throwing
    return {
      socket: null,
      isConnected: false,
      joinTask: () => {},
      leaveTask: () => {},
      joinProject: () => {},
      leaveProject: () => {},
      emitTyping: () => {},
      emitStopTyping: () => {},
    } as SocketContextType;
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  
  useEffect(() => {
    // Only connect if user is authenticated
    const authRaw = localStorage.getItem("taskflow_auth");
    const empRaw = localStorage.getItem("employee_auth");
    if (!authRaw && !empRaw) return;

    // Pass the JWT on the handshake so the server can derive privileged rooms
    // (WIP manager/employee rooms) from a verified identity rather than from
    // client-supplied `register-user` claims.
    let handshakeToken = "";
    try {
      const parsed = JSON.parse(authRaw || empRaw || "{}");
      handshakeToken = parsed?.token || "";
    } catch {
      // ignore parse errors — the socket still connects anonymously
    }

    const getSocketUrl = () => {
      const raw = String(import.meta.env.VITE_API_URL || "").trim();
      if (raw) return raw;
      if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
        return "http://localhost:5000";
      }
      return "https://task.se7eninc.com";
    };

    const socket = io(getSocketUrl(), {
      path: "/api/socket.io/",
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: { token: handshakeToken },
    });


    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);

      // Register in a personal room + role room so the backend can send targeted notifications.
      // Admin/manager: username=email (from JWT), name=display name — both rooms needed so
      // @mentions (stored by display name) reach them via the name room.
      // Employee: username=name (display name matches task.assignees storage).
      let username = "";
      let name = "";
      let role = "";
      try {
        const authRaw = localStorage.getItem("taskflow_auth");
        if (authRaw) {
          const auth = JSON.parse(authRaw);
          username = auth.username || auth.name || "";
          name = auth.name || "";
          role = auth.role || "";
        } else {
          const empRaw = localStorage.getItem("employee_auth");
          if (empRaw) {
            const emp = JSON.parse(empRaw);
            username = emp.name || emp.username || emp.email || "";
            role = "employee";
          }
        }
      } catch {
        // ignore parse errors
      }
      if (username) {
        socket.emit("register-user", { username, name, role });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket error:", error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinTask = useCallback((taskId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join-task", taskId);
    }
  }, [isConnected]);

  const leaveTask = useCallback((taskId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave-task", taskId);
    }
  }, [isConnected]);

  const joinProject = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join-project", projectId);
    }
  }, [isConnected]);

  const leaveProject = useCallback((projectId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave-project", projectId);
    }
  }, [isConnected]);

  const emitTyping = useCallback((taskId: string, username: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", { taskId, username });
    }
  }, [isConnected]);

  const emitStopTyping = useCallback((taskId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("stop-typing", { taskId });
    }
  }, [isConnected]);

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    joinTask,
    leaveTask,
    joinProject,
    leaveProject,
    emitTyping,
    emitStopTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
