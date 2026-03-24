import { useMemo } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { getAuthState } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

import Dashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import Tasks from "@/pages/admin/Tasks";
import Employees from "@/pages/admin/Employees";
import Payroll from "@/pages/admin/Payroll";
import TaskHistory from "@/pages/admin/TaskHistory";
import EmployeeTaskHistory from "@/pages/admin/EmployeeTaskHistory";
import Appliances from "@/pages/admin/Appliances";
import Vehicles from "@/pages/admin/Vehicles";
import Locations from "@/pages/admin/Locations";
import Companies from "@/pages/admin/Companies";
import Vendors from "@/pages/admin/Vendors";
import Scheduling from "@/pages/admin/Scheduling";
import TimeTracking from "@/pages/admin/TimeTracking";
import EmployeeTimeHistory from "@/pages/admin/EmployeeTimeHistory";
import Messaging from "@/pages/admin/Messaging";
import Notifications from "@/pages/admin/Notifications";
import DoNotHire from "@/pages/admin/DoNotHire";
import Onboarding from "@/pages/admin/Onboarding";
import Reports from "@/pages/admin/Reports";
import ActivityLogs from "@/pages/admin/ActivityLogs";
import Settings from "@/pages/admin/Settings";
import Profile from "@/pages/admin/Profile";
import RolesPermissions from "@/pages/admin/RolesPermissions";
import AsanaImport from "@/pages/admin/AsanaImport";
import AsanaData from "@/pages/admin/AsanaData";
import BugReport from "@/pages/admin/BugReport";
import NotFound from "@/pages/admin/NotFound";

export default function AdminRoutes() {
  const location = useLocation();
  const auth = getAuthState();

  const routes = useMemo(
    () => [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "roles", element: <RolesPermissions /> },
      { path: "tasks", element: <Tasks /> },
      { path: "employees", element: <Employees /> },
      { path: "payroll", element: <Payroll /> },
      { path: "task-history", element: <TaskHistory /> },
      { path: "task-history/:employee", element: <EmployeeTaskHistory /> },
      { path: "appliances", element: <Appliances /> },
      { path: "vehicles", element: <Vehicles /> },
      { path: "locations", element: <Locations /> },
      { path: "companies", element: <Companies /> },
      { path: "vendors", element: <Vendors /> },
      { path: "scheduling", element: <Scheduling /> },
      { path: "time-tracking", element: <TimeTracking /> },
      { path: "time-tracking/history/:employee", element: <EmployeeTimeHistory /> },
      { path: "messaging", element: <Messaging /> },
      { path: "notifications", element: <Notifications /> },
      { path: "do-not-hire", element: <DoNotHire /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "reports", element: <Reports /> },
      { path: "activity-logs", element: auth.role === "super-admin" ? <ActivityLogs /> : <Navigate to="/admin" replace /> },
      { path: "settings", element: <Settings /> },
      { path: "asana-import", element: <AsanaImport /> },
      { path: "asana-data", element: <AsanaData /> },
      { path: "bug-report", element: <BugReport /> },
      { path: "profile", element: <Profile /> },
      { path: "*", element: <NotFound /> },
    ],
    [],
  );

  const element = useRoutes(routes);

  if (!auth.isAuthenticated || (auth.role !== "admin" && auth.role !== "super-admin")) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AdminLayout>{element}</AdminLayout>;
}
