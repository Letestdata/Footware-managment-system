import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminOrders.css';

const AdminOrders = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState(''); // NEW!
  const [receipts, setReceipts] = useState([]);


  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        const dateObj = data.createdAt?.toDate() || new Date(0);
        const formattedDate = dateObj 
          ? dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just Now';

          let prodString = "0 Items";
          if (data.purchasedItems && data.purchasedItems.length > 0) {
             prodString = data.purchasedItems.map(item => `${item.productName} (x${item.quantity})`).join(', ');
          } else if (data.productName) {
             prodString = `${data.productName} (x${data.itemCount})`;
          }
          
          return {
          id: doc.id,
          receiptId: data.invoiceId || 'N/A',
          customer: data.customerName || 'Walk-in Customer',
          phone: data.phone || 'N/A',
          dateTime: formattedDate,
          total: data.totalAmount || "0.00",
          rawTotal: parseFloat(data.totalAmount) || 0,
          productName: data.productName,
          items: prodString,
          purchasedItems: data.purchasedItems || [],
          rawDate: dateObj,
          itemCount: data.itemCount || 1, 
          status: data.status || 'Completed'
        };

      });
      
      setReceipts(ordersData);
    });

    return () => unsubscribe(); 
  }, []);


     const [returnForm, setReturnForm] = useState({
    receiptId: '',
    customer: '',
    phone: '',
    total: '',
    reason: '',
    returnItems: [] 
  });

  

  const handleReturnItemAction = (index, actionValue) => {
     const updated = [...returnForm.returnItems];
     updated[index].action = actionValue;
     setReturnForm({ ...returnForm, returnItems: updated });
  };

  const [newSale, setNewSale] = useState({
    customer: 'Walk-in Customer',
    phone: '', 
    productId: '',
    items: '1',
    payment: 'Card',
    total: '0.00'
  });


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'receiptId' && value) {
      const foundOrders = receipts.filter(r => r.receiptId === value);
      if (foundOrders.length > 0) {
        const first = foundOrders[0];
        
        let rItems = [];
        if (first.purchasedItems && first.purchasedItems.length > 0) {
           rItems = first.purchasedItems.map(item => ({
              docId: first.id,
              productId: item.productId,
              productName: item.productName,
              itemCount: item.quantity,
              price: item.price,
              status: item.status || first.status,
              action: 'None'
           }));
        } else {
           rItems = [{
              docId: first.id,
              productName: first.productName || "Unknown",
              itemCount: first.itemCount || 1,
              price: first.rawTotal || 0,
              status: first.status,
              action: 'None'
           }];
        }

        setReturnForm({ 
          ...returnForm, 
          receiptId: value, 
          customer: first.customer, 
          phone: first.phone,
          total: first.total,
          returnItems: rItems
        });
        return;
      }
    }
    setReturnForm({ ...returnForm, [name]: value });
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    
    try {
      let processedAny = false;
      if (returnForm.returnItems.length === 0) return;
      
      const orderRef = doc(db, 'orders', returnForm.returnItems[0].docId);
      const invoiceData = receipts.find(r => r.id === returnForm.returnItems[0].docId);
      if (!invoiceData) return;
      
      let newTotal = parseFloat(invoiceData.rawTotal) || 0;
      let updatedPurchasedItems = invoiceData.purchasedItems ? [...invoiceData.purchasedItems] : [];

      for (const item of returnForm.returnItems) {
         if (item.action === 'None' || item.status === 'Refunded' || item.status === 'Exchanged') {
            continue; 
         }
         
         processedAny = true;
         const newStatus = item.action === 'Refund' ? 'Refunded' : 'Exchanged';
         
         if (updatedPurchasedItems.length > 0) {
            const itemIndex = updatedPurchasedItems.findIndex(p => p.productId === item.productId || p.productName === item.productName);
            if (itemIndex >= 0) updatedPurchasedItems[itemIndex].status = newStatus;
         }

         if (newStatus === 'Refunded') {
            newTotal -= (parseFloat(item.price) * parseInt(item.itemCount)) || 0;
         }
         
         const productQuery = query(collection(db, 'products'), where("name", "==", item.productName));
         const prodSnapshot = await getDocs(productQuery);
          
         if (!prodSnapshot.empty) {
            const prodDoc = prodSnapshot.docs[0];
            const prodRef = doc(db, 'products', prodDoc.id);
            const currentStock = parseInt(prodDoc.data().stockQuantity || prodDoc.data().stock || 0);
            const returnedQty = parseInt(item.itemCount || 1);
            
            await updateDoc(prodRef, {
              stockQuantity: currentStock + returnedQty,
              stock: currentStock + returnedQty 
             });
         }
      }
      
      if (!processedAny) {
         alert("No items were selected for return or exchange! Please change the dropdown for at least one item.");
         return;
      }
      
      let finalStatus = 'Completed';
      if (updatedPurchasedItems.length > 0) {
         const allReturned = updatedPurchasedItems.every(i => i.status === 'Refunded' || i.status === 'Exchanged');
         finalStatus = allReturned ? 'Refunded' : 'Partial Return';
      } else {
         finalStatus = returnForm.returnItems[0].action === 'Refund' ? 'Refunded' : 'Exchanged';
      }
      
      const updatePayload = {
         status: finalStatus,
         returnReason: returnForm.reason || 'No reason provided',
         returnedAt: new Date(),
         totalAmount: Math.max(0, newTotal).toFixed(2)
      };
      
      if (updatedPurchasedItems.length > 0) {
         updatePayload.purchasedItems = updatedPurchasedItems;
      }

      await updateDoc(orderRef, updatePayload);
      
    } catch (error) {
      console.error("Error processing return: ", error);
      alert("Failed to process return in Firebase.");
    }

    setIsModalOpen(false);
    setReturnForm({ receiptId: '', customer: '', phone: '', total: '', reason: '', returnItems: [] });
  };



  const today = new Date();
  
  const todaysOrders = receipts.filter(r => 
    r.rawDate.getDate() === today.getDate() && 
    r.rawDate.getMonth() === today.getMonth() && 
    r.rawDate.getFullYear() === today.getFullYear()
  );

  const ordersTodayCount = todaysOrders.filter(r => r.status !== 'Refunded' && r.status !== 'Exchanged').length;
  
  const shoesSoldToday = todaysOrders
    .filter(r => r.status !== 'Refunded' && r.status !== 'Exchanged')
    .reduce((sum, r) => sum + parseInt(r.itemCount), 0);

  const returnsProcessed = receipts.filter(r => r.status === 'Refunded').length;
  const exchangesCount = receipts.filter(r => r.status === 'Exchanged').length;

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
          <a href="/admin/Sales" className="admin-nav-item ">
            <span className="material-symbols-outlined">payments</span>
            <span>Sales</span>
          </a>
          <a href="/admin/Orders" className="admin-nav-item active">
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
              placeholder="Scan or type Receipt ID..." 
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
              <h2>Receipts & Returns (Orders)</h2>
              <p>View past in-store transactions, reprint receipts, and process returns or exchanges.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment_return</span>
                Process Return
              </button>
            </div>
          </div>

          <div className="admin-bento-grid admin-bento-4">
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Orders Today</p>
              <h3 className="admin-stat-value" style={{ color: 'var(--admin-primary)' }}>{ordersTodayCount}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Shoes Sold Today</p>
              <h3 className="admin-stat-value">{shoesSoldToday} Pairs</h3>
            </div>
            <div className="admin-stat-card alert-card">
              <p className="admin-stat-subtitle">Returns Processed</p>
              <h3 className="admin-stat-value text-error">{returnsProcessed}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Exchanges</p>
              <h3 className="admin-stat-value">{exchangesCount}</h3>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Order History</h3>
            </div>
            <div className="admin-table-container">
              {(() => {
                const groupedReceipts = [];
                receipts.forEach(r => {
                  const existing = groupedReceipts.find(g => g.receiptId === r.receiptId);
                  if (existing) {
                    existing.itemsDetails.push({ name: r.items, status: r.status });
                    existing.total = (parseFloat(existing.total) + parseFloat(r.total)).toFixed(2);
                    if (existing.status !== r.status) {
                       existing.status = 'Partial Refund';
                    }
                  } else {
                    groupedReceipts.push({
                      ...r,
                      itemsDetails: [{ name: r.items, status: r.status }]
                    });
                                    }
                });

                const lowerSearch = searchQuery.toLowerCase();
                const filteredReceipts = groupedReceipts.filter(receipt => {
                  const itemsStr = receipt.itemsDetails.map(i => i.name).join(', ').toLowerCase();
                  return (
                    receipt.receiptId.toLowerCase().includes(lowerSearch) ||
                    receipt.dateTime.toLowerCase().includes(lowerSearch) ||
                    receipt.customer.toLowerCase().includes(lowerSearch) ||
                    itemsStr.includes(lowerSearch) ||
                    String(receipt.total).includes(lowerSearch) ||
                    receipt.status.toLowerCase().includes(lowerSearch)
                  );
                });

                return (
                  <div className="admin-orders-table-wrapper">
              <table className="admin-table">
                    <thead>
                      <tr>

                        <th>Receipt ID</th>
                        <th>Item Details</th>
                        <th>Customer Name</th>
                        <th>Date & Time</th>
                        <th>Total Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceipts.map((receipt) => (
                        <tr key={receipt.receiptId}>
                          <td style={{ fontWeight: '500', color: 'var(--admin-primary)' }}>{receipt.receiptId}</td>
                          <td style={{lineHeight: '1.8'}}>
                            {receipt.itemsDetails.map((item, idx) => (
                               <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                                  <span style={{fontWeight: '600', color: 'var(--admin-on-surface)'}}>{item.name}</span>
                                  <span className={`admin-status-badge ${item.status === 'Completed' || item.status === 'Paid' ? 'success' : item.status === 'Refunded' ? 'error' : 'warning'}`} style={{fontSize: '11px', padding: '2px 8px'}}>
                                     {item.status}
                                  </span>
                               </div>
                            ))}
                          </td>
                          <td>
                            <p style={{margin: 0, fontWeight: 'bold'}}>{receipt.customer}</p>
                            <p style={{margin: 0, fontSize: '12px', color: 'var(--admin-on-surface-variant)'}}>{receipt.phone}</p>
                          </td>
                          <td>{receipt.dateTime}</td>
                          <td style={{ fontWeight: '600' }}>₹{receipt.total}</td>
                          <td>
                            <span className={`admin-status-badge ${receipt.status === 'Completed' || receipt.status === 'Paid' || receipt.status === 'Partial Refund' ? (receipt.status === 'Partial Refund' ? 'warning' : 'success') : 'error'}`}>
                              {receipt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredReceipts.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-on-surface-variant)' }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            );
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* PROCESS RETURN MODAL */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h3>Process Return or Exchange</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleProcessReturn}>
              <div className="admin-form-group">
                  <label>Select Receipt ID</label>
                  <select name="receiptId" value={returnForm.receiptId} onChange={handleInputChange} required style={{ backgroundColor: 'var(--admin-surface)', color: 'var(--admin-on-surface)' }}>
                    <option value="">-- Choose a Receipt --</option>
                    {/* Filter out duplicates by mapping Unique IDs */}
                    {Array.from(new Set(receipts.filter(r => r.status === 'Paid' || r.status === 'Completed').map(r => r.receiptId)))
                      .map(id => {
                         const r = receipts.find(x => x.receiptId === id);
                         return (
                            <option key={id} value={id}>
                              {id} - {r.customer}
                            </option>
                         )
                    })}
                  </select>
                </div>

                <div className="admin-form-group" style={{marginTop: '25px'}}>
                  <label>Select Items to Return or Exchange</label>
                  {returnForm.returnItems.length === 0 ? (
                    <p style={{fontSize: '14px', color: 'var(--admin-on-surface-variant)', fontStyle: 'italic'}}>Please select a Receipt ID above to view products.</p>
                  ) : (
                    returnForm.returnItems.map((item, idx) => (
                      <div key={item.docId} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--admin-surface)', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--admin-outline)'}}>
                         <div>
                            <h5 style={{margin: '0 0 5px 0', fontSize: '15px', color: 'var(--admin-on-surface)'}}>{item.productName}</h5>
                            <span style={{fontSize: '12px', color: 'var(--admin-on-surface-variant)'}}>(Qty: {item.itemCount})</span>
                            <br/>
                            <span style={{fontSize: '10px', fontWeight: 'bold', color: item.status === 'Paid' ? '#16a34a' : 'var(--admin-error)', marginTop: '4px', display: 'inline-block'}}>
                               Status: {item.status}
                            </span>
                         </div>
                         <select 
                            style={{width: '150px', padding: '8px', fontSize: '13px', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-on-surface)', border: '1px solid var(--admin-outline)', borderRadius: '6px'}}
                            value={item.action} 
                            onChange={(e) => handleReturnItemAction(idx, e.target.value)}
                            disabled={item.status === 'Refunded' || item.status === 'Exchanged'}
                         >
                            <option value="None">Keep Item</option>
                            <option value="Refund">Refund</option>
                            <option value="Exchange">Exchange</option>
                         </select>
                      </div>
                    ))
                  )}
                </div>

                <div className="admin-form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={returnForm.phone || ''} 
                  placeholder="Auto-filled from receipt"
                  readOnly
                  style={{ backgroundColor: 'var(--admin-background)', color: 'var(--admin-on-surface)' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Original Total Paid (₹)</label>
                <input 
                  type="number" 
                  name="total" 
                  value={returnForm.total || ''} 
                  readOnly 
                  style={{ backgroundColor: 'var(--admin-background)', fontWeight: 'bold', color: 'var(--admin-on-surface)' }}
                />
              </div>
              <div className="admin-form-group">
                <label>Reason for Return</label>
                <select 
                  name="reason" 
                  value={returnForm.reason} 
                  onChange={handleInputChange}
                  required
                  style={{ backgroundColor: 'var(--admin-surface)', color: 'var(--admin-on-surface)' }}
                >
                  <option value="" disabled>Select reason</option>
                  <option value="Defective">Defective Product</option>
                  <option value="Wrong Size">Wrong Size</option>
                  <option value="Changed Mind">Customer Changed Mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-outlined-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-filled-btn text-error" style={{ background: 'var(--admin-error)', color: '#fff', border: 'none' }}>Process Items</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
