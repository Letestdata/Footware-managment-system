const fs = require('fs');

const path = './src/css/Dashbord.css';
let content = fs.readFileSync(path, 'utf8');

// Find where it's broken
const brokenStartStr = `.topbar {
  .sales-table {`;

if (content.includes(brokenStartStr)) {
  const replacement = `.topbar {
    width: 100%;
    padding: 0 1rem;
  }
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 1rem;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .activity-grid {
    grid-template-columns: 1fr;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .actions-grid {
    grid-template-columns: 1fr 1fr;
  }
  .search-wrapper {
    width: auto;
    flex: 1;
    margin: 0 10px;
  }
  .search-input {
    width: 100%;
  }
  .profile-text {
    display: none;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .inventory-table-wrapper {
    overflow-x: auto;
    width: 100%;
  }
  .sales-table {`;
  
  content = content.replace(brokenStartStr, replacement);
  
  // also fix the other @media max-width 768px actions-grid if it's there
  content = content.replace(
    /(\.actions-grid\s*{\s*grid-template-columns:)\s*1fr;(\s*})/g,
    '$1 1fr 1fr;$2'
  );
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed Dashbord.css');
} else {
  console.log('Could not find broken string in Dashbord.css');
}
