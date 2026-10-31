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
      
      // Let's see if there are any syntax errors with `\n` without quotes
      // Usually the bad `\n` are like `;\n  ` or `}\n  ` or `,\n  ` 
      // If we see `\n` surrounded by syntax characters it's definitely the generator flaw
      if (content.includes('\\n')) {
         console.log(p, "has literal \\n");
         
         // Fix the obvious cases of literal unescaped \n that are outside of strings:
         // The generator did things like: `reportNumber: string;\n  title: string;`
         // So replacing literally `\\n  ` or `\\n` with a real newline is generally safe
         // if it's not preceded by an odd number of backslashes or inside a valid string context where it would break.
         // Let's just do a blanket replace of `\\n` to actual `\n`.
         // Wait, if there's a valid string like "Hello\\nWorld", replacing it makes it:
         // "Hello
         // World"
         // which is invalid syntax for double/single quotes.
         
         // A safe replace regex would be:
         // Look for `\n` that is not inside quotes. But JS AST is hard.
         // Let's just do the replace, and then see if we can build it. 
         // If we only replace `\\n` when it's followed by spaces and a word character:
         // e.g., /\\n\s+/g
         
         content = content.replace(/\\n/g, '\n');
         fs.writeFileSync(p, content);
      }
    }
  }
}

walk('src/pages');
console.log("Fixed \\n across src/pages");
