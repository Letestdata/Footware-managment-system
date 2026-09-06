import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Inventory.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';



const Inventory = () => {
const updateDashboardStock = (addedStockQuantity, isLowStock) => {
  const storedMetrics = localStorage.getItem('storeMetrics');
  if (storedMetrics) {
    let currentMetrics = JSON.parse(storedMetrics);
    
    currentMetrics.currentStock += parseInt(addedStockQuantity);
    currentMetrics.totalProducts += 1;
    
    if (isLowStock) {
      currentMetrics.lowStock += 1;
    }
    
    localStorage.setItem('storeMetrics', JSON.stringify(currentMetrics));
  }
};

  
  const [isModalOpen, setIsModalOpen] = useState(false);

   const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStock: 0,
    categories: 0,
    totalValue: 0
  });

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productList = [];
      let totalStockValue = 0;
      let lowStockCount = 0;
      const uniqueCategories = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        const qty = parseInt(data.stock) || parseInt(data.stockQuantity) || 0;
        const price = parseFloat(data.price) || parseFloat(data.retailPrice) || 0;
        
        totalStockValue += (qty * price);
        if (qty <= 10 && qty > 0) lowStockCount++;
        if (data.category) uniqueCategories.add(data.category);

        let status = "In Stock";
        if (qty === 0) status = "Out of Stock";
        else if (qty <= 10) status = "Low Stock";

        productList.push({
          id: doc.id,
          ...data,
          stock: qty,
          price: price,
          status: status
        });
      });

      setProducts(productList);
      setMetrics({
        totalProducts: productList.length,
        lowStock: lowStockCount,
        categories: uniqueCategories.size,
        totalValue: totalStockValue
      });
    });

    return () => unsubscribe();
  }, []);


  const [editingProduct, setEditingProduct] = useState(null);

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
    const stockNum = parseInt(newProduct.stock) || 0;
    
    try {
      if (editingProduct !== null) {
        // 1. EDIT EXISTING PRODUCT
        const productRef = doc(db, 'products', editingProduct);
        await updateDoc(productRef, {
          name: newProduct.name,
          size: newProduct.size,
          sku: newProduct.sku,
          category: newProduct.category,
          price: newProduct.price,
          stock: stockNum,
          stockQuantity: stockNum 
        });
      } else {
        const productsRef = collection(db, 'products');
        await addDoc(productsRef, {
          name: newProduct.name,
          size: newProduct.size,
          sku: newProduct.sku,
          category: newProduct.category,
          price: newProduct.price,
          stock: stockNum,
          stockQuantity: stockNum 
        });
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      setNewProduct({ name: '', size: '', sku: '', category: 'Sneakers', price: '', stock: '' });
      
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("Failed to save product to database!");
    }
  };


    const openAddModal = () => {
    setEditingProduct(null);
    
    const randomSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setNewProduct({ 
      name: '', 
      size: '', 
      sku: randomSKU,
      category: 'Sneakers', 
      price: '', 
      stock: '' 
    });
    
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
    if (window.confirm("Are you sure you want to completely delete this product from the database?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Failed to delete product from database!");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="inventory" />
            <Topbar 
        searchPlaceholder="Search product, SKU or order..." 
        searchValue={searchTerm}
        onSearch={setSearchTerm}
      />

      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Inventory Management</h2>
            <p>View, search, and manage your product stock in real-time.</p>
          </div>
       
          <button className="primary-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span>
            Add Product
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <p className="card-subtitle">Total Products</p>
            <h3 className="card-title">{metrics.totalProducts}</h3>
          </div>
          <div className="metric-card alert-card">
            <div className="alert-corner">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <p className="card-subtitle">Low Stock Alerts</p>
            <h3 className="card-title error-text">{metrics.lowStock}</h3>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Categories</p>
            <h3 className="card-title">{metrics.categories}</h3>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Total Stock Value</p>
            <h3 className="card-title">₹{metrics.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>


        <div className="inventory-filters">
          <div className="search-box">
             <span className="material-symbols-outlined">search</span>
             <input 
                type="text" 
                placeholder="Search by name, SKU, or brand..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />

          </div>
          <div className="filter-actions">
                        <select 
               className="filter-dropdown"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
            >
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
            <select 
               className="filter-dropdown"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Information</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                {products.filter((product) => {
                 const matchesSearch = searchTerm === '' || 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase());
                 
                 const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
                 
                 const matchesStatus = statusFilter === 'All Status' || product.status === statusFilter;
                 
                 return matchesSearch && matchesCategory && matchesStatus;
               }).map((product) => (

                 <tr key={product.id}>
                   <td>
                     <div className="product-cell">
                       {product.image ? (
                         <img src={product.image} alt={product.name} />
                       ) : (
                         <div className="product-icon" style={{width: 44, height: 44, backgroundColor: 'var(--surface-highest)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <span className="material-symbols-outlined text-muted">footprint</span>
                         </div>
                       )}
                       <div>
                         <p className="product-name">{product.name}</p>
                         <p className="product-size">{product.size}</p>
                       </div>
                     </div>
                   </td>
                   <td className="bold-text">{product.sku}</td>
                   <td>{product.category}</td>
                   <td className="bold-text">₹{product.price}</td>
                   <td>{product.stock} Units</td>
                   <td>
                     <span className={`stock-badge ${
                       product.status === 'In Stock' ? 'in-stock' :
                       product.status === 'Out of Stock' ? 'out-stock' : 'low-stock'
                     }`}>
                       {product.status}
                     </span>
                   </td>
                   <td>
                      <button className="action-icon" onClick={() => handleEditClick(product)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                          <button className="action-icon" onClick={() => handleDelete(product.id)}>
                       <span className="material-symbols-outlined">delete</span>
                     </button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" name="name" placeholder="e.g. Urban Flex 3.0" value={newProduct.name} onChange={handleInputChange} required />
                </div>
                
                <div className="form-group">
                  <label>Description & Size</label>
                  <input type="text" name="size" placeholder="e.g. Men's Casual (Size 8)" value={newProduct.size} onChange={handleInputChange} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>SKU</label>
                    <input type="text" name="sku" placeholder="SKU-XXXX" value={newProduct.sku} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={newProduct.category} onChange={handleInputChange}>
                      <option>Sneakers</option>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" step="0.01" name="price" placeholder="0.00" value={newProduct.price} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" name="stock" placeholder="0" value={newProduct.stock} onChange={handleInputChange} required />
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}>Cancel</button>
                <button type="submit" className="primary-btn">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
