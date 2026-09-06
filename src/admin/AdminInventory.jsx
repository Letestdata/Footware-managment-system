import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminInventory.css';


const AdminInventory = () => {

  
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState('Stock Status: All');

    const [products, setProducts] = useState([]);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const currentStock = parseInt(data.stock) || parseInt(data.stockQuantity) || 0;
        
        let calculatedStatus = "In Stock";
        if (currentStock === 0) calculatedStatus = "Out of Stock";
        else if (currentStock <= 10) calculatedStatus = "Low Stock";

        
        return {
          id: doc.id,
          stock: currentStock,
          ...data,
          status: calculatedStatus 
        };
      });
      setProducts(productsData);
    });

    return () => unsubscribe(); 
  }, []);




    const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    
    const pStock = parseInt(product.stock) || parseInt(product.stockQuantity) || 0;
    let liveStatus = "In Stock";
    if (pStock === 0) liveStatus = "Out of Stock";
    else if (pStock <= 10) liveStatus = "Low Stock";

    let matchesStock = true;
    if (stockFilter === 'In Stock') matchesStock = liveStatus === 'In Stock';
    if (stockFilter === 'Low Stock') matchesStock = liveStatus === 'Low Stock';
    if (stockFilter === 'Out of Stock') matchesStock = liveStatus === 'Out of Stock';
    
    return matchesSearch && matchesCategory && matchesStock;
  });


    const [newProduct, setNewProduct] = useState({
    name: '',
    size: '',
    sku: '',
    category: 'Sneakers',
    price: '',
    stock: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    let currentStatus = "In Stock";
    const stockNum = parseInt(newProduct.stock) || 0;
     const priceNum = parseFloat(newProduct.price) || 0; 

    
    if (stockNum < 0 || priceNum < 0) {
      alert("Stock and Price cannot be negative.");
      return;
    }
    if (newProduct.name.trim() === '' || newProduct.sku.trim() === '') {
      alert("Name and SKU are required.");
      return;
    }
    
    if (stockNum === 0) currentStatus = "Out of Stock";
    else if (stockNum <= 10) currentStatus = "Low Stock";

    try {
      if (editingProduct !== null) {
        const productRef = doc(db, 'products', editingProduct);
        await updateDoc(productRef, {
          name: newProduct.name,
          size: newProduct.size || '',
          sku: newProduct.sku,
          category: newProduct.category,
          price: priceNum,
          stock: stockNum,            
          stockQuantity: stockNum,    
          status: currentStatus,
          updatedAt: new Date()       
        });
      } else {
        
        const productsRef = collection(db, 'products');
        await addDoc(productsRef, {
          name: newProduct.name,
          size: newProduct.size || '',
          sku: newProduct.sku,
          category: newProduct.category,
          price: priceNum,
          stock: stockNum,
          stockQuantity: stockNum,
          status: currentStatus,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("There was an error saving the product.");
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
    const randomSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewProduct({ name: '', size: '', sku: randomSKU, category: 'Sneakers', price: '', stock: '' });
  };



  const openAddModal = () => {
    setEditingProduct(null);
    const randomSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewProduct({ name: '', size: '', sku: randomSKU, category: 'Sneakers', price: '', stock: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setNewProduct({
      name: product.name,
      size: product.size,
      sku: product.sku,
      category: product.category,
      price: product.price,
      stock: product.stock
    });
    setIsModalOpen(true);
  };

    const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product: ", error);
      }
    }
  };


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
          <a href="/admin/Inventory" className="admin-nav-item active">
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
              placeholder="Search Inventory, Orders, Users..." 
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
              <h2>Inventory Management</h2>
              <p>View, search, and manage your product stock in real-time.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={openAddModal}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Add New Product
              </button>
            </div>
          </div>

          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option>All Categories</option>
                      <option>Sports Shoes</option>
                      <option>Formal Shoes</option>
                      <option>Sneakers</option>
                      <option>Slippers</option>
                      <option>Loafers</option>
                      <option>School Shoes</option>
                      <option>Running Shoes</option>
                      <option>Walking Shoes</option>
                      <option>Sandals</option>
              </select>
              <select className="admin-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option>Stock Status: All</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <div className="admin-product-cell-icon">
                            <span className="material-symbols-outlined">footprint</span>
                          </div>
                          <div>
                            <p className="admin-product-name">{product.name}</p>
                            <p className="admin-product-sub">{product.sku} • {product.size}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-on-surface-variant)' }}>{product.category}</td>
                      <td style={{ fontWeight: 700 }}>₹{product.price}</td>
                      <td style={{ fontWeight: 600 }}>{product.stock} units</td>
                                            <td>
                        {(() => {
                          const pStock = parseInt(product.stock) || parseInt(product.stockQuantity) || 0;
                          let liveStatus = "In Stock";
                          let badgeClass = "success";
                          if (pStock === 0) { liveStatus = "Out of Stock"; badgeClass = "error"; }
                          else if (pStock <= 10) { liveStatus = "Low Stock"; badgeClass = "warning"; }
                          
                          return (
                            <span className={`admin-badge ${badgeClass}`}>
                              {liveStatus}
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        <div className="admin-action-buttons">
                          <button className="admin-action-btn edit" onClick={() => handleEditClick(product)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="admin-action-btn delete" onClick={() => handleDelete(product.id)}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-on-surface-variant)' }}>
                        No products found matching your filters.
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
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Product Name</label>
                <input type="text" name="name" value={newProduct.name} onChange={handleInputChange} required placeholder="e.g. AeroStride Pro" />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>SKU</label>
                  <input type="text" name="sku" value={newProduct.sku} onChange={handleInputChange} required placeholder="e.g. SKU-1234" />
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select name="category" value={newProduct.category} onChange={handleInputChange}>
                    <option>Sports Shoes</option>
                      <option>Formal Shoes</option>
                      <option>Sneakers</option>
                      <option>Slippers</option>
                      <option>Loafers</option>
                      <option>School Shoes</option>
                      <option>Running Shoes</option>
                      <option>Walking Shoes</option>
                      <option>Sandals</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Size / Variant</label>
                <input type="text" name="size" value={newProduct.size} onChange={handleInputChange} required placeholder="e.g. Men's (Size 10)" />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price (₹)</label>
                  <input type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} required />
                </div>
                <div className="admin-form-group">
                  <label>Stock Quantity</label>
                  <input type="number" name="stock" value={newProduct.stock} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="admin-form-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
                <label>Inventory Status (Auto-calculated)</label>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'var(--admin-surface-variant)',
                  border: '1px dashed var(--admin-outline)',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '600'
                }}>
                  {(() => {
                    const stockNum = parseInt(newProduct.stock) || 0;
                    if (newProduct.stock === '') {
                      return <span style={{ color: 'var(--admin-on-surface-variant)' }}>Enter stock to calculate...</span>;
                    }
                    if (stockNum === 0) {
                      return <span style={{ color: 'var(--admin-error)' }}>Out of Stock</span>;
                    }
                    if (stockNum <= 10) {
                      return <span style={{ color: '#b45309' }}>Low Stock</span>;
                    }

                    return <span style={{ color: 'var(--admin-primary)' }}>In Stock</span>;
                  })()}
                </div>
              </div>



              <div className="admin-modal-footer">
                <button type="button" className="admin-outline-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-filled-btn">
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
