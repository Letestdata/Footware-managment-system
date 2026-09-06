import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Notifications.css';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

    useEffect(() => {
    let realNotifs = [];
    let autoNotifs = [];

    const updateUI = () => {
      const readSysStrings = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
      const processedAuto = autoNotifs.map(n => ({
         ...n,
         unread: !readSysStrings.includes(n.id)
      }));
      const merged = [...processedAuto, ...realNotifs];
      merged.sort((a, b) => b.rawDate - a.rawDate);
      setNotifications(merged);
    };

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      realNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date();
        return {
          id: doc.id,
          type: data.type || 'info', 
          icon: data.icon || 'info',
          title: data.title || 'System Notification',
          desc: data.desc || '',
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: data.unread !== false,
          rawDate: dateObj
        };
      });
      updateUI();
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      autoNotifs = [];

      snapshot.forEach(doc => {
        const prod = doc.data();
        const stock = parseInt(prod.stock) || parseInt(prod.stockQuantity) || 0;
        
        if (stock > 0 && stock <= 10) {
          let lowStockTimeStr = 'Active Alert';
          let lowStockRawDate = new Date(0);
          
          if (prod.updatedAt && prod.updatedAt.toDate) {
              lowStockRawDate = prod.updatedAt.toDate();
              lowStockTimeStr = lowStockRawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (prod.createdAt && prod.createdAt.toDate) {
              lowStockRawDate = prod.createdAt.toDate();
              lowStockTimeStr = lowStockRawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          autoNotifs.push({
            id: `sys-low-stock-${doc.id}`,
            type: 'warning',
            icon: 'warning',
            title: `Low Stock Alert: ${prod.name}`,
            desc: `Inventory for SKU ${prod.sku} has dropped to ${stock} units.`,
            time: lowStockTimeStr, 
            rawDate: lowStockRawDate
          });
        }


        let prodRawDate = new Date(0);
        let prodDateTime = "Recently";
        
         if (prod.createdAt && prod.createdAt.toDate) {
            prodRawDate = prod.createdAt.toDate();
            prodDateTime = prodRawDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }


        autoNotifs.push({
          id: `sys-new-prod-${doc.id}`,
          type: 'info',
          icon: 'inventory_2',
          title: `New Product Added: ${prod.name}`,
          desc: `Admin has added a new product (SKU: ${prod.sku}) to the inventory with ${stock} units.`,
          time: prodDateTime,
          rawDate: prodRawDate
        });

      });
      
      updateUI();
    });


    return () => {
      unsubNotifs();
      unsubProducts();
    };
  }, []);


  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    
    if (id.startsWith('sys-')) {
       const existingReads = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
       if (!existingReads.includes(id)) {
           existingReads.push(id);
           localStorage.setItem('readSysNotifs', JSON.stringify(existingReads));
       }
    } else {
       try {
         await updateDoc(doc(db, 'notifications', id), { unread: false });
       } catch (err) {
         console.error("Error updating notification:", err);
       }
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    
    const unreadRealNotifs = notifications.filter(n => n.unread && !n.id.startsWith('sys-'));
    for (const notif of unreadRealNotifs) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { unread: false });
      } catch (err) {
        console.error("Error updating notification:", err);
      }
    }

    const unreadSysNotifs = notifications.filter(n => n.unread && n.id.startsWith('sys-'));
    if (unreadSysNotifs.length > 0) {
       const existingReads = JSON.parse(localStorage.getItem('readSysNotifs') || '[]');
       
       const updatedReads = new Set([...existingReads, ...unreadSysNotifs.map(n => n.id)]);
       localStorage.setItem('readSysNotifs', JSON.stringify(Array.from(updatedReads)));
    }
  };

  const filteredNotifs = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar activePage="notifications" />
      <Topbar searchPlaceholder="Search system alerts..." />
      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>System Notifications</h2>
            <p>Automated alerts for low stock, system updates, and task reminders.</p>
          </div>
        </div>

        <div className="notifications-board">
          <div className="notif-header">
            <h3>Recent Alerts</h3>
            {notifications.some(n => n.unread) && (
              <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all as read</button>
            )}
          </div>

          <div className="notif-list">
            
            {filteredNotifs.map((notif) => (
              <div 
                key={notif.id} 
                className={`notif-item ${notif.unread ? 'unread' : ''}`}
                onClick={() => notif.unread && handleMarkRead(notif.id)}
                style={notif.unread ? {cursor: 'pointer'} : {}}
                title={notif.unread ? "Click to mark as read" : ""}
              >
                <div className={`notif-icon ${notif.type}`}>
                  <span className="material-symbols-outlined">{notif.icon}</span>
                </div>
                <div className="notif-content">
                  <h4 className="notif-title">{notif.title}</h4>
                  <p className="notif-desc">{notif.desc}</p>
                </div>
                <div className="notif-time">{notif.time}</div>
                {notif.unread && <div className="unread-dot"></div>}
              </div>
            ))}
            
            {filteredNotifs.length === 0 && (
                <div style={{padding: '30px', textAlign: 'center', color: 'var(--text-muted)'}}>
                    No system notifications at this time.
                </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
};

export default Notifications;
