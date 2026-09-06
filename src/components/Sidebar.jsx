import React from 'react';

const Sidebar = ({ activePage }) => {
  const language = localStorage.getItem('language') || 'English (US)';
  
  const translations = {
    'English (US)': {
      dashboard: 'Dashboard', inventory: 'Inventory', sales: 'Sales', orders: 'Receipts & Returns',
      customers: 'Customers', reports: 'Reports', messages: 'Messages', notifications: 'Notifications',
      history: 'My Login History', settings: 'Settings', logout: 'Logout'
    },
    'Hindi': {
      dashboard: 'डैशबोर्ड', inventory: 'इन्वेंटरी', sales: 'बिक्री', orders: 'रसीदें और वापसी',
      customers: 'ग्राहक', reports: 'रिपोर्ट', messages: 'संदेश', notifications: 'सूचनाएं',
      history: 'लॉगिन इतिहास', settings: 'सेटिंग्स', logout: 'लॉग आउट'
    },
    'Gujarati': {
      dashboard: 'ડેશબોર્ડ', inventory: 'ઇન્વેન્ટરી', sales: 'વેચાણ', orders: 'રસીદો અને વળતર',
      customers: 'ગ્રાહકો', reports: 'રિપોર્ટ્સ', messages: 'સંદેશા', notifications: 'સૂચનાઓ',
      history: 'લોગિન ઇતિહાસ', settings: 'સેટિંગ્સ', logout: 'લૉગ આઉટ'
    }
  };
  
  const t = translations[language] || translations['English (US)'];

  return (
    <>
      <div 
        className="sidebar-overlay" 
        onClick={() => document.body.classList.remove('sidebar-open')}
      ></div>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img 
            alt="Nice Footware Logo" 
            className="brand-logo" 
            src="https://i.ibb.co/1pg7Nby/icon.png"
          />
          <div className="brand-text">
            <h1>Nice Footware</h1>
            <p>Management System</p>
          </div>
          <button 
            className="close-sidebar-btn" 
            onClick={() => document.body.classList.remove('sidebar-open')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

      <nav className="sidebar-nav">
        <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} href="/employee">
          <span className="material-symbols-outlined nav-icon">dashboard</span>
          <span className="nav-label">{t.dashboard}</span>
        </a>
        <a className={`nav-item ${activePage === 'inventory' ? 'active' : ''}`} href="/employee/inventory">
          <span className="material-symbols-outlined nav-icon">inventory_2</span>
          <span className="nav-label">{t.inventory}</span>
        </a>
        <a className={`nav-item ${activePage === 'sales' ? 'active' : ''}`} href="/employee/sales">
          <span className="material-symbols-outlined nav-icon">payments</span>
          <span className="nav-label">{t.sales}</span>
        </a>
        <a className={`nav-item ${activePage === 'orders' ? 'active' : ''}`} href="/employee/orders">
          <span className="material-symbols-outlined nav-icon">receipt_long</span>
          <span className="nav-label">{t.orders}</span>
        </a>
        
        <a className={`nav-item ${activePage === 'reports' ? 'active' : ''}`} href="/employee/reports">
          <span className="material-symbols-outlined nav-icon">analytics</span>
          <span className="nav-label">{t.reports}</span>
        </a>
        
        <a className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`} href="/employee/notifications">
          <span className="material-symbols-outlined nav-icon">notifications</span>
          <span className="nav-label">{t.notifications}</span>
        </a>
        <a className={`nav-item ${activePage === 'history' ? 'active' : ''}`} href="/employee/history">
          <span className="material-symbols-outlined nav-icon">history</span>
          <span className="nav-label">{t.history}</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} href="/employee/settings">
          <span className="material-symbols-outlined nav-icon">settings</span>
          <span className="nav-label">{t.settings}</span>
        </a>
        <a className="nav-item logout-btn" href="/">
          <span className="material-symbols-outlined nav-icon">logout</span>
          <span className="nav-label">{t.logout}</span>
        </a>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
