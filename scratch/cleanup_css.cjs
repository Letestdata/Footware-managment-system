const fs = require('fs');
const path = './src/css/Dashbord.css';
let content = fs.readFileSync(path, 'utf8');

// The file got duplicated. Let's find the boundaries of the duplication.
// The duplication started after `    display: block;` inside `.sales-table {`
// Let's split by `.sales-table {\n    display: block;`

const parts = content.split(/\.sales-table\s*\{\s*display:\s*block;/);
// parts[0] is everything before .sales-table { display: block;
// parts[1] is the mangled part that starts with "  border-radius: 6px;"
// parts[2] is the actual end of the file which starts with "\n    overflow-x: auto;\n    white-space: nowrap;\n  }\n}"

if (parts.length >= 3) {
  // We want to keep parts[0], add back the correct sales-table closing, and then keep parts[2]
  // BUT wait, parts[2] has the correct `.sidebar-overlay` (line 1055).
  // AND parts[2] DOES NOT have `.status-badge` because `.status-badge` was supposed to be right after `.sales-table` media query ends.
  
  // Let's just fix the whole thing using the original file if possible. 
}

// Alternative approach: we know exactly what we want from line 660 onwards.
// Let's just do a regex replace to clean up the mess.

// Look for the block from `border-radius: 6px;` (line 664) down to `  white-space: nowrap;\n  }\n}\n` (line 1053)
const badBlockStart = content.indexOf('  border-radius: 6px;\n  display: flex;');
const badBlockEnd = content.indexOf('}\n\n.sidebar-overlay {\n  display: none;\n  position: fixed;');

if (badBlockStart !== -1 && badBlockEnd !== -1) {
  const cleanContent = content.substring(0, badBlockStart) +
    `    overflow-x: auto;\n    white-space: nowrap;\n  }\n}\n\n.status-badge {\n  padding: 4px 10px;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 700;\n  white-space: nowrap; \n}\n` +
    content.substring(badBlockEnd);
    
  fs.writeFileSync(path, cleanContent, 'utf8');
  console.log('Fixed Dashbord.css cleanup!');
} else {
  console.log('Could not find boundaries for cleanup');
}
