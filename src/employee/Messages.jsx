import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Messages.css';

const Messages = () => {
  
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Store Manager',
      email: 'manager@nicefootware.com',
      avatar: 'MG',
      avatarBg: 'var(--orange-50)',
      avatarColor: 'var(--primary-container)',
      time: '10:30 AM',
      date: 'Today',
      subject: 'Weekend Shift Schedule Update',
      snippet: 'Hi team, please review the attached schedule for...',
      body: [
        'Hi Team,',
        'Due to the upcoming festival rush this weekend, we are extending the store hours by 2 hours on Saturday and Sunday.',
        'I have updated the shift schedule in the breakroom. Please make sure you check it before leaving today. If you have any serious conflicts, let me know by tomorrow afternoon so we can arrange cover.',
        "Let's prepare for a busy weekend!",
        'Best regards,\nStore Manager'
      ],
      unread: false
    },
    {
      id: 2,
      sender: 'Head Office HR',
      email: 'hr@nicefootware.com',
      avatar: 'HR',
      avatarBg: 'var(--surface-highest)',
      avatarColor: 'var(--text-main)',
      time: 'Yesterday',
      date: 'Yesterday',
      subject: 'Holiday Policy Changes',
      snippet: 'Please be advised that starting next month...',
      body: [
        'Dear Staff,',
        'Please be advised that starting next month, the updated Holiday Policy will take effect. All leave requests must now be submitted through the new HR portal at least 2 weeks in advance.',
        'Please review the attached PDF for full details on the changes to paid time off.',
        'Thanks,\nHR Department'
      ],
      unread: true
    },
    {
      id: 3,
      sender: 'Employee2 (Rahul)',
      email: 'rahul@nicefootware.com',
      avatar: 'E2',
      avatarBg: 'var(--green-50)',
      avatarColor: 'var(--green-700)',
      time: 'Oct 12',
      date: 'Oct 12',
      subject: 'Cover my shift on Tuesday?',
      snippet: "Hey man, I have a doctor's appointment on...",
      body: [
        'Hey man,',
        "I have a doctor's appointment on Tuesday afternoon and was wondering if you could cover my 1PM - 5PM shift?",
        "I can cover your Thursday morning shift in return if you want.",
        'Let me know!'
      ],
      unread: false
    }
  ]);

  const [activeMsgId, setActiveMsgId] = useState(1);
  const [replyText, setReplyText] = useState('');

  const activeMessage = messages.find(m => m.id === activeMsgId);

  const handleSelectMessage = (id) => {
    setActiveMsgId(id);
    setMessages(messages.map(m => m.id === id ? { ...m, unread: false } : m));
  };

  const handleSendReply = () => {
    if (replyText.trim() === '') return;
    alert(`Reply sent to ${activeMessage.sender}!`);
    setReplyText('');
  };

  const filteredMessages = messages.filter(m => 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.sender.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  return (
    <div className="dashboard-container">
      <Sidebar activePage="messages" />
      <Topbar searchPlaceholder="Search messages..." />
      

      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Internal Messages</h2>
            <p>Communicate with store managers and team members.</p>
          </div>
        </div>

        <div className="messages-layout">
          <div className="inbox-panel">
            <div className="inbox-header">
              <h3>Inbox ({messages.filter(m => m.unread).length} Unread)</h3>
              <button className="new-msg-btn" title="New Message" onClick={() => alert('Compose New Message window opened!')}>
                <span className="material-symbols-outlined">edit_square</span>
              </button>
            </div>
            <div className="message-list">
              
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message-item ${msg.id === activeMsgId ? 'active' : ''} ${msg.unread ? 'unread' : ''}`}
                  onClick={() => handleSelectMessage(msg.id)}
                >
                  <div className="msg-avatar" style={{backgroundColor: msg.avatarBg, color: msg.avatarColor}}>{msg.avatar}</div>
                  <div className="msg-preview">
                    <div className="msg-top-row">
                      <span className="msg-sender" style={msg.unread ? {fontWeight: 800} : {}}>{msg.sender}</span>
                      <span className="msg-time" style={msg.unread ? {color: 'var(--primary)', fontWeight: 700} : {}}>{msg.time}</span>
                    </div>
                    <div className="msg-subject" style={msg.unread ? {fontWeight: 800} : {}}>{msg.subject}</div>
                    <div className="msg-snippet" style={msg.unread ? {fontWeight: 600} : {}}>{msg.snippet}</div>
                  </div>
                </div>
              ))}
              
            </div>
          </div>

          <div className="reading-pane">
            {activeMessage ? (
              <>
                <div className="reading-header">
                  <h2 className="reading-subject">{activeMessage.subject}</h2>
                  <div className="reading-meta">
                    <div className="sender-info">
                      <div className="msg-avatar" style={{backgroundColor: activeMessage.avatarBg, color: activeMessage.avatarColor}}>{activeMessage.avatar}</div>
                      <div className="sender-details">
                        <div className="name">{activeMessage.sender}</div>
                        <div className="role">{activeMessage.email}</div>
                      </div>
                    </div>
                    <div className="msg-date">{activeMessage.date}, {activeMessage.time}</div>
                  </div>
                </div>
                
                <div className="reading-body">
                  {activeMessage.body.map((para, index) => (
                    <p key={index} style={{ whiteSpace: 'pre-line' }}>{para}</p>
                  ))}
                </div>

                <div className="reply-box">
                  <div className="msg-avatar">E1</div>
                  <textarea 
                    className="reply-input" 
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  <button className="primary-btn" style={{height: '45px'}} onClick={handleSendReply}>Send</button>
                </div>
              </>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)'}}>
                <p>Select a message to read</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Messages;
