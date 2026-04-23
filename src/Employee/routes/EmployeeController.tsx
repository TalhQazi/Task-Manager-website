import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { EmployeeLayout } from "../components/layout/EmployeeLayout";
import { getEmployeeAuth } from "../lib/auth";
import EmployeePayroll from "../screens/payroll";
import TaxDocs from "../screens/TaxDocs";
import TimeLogs from "../screens/TimeLogs";
import Documents from "../screens/Documents";

// Lazy-loaded screens for code splitting
const EmployeeDashboard = lazy(() => import("../screens/Dashboard"));
const EmployeeTasks = lazy(() => import("../screens/Tasks"));
const EmployeeTaskDetails = lazy(() => import("../screens/TaskDetails"));
const EmployeeSchedule = lazy(() => import("../screens/Schedule"));
const EmployeeClocked = lazy(() => import("../screens/Clocked"));
const EmployeeMessages = lazy(() => import("../screens/Messages"));
const EmployeeProfile = lazy(() => import("../screens/Profile"));
const EmployeeNotifications = lazy(() => import("../screens/Notifications"));
const EmployeePersonalNotes = lazy(() => import("../screens/PersonalNotes"));
const EmployeeScrumRecords = lazy(() => import("../screens/ScrumRecords"));
const EmployeeAssetLibrary = lazy(() => import("../screens/AssetLibrary"));
const EmployeeUICustomization = lazy(() => import("../screens/UICustomization"));

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

function EmployeeController() {
  const employeeAuth = getEmployeeAuth();
  
  // Redirect to employee login if not authenticated
  if (!employeeAuth) {
    return <Navigate to="/login/employee" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<EmployeeLayout />}>
          <Route path="/" element={<EmployeeDashboard />} />
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/tasks" element={<EmployeeTasks />} />
          <Route path="/tasks/:taskId" element={<EmployeeTaskDetails />} />
          <Route path="/schedule" element={<EmployeeSchedule />} />
          <Route path="/clocked" element={<EmployeeClocked />} />
          <Route path="/messages" element={<EmployeeMessages />} />
          <Route path="/asset-library" element={<EmployeeAssetLibrary />} />
          <Route path="/profile" element={<EmployeeProfile />} />
          <Route path="/notifications" element={<EmployeeNotifications />} />
          <Route path="/personal-notes" element={<EmployeePersonalNotes />} />

          <Route path="/scrum-records" element={<EmployeeScrumRecords />} />
          <Route path="/ui-customization" element={<EmployeeUICustomization />} />

          <Route path="/payroll" element={<EmployeePayroll />} />
          <Route path="/taxDocs" element={<TaxDocs />} />
          <Route path="/timeLogs" element={<TimeLogs />} />
          <Route path="/documents" element={<Documents />} />

        </Route>
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </Suspense>
  );
}

export default EmployeeController;
