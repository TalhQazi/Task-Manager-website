const API_BASE_URL = import.meta.env.VITE_API_URL || "https://task.se7eninc.com";

export async function employeeApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
  return employeeApiFetch<{ item: any }>(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
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
}) {
  return employeeApiFetch<{
    item: { id: string; sender: string; recipient: string; content: string; timestamp: string; type: string; status: string };
  }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markMessagesAsRead(sender: string, recipient: string) {
  return employeeApiFetch<{ success: boolean; message: string }>("/api/messages/mark-read", {
    method: "POST",
    body: JSON.stringify({ sender, recipient }),
  });
}
