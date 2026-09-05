const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf8');
      if (content.includes('\\n')) {
         
         let changed = false;
         
         const regex = /([;},">])\\n(\s+)/g;
         if (regex.test(content)) {
             content = content.replace(regex, '$1\n$2');
             changed = true;
         }

         const regex2 = /""\\n(\s+)/g;
         if (regex2.test(content)) {
             content = content.replace(regex2, '""\n$1');
             changed = true;
         }

         const regex3 = /\\n(\s*<)/g;
         if (regex3.test(content)) {
             content = content.replace(regex3, '\n$1');
             changed = true;
         }

         const regex4 = /\\n(\s*[a-zA-Z0-9_]+\s*:)/g; 
         if (regex4.test(content)) {
             content = content.replace(regex4, '\n$1');
             changed = true;
         }
         
         // Fix the specific issue in legaltrak TableRow: `</TableHead>\\n                <TableHead`
         const regex5 = /<\/TableHead>\\n\s*<TableHead/g;
         if (regex5.test(content)) {
             content = content.replace(/<\/TableHead>\\n/g, '</TableHead>\n');
             changed = true;
         }
         
         const regex6 = /<\/TableCell>\\n\s*<TableCell/g;
         if (regex6.test(content)) {
             content = content.replace(/<\/TableCell>\\n/g, '</TableCell>\n');
             changed = true;
         }

         if (changed) {
            fs.writeFileSync(p, content);
            console.log("Safely Patched", p);
         }
      }
    }
  }
}

walk('src/pages');
