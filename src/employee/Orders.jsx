import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Orders.css';
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Orders = () => {
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 


  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
            const ordersData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0);
        const formattedDate = dateObj.getTime() > 0 
          ? dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just Now';
          
        let prodString = "0 Items";
        if (data.purchasedItems && data.purchasedItems.length > 0) {
           prodString = data.purchasedItems.map(item => `${item.productName} (x${item.quantity})`).join(', ');
        } else if (data.productName) {
           prodString = `${data.productName} (x${data.itemCount})`;
        }

        return {
          id: docSnap.id, 
          receiptId: data.invoiceId || 'N/A',
          customer: data.customerName || 'Walk-in Customer',
          phone: data.phone || "Not Provided",
          items: prodString, 
          productName: data.productName,
          purchasedItems: data.purchasedItems || [],
          dateTime: formattedDate,
          total: parseFloat(data.totalAmount || 0).toFixed(2),
          status: data.status || 'Paid',
          rawDate: dateObj,
          rawTotal: parseFloat(data.totalAmount || 0),
          itemCount: data.purchasedItems ? data.purchasedItems.length : parseInt(data.itemCount || 1)
        };
      });

      
      ordersData.sort((a, b) => b.rawDate - a.rawDate);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'receiptId') {
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

  const handleReturnItemAction = (index, actionValue) => {
     const updated = [...returnForm.returnItems];
     updated[index].action = actionValue;
     setReturnForm({ ...returnForm, returnItems: updated });
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
  
  const ordersTodayList = receipts.filter(r => 
    r.rawDate.getDate() === today.getDate() && 
    r.rawDate.getMonth() === today.getMonth() && 
    r.rawDate.getFullYear() === today.getFullYear()
  );
  
  const successfulOrdersToday = ordersTodayList.filter(r => r.status === 'Paid');
  const ordersTodayCount = successfulOrdersToday.length;

  const shoesSoldToday = successfulOrdersToday.reduce((sum, r) => sum + r.itemCount, 0);

  const returnsProcessedList = ordersTodayList.filter(r => r.status === 'Refunded');
  const returnsProcessedCount = returnsProcessedList.reduce((sum, r) => sum + r.itemCount, 0);

  const exchangesToday = ordersTodayList.filter(r => r.status === 'Exchanged').length;

  return (
    <div className="dashboard-container">
      <Sidebar activePage="orders" />
      <Topbar 
        searchPlaceholder="Search Receipt ID or Customer..." 
        searchValue={searchTerm}
        onSearch={setSearchTerm}
      />
      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Receipts & Returns</h2>
            <p>View past in-store transactions, reprint receipts, and process returns or exchanges.</p>
          </div>
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">assignment_return</span>
            Process Return
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <p className="card-subtitle">Orders Today</p>
            <h3 className="card-title text-green">{ordersTodayCount}</h3>
            <p className="card-desc">Successful transactions</p>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Shoes Sold Today</p>
            <h3 className="card-title text-blue">{shoesSoldToday} Pairs</h3>
            <p className="card-desc">Total items leaving store</p>
          </div>
          <div className="metric-card alert-card">
            <p className="card-subtitle">Returns Processed</p>
            <h3 className="card-title error-text">{returnsProcessedCount}</h3>
            <p className="card-desc">Refunded items today</p>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Exchanges</p>
            <h3 className="card-title">{exchangesToday}</h3>
            <p className="card-desc">Size/color swaps today</p>
          </div>
        </div>

        <div className="orders-board">
          <div className="orders-filters">
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input 
                 type="text" 
                 placeholder="Scan or type Receipt ID or Customer..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>


            <div className="filter-actions">
              <select className="filter-dropdown">
                <option>All Receipts</option>
                <option>Completed</option>
                <option>Refunded</option>
                <option>Exchanged</option>
              </select>
              <select className="filter-dropdown">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
              </select>
            </div>
          </div>

          {(() => {
                        const groupedReceipts = [];
            receipts.forEach(r => {
              const existing = groupedReceipts.find(g => g.receiptId === r.receiptId);
              if (existing) {
                existing.itemsDetails.push({ name: r.items, status: r.status });
                existing.total = (parseFloat(existing.total) + parseFloat(r.total)).toFixed(2);
                
                if (existing.status !== r.status) {
                   existing.status = 'Partial';
                }
              } else {
                groupedReceipts.push({
                  ...r,
                  itemsDetails: [{ name: r.items, status: r.status }]
                });
              }
            });

            return (
              <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Item Details</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedReceipts
                     .filter(receipt => 
                        searchTerm === '' || 
                        receipt.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        receipt.customer.toLowerCase().includes(searchTerm.toLowerCase())
                     )
                     .map((receipt) => (

                    <tr key={receipt.receiptId}>
                      <td className="bold-text text-primary">{receipt.receiptId}</td>
                      
                      <td style={{lineHeight: '1.8'}}>
                        {receipt.itemsDetails.map((item, idx) => (
                           <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                              <span style={{fontWeight: '600', color: 'var(--text-dark)'}}>{item.name}</span>
                              <span className={`order-badge ${item.status.toLowerCase()}`} style={{fontSize: '11px', padding: '3px 8px', borderRadius: '12px'}}>
                                 {item.status}
                              </span>
                           </div>
                        ))}
                      </td>
                      
                      <td>
                        <p className="customer-name">{receipt.customer}</p>
                        <p className="customer-phone">{receipt.phone}</p>
                      </td>
                      <td>{receipt.dateTime}</td>
                      <td className="bold-text">₹{receipt.total}</td>
                      <td>
                        <span className={`order-badge ${receipt.status.toLowerCase()}`}>
                          {receipt.status === 'Partial' ? 'Partial Refund' : receipt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {groupedReceipts.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No receipts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            );
          })()}

        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div className="modal-header">
              <h3>Process Return or Exchange</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleProcessReturn}>
              <div className="modal-body">
                
                                <div className="form-group">
                  <label>Select Receipt ID</label>
                  <select name="receiptId" value={returnForm.receiptId} onChange={handleInputChange} required>
                    <option value="">-- Choose a Receipt --</option>
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

                <div className="form-group" style={{marginTop: '25px'}}>
                  <label>Select Items to Return or Exchange</label>
                  {returnForm.returnItems.length === 0 ? (
                    <p style={{fontSize: '14px', color: 'var(--text-light)', fontStyle: 'italic'}}>Please select a Receipt ID above to view products.</p>
                  ) : (
                    returnForm.returnItems.map((item, idx) => (
                      <div key={item.docId} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)'}}>
                         <div>
                           <div style={{fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '4px'}}>{item.productName} (Qty: {item.itemCount})</div>
                           <span style={{fontSize: '12px', fontWeight: 'bold', color: item.status === 'Paid' ? 'var(--success)' : 'var(--error)'}}>Status: {item.status}</span>
                         </div>
                         <select 
                           value={item.action} 
                           onChange={(e) => handleReturnItemAction(idx, e.target.value)}
                           disabled={item.status !== 'Paid' && item.status !== 'Completed'}
                           style={{padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 'bold'}}
                         >
                           <option value="None">Keep Item</option>
                           <option value="Refund">Refund</option>
                           <option value="Exchange">Exchange</option>
                         </select>
                      </div>
                    ))
                  )}
                </div>



                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input type="text" name="customer" placeholder="Auto-fills from Receipt ID..." value={returnForm.customer} onChange={handleInputChange} readOnly style={{backgroundColor: 'var(--background)'}} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone" placeholder="Auto-fills from Receipt ID..." value={returnForm.phone} onChange={handleInputChange} readOnly style={{backgroundColor: 'var(--background)'}} />
                  </div>
                  <div className="form-group">
                    <label>Total Value (₹)</label>
                    <input type="number" step="0.01" name="total" placeholder="0.00" value={returnForm.total} onChange={handleInputChange} readOnly style={{backgroundColor: 'var(--background)'}} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Reason for Return</label>
                    <input type="text" name="reason" placeholder="e.g. Wrong size, Defective" value={returnForm.reason} onChange={handleInputChange} required />
                  </div>
                  {/* <div className="form-group">
                    <label>Action to Take</label>
                    <select name="action" value={returnForm.action} onChange={handleInputChange}>
                      <option value="Refund">Issue Full Refund</option>
                      <option value="Exchange">Exchange for another size/item</option>
                    </select>
                  </div> */}
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Submit Processing</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
