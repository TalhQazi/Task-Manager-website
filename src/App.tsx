import { lazy, Suspense } from "react";
import { Toaster } from "@/components/manger/ui/toaster";
import { Toaster as Sonner } from "@/components/manger/ui/sonner";
import { TooltipProvider } from "@/components/manger/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/admin/Login";
import EmployeeLogin from "./Employee/screens/Login";
import { getAuthState } from "./lib/auth";
import { getEmployeeAuth } from "./Employee/lib/auth";
import { SocketProvider } from "./contexts/SocketContext";
import { TaskBlasterProvider } from "./contexts/TaskBlasterContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Lazy-load route controllers — each pulls in its own pages lazily
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const ManagerController = lazy(() => import("./routes/ManagerController"));
const DeveloperController = lazy(() => import("./routes/DeveloperController"));
const EmployeeController = lazy(() => import("./Employee/routes/EmployeeController"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function IndexRedirect() {
  const auth = getAuthState();
  const employeeAuth = getEmployeeAuth();
  
  if (employeeAuth) return <Navigate to="/employee" replace />;
  if (!auth.isAuthenticated || !auth.role) return <Navigate to="/login" replace />;
  if (auth.role === "developer") return <Navigate to="/developer" replace />;
  return <Navigate to={auth.role === "admin" || auth.role === "super-admin" ? "/admin" : "/manager"} replace />;
}

const App = () => (
  <SocketProvider>
    <TaskBlasterProvider>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>}>
            <Routes>
              <Route path="/" element={<IndexRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/employee" element={<EmployeeLogin />} />
              <Route path="/admin/*" element={
                <ThemeProvider>
                  <AdminRoutes />
                </ThemeProvider>
              } />
              <Route path="/manager/*" element={
                <ManagerController />
              } />
              <Route path="/developer/*" element={<DeveloperController />} />
              <Route path="/employee/*" element={
                <ThemeProvider>
                  <EmployeeController />
                </ThemeProvider>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </TaskBlasterProvider>
  </SocketProvider>
);

export default App;

