import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminActivityLogs.css';


const AdminActivityLogs = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [filterMode, setFilterMode] = useState('All Activity');

    const [logs, setLogs] = useState([]);

  useEffect(() => {
    
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date(0);
        
        let logType = 'sale';
        let logIcon = 'point_of_sale';
        let logAction = 'Processed Sale';
        let logDetails = `Invoice ${data.invoiceId} created (₹${data.totalAmount})`;

        if (data.status === 'Refunded') {
          logType = 'security'; 
          logIcon = 'assignment_return';
          logAction = 'Processed Return';
          logDetails = `Refunded ${data.invoiceId} (₹${data.totalAmount})`;
        }

        return {
          id: `order-${doc.id}`,
          user: 'Admin',
          action: logAction,
          details: logDetails,
          time: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: dateObj.toLocaleDateString(),
          rawDate: dateObj,
          type: logType,
          icon: logIcon
        };
      });

      const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (custSnapshot) => {
        const customersLogs = custSnapshot.docs.map(doc => {
          const data = doc.data();
          const dateObj = data.createdAt?.toDate() || new Date(0);
          
          return {
            id: `cust-${doc.id}`,
            user: 'Admin',
            action: 'Added New Customer',
            details: `Profile created for "${data.name}"`,
            time: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            date: dateObj.toLocaleDateString(),
            rawDate: dateObj,
            type: 'user',
            icon: 'person_add'
          };
        });

        const mergedLogs = [...ordersLogs, ...customersLogs];
        mergedLogs.sort((a, b) => b.rawDate - a.rawDate);
        setLogs(mergedLogs);
      });

      return () => unsubscribeCustomers();
    });

    return () => unsubscribeOrders();
  }, []);


  const filteredLogs = logs.filter(log => {
    if (filterMode === 'Security') return log.type === 'security';
    if (filterMode === 'Sales') return log.type === 'sale';
    if (filterMode === 'System') return log.type === 'system';
    return true; 
  });

  const getBadgeClass = (type) => {
    switch(type) {
      case 'security': return 'admin-badge error';
      case 'sale': return 'admin-badge success';
      case 'system': return 'admin-badge primary';
      case 'user': return 'admin-badge warning';
      default: return 'admin-badge';
    }
  };

  return (
    <div className="admin-body">
      
      <div className="admin-sidebar-overlay" onClick={() => document.body.classList.remove('admin-sidebar-open')}></div>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <button className="admin-close-sidebar-btn" onClick={() => document.body.classList.remove('admin-sidebar-open')}><span className="material-symbols-outlined">close</span></button>
          <img src="https://i.ibb.co/1pg7Nby/icon.png" alt="Nice Footware Logo" />
          <div>
            <h1>Nice Footware</h1>
            <p>Management System</p>
          </div>
        </div>
        
        <nav className="admin-nav">
          <a href="/admin/Dashbord" className="admin-nav-item ">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="/admin/Inventory" className="admin-nav-item">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Inventory</span>
          </a>
          <a href="/admin/Sales" className="admin-nav-item ">
            <span className="material-symbols-outlined">payments</span>
            <span>Sales</span>
          </a>
          <a href="/admin/Orders" className="admin-nav-item">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Receipts & Returns</span>
          </a>
          {/* <a href="/admin/Customers" className="admin-nav-item">
            <span className="material-symbols-outlined">group</span>
            <span>Customers</span>
          </a> */}
          <a href="/admin/Employees" className="admin-nav-item">
            <span className="material-symbols-outlined">badge</span>
            <span>Employees</span>
          </a>
          <a href="/admin/Reports" className="admin-nav-item">
            <span className="material-symbols-outlined">analytics</span>
            <span>Reports</span>
          </a>
          <a href="/admin/ActivityLogs" className="admin-nav-item active">
            <span className="material-symbols-outlined">history</span>
            <span>Activity Logs</span>
          </a>
          <a href="/admin/Notifications" className="admin-nav-item">
            <span className="material-symbols-outlined">mail</span>
            <span>Messages</span>
          </a>
        

        </nav>
        
        <div className="admin-footer-nav">
          <a href="/admin/Settings" className="admin-nav-item">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a href="#" onClick={handleLogout} className="admin-nav-item">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      
      <main className="admin-main">
        
        <header className="admin-topbar">
          <button className="admin-mobile-menu-btn" onClick={() => document.body.classList.toggle('admin-sidebar-open')}><span className="material-symbols-outlined">menu</span></button>
          <div className="admin-search">
            <span className="material-symbols-outlined admin-search-icon">search</span>
            <input type="text" placeholder="Search logs..." />
          </div>
          
          <div className="admin-top-actions">
            <div className="admin-profile">
              <div className="admin-profile-img">
                <div style={{width:'100%', height:'100%', backgroundColor:'var(--admin-primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem'}}>A</div>
              </div>
              <div className="admin-profile-text">
                <h4>Admin Profile</h4>
                <p>Store Manager</p>
              </div>
            </div>
          </div>
        </header>

       
        <div className="admin-canvas">
          <div className="admin-header">
            <div>
              <h2>System Activity Logs</h2>
              <p>Monitor system-wide actions, employee logins, and inventory changes.</p>
            </div>
            <div className="admin-header-actions">
              <select 
                className="admin-select"
                value={filterMode} 
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option>All Activity</option>
                <option>Sales</option>
                <option>System</option>
                <option>Security</option>
              </select>
            </div>
          </div>

          <div className="admin-timeline-card">
            <div className="admin-timeline">
              {filteredLogs.map(log => (
                <div className="admin-timeline-item" key={log.id}>
                  
                  <div className="admin-timeline-time">
                    <span className="time-text">{log.time}</span>
                    <span className="date-text">{log.date}</span>
                  </div>

                  <div className="admin-timeline-divider">
                    <div className="timeline-dot"></div>
                    <div className="timeline-line"></div>
                  </div>

                  <div className="admin-timeline-content">
                    <div className="admin-timeline-header">
                      <div className="admin-timeline-title">
                        <span className="material-symbols-outlined log-icon">{log.icon}</span>
                        <h3>{log.action}</h3>
                        <span className={getBadgeClass(log.type)}>{log.type.toUpperCase()}</span>
                      </div>
                      <span className="admin-timeline-user">By: <strong>{log.user}</strong></span>
                    </div>
                    <div className="admin-timeline-body">
                      <p>{log.details}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminActivityLogs;
