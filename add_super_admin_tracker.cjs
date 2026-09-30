const fs = require('fs');

const f = 'src/components/admin/layout/Sidebar.tsx';
let content = fs.readFileSync(f, 'utf8');

if (!content.includes('label: "Legal Tracker"')) {
    // 1. Add imports if missing
    const missingImports = ['Gavel', 'Briefcase', 'Scale', 'FileCheck', 'ListTodo', 'Contact'];
    missingImports.forEach(imp => {
        if (!content.includes(imp + ',')) {
            content = content.replace('} from "lucide-react";', `  ${imp},\n} from "lucide-react";`);
        }
    });

    // 2. Insert Legal Tracker in navItemsBase
    const target = '  { icon: ImageIcon, label: "Memes", path: "/admin/memes" },';
    const insert = `  { icon: ImageIcon, label: "Memes", path: "/admin/memes" },
  {
    icon: Gavel,
    label: "Legal Tracker",
    children: [
      { icon: Briefcase, label: "Cases", path: "/admin/legal/cases" },
      { icon: Calendar, label: "Deadlines", path: "/admin/legal/deadlines" },
      { icon: Calendar, label: "Calendar", path: "/admin/legal/calendar" },
      { icon: FileText, label: "Documents", path: "/admin/legal/documents" },
      { icon: Scale, label: "Evidence", path: "/admin/legal/evidence" },
      { icon: FileCheck, label: "Filings", path: "/admin/legal/filings" },
      { icon: ListTodo, label: "Tasks", path: "/admin/legal/tasks" },
      { icon: Contact, label: "Contacts", path: "/admin/legal/contacts" },
      { icon: FileText, label: "Notes", path: "/admin/legal/notes" },
      { icon: Bell, label: "Notifications", path: "/admin/legal/notifications" },
      { icon: BarChart3, label: "Reports", path: "/admin/legal/reports" },
    ],
  },`;

    content = content.replace(target, insert);

    fs.writeFileSync(f, content);
    console.log('Added Legal Tracker to super admin sidebar!');
}
