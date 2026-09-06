import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminDashbord.css'; 

const AdminEmployees = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const employeeData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          empId: data.employeeId || 'N/A',
          name: data.name || 'Unknown',
          phone: data.phone || 'N/A',
          email: data.email || 'N/A',
          username: data.username || 'N/A',
          position: data.position || 'Staff',
          role: data.role || 'employee',
          status: data.status || 'Active',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0)
        };
      });
      
      setEmployees(employeeData);
    });

    return () => unsubscribe(); 
  }, []);


  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    position: 'Sales Representative'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newIdString = `#EMP-${randomNum}`;
    
    const assignedRole = newEmployee.position === 'Store Manager' ? 'admin' : 'employee';

    const employeeData = {
      employeeId: newIdString,
      name: newEmployee.name,
      phone: newEmployee.phone,
      email: newEmployee.email,
      username: newEmployee.username.toLowerCase(),
      password: newEmployee.password,
      position: newEmployee.position,
      role: assignedRole,
      status: "Active",
      createdAt: new Date()
    };
    
    try {
      const usersRef = collection(db, 'users');
      await addDoc(usersRef, employeeData);
    } catch (error) {
      console.error("Error saving user: ", error);
      alert("Failed to save the user to Firebase.");
    }

    setIsModalOpen(false);
    setNewEmployee({ name: '', phone: '', email: '', username: '', password: '', position: 'Sales Representative' });
  };

  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.status === 'Active').length;
  const salesReps = employees.filter(e => e.position === 'Sales Representative').length;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires = employees.filter(e => e.createdAt >= thirtyDaysAgo).length;

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
          <a href="/admin/Employees" className="admin-nav-item active">
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
          
          <div className="admin-cta">
            <button className="admin-cta-btn" onClick={() => setIsModalOpen(true)}>
              <span className="material-symbols-outlined">add</span>
              New Entry
            </button>
          </div>
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
            <input type="text" placeholder="Search employees..." />
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
              <h2>Staff & Employees</h2>
              <p>Manage your workforce, track roles, and add new team members.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                Add Employee
              </button>
            </div>
          </div>

          <div className="admin-bento-grid admin-bento-4">
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Total Employees</p>
              <h3 className="admin-stat-value" style={{ color: 'var(--admin-primary)' }}>{totalEmployees}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Active Staff</p>
              <h3 className="admin-stat-value">{activeStaff}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Sales Reps</p>
              <h3 className="admin-stat-value">{salesReps}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">New Hires (30d)</p>
              <h3 className="admin-stat-value text-success">{newHires}</h3>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Employee Directory</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Position / Role</th>
                    <th>System Access</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: '500', color: 'var(--admin-primary)' }}>{emp.empId}</td>
                      <td style={{ fontWeight: '600' }}>{emp.name}</td>
                      <td>{emp.username}</td>
                      <td>{emp.position}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', background: emp.role === 'admin' ? 'var(--admin-primary)' : 'var(--admin-surface-container-high)', color: emp.role === 'admin' ? '#fff' : 'inherit' }}>
                          {emp.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${emp.status === 'Active' ? 'success' : 'error'}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-on-surface-variant)' }}>
                        No employees found. Add one above to allow them to log in!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h3>Add New Employee</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleAddEmployee}>
              <div className="admin-form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={newEmployee.name} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Position / Role</label>
                <select name="position" value={newEmployee.position} onChange={handleInputChange} required>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Store Manager">Store Manager (Grants Admin Access)</option>
                  <option value="Stock Clerk">Stock Clerk</option>
                </select>
              </div>
              
              <div style={{ padding: '16px', background: 'var(--admin-surface-container-low)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--admin-outline-variant)' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-primary)' }}>System Login Credentials</h4>
                <div className="admin-form-group">
                  <label>Username</label>
                  <input type="text" name="username" value={newEmployee.username} onChange={handleInputChange} required placeholder="e.g. jsmith" />
                </div>
                <div className="admin-form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={newEmployee.password} onChange={handleInputChange} required placeholder="Assign a secure password" />
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-outlined-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-filled-btn">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
