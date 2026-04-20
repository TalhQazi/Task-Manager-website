import { lazy, Suspense, useMemo } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { getAuthState } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Tasks = lazy(() => import("@/pages/admin/Tasks"));
const Employees = lazy(() => import("@/pages/admin/Employees"));
const Payroll = lazy(() => import("@/pages/admin/Payroll"));
const TaskHistory = lazy(() => import("@/pages/admin/TaskHistory"));
const EmployeeTaskHistory = lazy(() => import("@/pages/admin/EmployeeTaskHistory"));
const Appliances = lazy(() => import("@/pages/admin/Appliances"));
const Vehicles = lazy(() => import("@/pages/admin/Vehicles"));
const Locations = lazy(() => import("@/pages/admin/Locations"));
const Companies = lazy(() => import("@/pages/admin/Companies"));
const Vendors = lazy(() => import("@/pages/admin/Vendors"));
const Scheduling = lazy(() => import("@/pages/admin/Scheduling"));
const TimeTracking = lazy(() => import("@/pages/admin/TimeTracking"));
const EmployeeTimeHistory = lazy(() => import("@/pages/admin/EmployeeTimeHistory"));
const Messaging = lazy(() => import("@/pages/admin/Messaging"));
const Notifications = lazy(() => import("@/pages/admin/Notifications"));
const DoNotHire = lazy(() => import("@/pages/admin/DoNotHire"));
const Onboarding = lazy(() => import("@/pages/admin/Onboarding"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const ActivityLogs = lazy(() => import("@/pages/admin/ActivityLogs"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const Profile = lazy(() => import("@/pages/admin/Profile"));
const PersonalNotes = lazy(() => import("@/pages/admin/PersonalNotes"));
const RolesPermissions = lazy(() => import("@/pages/admin/RolesPermissions"));
const AsanaImport = lazy(() => import("@/pages/admin/AsanaImport"));
const AsanaData = lazy(() => import("@/pages/admin/AsanaData"));
const DigitalAssets = lazy(() => import("@/pages/admin/DigitalAssets").then(m => ({ default: m.DigitalAssets })));
const IntellectualProperty = lazy(() => import("@/pages/admin/IntellectualProperty").then(m => ({ default: m.IntellectualProperty })));
const NotFound = lazy(() => import("@/pages/admin/NotFound"));
const ArchiveData = lazy(() => import("@/pages/admin/ArchiveData"));
const FounderMessages = lazy(() => import("@/pages/admin/FounderMessages"));
const AssetLibrary = lazy(() => import("@/pages/admin/AssetLibrary"));
const ScrumRecords = lazy(() => import("@/pages/admin/ScrumRecords"));
const EmployeeScrumHistory = lazy(() => import("@/pages/admin/EmployeeScrumHistory"));
const SignaCore = lazy(() => import("@/pages/admin/SignaCore"));
const UphMaintenance = lazy(() => import("@/pages/admin/UphMaintenance"));
const BugReport = lazy(() => import("@/pages/admin/BugReport"));

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid rgba(255,255,255,0.1)",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AdminRoutes() {
  const location = useLocation();
  const auth = getAuthState();

  const routes = useMemo(
    () => [
      { path: "contracts", element: <SignaCore /> },
      { path: "uph-maintenance", element: <UphMaintenance /> },
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
      { path: "digital-assets", element: <DigitalAssets /> },
      { path: "intellectual-property", element: <IntellectualProperty /> },
      { path: "asset-library", element: <AssetLibrary /> },
      { path: "settings", element: <Settings /> },
      { path: "asana-import", element: <AsanaImport /> },
      { path: "asana-data", element: <AsanaData /> },
      { path: "profile", element: <Profile /> },
      { path: "personal-notes", element: <PersonalNotes /> },
      { path: "archive-data", element: <ArchiveData /> },
      { path: "founder-messages", element: <FounderMessages /> },
      { path: "scrum-records", element: <ScrumRecords /> },
      { path: "scrum-records/:employeeName", element: <EmployeeScrumHistory /> },
      { path: "bug-reports", element: <BugReport /> },
      { path: "*", element: <NotFound /> },
    ],
    [],
  );

  const element = useRoutes(routes);

  if (!auth.isAuthenticated || (auth.role !== "admin" && auth.role !== "super-admin")) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </AdminLayout>
  );
}
