const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages', 'atlasbooks');
const targetArrays = ['lines', 'assetRoster', 'roster', 'tickets', 'rollovers', 'deeds', 'deedRecords', 'workOrders', 'payrollRuns'];

function processDir(d) {
  if (!fs.existsSync(d)) return;
  const files = fs.readdirSync(d);
  for (const file of files) {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const name of targetArrays) {
        const regex = new RegExp(`(const\\s+${name}\\s*(?::\\s*[A-Za-z\\[\\]<>]+)?\\s*=\\s*)\\[([\\s\\S]*?)\\]\\s*;`, 'g');
        content = content.replace(regex, (match, prefix, arrayContent) => {
          if (arrayContent.trim() !== '') {
            console.log('Cleared ' + name + ' in ' + path.basename(fullPath));
            return prefix + '[];';
          }
          return match;
        });
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
processDir(dir);
