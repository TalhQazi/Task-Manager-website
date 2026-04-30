import { lazy, Suspense, useMemo } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { MainLayout } from "@/components/manger/layout/MainLayout";
import { getAuthState } from "@/lib/auth";

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import("@/pages/manger/Dashboard"));
const Tasks = lazy(() => import("@/pages/manger/Tasks"));
const Employees = lazy(() => import("@/pages/manger/Employees"));
const Scheduling = lazy(() => import("@/pages/manger/Scheduling"));
const TimeTracking = lazy(() => import("@/pages/manger/TimeTracking"));
const Attendance = lazy(() => import("@/pages/manger/Attendance"));
const Payroll = lazy(() => import("@/pages/manger/Payroll"));
const Profile = lazy(() => import("@/pages/manger/Profile"));
const EODReports = lazy(() => import("@/pages/manger/EODReports"));
const LeaveRequests = lazy(() => import("@/pages/manger/LeaveRequests"));
const EmployeeTimeHistory = lazy(() => import("@/pages/manger/EmployeeTimeHistory"));
const Vehicles = lazy(() => import("@/pages/manger/Vehicles"));
const Appliances = lazy(() => import("@/pages/manger/Appliances"));
const Locations = lazy(() => import("@/pages/manger/Locations"));
const Vendors = lazy(() => import("@/pages/manger/Vendors"));
const Messages = lazy(() => import("@/pages/manger/Messages"));
const Notifications = lazy(() => import("@/pages/manger/Notifications"));
const Settings = lazy(() => import("@/pages/manger/Settings"));
const DoNotHire = lazy(() => import("@/pages/manger/DoNotHire"));
const OnboardingMonitoring = lazy(() => import("@/pages/manger/OnboardingMonitoring"));
const Reports = lazy(() => import("@/pages/manger/Reports"));
const FounderMessages = lazy(() => import("@/pages/manger/FounderMessages"));
const NotFound = lazy(() => import("@/pages/manger/NotFound"));
const PersonalNotes = lazy(() => import("@/pages/manger/PersonalNotes"));
const UICustomization = lazy(() => import("@/pages/manger/UICustomization"));
const SignaCore = lazy(() => import("@/pages/admin/SignaCore"));
const UphMaintenance = lazy(() => import("@/pages/admin/UphMaintenance"));
const ShoppingLists = lazy(() => import("@/pages/admin/ShoppingLists"));

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

export default function ManagerController() {
  const location = useLocation();
  const auth = getAuthState();
// adding routes
  const routes = useMemo(
    () => [
      { path: "contracts", element: <SignaCore /> },
      { path: "uph-maintenance", element: <UphMaintenance /> },
      { index: true, element: <Dashboard /> },
      { path: "tasks", element: <Tasks /> },
      { path: "employees", element: <Employees /> },
      { path: "scheduling", element: <Scheduling /> },
      { path: "time-tracking", element: <TimeTracking /> },
      { path: "attendance", element: <Attendance /> },
      { path: "payroll", element: <Payroll /> },
      { path: "profile", element: <Profile /> },
      { path: "eod-reports", element: <EODReports /> },
      { path: "leave-requests", element: <LeaveRequests /> },
      { path: "time-tracking/history/:employee", element: <EmployeeTimeHistory /> },
      { path: "vehicles", element: <Vehicles /> },
      { path: "appliances", element: <Appliances /> },
      { path: "locations", element: <Locations /> },
      { path: "vendors", element: <Vendors /> },
      { path: "do-not-hire", element: <DoNotHire /> },
      { path: "onboarding", element: <OnboardingMonitoring /> },
      { path: "reports", element: <Reports /> },
      { path: "founder-messages", element: <FounderMessages /> },
      { path: "messages", element: <Messages /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
      { path: "personal-notes", element: <PersonalNotes /> },
      { path: "ui-customization", element: <UICustomization /> },
      { path: "shopping-lists", element: <ShoppingLists /> },
      { path: "*", element: <NotFound /> },
    ],
    [],
  );

  const element = useRoutes(routes);

  if (!auth.isAuthenticated || auth.role !== "manager") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </MainLayout>
  );
}
