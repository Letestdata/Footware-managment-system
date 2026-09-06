import React, { useState, useEffect } from 'react';
import '../css/Settings.css';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';


const Settings = () => {
  const [currentTime, setCurrentTime] = useState('Loading time...');
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [userDocId, setUserDocId] = useState(null);
  const [currentDbPassword, setCurrentDbPassword] = useState('');

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser.username) return;
      
      const q = query(collection(db, 'users'), where("username", "==", currentUser.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setUserDocId(docSnap.id); 
        const data = docSnap.data();
        
        setCurrentDbPassword(data.password); 
        
        const nameParts = (data.name || '').split(' ');
        
        setPersonalInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: data.phone || '',
          email: data.email || ''
        });
      }
    };
    fetchUserData();
  }, [currentUser.username]);


  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('prefs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      systemNotifications: true,
      emailNotifications: false,
      language: 'English (US)',
      theme: 'Light Mode'
    };
  });

  useEffect(() => {
    localStorage.setItem('prefs', JSON.stringify(prefs));
    localStorage.setItem('language', prefs.language);
    localStorage.setItem('theme', prefs.theme);
  }, [prefs]);

  // Handlers
  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

    const handleSavePersonalInfo = async () => {
    if (!userDocId) return;
    
    try {
      const updatedName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
      
      await updateDoc(doc(db, 'users', userDocId), {
        name: updatedName,
        phone: personalInfo.phone,
        email: personalInfo.email
      });
      
      const updatedUser = { ...currentUser, name: updatedName };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      alert('Personal information successfully saved to Firebase!');
    } catch (err) {
      console.error(err);
      alert('Error saving information.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('Please fill out all password fields.');
      return;
    }
    
    if (passwords.current !== currentDbPassword) {
      alert('Current password is incorrect! Action denied.');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }
    
    if (!userDocId) return;
    
    try {
      await updateDoc(doc(db, 'users', userDocId), {
        password: passwords.new
      });
      
      setCurrentDbPassword(passwords.new); 
      setPasswords({ current: '', new: '', confirm: '' });
      alert('Password updated securely in Firebase!');
    } catch (err) {
       console.error(err);
       alert('Error updating password.');
    }
  };

 

  const togglePref = (key) => {
    const newState = !prefs[key];
    setPrefs({ ...prefs, [key]: newState });
    
    if (key === 'systemNotifications') {
      if (newState) {
        alert('System Notifications are Enabled. Topbar badge will be visible.');
      } else {
        alert('System Notifications are Disabled. Topbar badge will be hidden.');
      }
    } else if (key === 'emailNotifications') {
      if (newState) {
        alert(`Email Notifications Activated. Daily summaries will be sent to ${personalInfo.email}`);
      } else {
        alert(`Email Notifications Disabled.`);
      }
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setPrefs({...prefs, language: newLang});
    localStorage.setItem('language', newLang);
    window.location.reload();
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setPrefs({...prefs, theme: newTheme});
    localStorage.setItem('theme', newTheme);
    window.location.reload();
  };

  const translations = {
    'English (US)': {
      accountSettings: 'Account Settings', personalInfo: 'Personal Information',
      security: 'Security & Password', preferences: 'Preferences'
    },
    'Hindi': {
      accountSettings: 'खाता सेटिंग्स', personalInfo: 'व्यक्तिगत जानकारी',
      security: 'सुरक्षा और पासवर्ड', preferences: 'प्राथमिकताएं'
    },
    'Gujarati': {
      accountSettings: 'એકાઉન્ટ સેટિંગ્સ', personalInfo: 'વ્યક્તિગત માહિતી',
      security: 'સુરક્ષા અને પાસવર્ડ', preferences: 'પસંદગીઓ'
    }
  };
  
  const t = translations[prefs.language] || translations['English (US)'];



  useEffect(() => {
    if (prefs.theme === 'Dark Mode') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [prefs.theme]);

  return (
    <div className="dashboard-container">
      <Sidebar activePage="settings" />
      <Topbar searchPlaceholder="Search settings..." />

      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>{t.accountSettings}</h2>
            <p>Manage your profile, security, and application preferences.</p>
          </div>
        </div>

        <div className="settings-layout">
          
          <div className="settings-card">
            <h3 className="settings-section-title">
              <span className="material-symbols-outlined">person</span>
              {t.personalInfo}
            </h3>
            <p className="settings-section-desc">Update your photo and personal details here.</p>
            
            <div className="profile-edit-wrapper">
              
              
                          <div className="settings-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" value={personalInfo.firstName} onChange={handlePersonalInfoChange} />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={personalInfo.lastName} onChange={handlePersonalInfoChange} />
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" defaultValue="EMP-10452" disabled style={{opacity: 0.7, cursor: 'not-allowed'}} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} />
                </div>
                <div className="form-group full-width">
                  <label>Email Address</label>
                  <input type="email" name="email" value={personalInfo.email} onChange={handlePersonalInfoChange} />
                </div>
              </div>
            </div>
            <div className="settings-actions">
              <button className="secondary-btn">Cancel</button>
              <button className="primary-btn" onClick={handleSavePersonalInfo}>Save Changes</button>
            </div>
          </div>

          <div className="settings-card">
            <h3 className="settings-section-title">
              <span className="material-symbols-outlined">lock</span>
              {t.security}
            </h3>
            <p className="settings-section-desc">Keep your account secure by using a strong password.</p>
            
            <div className="settings-form">
              <div className="form-group full-width">
                <label>Current Password</label>
                <input type="password" name="current" placeholder="Enter current password" value={passwords.current} onChange={handlePasswordChange} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" name="new" placeholder="Enter new password" value={passwords.new} onChange={handlePasswordChange} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" name="confirm" placeholder="Confirm new password" value={passwords.confirm} onChange={handlePasswordChange} />
              </div>
            </div>
            <div className="settings-actions">
              <button className="primary-btn" onClick={handleUpdatePassword}>Update Password</button>
            </div>
          </div>

          <div className="settings-card">
            <h3 className="settings-section-title">
              <span className="material-symbols-outlined">tune</span>
              {t.preferences}
            </h3>
            
            <div className="settings-form" style={{marginTop: '1.5rem'}}>

              <div className="form-group">
                <label>Theme Preference</label>
                <select value={prefs.theme} onChange={handleThemeChange}>
                  <option value="Light Mode">Light Mode</option>
                  <option value="Dark Mode">Dark Mode</option>
                  <option value="System Default">System Default</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
