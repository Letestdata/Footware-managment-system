const fs = require('fs');
const path = './src/css/Dashbord.css';
let content = fs.readFileSync(path, 'utf8');

// The file got truncated after `.status-badge { ... } }` around line 676.
// Let's replace the end of the file with the correct content.
const goodStart = content.substring(0, content.indexOf('.status-badge {'));

const restOfFile = `.status-badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap; 
}
.status-badge.completed { background-color: var(--green-100); color: var(--green-700); }
.status-badge.processing { background-color: var(--yellow-100); color: var(--yellow-700); }
.status-badge.refunded { background-color: var(--red-100); color: var(--red-700); }
.status-badge.partial { background-color: var(--orange-100); color: var(--orange-700); }

.sidebar-widgets { display: flex; flex-direction: column; gap: 1.5rem; }
.stats-card {
  background-color: var(--sidebar-bg);
  color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}
.stats-content { position: relative; z-index: 10; }
.stats-subtitle { font-size: 0.875rem; color: #a0aabf; margin-bottom: 1rem; }
.stats-main { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.stats-value { font-size: 2.25rem; font-weight: 700; }
.stats-rank { font-size: 0.75rem; font-weight: 700; color: var(--green-400); }

.progress-section { display: flex; flex-direction: column; gap: 0.5rem; }
.progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; }
.progress-percent { color: var(--primary-container); font-weight: 700; }
.progress-track {
  width: 100%; height: 8px; background-color: rgba(255,255,255,0.1); border-radius: 9999px;
}
.progress-fill { height: 100%; background-color: var(--primary-container); border-radius: 9999px; }
.stats-glow {
  position: absolute; bottom: -40px; right: -40px; width: 160px; height: 160px;
  background-color: rgba(255, 107, 53, 0.2); border-radius: 50%; filter: blur(40px);
}

.quick-actions-card {
  background-color: var(--surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--outline);
}
.quick-actions-card h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; }
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.action-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 1rem; border: 1px solid var(--surface-highest); border-radius: 8px; transition: all 0.2s;
}
.action-btn span:first-child { margin-bottom: 0.5rem; color: var(--text-muted); }
.action-btn span:last-child { font-size: 0.75rem; font-weight: 700; color: var(--text-main); }
.action-btn:hover { background-color: var(--primary-fixed); border-color: var(--primary-container); }
.action-btn:hover span:first-child { color: var(--primary); }

/* Bottom Grid */
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
.has-icon { justify-content: flex-start; gap: 0.75rem; }
.icon-primary { color: var(--primary); }

.history-card, .top-selling-card {
  background-color: var(--surface); border-radius: 12px; border: 1px solid var(--outline); overflow: hidden;
}
.history-list { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem; background-color: var(--surface-low); border-radius: 8px;
}
.history-item.expired { opacity: 0.6; }
.history-info { display: flex; align-items: center; gap: 1rem; }
.history-icon {
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.history-icon.success { background-color: var(--green-100); color: var(--green-700); }
.history-icon.warning { background-color: var(--primary-fixed); color: var(--primary); }
.history-title { font-weight: 700; font-size: 0.875rem; }
.history-desc { font-size: 0.75rem; color: var(--text-muted); }
.history-time { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }

.products-list { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.product-item { display: flex; align-items: center; gap: 1.5rem; }
.product-img-box {
  width: 64px; height: 64px; border-radius: 8px; background-color: var(--surface-highest); overflow: hidden;
}
.product-img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.product-item:hover .product-img-box img { transform: scale(1.1); }

.product-details { flex: 1; }
.product-details h4 { font-weight: 700; font-size: 0.875rem; transition: color 0.2s; }
.product-item:hover .product-details h4 { color: var(--primary); }
.product-details p { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem; }

.rating-box { display: flex; align-items: center; gap: 0.5rem; }
.stars { color: var(--yellow-500); display: flex; }
.stars span { font-size: 14px; }
.rating-score { font-size: 0.75rem; color: var(--text-muted); }
.product-price { text-align: right; }
.product-price p { font-weight: 700; font-size: 1.125rem; margin-bottom: 0.25rem; }

.trend-badge.trending { background-color: var(--green-50); color: var(--green-600); }
.trend-badge.bestseller { background-color: var(--blue-50); color: var(--blue-600); }
.divider { width: 100%; height: 1px; background-color: var(--surface-highest); }

.mobile-fab { display: none; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--surface-highest); border-radius: 10px; }

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-dropdown {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--outline);
  background-color: var(--surface);
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--text-main);
  outline: none;
  cursor: pointer;
  appearance: auto;
  box-sizing: border-box;
}

select {
  box-sizing: border-box;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 45;
}
body.sidebar-open .sidebar-overlay {
  display: block;
}
.mobile-menu-btn {
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
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .stats-card {
    padding: 1rem;
  }
  .stats-value {
    font-size: 1.8rem;
  }
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .history-time {
    align-self: flex-start;
  }
  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .product-price {
    text-align: left;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .purchased-item-row {
    grid-template-columns: 40px 1fr 60px !important;
    position: relative;
  }
  .purchased-item-row > div:nth-child(4) {
    position: absolute;
    top: -5px;
    right: -5px;
  }
  .purchased-item-row > div:nth-child(4) button {
    background: #fee2e2 !important;
    border-radius: 50% !important;
    padding: 4px !important;
  }
}
`;

fs.writeFileSync(path, goodStart + restOfFile, 'utf8');
console.log("Restored Dashbord.css completely!");
