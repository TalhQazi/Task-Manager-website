import { apiFetch } from "@/lib/admin/apiClient";
import EmployeeAnnouncements from "@/pages/employee/Announcements";

/**
 * Manager panel: same announcements UI as employees, using manager JWT (apiFetch).
 */
export default function ManagerAnnouncements() {
  return <EmployeeAnnouncements fetchJson={apiFetch} cacheScope="manager" />;
}
