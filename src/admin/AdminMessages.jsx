import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminMessages.css';

const AdminMessages = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeMsgId, setActiveMsgId] = useState(null); 
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const unsubscribeMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const realMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date(0);
        return {
          id: doc.id,
          sender: data.sender || 'Unknown User',
          email: data.email || 'no-reply@nicefootware.com',
          avatar: (data.sender || 'U').charAt(0).toUpperCase(),
          avatarBg: 'var(--admin-surface-container-high)',
          avatarColor: 'var(--admin-on-surface)',
          time: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: dateObj.toLocaleDateString(),
          subject: data.subject || 'No Subject',
          snippet: data.body ? data.body.substring(0, 50) + '...' : '...',
          body: data.body ? data.body.split('\n') : [],
          unread: data.unread !== false,
          rawDate: dateObj
        };
      });

      const unsubscribeProducts = onSnapshot(collection(db, 'products'), (prodSnapshot) => {
        const lowStockItems = [];
        
        prodSnapshot.forEach(doc => {
          const prod = doc.data();
          if (prod.stockQuantity > 0 && prod.stockQuantity < 20) {
            lowStockItems.push(`- ${prod.name} (SKU: ${prod.sku}) - ${prod.stockQuantity} units left`);
          }
        });

        const allMessages = [...realMessages];

        if (lowStockItems.length > 0) {
          allMessages.push({
            id: 'system-alert',
            sender: 'Inventory Alerts',
            email: 'system@nicefootware.com',
            avatar: 'SYS',
            avatarBg: '#ffedd5',
            avatarColor: '#c2410c',
            time: 'Just Now',
            date: 'Today',
            subject: 'URGENT: Low Stock Warning',
            snippet: `Automated Alert: ${lowStockItems.length} items have fallen below minimum...`,
            body: [
              'Automated System Alert:',
              'The following items have fallen below minimum threshold levels:',
              ...lowStockItems,
              '',
              'Please issue a purchase order to restock these items immediately to avoid lost sales.',
              'This is an automated message.'
            ],
            unread: true,
            rawDate: new Date()
          });
        }

        allMessages.sort((a, b) => b.rawDate - a.rawDate);
        setMessages(allMessages);

        if (allMessages.length > 0 && !activeMsgId) {
          setActiveMsgId(allMessages[0].id);
        }
      });

      return () => unsubscribeProducts();
    });

    return () => unsubscribeMessages();
  }, [activeMsgId]);

  const activeMessage = messages.find(m => m.id === activeMsgId) || messages[0] || null;

  const handleSelectMessage = async (id) => {
    setActiveMsgId(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
    if (id === 'system-alert') return;
    try {
      await updateDoc(doc(db, 'messages', id), { unread: false });
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const handleSendReply = () => {
    if (replyText.trim() === '') return;
    alert(`Reply sent to ${activeMessage?.sender}!`);
    setReplyText('');
  };

  const filteredMessages = messages.filter(m => 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.sender.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.snippet.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Search messages..." 
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

        <div className="admin-canvas" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
          
          <div className="admin-header" style={{ marginBottom: '24px' }}>
            <div>
              <h2>Messages & Notifications</h2>
              <p>Manage employee communications and system alerts</p>
            </div>
          </div>

          <div className="admin-messages-layout">
            <div className="admin-messages-list-card">
              <div className="admin-messages-list-header">
                <h3>Inbox</h3>
                <span className="admin-badge primary">{messages.filter(m => m.unread).length} New</span>
              </div>
              
              <div className="admin-messages-scroll">
                {filteredMessages.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-on-surface-variant)' }}>
                    No messages found.
                  </div>
                ) : (
                  filteredMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`admin-msg-item ${activeMsgId === msg.id ? 'active' : ''} ${msg.unread ? 'unread' : ''}`}
                      onClick={() => handleSelectMessage(msg.id)}
                    >
                      <div className="admin-msg-avatar" style={{backgroundColor: msg.avatarBg, color: msg.avatarColor}}>
                        {msg.avatar}
                      </div>
                      <div className="admin-msg-preview">
                        <div className="admin-msg-meta">
                          <span className="admin-msg-sender">{msg.sender}</span>
                          <span className="admin-msg-time">{msg.date}</span>
                        </div>
                        <div className="admin-msg-subject">{msg.subject}</div>
                        <div className="admin-msg-snippet">{msg.snippet}</div>
                      </div>
                      {msg.unread && <div className="admin-msg-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="admin-messages-reading-pane">
              {activeMessage ? (
                <>
                  <div className="admin-reading-header">
                    <div className="admin-reading-title">
                      <h2>{activeMessage.subject}</h2>
                    </div>
                    <div className="admin-reading-meta">
                      <div className="admin-reading-sender">
                        <div className="admin-msg-avatar" style={{backgroundColor: activeMessage.avatarBg, color: activeMessage.avatarColor}}>
                          {activeMessage.avatar}
                        </div>
                        <div>
                          <strong>{activeMessage.sender}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--admin-on-surface-variant)', marginLeft: '8px' }}>&lt;{activeMessage.email}&gt;</span>
                        </div>
                      </div>
                      <div className="admin-reading-time">{activeMessage.date}, {activeMessage.time}</div>
                    </div>
                  </div>

                  <div className="admin-reading-body">
                    {activeMessage.body.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <div className="admin-reading-reply">
                    <textarea 
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    ></textarea>
                    <div className="admin-reply-actions">
                      <button className="admin-filled-btn" onClick={handleSendReply}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                        Send Reply
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--admin-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>mail</span>
                  <p>Select a message to read</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMessages;
