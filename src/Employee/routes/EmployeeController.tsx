import { Navigate, Route, Routes } from "react-router-dom";
import { EmployeeLayout } from "../components/layout/EmployeeLayout";
import EmployeeDashboard from "../screens/Dashboard";
import EmployeeTasks from "../screens/Tasks";
import EmployeeTaskDetails from "../screens/TaskDetails";
import EmployeeSchedule from "../screens/Schedule";
import EmployeeClocked from "../screens/Clocked";
import EmployeeMessages from "../screens/Messages";
import EmployeeProfile from "../screens/Profile";
import EmployeeNotifications from "../screens/Notifications";
import { getEmployeeAuth } from "../lib/auth";

function EmployeeController() {
  const employeeAuth = getEmployeeAuth();
  
  // Redirect to employee login if not authenticated
  if (!employeeAuth) {
    return <Navigate to="/login/employee" replace />;
  }

  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route path="/" element={<EmployeeDashboard />} />
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/tasks" element={<EmployeeTasks />} />
        <Route path="/tasks/:taskId" element={<EmployeeTaskDetails />} />
        <Route path="/schedule" element={<EmployeeSchedule />} />
        <Route path="/clocked" element={<EmployeeClocked />} />
        <Route path="/messages" element={<EmployeeMessages />} />
        <Route path="/profile" element={<EmployeeProfile />} />
        <Route path="/notifications" element={<EmployeeNotifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/employee" replace />} />
    </Routes>
  );
}

export default EmployeeController;
