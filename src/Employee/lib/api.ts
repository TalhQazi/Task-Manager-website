const API_BASE_URL = import.meta.env.VITE_API_URL || "https://task.se7eninc.com";

export async function employeeApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

   const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };

  

  const authRaw = localStorage.getItem("employee_auth");
  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw);
      if (auth.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
      }
    } catch (e) {
      console.error("Failed to parse employee_auth", e);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Transforms a direct S3 URL into a backend-proxied URL to avoid CORS/OpaqueResponseBlocking issues.
 * If the URL is already a data URL or doesn't match the S3 pattern, it's returned as-is.
 */
export function toProxiedUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  // Pattern for S3 URLs: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const s3Pattern = /^https:\/\/([\w.-]+)\.s3\.([\w.-]+)\.amazonaws\.com\/(.+)$/;
  const match = url.match(s3Pattern);

  if (match) {
    const key = match[3];
    let token = "";
    const authRaw = localStorage.getItem("employee_auth");
    if (authRaw) {
      try {
        const parsed = JSON.parse(authRaw);
        token = parsed.token || "";
      } catch (e) {
        void e;
      }
    }
    return `${API_BASE_URL}/api/s3-proxy/${key}${token ? `?token=${token}` : ""}`;
  }

  // Fallback for cases where it's already a relative path or other non-S3 URL
  return url;
}

// Employee specific API functions
export async function employeeLogin(username: string, password: string) {
  const res = await employeeApiFetch<{ token: string; user: { username: string; role: string } }>(
    "/api/auth/employee-login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );
  return res;
}

export async function getEmployeeProfile() {
  return employeeApiFetch<{ item: { id: string; name: string; email: string; role: string; phone?: string; company?: string; location?: string; status?: string } }>("/api/employees/me");
}

export async function getEmployeeTasks() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      dueDate: string;
      createdAt?: string;
      dueTime?: string;
      assignees?: string[];
      attachmentFileName?: string;
      attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number } | null;
    }>;
  }>("/api/employees/me/tasks");
}

// Get time entry history for employee
export async function getEmployeeTimeEntryHistory() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      date: string;
      clockIn: string;
      clockOut: string;
      clockInAt: string | null;
      clockOutAt: string | null;
      totalHours: number;
      status: string;
      scrum?: string | null;
    }>;
  }>("/api/employees/me/time-entry/history");
}

// Submit scrum and clock out
export async function submitScrumAndClockOut(scrum: string) {
  return employeeApiFetch<{
    item: { 
      id: string; 
      date: string; 
      clockIn: string; 
      clockOut: string; 
      status: string; 
      totalHours: number;
      scrum: string;
    };
  }>("/api/employees/me/clock-out-with-scrum", {
    method: "POST",
    body: JSON.stringify({ scrum }),
  });
}

// Get scrum records for employee
export async function getEmployeeScrumRecords() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      date: string;
      clockIn: string;
      clockOut: string;
      totalHours: number;
      scrum: string;
      createdAt: string;
    }>;
  }>("/api/employees/me/scrum-records");
}

export async function getTaskById(taskId: string) {
  return employeeApiFetch<{
    item: {
      id: string;
      title: string;
      description: string;
      assignees?: string[];
      priority?: string;
      status?: string;
      dueDate?: string | null;
      dueTime?: string;
      createdAt?: string;
      attachmentFileName?: string;
      attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
      updatedAt?: string;
    };
  }>(`/api/tasks/${encodeURIComponent(taskId)}`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  return employeeApiFetch<{ item: unknown }>(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getTaskComments(taskId: string) {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      taskId: string;
      message: string;
      authorUserId: string;
      authorUsername: string;
      authorRole: string;
      createdAt: string;
    }>;
  }>(`/api/tasks/${encodeURIComponent(taskId)}/comments`);
}

export async function addTaskComment(taskId: string, message: string) {
  return employeeApiFetch<{
    item: {
      id: string;
      taskId: string;
      message: string;
      authorUserId: string;
      authorUsername: string;
      authorRole: string;
      createdAt: string;
    };
  }>(`/api/tasks/${encodeURIComponent(taskId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getEmployeeDashboard() {
  return employeeApiFetch<{
    item: {
      tasks: { total: number; completed: number; pending: number; inProgress: number };
      clock: { clockIn: string; clockOut: string; status: string };
      scheduleCount: number;
      unreadMessages: number;
      recentTasks: Array<{ id: string; title: string; status: string; priority: string; dueDate: string }>;
    }
  }>("/api/employees/me/dashboard");
}

export async function getEmployeeSchedule() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      title: string;
      day: string;
      location: string;
      startTime: string;
      endTime: string;
      type: string;
    }>
  }>("/api/employees/me/schedule");
}

export async function getTodayTimeEntry() {
  return employeeApiFetch<{
    item: {
      id: string;
      date: string;
      clockIn: string;
      clockOut: string;
      clockInAt: string | null;
      clockOutAt: string | null;
      totalHours: number;
      status: string;
    } | null;
  }>("/api/employees/me/time-entry/today");
}

export async function clockIn() {
  return employeeApiFetch<{
    item: { id: string; date: string; clockIn: string; clockOut: string; status: string };
  }>("/api/employees/me/clock-in", { method: "POST" });
}

export async function clockOut() {
  return employeeApiFetch<{
    item: { id: string; date: string; clockIn: string; clockOut: string; status: string; totalHours: number };
  }>("/api/employees/me/clock-out", { method: "POST" });
}

// Messages API
export async function getEmployeeConversations(employeeName: string) {
  return employeeApiFetch<{
    items: Array<{
      employee: { id: string; name: string; email: string; department: string; status: string; initials: string };
      lastMessage: { id: string; content: string; timestamp: string; sender: string; status: string } | null;
      unreadCount: number;
    }>;
  }>(`/api/messages/conversations/${encodeURIComponent(employeeName)}`);
}

export async function getConversation(user1: string, user2: string) {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      sender: string;
      recipient: string;
      content: string;
      timestamp: string;
      type: string;
      status: string;
      attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
    }>;
  }>(`/api/messages/conversation/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`);
}

export async function sendMessage(data: {
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  type: "direct";
  status?: string;
  attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number };
}) {
  return employeeApiFetch<{
    item: { id: string; sender: string; recipient: string; content: string; timestamp: string; type: string; status: string; attachment?: { fileName?: string; url?: string; mimeType?: string; size?: number } };
  }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadMessageAttachment(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return employeeApiFetch<{
    attachment: { fileName: string; url: string; mimeType: string; size: number };
  }>("/api/messages/upload", {
    method: "POST",
    body: fd,
  });
}

export async function markMessagesAsRead(sender: string, recipient: string) {
  return employeeApiFetch<{ success: boolean; message: string }>("/api/messages/mark-read", {
    method: "POST",
    body: JSON.stringify({ sender, recipient }),
  });
}

// Personal Notes API
export async function getPersonalNotes() {
  return employeeApiFetch<{ items: Array<{ id: string; title: string; content: string; color: string; isPinned: boolean; updatedAt: string }> }>("/api/notes");
}

export async function createPersonalNote(payload: { title: string; content: string; color?: string; isPinned?: boolean }) {
  return employeeApiFetch<{ item: unknown }>("/api/notes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updatePersonalNote(id: string, payload: unknown) {
  return employeeApiFetch<{ item: unknown }>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deletePersonalNote(id: string) {
  return employeeApiFetch<{ success: boolean }>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}


// Download any URL with authentication for Employee
export async function downloadViaUrl(url: string, fileName: string): Promise<void> {
  const authRaw = localStorage.getItem("employee_auth");
  let token = "";
  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw);
      token = auth.token || "";
    } catch {}
  }
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(objectUrl);
}



// Payroll
export async function getEmployeePayroll() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      payPeriod: string;
      gross: number;
      net: number;
      taxes: number;
      deductions: number;
      pdfUrl: string;
    }>;
  }>("/api/employees/me/payroll");
}

// Tax Docs
export async function getEmployeeTaxDocs(year?: number) {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      year: number;
      type: string;
      fileUrl: string;
    }>;
  }>(`/api/employees/me/tax-docs${year ? `?year=${year}` : ""}`);
}

// Time Logs
export async function getEmployeeTimeLogs() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      date: string;
      clockIn: string;
      clockOut: string;
      totalHours: number;
    }>;
  }>("/api/employees/me/time-logs");
}

// Documents
export async function getEmployeeDocuments() {
  return employeeApiFetch<{
    items: Array<{
      id: string;
      docType: string;
      status: string;
      fileUrl: string;
    }>;
  }>("/api/employees/me/documents");
}

// Profile update
export async function updateEmployeeProfile(data: any) {
  return employeeApiFetch<{ item: any }>("/api/employees/me/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export const updateBankInfo = (data: any) =>
  employeeApiFetch("/api/employees/me/profile/bank", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const updateTaxInfo = (data: any) =>
  employeeApiFetch("/api/employees/me/profile/tax", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const uploadDocument = (formData: FormData) =>
  employeeApiFetch("/api/employees/me/documents", {
    method: "POST",
    body: formData,
  });

export const getDocuments = () =>
  employeeApiFetch("/api/employees/me/documents");

// Comment edit and delete APIs
export async function updateComment(
  taskId: string,
  commentId: string,
  payload: { message: string }
): Promise<{ item: { id: string; message: string; updatedAt: string } }> {
  return employeeApiFetch<{ item: { id: string; message: string; updatedAt: string } }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(
  taskId: string,
  commentId: string
): Promise<{ ok: true }> {
  return employeeApiFetch<{ ok: true }>(`/api/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
}

// Notification API functions
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  return employeeApiFetch<{ success: boolean }>(`/api/messages/${encodeURIComponent(notificationId)}/mark-read`, {
    method: "POST"
  });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return employeeApiFetch<{ success: boolean }>("/api/messages/mark-all-read", {
    method: "POST"
  });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  return employeeApiFetch<void>(`/api/messages/${encodeURIComponent(notificationId)}`, {
    method: "DELETE"
  });
}

