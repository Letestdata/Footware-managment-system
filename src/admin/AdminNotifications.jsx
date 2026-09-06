import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminNotifications.css';

const AdminNotifications = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

    useEffect(() => {
    const unsubscribeNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const realNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date(); 
        const formattedDateTime = dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return {
          id: doc.id,
          type: data.type || 'info', 
          icon: data.icon || 'info',
          title: data.title || 'System Notification',
          desc: data.desc || '',
          time: formattedDateTime,
          unread: data.unread !== false,
          rawDate: dateObj
        };
      });

      const unsubscribeProducts = onSnapshot(collection(db, 'products'), (prodSnapshot) => {
        const autoNotifs = [];
        const readSys = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
        const sysTimes = JSON.parse(localStorage.getItem('sysNotifsTime') || '{}');
        let timesChanged = false;

                prodSnapshot.forEach(doc => {
          const prod = doc.data();
          const stock = parseInt(prod.stock) || parseInt(prod.stockQuantity) || 0;
          if (stock > 0 && stock <= 10) {
            const notifId = `sys-low-stock-${doc.id}`;
            
            let generatedDateTime = sysTimes[notifId];
            let rawDateObj = new Date();
            
            if (!generatedDateTime) {
               const now = new Date();
               generatedDateTime = now.toLocaleDateString() + ', ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
               sysTimes[notifId] = generatedDateTime;
               timesChanged = true;
            } else {
               rawDateObj = new Date(generatedDateTime); 
               if (isNaN(rawDateObj.getTime())) rawDateObj = new Date();
            }

            autoNotifs.push({
              id: notifId,
              type: 'warning',
              icon: 'warning',
              title: `Low Stock Alert: ${prod.name}`,
              desc: `Inventory for SKU ${prod.sku} has dropped to ${stock} units. Please issue a restock order soon.`,
              time: generatedDateTime,
              unread: !readSys.includes(notifId), 
              rawDate: rawDateObj
            });
          }
        });

        
        if (timesChanged) localStorage.setItem('sysNotifsTime', JSON.stringify(sysTimes));
        
        const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (ordSnapshot) => {
           const orderNotifs = [];
           ordSnapshot.forEach(doc => {
              const data = doc.data();
              const dateObj = data.createdAt?.toDate() || new Date(0);
              const formattedDateTime = dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const notifId = `sys-order-${doc.id}`;
              
              if (data.status === 'Refunded') {
                 orderNotifs.push({
                    id: notifId,
                    type: 'error',
                    icon: 'assignment_return',
                    title: `Employee Processed Return`,
                    desc: `Invoice ${data.invoiceId} was refunded for ₹${data.totalAmount}.`,
                    time: formattedDateTime,
                    unread: !readSys.includes(notifId),
                    rawDate: dateObj
                 });
              } else {
                 orderNotifs.push({
                    id: notifId,
                    type: 'success',
                    icon: 'point_of_sale',
                    title: `Employee Processed Sale`,
                    desc: `Invoice ${data.invoiceId} created for ₹${data.totalAmount}.`,
                    time: formattedDateTime,
                    unread: !readSys.includes(notifId),
                    rawDate: dateObj
                 });
              }
           });

           const finalMerged = [...realNotifs, ...autoNotifs, ...orderNotifs];
           finalMerged.sort((a, b) => b.rawDate - a.rawDate);
           setNotifications(finalMerged);
        });

        return () => unsubscribeOrders();
      });

      return () => unsubscribeProducts();
    });

    return () => unsubscribeNotifs();
  }, []);



    const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    if (!id.startsWith('sys-')) {
      try {
        await updateDoc(doc(db, 'notifications', id), { unread: false });
      } catch (err) {
        console.error("Error updating notification:", err);
      }
    } else {
      const readSys = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
      if (!readSys.includes(id)) {
        readSys.push(id);
        localStorage.setItem('readSysNotifs', JSON.stringify(readSys));
      }
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    
    const readSys = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
    notifications.forEach(n => {
      if (n.id.startsWith('sys-') && !readSys.includes(n.id)) {
        readSys.push(n.id);
      } else if (!n.id.startsWith('sys-') && n.unread) {
        updateDoc(doc(db, 'notifications', n.id), { unread: false }).catch(console.error);
      }
    });
    localStorage.setItem('readSysNotifs', JSON.stringify(readSys));
  };


  const filteredNotifs = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <a href="/admin/Sales" className="admin-nav-item">
            <span className="material-symbols-outlined">payments</span>
            <span>Sales</span>
          </a>
          <a href="/admin/Orders" className="admin-nav-item">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Receipts & Returns</span>
          </a>
          {/* <a href="/admin/Customers" className="admin-nav-item ">
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
          <a href="/admin/ActivityLogs" className="admin-nav-item">
            <span className="material-symbols-outlined">history</span>
            <span>Activity Logs</span>
          </a>
          <a href="/admin/Notifications" className="admin-nav-item active">
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
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              <h2>System Notifications</h2>
              <p>Automated alerts for low stock, system updates, and important events.</p>
            </div>
          </div>

          <div className="admin-notifications-board">
            <div className="admin-notif-header">
              <h3>Recent Alerts</h3>
              {notifications.some(n => n.unread) && (
                <button className="admin-mark-read-btn" onClick={handleMarkAllRead}>
                  <span className="material-symbols-outlined" style={{fontSize: '16px'}}>done_all</span>
                  Mark all as read
                </button>
              )}
            </div>

            <div className="admin-notif-list">
              {filteredNotifs.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`admin-notif-item ${notif.unread ? 'unread' : ''}`}
                  onClick={() => notif.unread && handleMarkRead(notif.id)}
                  style={notif.unread ? {cursor: 'pointer'} : {}}
                  title={notif.unread ? "Click to mark as read" : ""}
                >
                  <div className={`admin-notif-icon ${notif.type}`}>
                    <span className="material-symbols-outlined">{notif.icon}</span>
                  </div>
                  <div className="admin-notif-content">
                    <h4 className="admin-notif-title">{notif.title}</h4>
                    <p className="admin-notif-desc">{notif.desc}</p>
                  </div>
                  <div className="admin-notif-time">{notif.time}</div>
                  {notif.unread && <div className="admin-unread-dot"></div>}
                </div>
              ))}
              {filteredNotifs.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-on-surface-variant)' }}>
                  No notifications found.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
