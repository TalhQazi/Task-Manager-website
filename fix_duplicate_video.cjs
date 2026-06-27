const fs = require('fs');
const files = [
  'src/pages/admin/Tasks.tsx',
  'src/pages/manger/Tasks.tsx',
  'src/Employee/screens/Tasks.tsx'
];

const badString = '<div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium">Intro Video URL (YouTube/Vimeo)</label><Input placeholder="https://youtube.com/watch?v=..." value={formData.introVideoUrl || ""} onChange={(e) => setFormData((prev) => ({ ...prev, introVideoUrl: e.target.value }))} /></div><div className="sm:col-span-2 space-y-1.5"><label className="text-sm font-medium">Intro Video URL (YouTube/Vimeo)</label><Input placeholder="https://youtube.com/watch?v=..." value={editForm.watch("introVideoUrl") || ""} onChange={(e) => editForm.setValue("introVideoUrl", e.target.value)} /></div><div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label>';

const goodString = '<div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label>';

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // First, remove the bad string globally and restore "Task Attachments"
    if (content.includes(badString)) {
      content = content.split(badString).join(goodString);
      console.log('Removed duplicate inputs from', f);
    }
    
    // Now safely inject the formData one specifically above the formData "dueTime" or "Task Attachments" inside the create form
    // Let's find a reliable anchor in the Create form:
    // `<div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label>`
    // Wait, the Create form and Edit form BOTH have "Task Attachments". 
    // To distinguish them, we can use `onChange={(e) => setFormData` vs `editForm.setValue`.
    // We already removed it. Let's do a targeted insertion based on context.
    
    fs.writeFileSync(f, content);
  }
});
