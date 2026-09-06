const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'Login', 'LogIn.css');

if (fs.existsSync(cssPath)) {
  let content = fs.readFileSync(cssPath, 'utf8');

  // Replace hardcoded background colors
  content = content.replace(/background-color:\s*#f8f9fb;/g, 'background-color: var(--surface, #f8f9fb);');
  content = content.replace(/background-color:\s*#ffffff;/g, 'background-color: var(--surface-low, #ffffff);');
  
  // Replace text colors
  content = content.replace(/color:\s*#191c1e;/g, 'color: var(--text-main, #191c1e);');
  content = content.replace(/color:\s*#594139;/g, 'color: var(--text-main, #594139);');
  
  // Also fix placeholder and icons which use similar dark colors
  content = content.replace(/color:\s*#404758;/g, 'color: var(--text-muted, #404758);');
  
  // Replace border colors
  content = content.replace(/border:\s*1px solid #d1d5db;/g, 'border: 1px solid var(--outline, #d1d5db);');
  
  fs.writeFileSync(cssPath, content, 'utf8');
  console.log("Updated LogIn.css for proper dark mode support");
} else {
  console.log("LogIn.css not found");
}
