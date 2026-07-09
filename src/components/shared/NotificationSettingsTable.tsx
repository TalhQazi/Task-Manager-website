import { Switch } from "@/components/ui/switch";

interface PreferenceObject {
  taskAssignment?: boolean;
  projectAssignment?: boolean;
  commentAdded?: boolean;
  replyAdded?: boolean;
  taskCompleted?: boolean;
  eodMissAlert?: boolean;
  eodComment?: boolean;
  messageAlert?: boolean;
  systemAlert?: boolean;
  patentExpiration?: boolean;
  complianceReminder?: boolean;
  userRegistration?: boolean;
  lunchBreakAlert?: boolean;
  websiteDownAlert?: boolean;
  [key: string]: boolean | undefined;
}

interface NotificationSettingsTableProps {
  emailPreferences: PreferenceObject;
  webPreferences: PreferenceObject;
  userRole: string;
  onChange: (type: "email" | "web", key: string, val: boolean) => void;
}

interface CategoryItem {
  key: string;
  name: string;
  description: string;
  roles?: string[]; // If undefined, visible to all roles
}

const CATEGORIES: CategoryItem[] = [
  {
    key: "taskAssignment",
    name: "Task Assignments",
    description: "Triggered when a task is assigned or reassigned to you.",
  },
  {
    key: "projectAssignment",
    name: "Project Assignments",
    description: "Triggered when you are added to a project.",
  },
  {
    key: "commentAdded",
    name: "Task Comments",
    description: "Triggered when a comment is added to a task you are assigned to.",
  },
  {
    key: "replyAdded",
    name: "Mentions & Replies",
    description: "Triggered when another team member @mentions you or replies to your comments.",
  },
  {
    key: "taskCompleted",
    name: "Task Completions",
    description: "Triggered when an assignee completes a task. (Recommended for Managers/Admins)",
    roles: ["super-admin", "admin", "manager"],
  },
  {
    key: "eodMissAlert",
    name: "EOD Missed Reminders",
    description: "Daily reminder and missed report notifications at 10 PM. (Excludes Super-Admins)",
    roles: ["admin", "manager", "employee"],
  },
  {
    key: "eodComment",
    name: "EOD Comments",
    description: "Triggered when someone comments on an EOD report.",
  },
  {
    key: "messageAlert",
    name: "Direct Messages",
    description: "Triggered for offline direct messages and real-time chat alerts.",
  },
  {
    key: "systemAlert",
    name: "Compliance & System Alerts",
    description: "Labor violation notifications, geofence check-in mismatch, or configuration logs.",
  },
  {
    key: "patentExpiration",
    name: "Patent Expirations",
    description: "Critical daily reminders for patents approaching their expiration dates.",
    roles: ["super-admin", "admin"],
  },
  {
    key: "complianceReminder",
    name: "Regulatory Filings",
    description: "Notifications for annual reports and corporate tax filing deadlines.",
    roles: ["super-admin", "admin"],
  },
  {
    key: "userRegistration",
    name: "New User Registrations",
    description: "Notification when new user or manager accounts are registered in the system.",
    roles: ["super-admin", "admin", "manager"],
  },
  {
    key: "lunchBreakAlert",
    name: "Lunch & Break Status Alerts",
    description: "Triggered when employees start/end lunch/breaks or exceed status limits.",
    roles: ["super-admin", "admin", "manager"],
  },
  {
    key: "websiteDownAlert",
    name: "Website Down Alerts",
    description: "Triggered immediately when monitored websites go down or fail health checks.",
  },
];

export default function NotificationSettingsTable({
  emailPreferences,
  webPreferences,
  userRole,
  onChange,
}: NotificationSettingsTableProps) {
  const normalizedRole = userRole.toLowerCase().trim();

  // Filter categories by role visibility
  const visibleCategories = CATEGORIES.filter((cat) => {
    if (!cat.roles) return true;
    return cat.roles.includes(normalizedRole);
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="p-4 font-semibold text-foreground">Notification Category</th>
            <th className="p-4 text-center font-semibold text-foreground w-36">Email Alerts</th>
            <th className="p-4 text-center font-semibold text-foreground w-36">In-App Alerts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visibleCategories.map((cat) => {
            const isEmailOn = emailPreferences[cat.key] !== false;
            const isWebOn = webPreferences[cat.key] !== false;

            return (
              <tr key={cat.key} className="hover:bg-muted/20 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 max-w-md">
                    {cat.description}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={isEmailOn}
                      onCheckedChange={(val) => onChange("email", cat.key, val)}
                    />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={isWebOn}
                      onCheckedChange={(val) => onChange("web", cat.key, val)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
