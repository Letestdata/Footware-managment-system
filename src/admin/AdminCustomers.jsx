import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminOrders.css'; 


const AdminCustomers = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

    const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const customersRef = collection(db, 'customers');
    
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          customerId: data.customerIdString || 'N/A', 
          name: data.name || 'Unknown',
          phone: data.phone || 'N/A',
          email: data.email || 'N/A',
          purchasedItems: data.purchasedItems || [],
          totalOrders: data.totalOrders || 0,
          rawTotalSpent: data.totalSpent ? parseFloat(data.totalSpent) : 0, 
          totalSpent: data.totalSpent ? parseFloat(data.totalSpent).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00",
          status: data.status || 'Active',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0) 
        };
      });
      
      setCustomers(customersData);
    });

    return () => unsubscribe(); 
  }, []);


  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    purchasedItems: [{ product: '', quantity: 1 }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer({ ...newCustomer, [name]: value });
  };

    const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newIdString = `#CUST-${randomNum}`;
    
    let totalOrders = 0;
    let totalSpent = 0;
    const validItems = newCustomer.purchasedItems.filter(item => item.product.trim() !== '');
    
    validItems.forEach(item => {
      const qty = parseInt(item.quantity) || 1;
      totalOrders += qty;
      totalSpent += qty * 1250; 
    });

    
    const customerData = {
      customerIdString: newIdString,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || "",
      purchasedItems: validItems,
      totalOrders: totalOrders,
      totalSpent: totalSpent,
      status: "Active",
      createdAt: new Date()
    };
    
    try {
      const customersRef = collection(db, 'customers');
      await addDoc(customersRef, customerData);
    } catch (error) {
      console.error("Error saving customer: ", error);
      alert("Failed to save the customer to Firebase.");
    }

    setIsModalOpen(false);
    setNewCustomer({ name: '', phone: '', email: '', purchasedItems: [{ product: '', quantity: 1 }] });
  };


  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    customer.phone.includes(searchQuery) ||
    customer.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // --- CALCULATE LIVE METRICS ---
  const totalCustomers = customers.length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = customers.filter(c => 
    c.createdAt.getMonth() === currentMonth && 
    c.createdAt.getFullYear() === currentYear
  ).length;

  const activeCustomers = customers.filter(c => c.status === 'Active').length;

  const totalStoreRevenue = customers.reduce((sum, c) => sum + c.rawTotalSpent, 0);
  const avgLifetimeValue = totalCustomers > 0 ? (totalStoreRevenue / totalCustomers) : 0;
  const formattedAvgLTV = `₹${Math.round(avgLifetimeValue).toLocaleString('en-IN')}`;
  // ------------------------------

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
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>Orders</span>
          </a>
          <a href="/admin/Customers" className="admin-nav-item active">
            <span className="material-symbols-outlined">group</span>
            <span>Customers</span>
          </a>
          <a href="/admin/Reports" className="admin-nav-item">
            <span className="material-symbols-outlined">analytics</span>
            <span>Reports</span>
          </a>
          <a href="/admin/Employees" className="admin-nav-item">
            <span className="material-symbols-outlined">badge</span>
            <span>Employees</span>
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
            <input 
              type="text" 
              placeholder="Search customers by name, phone..." 
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
              <h2>Customer Directory</h2>
              <p>Manage your customer list, view purchase history, and add new customers.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                Add Customer
              </button>
            </div>
          </div>

 
          <div className="admin-bento-grid admin-bento-4">
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Total Customers</p>
              <h3 className="admin-stat-value" style={{ color: 'var(--admin-primary)' }}>{totalCustomers.toLocaleString('en-IN')}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">New This Month</p>
              <h3 className="admin-stat-value">{newThisMonth.toLocaleString('en-IN')}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Active Customers</p>
              <h3 className="admin-stat-value">{activeCustomers.toLocaleString('en-IN')}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Avg. Lifetime Value</p>
              <h3 className="admin-stat-value">{formattedAvgLTV}</h3>
            </div>
          </div>


          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Customer Database</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Last Purchased</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600 }}>{customer.customerId}</td>
                      <td style={{ fontWeight: 600 }}>{customer.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem' }}>{customer.phone}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--admin-on-surface-variant)' }}>{customer.email}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-on-surface-variant)' }}>
                        {customer.purchasedItems && customer.purchasedItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {customer.purchasedItems.map((item, idx) => (
                              <span key={idx} style={{ fontSize: '0.85rem' }}>{item.quantity}x {item.product}</span>
                            ))}
                          </div>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td>{customer.totalOrders}</td>
                      <td style={{ fontWeight: 700 }}>₹{customer.totalSpent}</td>
                      <td>
                        <span className={`admin-badge ${customer.status === 'Active' ? 'success' : 'error'}`}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-on-surface-variant)' }}>
                        No customers found matching "{searchQuery}".
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
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Add New Customer</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} placeholder="e.g. John Doe" required />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={newCustomer.phone} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" required />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Email Address (Optional)</label>
                <input type="email" name="email" value={newCustomer.email} onChange={handleInputChange} placeholder="johndoe@example.com" />
              </div>

              <div className="admin-form-group">
                <label>Purchased Products</label>
                {newCustomer.purchasedItems.map((item, index) => (
                  <div key={index} className="admin-form-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                    <div className="admin-form-group" style={{ flex: 3, marginBottom: 0 }}>
                      <input 
                        type="text" 
                        value={item.product} 
                        onChange={(e) => {
                          const updated = [...newCustomer.purchasedItems];
                          updated[index].product = e.target.value;
                          setNewCustomer({ ...newCustomer, purchasedItems: updated });
                        }} 
                        placeholder="Product Name" 
                      />
                    </div>
                    <div className="admin-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => {
                          const updated = [...newCustomer.purchasedItems];
                          updated[index].quantity = e.target.value;
                          setNewCustomer({ ...newCustomer, purchasedItems: updated });
                        }} 
                      />
                    </div>
                    {newCustomer.purchasedItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = newCustomer.purchasedItems.filter((_, i) => i !== index);
                          setNewCustomer({ ...newCustomer, purchasedItems: updated });
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--admin-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setNewCustomer({ ...newCustomer, purchasedItems: [...newCustomer.purchasedItems, { product: '', quantity: 1 }] })}
                  style={{ background: 'transparent', border: 'none', color: 'var(--admin-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                  Add Another Product
                </button>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-outline-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-filled-btn">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
