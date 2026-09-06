const fs = require('fs');
const path = './src/css/Dashbord.css';
let content = fs.readFileSync(path, 'utf8');

// Find the bad block
const badBlock = `.mobile-menu-btn {
  display: none;
}
.close-sidebar-btn {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  margin-left: auto;
  padding: 0.5rem;
}`;

if (content.includes(badBlock)) {
  // Remove it from its current position
  content = content.replace(badBlock, '');
  
  // Insert it right BEFORE the @media (max-width: 1024px) block
  const target = '/* Responsive Mobile Layout */';
  if (content.includes(target)) {
    content = content.replace(target, badBlock + '\n\n' + target);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed button CSS order in Dashbord.css');
  } else {
    console.log('Could not find target to insert');
  }
} else {
  console.log('Could not find badBlock in Dashbord.css');
}
