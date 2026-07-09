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
const ItineraryHistory = lazy(() => import("@/pages/admin/ItineraryHistory"));
const EmployeeTaskHistory = lazy(() => import("@/pages/admin/EmployeeTaskHistory"));
const Appliances = lazy(() => import("@/pages/admin/Appliances"));
const Vehicles = lazy(() => import("@/pages/admin/Vehicles"));
const Locations = lazy(() => import("@/pages/admin/Locations"));
const Companies = lazy(() => import("@/pages/admin/Companies"));
const Vendors = lazy(() => import("@/pages/admin/Vendors"));
const Scheduling = lazy(() => import("@/pages/admin/Scheduling"));
const TimeTracking = lazy(() => import("@/pages/admin/TimeTracking"));
const EmployeeTimeHistory = lazy(() => import("@/pages/admin/EmployeeTimeHistory"));
const BreakTracking = lazy(() => import("@/pages/admin/BreakTracking"));
const Attendance = lazy(() => import("@/pages/manger/Attendance"));
const Messaging = lazy(() => import("@/pages/admin/Messaging"));
const Notifications = lazy(() => import("@/pages/admin/Notifications"));
const DoNotHire = lazy(() => import("@/pages/admin/DoNotHire"));
const Onboarding = lazy(() => import("@/pages/admin/Onboarding"));
const NewHireReporting = lazy(() => import("@/pages/admin/NewHireReporting"));
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
const VideoMessages = lazy(() => import("@/pages/admin/VideoMessages"));
const AssetLibrary = lazy(() => import("@/pages/admin/AssetLibrary"));
const CompanyInformation = lazy(() => import("@/pages/admin/CompanyInformation"));
const EODReports = lazy(() => import("@/pages/admin/EODReports"));
const LeaveRequests = lazy(() => import("@/pages/admin/LeaveRequests"));
const EmployeeEODHistory = lazy(() => import("@/pages/admin/EmployeeEODHistory"));
const SignaCore = lazy(() => import("@/pages/admin/SignaCore"));
const UphMaintenance = lazy(() => import("@/pages/admin/UphMaintenance"));
const BugReport = lazy(() => import("@/pages/admin/BugReport"));
const ComplianceCenter = lazy(() => import("@/pages/manger/ComplianceCenter"));
const Contributors = lazy(() => import("@/pages/admin/Contributors"));
const ThemeEngine = lazy(() => import("@/pages/admin/ThemeEngine"));
const Memes = lazy(() => import("@/pages/admin/Memes"));

const TeamLeadMappings = lazy(() => import("@/pages/admin/TeamLeadMappings"));
const TaskPermissions = lazy(() => import("@/pages/admin/TaskPermissions"));

const ShoppingLists = lazy(() => import("@/pages/admin/ShoppingLists"));
const SystemEmailSettings = lazy(() => import("@/pages/admin/SystemEmailSettings"));
const SystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));
const CompanyRegistry = lazy(() => import("@/pages/admin/CompanyRegistry"));

const LegalCases = lazy(() => import("@/pages/admin/legaltrak/Cases"));
const LegalDeadlines = lazy(() => import("@/pages/admin/legaltrak/Deadlines"));
const LegalCalendar = lazy(() => import("@/pages/admin/legaltrak/Calendar"));
const LegalDocuments = lazy(() => import("@/pages/admin/legaltrak/Documents"));
const LegalEvidence = lazy(() => import("@/pages/admin/legaltrak/Evidence"));
const LegalFilings = lazy(() => import("@/pages/admin/legaltrak/Filings"));
const LegalTasks = lazy(() => import("@/pages/admin/legaltrak/Tasks"));
const LegalContacts = lazy(() => import("@/pages/admin/legaltrak/Contacts"));
const LegalNotes = lazy(() => import("@/pages/admin/legaltrak/Notes"));
const LegalNotifications = lazy(() => import("@/pages/admin/legaltrak/Notifications"));
const LegalReports = lazy(() => import("@/pages/admin/legaltrak/Reports"));

const CRMDashboard = lazy(() => import("@/pages/admin/crm/Dashboard"));
const CRMContacts = lazy(() => import("@/pages/admin/crm/Contacts"));
const CRMCompanies = lazy(() => import("@/pages/admin/crm/Companies"));
const CRMDeals = lazy(() => import("@/pages/admin/crm/Deals"));
const CRMTasks = lazy(() => import("@/pages/admin/crm/Tasks"));
const CRMCommunication = lazy(() => import("@/pages/admin/crm/Communication"));
const CRMFiles = lazy(() => import("@/pages/admin/crm/Files"));
const CRMCommandCore = lazy(() => import("@/pages/admin/crm/CommandCore"));
const TravelCalendar = lazy(() => import("@/pages/admin/TravelCalendar"));
const Announcements = lazy(() => import("@/pages/admin/Announcements"));
const AtlasBookDashboard = lazy(() => import("@/pages/admin/atlas-book/Dashboard"));
const AtlasBookModulePage = lazy(() => import("@/pages/admin/atlas-book/ModulePage"));




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
      { path: "itineraries", element: <ItineraryHistory /> },
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
      { path: "break-history", element: <BreakTracking /> },
      { path: "attendance", element: <Attendance /> },
      { path: "messaging", element: <Messaging /> },
      { path: "announcements", element: <Announcements /> },
      { path: "video-messages", element: <VideoMessages /> },
      { path: "notifications", element: <Notifications /> },
      { path: "do-not-hire", element: <DoNotHire /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "new-hire-reporting", element: <NewHireReporting /> },
      { path: "reports", element: <Reports /> },
      { path: "activity-logs", element: auth.role === "super-admin" ? <ActivityLogs /> : <Navigate to="/admin" replace /> },
      { path: "digital-assets", element: <DigitalAssets /> },
      { path: "intellectual-property", element: <IntellectualProperty /> },
      { path: "asset-library", element: <AssetLibrary /> },
      { path: "company-information", element: <CompanyInformation /> },
      { path: "settings", element: <Settings /> },
      { path: "asana-import", element: <AsanaImport /> },
      { path: "asana-data", element: <AsanaData /> },
      { path: "profile", element: <Profile /> },
      { path: "personal-notes", element: <PersonalNotes /> },
      { path: "archive-data", element: <ArchiveData /> },
      { path: "founder-messages", element: <FounderMessages /> },
      { path: "eod-reports", element: <EODReports /> },
      { path: "eod-reports/:employeeName", element: <EmployeeEODHistory /> },
      { path: "leave-requests", element: <LeaveRequests /> },
      { path: "contributors", element: <Contributors /> },
      { path: "team-lead-mappings", element: <TeamLeadMappings /> },
      { path: "task-permissions", element: <TaskPermissions /> },

      { path: "legal/cases", element: <LegalCases /> },
      { path: "legal/deadlines", element: <LegalDeadlines /> },
      { path: "legal/calendar", element: <LegalCalendar /> },
      { path: "legal/documents", element: <LegalDocuments /> },
      { path: "legal/evidence", element: <LegalEvidence /> },
      { path: "legal/filings", element: <LegalFilings /> },
      { path: "legal/tasks", element: <LegalTasks /> },
      { path: "legal/contacts", element: <LegalContacts /> },
      { path: "legal/notes", element: <LegalNotes /> },
      { path: "legal/notifications", element: <LegalNotifications /> },
      { path: "legal/reports", element: <LegalReports /> },

      { path: "crm", element: <Navigate to="/admin/crm/dashboard" replace /> },
      { path: "crm/dashboard", element: <CRMDashboard /> },
      { path: "crm/contacts", element: <CRMContacts /> },
      { path: "crm/companies", element: <CRMCompanies /> },
      { path: "crm/deals", element: <CRMDeals /> },
      { path: "crm/tasks", element: <CRMTasks /> },
      { path: "crm/communication", element: <CRMCommunication /> },
      { path: "crm/files", element: <CRMFiles /> },
      { path: "crm/commandcore", element: <CRMCommandCore /> },
      { path: "bug-reports", element: <BugReport /> },
      { path: "compliance-center", element: <ComplianceCenter /> },
      { path: "theme-engine", element: <ThemeEngine /> },
      { path: "memes", element: <Memes /> },
      { path: "shopping-lists", element: <ShoppingLists /> },
      { path: "system-email-settings", element: auth.role === "super-admin" ? <SystemEmailSettings /> : <Navigate to="/admin" replace /> },
      { path: "company-registry", element: <CompanyRegistry /> },
      { path: "travel-calendar", element: <TravelCalendar /> },
      { path: "health", element: <SystemHealth /> },
      { path: "atlas-book", element: <AtlasBookDashboard /> },
      { path: "atlas-book/:moduleId", element: <AtlasBookModulePage /> },

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
