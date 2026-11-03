const fs = require('fs');

const files = [
  'src/pages/admin/Tasks.tsx',
  'src/pages/manger/Tasks.tsx',
  'src/Employee/screens/Tasks.tsx'
];

const createInsert = `
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Intro Video URL (YouTube/Vimeo)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={formData.introVideoUrl || ""} onChange={(e) => setFormData((prev) => ({ ...prev, introVideoUrl: e.target.value }))} />
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label>`;

const editInsert = `
              <FormField
                control={editForm.control}
                name="introVideoUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Intro Video URL (YouTube/Vimeo)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-1.5 pt-2">
                <FormLabel>Task Attachments</FormLabel>`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');

    // For create task form
    const createTarget = '<div className="space-y-1.5"><label className="text-sm font-medium">Task Attachments</label>';
    
    // Check if we haven't already inserted the create task one
    if (!content.includes('value={formData.introVideoUrl || ""}')) {
        content = content.replace(createTarget, createInsert);
        console.log('Added create Intro Video URL to', f);
    }

    if (!content.includes('name="introVideoUrl"')) {
        const editTargetFallback = /<div className="space-y-1\.5 pt-2">\s*<FormLabel>Task Attachments<\/FormLabel>/;
        if (editTargetFallback.test(content)) {
            content = content.replace(editTargetFallback, editInsert);
            console.log('Added edit Intro Video URL to', f);
        } else {
             // Let's try matching just FormLabel
             const editTargetFallback2 = /<FormLabel>Task Attachments<\/FormLabel>/;
             if (editTargetFallback2.test(content)) {
                  content = content.replace(editTargetFallback2, editInsert.replace('<div className="space-y-1.5 pt-2">\n                <FormLabel>Task Attachments</FormLabel>', '<FormLabel>Task Attachments</FormLabel>'));
                  console.log('Added edit Intro Video URL to', f, 'using fallback');
             }
        }
    }
    
    fs.writeFileSync(f, content);
  }
});
