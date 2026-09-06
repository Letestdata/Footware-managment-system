import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminSales.css';

const AdminSales = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState(''); 
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]); 


  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const ordersData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const dateObj = data.createdAt?.toDate() || new Date(0);
        const formattedDate = dateObj ? dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now';
        const amt = parseFloat(data.totalAmount) || 0;

        let itemsText = "0 Items";
        if (data.purchasedItems && data.purchasedItems.length > 0) {
           itemsText = data.purchasedItems.map(item => `${item.productName} (x${item.quantity})`).join(', ');
        } else if (data.productName) {
           itemsText = `${data.productName} (x${data.itemCount})`;
        }

        return {
          id: docSnap.id, 
          invoiceId: data.invoiceId || 'N/A',
          dateTime: formattedDate,
          customer: data.customerName || 'Walk-in Customer',
          items: itemsText, 
          purchasedItems: data.purchasedItems || [], 
          payment: data.paymentMethod || 'Card',
          total: data.totalAmount || 0,
          rawTotal: amt,
          rawDate: dateObj,
          status: data.status || 'Paid'
        };
      });
      setTransactions(ordersData);
    });

    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const pList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name || 'Unknown Product',
        price: parseFloat(docSnap.data().price || 0),
        stock: parseInt(docSnap.data().stockQuantity || 0)
      }));
      setProducts(pList);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

    const handleGenerateReceipt = (tx) => {
    
    let itemsListHTML = '';
    if (tx.purchasedItems && tx.purchasedItems.length > 0) {
      itemsListHTML = tx.purchasedItems.map(item => `
        <div class="flex">
          <span>${item.productName} (x${item.quantity})</span>
          <span>₹${(item.quantity * item.price).toFixed(2)}</span>
        </div>
      `).join('');
    } else {
      itemsListHTML = `
        <div class="flex">
          <span>${tx.items}</span>
          <span>₹${tx.rawTotal.toFixed(2)}</span>
        </div>`;
    }

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Please allow pop-ups in your browser to print receipts.");
      return;
    }
    
    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${tx.invoiceId}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 350px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; }
            .sub-head { text-align: center; font-size: 14px; margin-top: 0; color: #555; }
            .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
            .flex { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .bold { font-weight: bold; }
            .footer { text-align: center; font-size: 12px; margin-top: 30px; color: #555; }
          </style>
        </head>
        <body>
          <h2>NICE FOOTWEAR</h2>
          <p class="sub-head">Official Receipt</p>
          
          <div class="divider"></div>
          <div class="flex"><span>Invoice:</span> <span class="bold">${tx.invoiceId}</span></div>
          <div class="flex"><span>Date:</span> <span>${tx.dateTime}</span></div>
          <div class="flex"><span>Customer:</span> <span>${tx.customer}</span></div>
          
          <div class="divider"></div>
          <div class="flex bold"><span>Item</span><span>Amount</span></div>
          <div class="divider"></div>
          
          ${itemsListHTML}
          
          <div class="divider"></div>
          <div class="flex bold">
            <span>TOTAL</span>
            <span>₹${tx.rawTotal.toFixed(2)}</span>
          </div>
          <div class="flex">
            <span>Payment Method</span>
            <span>${tx.payment}</span>
          </div>
          
          <p class="footer">Thank you for shopping with us!<br>Please retain this receipt for returns/exchanges within 7 days.</p>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };


  const [newSale, setNewSale] = useState({
    customer: 'Walk-in Customer',
    phone: '',
    payment: 'Card',
    purchasedItems: [{ productId: '', quantity: 1, price: 0 }]
  });

  const computedTotal = newSale.purchasedItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSale({ ...newSale, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newSale.purchasedItems];
    updatedItems[index][field] = value;
    
    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === value);
      if (selectedProd) updatedItems[index].price = selectedProd.price;
      else updatedItems[index].price = 0;
    }
    setNewSale({ ...newSale, purchasedItems: updatedItems });
  };

  const addItemRow = () => setNewSale({ ...newSale, purchasedItems: [...newSale.purchasedItems, { productId: '', quantity: 1, price: 0 }] });
  
  const removeItemRow = (index) => {
    const updatedItems = [...newSale.purchasedItems];
    updatedItems.splice(index, 1);
    setNewSale({ ...newSale, purchasedItems: updatedItems });
  };

  

     const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    const validItems = newSale.purchasedItems.filter(item => item.productId.trim() !== '');
    if (validItems.length === 0) {
      alert("Please select at least one product!");
      return;
    }

    for (const item of validItems) {
      const selectedProd = products.find(p => p.id === item.productId);
      const qty = parseInt(item.quantity) || 1;
      
      if (!selectedProd) return;
      if (selectedProd.stock < qty) {
        alert(`Not enough stock for ${selectedProd.name}! Only ${selectedProd.stock} units left.`);
        return;
      }
    }
    
    try {
        const ordersRef = collection(db, 'orders');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newInvId = `#INV-2026-${randomNum}`; 

        const finalItemsArray = validItems.map(item => {
           const selectedProd = products.find(p => p.id === item.productId);
           return {
             productId: item.productId,
             productName: selectedProd.name,
             quantity: parseInt(item.quantity) || 1,
             price: parseFloat(item.price) || 0
           };
        });

        const orderData = {
          invoiceId: newInvId,
          customerName: newSale.customer,
          phone: newSale.phone || "N/A",
          purchasedItems: finalItemsArray, 
          paymentMethod: newSale.payment,
          totalAmount: computedTotal.toFixed(2), 
          status: "Paid",
          createdAt: new Date()
        };
        
        await addDoc(ordersRef, orderData);

        for (const item of finalItemsArray) {
           const productRef = doc(db, 'products', item.productId);
           const currentProd = products.find(p => p.id === item.productId);
           await updateDoc(productRef, {
             stock: currentProd.stock - item.quantity,
             stockQuantity: currentProd.stock - item.quantity 
           });
        }
    } catch (error) {
      console.error("Error saving sale: ", error);
      alert("Failed to save the transaction to Firebase.");
    }

    setIsModalOpen(false);
    setNewSale({ customer: 'Walk-in Customer', phone: '', payment: 'Card', purchasedItems: [{ productId: '', quantity: 1, price: 0 }] });
  };




  const totalTransactions = transactions.length;

  const today = new Date();
  const todaysRevenue = transactions
    .filter(t => 
      t.rawDate.getDate() === today.getDate() && 
      t.rawDate.getMonth() === today.getMonth() && 
      t.rawDate.getFullYear() === today.getFullYear()
    )
    .reduce((sum, t) => sum + t.rawTotal, 0);

  const totalStoreRevenue = transactions.reduce((sum, t) => sum + t.rawTotal, 0);
  const avgOrderValue = totalTransactions > 0 ? (totalStoreRevenue / totalTransactions) : 0;
  
  const returnsCount = transactions.filter(t => t.status === 'Refunded').length;
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
          <a href="/admin/Dashbord" className="admin-nav-item ">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="/admin/Inventory" className="admin-nav-item">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Inventory</span>
          </a>
          <a href="/admin/Sales" className="admin-nav-item active">
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
              placeholder="Search invoices, customers..." 
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
              <h2>Sales & Transactions</h2>
              <p>Monitor your sales performance and process new transactions.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>point_of_sale</span>
                New Transaction
              </button>
            </div>
          </div>

          <div className="admin-bento-grid admin-bento-4">
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Today's Revenue</p>
              <h3 className="admin-stat-value" style={{ color: 'var(--admin-primary)' }}>₹{todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Total Transactions</p>
              <h3 className="admin-stat-value">{totalTransactions.toLocaleString('en-IN')}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Average Order Value</p>
              <h3 className="admin-stat-value">₹{Math.round(avgOrderValue).toLocaleString('en-IN')}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Returns / Refunds</p>
              <h3 className="admin-stat-value text-error">{returnsCount}</h3>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Recent Transactions</h3>
            </div>
            <div className="admin-table-container">
              {(() => {
                const groupedTransactions = [];
                transactions.forEach(tx => {
                  const existing = groupedTransactions.find(g => g.invoiceId === tx.invoiceId);
                  if (existing) {
                    existing.itemsList.push(tx.items);
                    existing.total = (parseFloat(existing.total) + parseFloat(tx.total)).toFixed(2);
                    
                    if (existing.status !== tx.status) {
                       existing.status = 'Partial Refund';
                    }
                  } else {
                    groupedTransactions.push({
                      ...tx,
                      itemsList: [tx.items]
                    });
                                   }
                });

                const lowerSearch = searchQuery.toLowerCase();
                const filteredTransactions = groupedTransactions.filter(tx => {
                  const itemsStr = tx.itemsList.join(', ').toLowerCase();
                  return (
                    tx.invoiceId.toLowerCase().includes(lowerSearch) ||
                    tx.dateTime.toLowerCase().includes(lowerSearch) ||
                    tx.customer.toLowerCase().includes(lowerSearch) ||
                    itemsStr.includes(lowerSearch) ||
                    tx.payment.toLowerCase().includes(lowerSearch) ||
                    String(tx.total).includes(lowerSearch) ||
                    tx.status.toLowerCase().includes(lowerSearch)
                  );
                });

                return (
                  <table className="admin-table">
                    <thead>
                      <tr>

                        <th>Invoice ID</th>
                        <th>Date & Time</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((tx) => (
                        <tr key={tx.invoiceId}>
                          <td style={{ fontWeight: '500', color: 'var(--admin-primary)' }}>{tx.invoiceId}</td>
                          <td>{tx.dateTime}</td>
                          <td>{tx.customer}</td>
                          <td style={{ lineHeight: '1.5' }}>{tx.itemsList.join(', ')}</td>
                          <td>{tx.payment}</td>
                          <td style={{ fontWeight: '600' }}>₹{tx.total}</td>
                          <td>
                            <span className={`admin-status-badge ${tx.status === 'Paid' ? 'success' : tx.status.includes('Refund') ? 'error' : 'warning'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-on-surface-variant)' }}>
                            No transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '700px' }}>
            <div className="admin-modal-header">
              <h3>Process New Transaction</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleAddTransaction}>

                            <div className="admin-form-group">
                <label>Customer Name</label>
                <input type="text" name="customer" value={newSale.customer} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" placeholder="e.g. 9876543210" value={newSale.phone} onChange={handleInputChange} minLength="10" maxLength="10" pattern="\d{10}" title="Phone number must be exactly 10 digits" required />
              </div>

              <h4 style={{marginTop: '15px', marginBottom: '10px', color: 'var(--admin-on-surface)'}}>Purchased Items</h4>
              
              
                  
                  <div className="purchased-item-header">
                     <div>Select Product</div>
                     <div>Qty</div>
                     <div>Price (₹)</div>
                     {newSale.purchasedItems.length > 1 ? <div></div> : <div></div>}
                  </div>

                  {newSale.purchasedItems.map((item, index) => (
                    <div key={index} className="purchased-item-row">
                      <div className="admin-form-group" >
                        <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required style={{width: '100%'}}>
                          <option value="">-- Choose --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | ₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                      <div className="admin-form-group" >
                        <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required style={{width: '100%'}} />
                      </div>
                      <div className="admin-form-group" >
                        <input type="number" step="0.01" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} required style={{width: '100%'}} />
                      </div>
                      {newSale.purchasedItems.length > 1 && (
                        <div>
                          <button type="button" onClick={() => removeItemRow(index)} style={{marginBottom: '0', background: 'none', border: 'none', color: 'var(--admin-error)', cursor: 'pointer', padding: '10px'}}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                <button type="button" onClick={addItemRow} style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--admin-primary)', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', marginBottom: '20px'}}>
                <span className="material-symbols-outlined">add_circle</span> Add Another Item
              </button>

              <div className="admin-form-group">
                <label>Payment Method</label>
                <select name="payment" value={newSale.payment} onChange={handleInputChange}>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Grand Total (₹)</label>
                <input type="number" value={computedTotal.toFixed(2)} readOnly style={{backgroundColor: 'var(--admin-surface-variant)', fontWeight: 'bold', color: 'var(--admin-primary)', fontSize: '18px'}} />
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-outlined-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-filled-btn">Process Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSales;
