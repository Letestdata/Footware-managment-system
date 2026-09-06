const fs = require('fs');
const path = require('path');

const dir = 'd:/Ahmadali/sem 5/project/nice-footware-system/src/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Check if useNavigate is imported. If not, add it.
  if (!content.includes('useNavigate')) {
    if (content.includes('react-router-dom')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];/, (match, p1) => {
        return `import { ${p1.trim()}, useNavigate } from 'react-router-dom';`;
      });
    } else {
      content = content.replace(/import React[^;]*;/, match => {
        return `${match}\nimport { useNavigate } from 'react-router-dom';`;
      });
    }
  }

  // 2. Check if navigate is initialized. If not, inject it and the handleLogout function inside the component.
  if (!content.includes('const navigate = useNavigate();')) {
    // Find the component declaration: e.g. const AdminOrders = () => { OR function AdminDashbord() {
    content = content.replace(/(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{|function\s+\w+\s*\([^)]*\)\s*{)/, (match) => {
      return `${match}\n  const navigate = useNavigate();\n\n  const handleLogout = (e) => {\n    e.preventDefault();\n    localStorage.clear();\n    navigate('/');\n  };\n`;
    });
  } else if (!content.includes('const handleLogout')) {
    // If navigate exists but handleLogout doesn't
    content = content.replace(/const navigate = useNavigate\(\);/, match => {
      return `${match}\n\n  const handleLogout = (e) => {\n    e.preventDefault();\n    localStorage.clear();\n    navigate('/');\n  };\n`;
    });
  }

  // 3. Update the Logout button
  // Searching for:
  // <a href="#" className="admin-nav-item">
  //   <span className="material-symbols-outlined">logout</span>
  
  // Normalizing line endings for regex
  const originalEndings = content.includes('\r\n') ? '\r\n' : '\n';
  content = content.replace(/\r\n/g, '\n');

  content = content.replace(
    /<a href="#" className="admin-nav-item">\n\s*<span className="material-symbols-outlined">logout<\/span>/g,
    `<a href="#" onClick={handleLogout} className="admin-nav-item">\n            <span className="material-symbols-outlined">logout</span>`
  );

  // Restore line endings
  if (originalEndings === '\r\n') {
    content = content.replace(/\n/g, '\r\n');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated logout for ${file}`);
});
console.log('Done mapping logout functions.');
