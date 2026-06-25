const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'pages', 'atlasbooks'),
  path.join(__dirname, 'src', 'pages', 'admin', 'atlas-book')
];

function getFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.tsx')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const allFiles = dirs.flatMap(d => getFiles(d));

let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace useState initialized with array of objects
  // e.g. const [expenses, setExpenses] = useState<CardExpense[]>([ { ... } ]);
  content = content.replace(/(useState<[^>]+>\()\[[\s\S]*?\](\))/g, '$1[]$2');

  // Replace variable assignments with mock arrays
  // const data = [ ... ]
  const arrayNames = [
    'cashFlowData', 'heatmapRows', 'transactions', 'vendors', 'tasks',
    'expenses', 'properties', 'units', 'budgetData', 'alerts',
    'anomalies', 'staffData', 'assets', 'approvals', 'liens', 'forecasts',
    'statements', 'revenueData', 'expenseData', 'occupancyData',
    'noiData', 'maintenanceData', 'mockData', 'dummyData', 'mock'
  ];

  for (const name of arrayNames) {
    // Regex to match: const name = [ ... ]; OR const name: Type[] = [ ... ];
    const regex = new RegExp(`(const\\s+${name}(?:\\s*:\\s*[A-Za-z\\[\\]<>]+)?\\s*=\\s*)\\[([\\s\\S]*?)\\]\\s*;`, 'g');
    content = content.replace(regex, (match, prefix, arrayContent) => {
      // Only replace if the array looks like it has objects or non-empty strings/numbers (avoid empty arrays)
      if (arrayContent.trim() !== '') {
        return `${prefix}[];`;
      }
      return match;
    });
  }

  // Replace Math.round(...) mock calculations with 0
  content = content.replace(/(const\s+\w+\s*=\s*)Math\.round\([^)]+\)\s*;/g, '$10;');
  
  // Replace simple math mock calculations like cash * 0.15 with 0
  content = content.replace(/(const\s+\w+\s*=\s*)[a-zA-Z]+\s*\*\s*0\.\d+\s*;/g, '$10;');

  // Replace literal numbers assigned to constants (e.g. const target = 1000)
  // We need to be careful not to break legitimate constants.
  // We will only do this if they are commented with 'mock' or 'dummy' or similar.
  // Alternatively, just let them be if they aren't arrays.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Modified:', file);
  }
}

console.log(`\nModified ${modifiedCount} files out of ${allFiles.length} total.`);
