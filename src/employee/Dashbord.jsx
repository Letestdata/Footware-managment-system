import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Dashbord.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Dashbord = () => {


  const [recentSessions, setRecentSessions] = useState([]);
  const logsRef = collection(db, 'login_history');
  const unsubLogs = onSnapshot(logsRef, (snapshot) => {
    const logsList = [];
    snapshot.forEach(doc => {
      logsList.push({ id: doc.id, ...doc.data() });
    });
    logsList.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    setRecentSessions(logsList.slice(0, 3));
  });

  const [metrics, setMetrics] = useState({
    revenue: 0,
    sales: 0,
    currentStock: 0,
    lowStock: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      let totalRev = 0;
      let totalSales = 0;
      const salesList = [];

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      snapshot.forEach(doc => {
        const data = doc.data();
        
        let dateObj = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            dateObj = data.createdAt.toDate();
          } else {
            const dateStr = String(data.createdAt).replace(' at ', ' ');
            dateObj = new Date(dateStr);
          }
        }
        
        if (dateObj >= startOfToday) {
          totalRev += parseFloat(data.totalAmount) || 0;
          totalSales += parseInt(data.itemCount) || 1;
        }

        const existing = salesList.find(s => s.invoiceId === data.invoiceId);
        if (existing) {
          existing.itemsList.push(`${data.productName} (x${data.itemCount})`);
          existing.totalAmount = (parseFloat(existing.totalAmount) + parseFloat(data.totalAmount)).toFixed(2);
          if (existing.status !== data.status) {
            existing.status = 'Partial Refund';
          }
        } else {
          salesList.push({
            id: doc.id,
            ...data,
            itemsList: [`${data.productName} (x${data.itemCount})`]
          });
        }
      });

      salesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setRecentSales(salesList.slice(0, 3));

      setMetrics(prev => ({ ...prev, revenue: totalRev, sales: totalSales }));
    });

    const inventoryRef = collection(db, 'products');
    const unsubInventory = onSnapshot(inventoryRef, (snapshot) => {
      let totalStock = 0;
      let lowStockCount = 0;
      const productList = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const qty = parseInt(data.stock) || parseInt(data.stockQuantity) || 0;
        totalStock += qty;
        if (qty <= 10) lowStockCount++;

        productList.push({
          id: doc.id,
          name: data.name || 'Unknown Product',
          price: parseFloat(data.price || data.retailPrice) || 0,
          stock: qty
        });
      });

      productList.sort((a, b) => b.stock - a.stock);
      setTopProducts(productList.slice(0, 2));


      setMetrics(prev => ({ ...prev, currentStock: totalStock, lowStock: lowStockCount }));
    });


    return () => {
      unsubOrders();
      unsubInventory();
      unsubLogs();
    };

  }, []);

  const today = new Date();
  const todaysRevenue = recentSales
    .filter(sale => {
      const d = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(0);
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);

  const dailyTarget = 5000;
  const progressRaw = (todaysRevenue / dailyTarget) * 100;
  const progressPercent = Math.min(progressRaw, 100).toFixed(0);

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" />
            <Topbar
        searchPlaceholder="Search product, SKU or order..."
        onClickSearch={() => window.location.href = "/employee/inventory"}
      />

      <main className="main-content">

        <div className="page-header">
          <div className="page-title">
            <h2>Welcome back, <span>employee1</span></h2>
            <p>Here's what's happening at the store today.</p>
          </div>
          <button className="primary-btn" onClick={() => window.location.href = "/employee/sales"}>
            <span className="material-symbols-outlined">add</span>
            New Sale
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="card-header">
              <div className="icon-box bg-blue">
                <span className="material-symbols-outlined filled">inventory_2</span>
              </div>
              <span className="trend-badge positive">+2.4%</span>
            </div>
            <p className="card-subtitle">Current Stock</p>
            <h3 className="card-title">{metrics.currentStock.toLocaleString('en-IN')}</h3>
            <p className="card-desc">Total items in warehouse</p>
          </div>

          <div className="metric-card">
            <div className="card-header">
              <div className="icon-box bg-orange">
                <span className="material-symbols-outlined filled">shopping_bag</span>
              </div>
              <span className="trend-badge positive">+12%</span>
            </div>
            <p className="card-subtitle">Today's Sales</p>
            <h3 className="card-title">{metrics.sales}</h3>
            <p className="card-desc">Transactions today</p>
          </div>

          <div className="metric-card">
            <div className="card-header">
              <div className="icon-box bg-green">
                <span className="material-symbols-outlined filled">payments</span>
              </div>
              <span className="trend-badge positive">High</span>
            </div>
            <p className="card-subtitle">Today's Revenue</p>
            <h3 className="card-title">₹{metrics.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="card-desc">Real-time earnings</p>
          </div>

          <div className="metric-card alert-card">
            <div className="alert-corner">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div className="card-header">
              <div className="icon-box bg-red">
                <span className="material-symbols-outlined">trending_down</span>
              </div>
            </div>
            <p className="card-subtitle">Low Stock Alerts</p>
            <h3 className="card-title error-text">{metrics.lowStock}</h3>
            <p className="card-desc error-text-dim">Action required immediately</p>
          </div>
        </div>

        <div className="activity-grid">
          <div className="recent-sales-card">
            <div className="widget-header">
              <h3>Recent Sales Activity</h3>
              <button className="view-all-btn" onClick={() => window.location.href = "/employee/sales"}>View All Sales</button>
            </div>
            <div className="table-responsive">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="bold-text">{sale.invoiceId || sale.id}</td>
                      <td>
                        <div className="product-cell">
                          <div className="product-icon" style={{ backgroundColor: 'var(--admin-primary-container)', color: 'var(--admin-primary)' }}>
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <div className="product-info">
                            <p className="product-name">{sale.customerName || 'Walk-in Customer'}</p>
                            <p className="product-size" style={{ lineHeight: '1.4', marginTop: '4px' }}>
                              {sale.itemsList.join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="bold-text">₹{parseFloat(sale.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><span className={`status-badge ${sale.status === 'Refunded' ? 'processing' : 'completed'}`}>{sale.status || 'Paid'}</span></td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No sales yet today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sidebar-widgets">
            <div className="stats-card">
              <div className="stats-content">
                <p className="stats-subtitle">Store Sales Performance Today</p>
                <div className="stats-main">
                  <h4 className="stats-value">₹{todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                  <span className="stats-rank">Target: ₹{dailyTarget.toLocaleString('en-IN')}</span>
                </div>
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Target Achievement</span>
                    <span className="progress-percent">{progressPercent}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-btn" onClick={() => window.location.href = "/employee/inventory"}>
                  <span className="material-symbols-outlined">add_box</span>
                  <span>Add Stock</span>
                </button>
                <button className="action-btn" onClick={() => window.location.href = "/employee/inventory"}>
                  <span className="material-symbols-outlined">search</span>
                  <span>Find Product</span>
                </button>
                <button className="action-btn" onClick={() => alert("Excel Report generation started... Check your downloads folder shortly.")}>
                  <span className="material-symbols-outlined">description</span>
                  <span>Excel Report</span>
                </button>
                <button className="action-btn" onClick={() => window.location.href = "/employee/history"}>
                  <span className="material-symbols-outlined">history</span>
                  <span>Audit Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-grid">

          <div className="history-card">
            <div className="widget-header has-icon">
              <span className="material-symbols-outlined icon-primary">login</span>
              <h3>My Recent Sessions</h3>
            </div>
            <div className="history-list">
              {recentSessions.map((session) => (
                <div key={session.id} className="history-item">
                  <div className="history-info">
                    <div className={`history-icon ${session.status === 'Success' ? 'success' : 'warning'}`}>
                      <span className="material-symbols-outlined">
                        {session.status === 'Success' ? 'check_circle' : 'error'}
                      </span>
                    </div>
                    <div>
                      <p className="history-title">{session.status === 'Success' ? 'Successful Login' : 'Failed Login'}</p>
                      <p className="history-desc">{session.name} ({session.role})</p>
                    </div>
                  </div>
                  <p className="history-time">
                    {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                  </p>
                </div>
              ))}
              {recentSessions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--on-surface-variant)' }}>No recent sessions.</div>
              )}
            </div>

          </div>

          <div className="top-selling-card">
            <div className="widget-header has-icon">
              <span className="material-symbols-outlined icon-primary">star</span>
              <h3>Top Selling This Week</h3>
            </div>
            <div className="products-list">
              {topProducts.map((product, index) => (
                <React.Fragment key={product.id}>
                  <div className="product-item">
                    <div className="product-details">
                      <h4>{product.name}</h4>
                      <p>Only {product.stock} units left!</p>
                    </div>
                    <div className="product-price">
                      <p>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <span className="trend-badge trending">Trending</span>
                    </div>
                  </div>

                  {index === 0 && <div className="divider"></div>}
                </React.Fragment>
              ))}

              {topProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>No products found</div>
              )}
            </div>
          </div>
        </div>

      </main>

      <button className="mobile-fab">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default Dashbord;
