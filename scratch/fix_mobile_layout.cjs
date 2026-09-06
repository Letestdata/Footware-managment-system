const fs = require('fs');
const path = './src/css/Dashbord.css';
let content = fs.readFileSync(path, 'utf8');

const mobileCSS = `
/* Responsive Mobile Layout */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  body.sidebar-open .sidebar {
    transform: translateX(0);
  }
  .topbar {
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
  .sales-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  .mobile-menu-btn {
    display: flex;
    background: transparent;
    border: none;
    color: var(--text-main);
    cursor: pointer;
    padding: 4px;
    align-items: center;
    justify-content: center;
  }
  .close-sidebar-btn {
    display: flex;
  }
}

`;

// Insert it right before `.sidebar-overlay {` at the end
const insertTarget = '.sidebar-overlay {\n  display: none;';
if (content.includes(insertTarget) && !content.includes('@media (max-width: 1024px)')) {
  content = content.replace(insertTarget, mobileCSS + insertTarget);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Restored mobile layout in Dashbord.css');
} else if (content.includes('@media (max-width: 1024px)')) {
  console.log('Mobile layout already exists in Dashbord.css!');
} else {
  console.log('Could not find insert target');
}
