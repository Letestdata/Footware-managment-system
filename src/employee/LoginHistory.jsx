import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/LoginHistory.css';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const LoginHistory = () => {
  const [history, setHistory] = useState([]);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    if (!currentUser.username) return;

    const historyRef = collection(db, 'login_history');
    const q = query(historyRef, where("username", "==", currentUser.username));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date();
        
        let dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateObj.toDateString() === today.toDateString()) {
           dateString = `Today (${dateString})`;
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
           dateString = `Yesterday (${dateString})`;
        }

        return {
          id: doc.id,
          time: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: dateString,
          rawDate: dateObj,
          status: data.status || 'Success',
        };
      });

      logs.sort((a, b) => b.rawDate - a.rawDate);
      setHistory(logs);
    });

    return () => unsubscribe();
  }, [currentUser.username]);

  return (
    <div className="dashboard-container">
      <Sidebar activePage="history" />
      <Topbar searchPlaceholder="Search history..." />
      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>My Login History</h2>
            <p>Review your recent account activity and active sessions.</p>
          </div>
        </div>

        <div className="history-board">
          <div className="history-header">
            <h3>Recent Activity</h3>
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className="time-bold">{log.time}</span>
                      <span className="date-muted">{log.date}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${log.status === 'Success' ? 'success' : 'failed'}`}>
                        <span className="material-symbols-outlined" style={{fontSize: '14px'}}>
                          {log.status === 'Success' ? 'check_circle' : 'cancel'}
                        </span>
                        {log.status === 'Success' ? 'Success' : 'Failed Attempt'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
                    No login history found. Please log out and log back in to generate records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default LoginHistory;
