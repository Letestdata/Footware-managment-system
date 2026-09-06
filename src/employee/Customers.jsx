import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Customers.css';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Customers = () => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
    
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Customers');
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]); 

  useEffect(() => {
    const customersRef = collection(db, 'customers');
    const unsubCustomers = onSnapshot(customersRef, (snapshot) => {
      const customersData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0);
        const formattedDate = dateObj.getTime() > 0 
          ? dateObj.toLocaleDateString()
          : 'Just Now';

        const initials = (data.name || 'Unknown')
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'NA';

        const rawPrice = data.totalSpent ? parseFloat(data.totalSpent) : 0;
        
        let displayProduct = 'None';
        if (data.purchasedItems && data.purchasedItems.length > 0) {
          const firstItem = data.purchasedItems[0];
          displayProduct = data.purchasedItems.length > 1 
            ? `${firstItem.product} + ${data.purchasedItems.length - 1} more`
            : firstItem.product;
        }

        return {
          id: docSnap.id,
          customerId: data.customerIdString || 'N/A', 
          initials: initials,
          colorClass: 'blue',
          name: data.name || 'Unknown',
          phone: data.phone || 'N/A',
          email: data.email || '',
          price: rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          rawPrice: rawPrice,
          date: formattedDate,
          createdAt: dateObj,
          product: displayProduct,
          purchasedItems: data.purchasedItems || [],
          totalOrders: data.totalOrders || 0,
        };
      });
      
      customersData.sort((a, b) => b.createdAt - a.createdAt);
      setCustomers(customersData);
    });

    const productsRef = collection(db, 'products');
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      const pList = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name || 'Unknown',
        price: parseFloat(d.data().price || d.data().retailPrice || 0),
        stock: parseInt(d.data().stockQuantity || d.data().stock || 0) 
      }));
      setProducts(pList);
    });


    return () => {
      unsubCustomers();
      unsubProducts();
    }
  }, []);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    purchasedItems: [{ product: '', quantity: 1, price: 0 }] 
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer({ ...newCustomer, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newCustomer.purchasedItems];
    updatedItems[index][field] = value;
    
    if (field === 'product') {
      const selectedProd = products.find(p => p.name === value);
      if (selectedProd) {
        updatedItems[index].price = selectedProd.price;
      }
    }
    
    setNewCustomer({ ...newCustomer, purchasedItems: updatedItems });
  };

  const addItemRow = () => {
    setNewCustomer({
      ...newCustomer,
      purchasedItems: [...newCustomer.purchasedItems, { product: '', quantity: 1, price: 0 }]
    });
  };

  const removeItemRow = (index) => {
    const updatedItems = [...newCustomer.purchasedItems];
    updatedItems.splice(index, 1);
    setNewCustomer({ ...newCustomer, purchasedItems: updatedItems });
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setEditCustomerId(null);
    setNewCustomer({ name: '', phone: '', email: '', purchasedItems: [{ product: '', quantity: 1, price: 0 }], payment: 'Card' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditMode(true);
    setEditCustomerId(customer.id);
    
    let itemsToEdit = customer.purchasedItems;
    if (!itemsToEdit || itemsToEdit.length === 0) {
      itemsToEdit = [{ product: '', quantity: 1, price: 0 }];
    }
    
    setNewCustomer({
      name: customer.name,
      phone: customer.phone === 'N/A' ? '' : customer.phone,
      email: customer.email || '',
      purchasedItems: itemsToEdit
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    
    let totalOrders = 0;
    let totalSpent = 0;
    const validItems = newCustomer.purchasedItems.filter(item => item.product.trim() !== '');
    
    validItems.forEach(item => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      totalOrders += qty;
      totalSpent += qty * price; 
    });

    if (editMode) {
      try {
        const custRef = doc(db, 'customers', editCustomerId);
        await updateDoc(custRef, {
          name: newCustomer.name,
          phone: newCustomer.phone || 'N/A',
          email: newCustomer.email || '',
          purchasedItems: validItems,
          totalOrders: totalOrders,
          totalSpent: totalSpent
        });
      } catch (err) {
        console.error("Error updating customer", err);
      }
    }
    
       else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newIdString = `#CUST-${randomNum}`;
      
      const customerData = {
        customerIdString: newIdString,
        name: newCustomer.name,
        phone: newCustomer.phone || 'N/A',
        email: newCustomer.email || '',
        purchasedItems: validItems,
        totalOrders: totalOrders,
        totalSpent: totalSpent,
        status: "Active",
        createdAt: new Date()
      };
      
      try {
        const customersRef = collection(db, 'customers');
        await addDoc(customersRef, customerData);
        
        for (const item of validItems) {
           const qty = parseInt(item.quantity) || 1;
           const price = parseFloat(item.price) || 0;
           
           const selectedProd = products.find(p => p.name === item.product);
           if (selectedProd) {
              
              const orderNum = Math.floor(1000 + Math.random() * 9000);
              const orderData = {
                 invoiceId: `#INV-2026-${orderNum}`,
                 customerName: newCustomer.name,
                 phone: newCustomer.phone || 'N/A',
                 productName: item.product,
                 itemCount: qty,
                 paymentMethod: newCustomer.payment || 'Card',
                 totalAmount: (qty * price).toFixed(2),
                 status: "Paid",
                 createdAt: new Date()
              };
              await addDoc(collection(db, 'orders'), orderData);
              
              const productRef = doc(db, 'products', selectedProd.id);
              await updateDoc(productRef, {
                 stockQuantity: selectedProd.stock - qty
              });
           }
        }
      } catch (err) {
        console.error("Error adding customer & transactions", err);
      }
    }

    setIsModalOpen(false);
    setNewCustomer({ name: '', phone: '', email: '', purchasedItems: [{ product: '', quantity: 1, price: 0 }], payment: 'Card' });
    setEditMode(false);
    setEditCustomerId(null);
  };

  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cust.phone.includes(searchQuery);
                          
    if (filterType === 'High Value Customers') return matchesSearch && cust.rawPrice >= 5000;
    if (filterType === 'Standard Value') return matchesSearch && cust.rawPrice < 5000;
    return matchesSearch;
  });

  const totalCustomersCount = customers.length;
  
  const returningCustomersCount = customers.filter(c => c.totalOrders > 1).length;
  
  const totalStoreRevenue = customers.reduce((sum, c) => sum + c.rawPrice, 0);
  const avgLifetimeValue = totalCustomersCount > 0 ? (totalStoreRevenue / totalCustomersCount) : 0;
  
  const unregisteredCount = customers.filter(c => c.name.toLowerCase().includes('walk-in') || c.phone === 'N/A').length;
  const walkInRatio = totalCustomersCount > 0 ? Math.round((unregisteredCount / totalCustomersCount) * 100) : 0;

  return (
    <div className="dashboard-container">
      <Sidebar activePage="customers" />
      <Topbar searchPlaceholder="Search..." />
      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Customer Directory</h2>
            <p>Manage customer profiles and view their past purchase history.</p>
          </div>
          <button className="primary-btn" onClick={handleOpenAddModal}>
            <span className="material-symbols-outlined">person_add</span>
            Add Customer
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <p className="card-subtitle">Total Customers</p>
            <h3 className="card-title">{totalCustomersCount.toLocaleString('en-IN')}</h3>
            <span className="trend-badge positive">All Time</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Returning Customers</p>
            <h3 className="card-title text-purple">{returningCustomersCount.toLocaleString('en-IN')}</h3>
            <p className="card-desc">Bought 2+ items</p>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Average Spend</p>
            <h3 className="card-title text-green">₹{Math.round(avgLifetimeValue).toLocaleString('en-IN')}</h3>
            <p className="card-desc">Lifetime value per customer</p>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Walk-in Ratio</p>
            <h3 className="card-title text-blue">{walkInRatio}%</h3>
            <p className="card-desc">Unregistered Guests</p>
          </div>
        </div>

        <div className="customers-board">
          <div className="customers-filters">
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input 
                type="text" 
                placeholder="Search by name or phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <select 
                className="filter-dropdown" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All Customers">All Customers</option>
                <option value="High Value Customers">High Value Customers</option>
                <option value="Standard Value">Standard Value</option>
              </select>
            </div>
          </div>

          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Purchased Product(s)</th>
                <th>Total Spent</th>
                <th>Date Added</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id}>
                  <td>
                    <div className="customer-profile-cell">
                      <div className={`customer-avatar ${cust.colorClass === 'grey' ? '' : cust.colorClass}`} 
                           style={cust.colorClass === 'grey' ? {backgroundColor: 'var(--surface-low)', color: 'var(--text-muted)'} : {}}>
                        {cust.initials}
                      </div>
                      <div>
                        <p className="customer-name">{cust.name}</p>
                        <p className="customer-phone">{cust.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="bold-text">{cust.product}</td>
                  <td className="bold-text text-green">₹{cust.price}</td>
                  <td>{cust.date}</td>
                  <td>
                    <button className="action-icon" onClick={() => handleOpenEditModal(cust)}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            
            <div className="modal-header">
              <h3>{editMode ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" placeholder="e.g. Rahul Kumar" value={newCustomer.name} onChange={handleInputChange} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone" placeholder="+91 XXXXX XXXXX" value={newCustomer.phone} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="Optional" value={newCustomer.email} onChange={handleInputChange} />
                  </div>
                </div>
                
                <h4 style={{marginTop: '15px', marginBottom: '10px'}}>Purchased Items</h4>
                {newCustomer.purchasedItems.map((item, index) => (
                  <div className="form-row" key={index} style={{alignItems: 'flex-end', marginBottom: '10px'}}>
                    
                    <div className="form-group" style={{flex: 2}}>
                      <label>Select Product</label>
                      <select 
                        value={item.product} 
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        required
                      >
                        <option value="">-- Choose --</option>
                        {products.map(p => (
                           <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{flex: 1}}>
                      <label>Qty</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="form-group" style={{flex: 1}}>
                      <label>Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={item.price} 
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)} 
                        required 
                      />
                    </div>

                    {newCustomer.purchasedItems.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(index)} className="action-icon" style={{marginBottom: '5px', color: 'var(--error)'}}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={addItemRow}
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '10px'
                  }}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Add Another Item
                </button>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editMode ? 'Save Changes' : 'Save Customer'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
