import React, { useState, useEffect } from 'react';

const Topbar = ({ searchPlaceholder = 'Search...', searchValue, onSearch, onClickSearch }) => {  
  const [currentTime, setCurrentTime] = useState('Loading time...');
  const [showNotifications, setShowNotifications] = useState(true);
  
  const [empName, setEmpName] = useState('Employee');
  const [empRole, setEmpRole] = useState('Employee');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj && userObj.name) {
        setEmpName(userObj.name); 
      }
      if (userObj && userObj.role) {
        setEmpRole(userObj.role.charAt(0).toUpperCase() + userObj.role.slice(1)); 
      }
    }

    const prefsStr = localStorage.getItem('prefs');
    if (prefsStr) {
      try {
        const prefs = JSON.parse(prefsStr);
        if (prefs.systemNotifications === false) {
          setShowNotifications(false);
        }
      } catch(e) {}
    }

    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      };
      setCurrentTime(now.toLocaleDateString('en-US', options).toUpperCase());
    };
    
    updateTime();
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="topbar">
      <button 
        className="icon-btn mobile-menu-btn" 
        onClick={() => document.body.classList.toggle('sidebar-open')}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <div className="search-wrapper">
        <span className="material-symbols-outlined search-icon">search</span>
          <input 
          className="search-input" 
          placeholder={searchPlaceholder} 
          type="text"
          value={searchValue} 
          onChange={(e) => onSearch && onSearch(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && onClickSearch) {
                 onClickSearch(e.target.value);
             }
          }}
        />


      </div>

      <div className="topbar-actions">
        {/* <div className="icon-buttons">
          <button className="icon-btn">
            <span className="material-symbols-outlined">notifications</span>
             {showNotifications && <span className="notif-badge">3</span>}
          </button>
        </div>
        <div className="vertical-divider"></div> */}
        
        <div className="profile-section">
          <div className="profile-text">
            <div className="profile-name-row">
              <span className="profile-name">{empName}</span>
              <span className="role-badge">{empRole}</span>
            </div>
            <p className="current-time">{currentTime}</p>
          </div>
          
          <div className="profile-avatar">
            <div style={{width:'100%', height:'100%', backgroundColor:'var(--admin-primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem', borderRadius: '50%'}}>
              {empName.charAt(0).toUpperCase()}
            </div>
          </div>
          
        </div>

      </div>
    </header>
  );
};

export default Topbar;
