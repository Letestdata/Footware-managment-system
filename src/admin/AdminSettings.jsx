import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminDashbord.css';

const AdminSettings = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

    const [activeTab, setActiveTab] = useState('profile');
  const [docId, setDocId] = useState(null);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [store, setStore] = useState({
    storeName: '',
    address: '',
    currency: 'INR (₹)',
    taxRate: '18'
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

    useEffect(() => {
        const fetchSettings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'storeSettings'));
        if (!querySnapshot.empty) {
          const settingsDoc = querySnapshot.docs[0];
          setDocId(settingsDoc.id); 
          const data = settingsDoc.data();
          
          setStore({
            storeName: data.storeName || data.store?.storeName || '', 
            address: data.address || data.store?.address || '',
            currency: data.currency || data.store?.currency || 'INR (₹)', 
            taxRate: data.taxRate || data.store?.taxRate || '18'
          });
        } else {
          setDocId(null);
        }

        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const q = query(collection(db, 'users'), where("username", "==", userObj.username));
          const userSnap = await getDocs(q);
          
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            let fName = userData.firstName || '';
            let lName = userData.lastName || '';
            if (!fName && userData.name) {
               const nameParts = userData.name.split(' ');
               fName = nameParts[0] || '';
               lName = nameParts.slice(1).join(' ') || '';
            }
            setProfile({
              firstName: fName,
              lastName: lName,
              email: userData.email || '',
              phone: userData.phone || ''
            });
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);


        const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      if (activeTab === 'security') {
        if (!passwords.current) return alert("Please enter your current password.");
        if (passwords.newPass !== passwords.confirm) return alert("New passwords do not match!");
        if (passwords.newPass.length < 6) return alert("Password must be at least 6 characters long.");

        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return alert("You are not properly logged in.");
        
        const q = query(collection(db, 'users'), where("username", "==", JSON.parse(userStr).username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return alert("Admin account not found in database.");
        const userDocRef = querySnapshot.docs[0];

        if (userDocRef.data().password !== passwords.current) {
          return alert("Incorrect current password. Password update failed.");
        }

        await updateDoc(doc(db, 'users', userDocRef.id), { password: passwords.newPass });
        setPasswords({ current: '', newPass: '', confirm: '' });
        alert('Password successfully updated!');

      } else if (activeTab === 'profile') {
        if (!profile.firstName.trim() || !profile.lastName.trim()) return alert("First Name and Last Name are required.");
        if (!profile.email.includes('@')) return alert("Please enter a valid email address.");
        if (profile.phone.length < 10) return alert("Please enter a valid phone number.");

        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return;
        
        const q = query(collection(db, 'users'), where("username", "==", JSON.parse(userStr).username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDocRef = querySnapshot.docs[0];
          const fullName = profile.firstName.trim() + ' ' + profile.lastName.trim();
          
          await updateDoc(doc(db, 'users', userDocRef.id), {
            name: fullName,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim()
          });

          const updatedUserObj = { ...JSON.parse(userStr), name: fullName };
          localStorage.setItem('currentUser', JSON.stringify(updatedUserObj));
          alert('Admin Profile successfully updated!');
        }

      } else {
        const dataToSave = {
          address: store.address || "",
          currency: store.currency || "",
          email: profile.email || "",
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          password: passwords.newPass || passwords.current || "",
          phone: profile.phone || "",
          storeName: store.storeName || "",
          taxRate: store.taxRate || "",
          lastUpdated: new Date()
        };

        if (docId) {
          await updateDoc(doc(db, 'storeSettings', docId), dataToSave);
        } else {
          const newDocRef = doc(collection(db, 'storeSettings'));
          setDocId(newDocRef.id);
          await setDoc(newDocRef, dataToSave);
        }
        
        alert('Settings saved to Firebase successfully!');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings.');
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
          <a href="/admin/Dashbord" className="admin-nav-item">
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
          <a href="/admin/ActivityLogs" className="admin-nav-item">
            <span className="material-symbols-outlined">history</span>
            <span>Activity Logs</span>
          </a>
          <a href="/admin/Notifications" className="admin-nav-item">
            <span className="material-symbols-outlined">mail</span>
            <span>Messages</span>
          </a>
        </nav>
        
        <div className="admin-footer-nav">
          <a href="/admin/Settings" className="admin-nav-item active">
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
            <input type="text" placeholder="Search settings..." />
          </div>
          
            <div className="admin-top-actions">
            <div className="admin-profile">
              <div className="admin-profile-img">
                <div style={{width:'100%', height:'100%', backgroundColor:'var(--admin-primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem'}}>
                  {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>
              <div className="admin-profile-text">
                <h4>Admin Profile</h4>
                <p>{profile.firstName} {profile.lastName}</p>
              </div>
            </div>
          </div>

        </header>

        <div className="admin-canvas">
          <div className="admin-header">
            <div>
              <h2>System Settings</h2>
              <p>Manage your account, store preferences, and system configurations.</p>
            </div>
          </div>

          <div className="admin-settings-layout">
            <div className="admin-settings-sidebar">
              <button 
                onClick={() => setActiveTab('profile')} 
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'profile' ? 'var(--admin-primary-container)' : 'transparent', color: activeTab === 'profile' ? 'var(--admin-on-primary-container)' : 'var(--admin-on-surface)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                Profile Settings
              </button>
              <button 
                onClick={() => setActiveTab('store')} 
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'store' ? 'var(--admin-primary-container)' : 'transparent', color: activeTab === 'store' ? 'var(--admin-on-primary-container)' : 'var(--admin-on-surface)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>storefront</span>
                Store Details
              </button>
              <button 
                onClick={() => setActiveTab('security')} 
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'security' ? 'var(--admin-primary-container)' : 'transparent', color: activeTab === 'security' ? 'var(--admin-on-primary-container)' : 'var(--admin-on-surface)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>security</span>
                Security
              </button>
            </div>

            <div className="admin-settings-content">
              
              {activeTab === 'profile' && (
                <form onSubmit={handleSave}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Profile Information</h3>
                  <div className="admin-settings-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>First Name</label>
                      <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Last Name</label>
                      <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Email Address</label>
                      <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Phone Number</label>
                      <input type="text" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                    </div>
                  </div>
                  <button type="submit" className="admin-filled-btn">Save Changes</button>
                </form>
              )}

              {activeTab === 'store' && (
                <form onSubmit={handleSave}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Store Configuration</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Store Name</label>
                      <input type="text" value={store.storeName} onChange={(e) => setStore({...store, storeName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Business Address</label>
                      <textarea rows="3" value={store.address} onChange={(e) => setStore({...store, address: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem', fontFamily: 'inherit' }}></textarea>
                    </div>
                    <div className="admin-settings-grid" style={{ marginBottom: 0 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Currency</label>
                        <select value={store.currency} onChange={(e) => setStore({...store, currency: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }}>
                          <option>INR (₹)</option>
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Tax Rate (%)</label>
                        <input type="number" value={store.taxRate} onChange={(e) => setStore({...store, taxRate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="admin-filled-btn">Save Configurations</button>
                </form>
              )}
              
              {activeTab === 'security' && (
                <form onSubmit={handleSave}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Change Password</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Current Password</label>
                      <input type="password" placeholder="••••••••" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>New Password</label>
                      <input type="password" placeholder="••••••••" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Confirm New Password</label>
                      <input type="password" placeholder="••••••••" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-outline)', fontSize: '0.95rem' }} required />
                    </div>
                  </div>
                  <button type="submit" className="admin-filled-btn">Update Password</button>
                </form>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
