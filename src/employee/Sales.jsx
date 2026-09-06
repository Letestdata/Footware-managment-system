import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Sales.css';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const Sales = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState(Array(7).fill(0));
  const [searchTerm, setSearchTerm] = useState(''); 


  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      let weeklyRev = Array(7).fill(0);
      
      const ordersData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0);
        const formattedDate = dateObj.getTime() > 0 
          ? dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just Now';
          
        const amt = parseFloat(data.totalAmount) || 0;

        if (dateObj.getTime() > 0) {
          const dayIndex = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
          weeklyRev[dayIndex] += amt;
        }

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
      
      ordersData.sort((a, b) => b.rawDate - a.rawDate);
      
      setTransactions(ordersData);
      setWeeklyPerformance(weeklyRev);
    });

    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const pList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name || 'Unknown Product',
        price: parseFloat(docSnap.data().price || docSnap.data().retailPrice || 0),
        stock: parseInt(docSnap.data().stock || docSnap.data().stockQuantity || 0)
      }));
      setProducts(pList);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

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

    const handleDeleteTransaction = async (invoiceId) => {
    if(window.confirm(`Are you sure you want to permanently delete the ENTIRE invoice (${invoiceId}) from the database?`)) {
      try {
        const itemsToDelete = transactions.filter(t => t.invoiceId === invoiceId);
        
        for (const item of itemsToDelete) {
           await deleteDoc(doc(db, 'orders', item.id));
        }
      } catch (error) {
         console.error("Error deleting transaction: ", error);
         alert("Failed to delete the transaction from Firebase! Check console.");
      }
    }
  };

  const handleGenerateReceipt = async (tx) => {
    
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
          <div class="flex bold" style="font-size: 16px;">
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
    
    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `receipt_${tx.invoiceId.replace('#', '')}.html`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: receiptHTML,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Print/Share Receipt',
          text: `Receipt ${tx.invoiceId}`,
          url: result.uri,
          dialogTitle: 'Share or Print Receipt',
        });
      } catch (err) {
        console.error("Error sharing receipt:", err);
        alert("Failed to generate native receipt.");
      }
    } else {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        alert("Please allow pop-ups in your browser to print receipts.");
        return;
      }
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
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
  
  const maxWeeklyRev = Math.max(...weeklyPerformance, 1);
  
  const cardTotal = transactions.filter(t => t.payment === 'Card').reduce((sum, t) => sum + t.rawTotal, 0);
  const cashTotal = transactions.filter(t => t.payment === 'Cash').reduce((sum, t) => sum + t.rawTotal, 0);
  const upiTotal = transactions.filter(t => t.payment === 'UPI').reduce((sum, t) => sum + t.rawTotal, 0);
  
  const cardPercent = totalStoreRevenue > 0 ? Math.round((cardTotal / totalStoreRevenue) * 100) : 0;
  const cashPercent = totalStoreRevenue > 0 ? Math.round((cashTotal / totalStoreRevenue) * 100) : 0;
  const upiPercent = totalStoreRevenue > 0 ? Math.round((upiTotal / totalStoreRevenue) * 100) : 0;

  return (
    <div className="dashboard-container">
      <Sidebar activePage="sales" />
            <Topbar 
        searchPlaceholder="Search Invoice ID or Customer..." 
        searchValue={searchTerm}
        onSearch={setSearchTerm}
      />

      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Sales & Transactions</h2>
            <p>Monitor your sales performance and process new transactions.</p>
          </div>
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">point_of_sale</span>
            New Transaction
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <p className="card-subtitle">Today's Revenue</p>
            <h3 className="card-title text-green">₹{todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <span className="trend-badge positive">Live Today</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Total Transactions</p>
            <h3 className="card-title">{totalTransactions.toLocaleString('en-IN')}</h3>
            <span className="trend-badge positive">All Time</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Average Order Value</p>
            <h3 className="card-title">₹{Math.round(avgOrderValue).toLocaleString('en-IN')}</h3>
            <span className="trend-badge positive">Avg Per Order</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Returns / Refunds</p>
            <h3 className="card-title error-text">{returnsCount}</h3>
            <span className="trend-badge neutral">Stable</span>
          </div>
        </div>

        <div className="sales-content-grid">
          <div className="sales-chart-card">
            <div className="widget-header">
              <h3>Revenue Trend (Last 7 Days)</h3>
              <select className="chart-filter">
                <option>This Week</option>
              </select>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="bar" style={{height: `${(weeklyPerformance[index] / maxWeeklyRev) * 100}%`}} title={`₹${weeklyPerformance[index]}`}><span>{day}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="payment-methods-card">
            <div className="widget-header">
              <h3>Payment Methods</h3>
            </div>
            <div className="payment-list">
               <div className="payment-item">
                 <span className="material-symbols-outlined icon-blue">credit_card</span>
                 <div className="payment-info">
                    <h4>Credit Card</h4>
                    <p>{cardPercent}% of revenue</p>
                 </div>
                 <h4 className="payment-amount">₹{cardTotal.toLocaleString('en-IN')}</h4>
               </div>
               <div className="payment-item">
                 <span className="material-symbols-outlined icon-green">payments</span>
                 <div className="payment-info">
                    <h4>Cash</h4>
                    <p>{cashPercent}% of revenue</p>
                 </div>
                 <h4 className="payment-amount">₹{cashTotal.toLocaleString('en-IN')}</h4>
               </div>
               <div className="payment-item">
                 <span className="material-symbols-outlined icon-orange">account_balance_wallet</span>
                 <div className="payment-info">
                    <h4>UPI / Digital</h4>
                    <p>{upiPercent}% of revenue</p>
                 </div>
                 <h4 className="payment-amount">₹{upiTotal.toLocaleString('en-IN')}</h4>
               </div>
            </div>
          </div>
        </div>

        <div className="transaction-history">
          <div className="widget-header">
            <h3>Recent Transactions</h3>
            <div className="small-search">
              <span className="material-symbols-outlined">search</span>
              <input 
                 type="text" 
                 placeholder="Search Invoice ID or Customer..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>


          </div>
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

            return (
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date & Time</th>
                    <th>Customer Name</th>
                    <th>Items (Purchased)</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                    {groupedTransactions
                     .filter(tx => 
                        searchTerm === '' || 
                        tx.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tx.customer.toLowerCase().includes(searchTerm.toLowerCase())
                     )
                     .map((tx) => (

                    <tr key={tx.invoiceId}>
                      <td className="bold-text text-primary">{tx.invoiceId}</td>
                      <td>{tx.dateTime}</td>
                      <td>{tx.customer}</td>
                      <td className="bold-text" style={{lineHeight: '1.5'}}>{tx.itemsList.join(', ')}</td>
                      <td>
                        <span className={`pay-badge ${tx.payment.toLowerCase()}`}>
                          {tx.payment}
                        </span>
                      </td>
                      <td className="bold-text">₹{tx.total}</td>
                      <td>
                        <span className={`status-badge ${
                           tx.status === 'Paid' ? 'completed' : 
                           tx.status === 'Refunded' ? 'refunded' : 
                           tx.status === 'Partial Refund' ? 'partial' : 
                           'processing'
                        }`}> 
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-icon" onClick={() => handleGenerateReceipt(tx)}>
                          <span className="material-symbols-outlined">receipt_long</span>
                        </button>
                        <button className="action-icon" onClick={() => handleDeleteTransaction(tx.invoiceId)}>
                           <span className="material-symbols-outlined" style={{color: 'var(--error)'}}>delete</span>
                        </button>


                      </td>
                    </tr>
                  ))}
                  
                  {groupedTransactions.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            
            <div className="modal-header">
              <h3>Process New Transaction</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" name="customer" placeholder="e.g. Walk-in Customer" value={newSale.customer} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" placeholder="e.g. 9876543210" value={newSale.phone} onChange={handleInputChange} minLength="10" maxLength="10" pattern="\d{10}" title="Phone number must be exactly 10 digits" required />
                </div>
                <div className="form-group">
                  <h4 style={{marginTop: '15px', marginBottom: '10px'}}>Purchased Items</h4>
                
                  
                      
                  <div className="purchased-item-header">
                     <div>Select Product</div>
                     <div>Qty</div>
                     <div>Price (₹)</div>
                     {newSale.purchasedItems.length > 1 ? <div></div> : <div></div>}
                  </div>

                  {newSale.purchasedItems.map((item, index) => (
                    <div key={index} className="purchased-item-row">
                      <div className="form-group" >
                        <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required style={{width: '100%'}}>
                          <option value="">-- Choose --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | ₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" >
                        <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required style={{width: '100%'}} />
                      </div>
                      <div className="form-group" >
                        <input type="number" step="0.01" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} required style={{width: '100%'}} />
                      </div>
                      {newSale.purchasedItems.length > 1 && (
                        <div>
                          <button type="button" onClick={() => removeItemRow(index)} className="action-icon" style={{marginBottom: '0', color: 'var(--error)'}}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addItemRow} style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px'}}>
                    <span className="material-symbols-outlined">add_circle</span> Add Another Item
                  </button>

                  <div className="form-group" style={{marginTop: '20px'}}>
                    <label>Grand Total (₹)</label>
                    <input type="number" value={computedTotal.toFixed(2)} readOnly style={{backgroundColor: 'var(--background)', fontWeight: 'bold', color: 'var(--primary)', fontSize: '18px'}} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select name="payment" value={newSale.payment} onChange={handleInputChange}>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / Digital Wallet</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Complete Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
