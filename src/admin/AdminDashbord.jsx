import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import './css/AdminDashbord.css';

function AdminDashbord() {

    const [adminName, setAdminName] = useState('Store Manager');
  const [adminInitials, setAdminInitials] = useState('A');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj && userObj.name) {
        setAdminName(userObj.name);
        setAdminInitials(userObj.name.charAt(0).toUpperCase());
      }
    }
  }, []);


  const navigate = useNavigate();
  const [topProducts, setTopProducts] = useState([]);


  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const perfChartRef = useRef(null);
  const catChartRef = useRef(null);
  const weekChartRef = useRef(null);
  const sparkChartRef = useRef(null);
  const productSalesRef = useRef({});

  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const [metrics, setMetrics] = useState({
    revenue: 0,
    sales: 0,
    currentStock: 0,
    lowStock: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 5, 
    totalEmployees: 2, 
    monthlyRevenue: 0,
    totalProfit: 0
  });

  const [recentSalesData, setRecentSalesData] = useState([]);
  const [allOrdersData, setAllOrdersData] = useState([]);
  const [categoryData, setCategoryData] = useState({ Sneakers: 0, Running: 0, Formal: 0 });

  const [monthlyPerformance, setMonthlyPerformance] = useState({
    revenue: Array(12).fill(0),
    sales: Array(12).fill(0)
  });
  const [weeklyPerformance, setWeeklyPerformance] = useState(Array(7).fill(0));

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      let totalRev = 0;
      const salesList = [];
      const ordersList = [];
      const productSales = {}; 
      
      let monthlyRev = Array(12).fill(0);
      let monthlyCount = Array(12).fill(0);
      let weeklyRev = Array(7).fill(0);

      snapshot.forEach(doc => {
        const data = doc.data();
        const amt = parseFloat(data.totalAmount) || 0;
        const items = parseInt(data.itemCount) || 1;
        totalRev += amt;
        
        let dateObj = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            dateObj = data.createdAt.toDate();
          } else {
            const dateStr = String(data.createdAt).replace(' at ', ' ');
            dateObj = new Date(dateStr);
          }
        }
        if (isNaN(dateObj.getTime())) dateObj = new Date();
        const formattedDate = dateObj.toLocaleDateString();

        const monthIndex = dateObj.getMonth();
        monthlyRev[monthIndex] += amt;
        monthlyCount[monthIndex] += items;
        
        const dayIndex = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
        weeklyRev[dayIndex] += amt;

        if (data.status !== 'Refunded') {
           const key = data.sku || data.productName;
           if (key) {
             if (!productSales[key]) productSales[key] = { sold: 0 };
             productSales[key].sold += items;
           }
        }
        
        ordersList.push({
          amount: amt,
          items: items,
          status: data.status || 'Completed',
          dateObj: dateObj
        });

        salesList.push({
          id: data.invoiceId || '#INV-0000',
          customerInitials: (data.customerName || 'W').charAt(0).toUpperCase(),
          customerName: data.customerName || 'Walk-in Customer',
          customerColor: 'var(--admin-primary-fixed)',
          employee: 'Admin',
          amount: `₹${data.totalAmount}`,
          payment: data.paymentMethod || 'Card',
          status: data.status || 'Completed',
          statusClass: data.status === 'Refunded' ? 'error' : 'success',
          date: formattedDate,
          rawDate: dateObj
        });
      });

      productSalesRef.current = productSales; 

      salesList.sort((a, b) => b.rawDate - a.rawDate);
      setRecentSalesData(salesList.slice(0, 5)); 

      setMonthlyPerformance({ revenue: monthlyRev, sales: monthlyCount });
      setWeeklyPerformance(weeklyRev);
      
      setAllOrdersData(ordersList);

      setMetrics(prev => ({
        ...prev,
        monthlyRevenue: totalRev, 
        totalProfit: totalRev * 0.4 
      }));
    });
  
  return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filteredRev = 0;
    let filteredSalesCount = 0;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay() || 7; 
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    allOrdersData.forEach(order => {
      let include = false;
      if (timeRange === 'Today') {
        if (order.dateObj >= startOfToday) include = true;
      } else if (timeRange === 'This Week') {
        if (order.dateObj >= startOfWeek) include = true;
      } else if (timeRange === 'Last 30 Days') {
        if (order.dateObj >= thirtyDaysAgo) include = true;
      } else {
        include = true; 
      }
      
      if (include) {
        filteredRev += order.amount;
        filteredSalesCount += order.items; 
      }
    });

    setMetrics(prev => ({
      ...prev,
      revenue: filteredRev,
      sales: filteredSalesCount
    }));
  }, [allOrdersData, timeRange]);



  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      let currentStock = 0;
      let lowStockCount = 0;
      let catCounts = {};
      const productList = []; 
      
      snapshot.forEach(doc => {
        const data = doc.data();
      const stock = parseInt(data.stock) || parseInt(data.stockQuantity) || 0; 
        currentStock += stock;
        
        if (stock <= 10 && stock > 0) lowStockCount++;
        
        const cat = data.category || 'Other';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
        
        const salesData = productSalesRef.current[data.sku] || productSalesRef.current[data.name] || { sold: 0 };

        productList.push({
          name: data.name || 'Unknown Product',
          stock: stock,
          sold: salesData.sold
        });
      });
      
      productList.sort((a, b) => b.sold - a.sold);
      setTopProducts(productList.slice(0, 3));
      setCategoryData(catCounts);
      
      setMetrics(prev => ({
        ...prev,
        currentStock: currentStock,
        lowStock: lowStockCount,
        totalProducts: snapshot.size,
        totalCategories: Object.keys(catCounts).length
      }));
    });
    return () => unsubscribe();
  }, []);


  const filteredSales = recentSalesData.filter(sale => 
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sale.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let perfChartInst, catChartInst, weekChartInst, sparkChartInst;

    if (perfChartRef.current) {
      perfChartInst = new Chart(perfChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
                          
              label: 'Revenue',
              data: monthlyPerformance.revenue,

              borderColor: '#ab3500',
              backgroundColor: 'rgba(171, 53, 0, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 0,
              pointHoverRadius: 6
            },
            {
              label: 'Sales',
              type: 'bar',
              data: monthlyPerformance.sales,
              backgroundColor: '#575e70',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { display: false }, ticks: { display: false } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (catChartRef.current) {
      catChartInst = new Chart(catChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(categoryData), 
          datasets: [{
            data: Object.values(categoryData),
            backgroundColor: ['#ff6b35', '#575e70', '#494bd6', '#00a368', '#f2c94c'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          cutout: '75%',
          plugins: { legend: { display: false } },
          maintainAspectRatio: false
        }
      });
    }

    if (weekChartRef.current) {
      weekChartInst = new Chart(weekChartRef.current, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: weeklyPerformance,
            borderColor: '#494bd6',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#494bd6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { borderDash: [5, 5] } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (sparkChartRef.current) {
      sparkChartInst = new Chart(sparkChartRef.current, {
        type: 'line',
        data: {
          labels: [1, 2, 3, 4, 5, 6, 7],
          datasets: [{
            data: [35, 30, 42, 38, 25, 20, 24],
            borderColor: '#ba1a1a',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }

    return () => {
      if (perfChartInst) perfChartInst.destroy();
      if (catChartInst) catChartInst.destroy();
      if (weekChartInst) weekChartInst.destroy();
      if (sparkChartInst) sparkChartInst.destroy();
    };
  }, [categoryData, monthlyPerformance, weeklyPerformance]);


  const handleExport = async () => {
    try {
      const csvContent = "Metric,Value\n"
        + `Revenue,${metrics.revenue}\n`
        + `Sales,${metrics.sales}\n`
        + `Stock,${metrics.stock}\n`
        + `Returns,${metrics.returns}`;
        
      if (Capacitor.isNativePlatform()) {
        const fileName = `dashboard_report_${timeRange.replace(/ /g, '_')}.csv`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Export Report',
          text: 'Dashboard Report',
          url: result.uri,
          dialogTitle: 'Share or Save Report',
        });
      } else {
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dashboard_report_${timeRange.replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("Report downloaded successfully!");
      }
    } catch (e) {
      alert("Error exporting report: " + e.message);
    }
  };

  return (
    <div className="admin-body">
      <div 
        className="admin-sidebar-overlay" 
        onClick={() => document.body.classList.remove('admin-sidebar-open')}
      ></div>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="https://i.ibb.co/1pg7Nby/icon.png" />
          <div>
            <h1>Nice Footware</h1>
            <p>Management System</p>
          </div>
          <button 
            className="admin-close-sidebar-btn" 
            onClick={() => document.body.classList.remove('admin-sidebar-open')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <nav className="admin-nav">
          <a href="/admin/Dashbord" className="admin-nav-item active">
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
            <button className="admin-cta-btn" onClick={() => setIsQuickActionOpen(true)}>
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
          <button 
            className="admin-mobile-menu-btn" 
            onClick={() => document.body.classList.toggle('admin-sidebar-open')}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
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
          <Link to="/admin/Notifications" className="admin-icon-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <span className="material-symbols-outlined">notifications</span>
          </Link>
           
            <div className="admin-divider-v"></div>
            
              <div className="admin-profile">
              <div className="admin-profile-img">
                <div style={{width:'100%', height:'100%', backgroundColor:'var(--admin-primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem'}}>
                  {adminInitials}
                </div>
              </div>
              <div className="admin-profile-text">
                <h4>Admin Profile</h4>
                <p>{adminName}</p>
              </div>
            </div>

          </div>
        </header>

        <div className="admin-canvas">
          <div className="admin-header">
            <div>
              <h2>Dashboard Overview</h2>
              <p>Real-time store performance and logistics tracking</p>
            </div>
            <div className="admin-header-actions">
              <select 
                className="admin-outline-btn" 
                style={{ cursor: 'pointer', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-on-surface)' }}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option style={{color: '#000'}}>Last 30 Days</option>
                <option style={{color: '#000'}}>This Week</option>
                <option style={{color: '#000'}}>Today</option>
              </select>
              <button className="admin-filled-btn" onClick={handleExport}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export Report
              </button>
            </div>
          </div>

          <div className="admin-bento-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-icon-box bg-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="admin-trend-badge">+12.5%</span>
              </div>
              <p className="admin-stat-subtitle">{timeRange === 'Today' ? "Today's Revenue" : `${timeRange} Revenue`}</p>
              <h3 className="admin-stat-value">₹{metrics.revenue.toLocaleString()}</h3>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-icon-box bg-secondary">
                  <span className="material-symbols-outlined">shopping_basket</span>
                </div>
                <span className="admin-trend-badge">+8.2%</span>
              </div>
              <p className="admin-stat-subtitle">{timeRange === 'Today' ? "Today's Sales" : `${timeRange} Sales`}</p>
              <h3 className="admin-stat-value">{metrics.sales} Items</h3>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-icon-box bg-tertiary">
                  <span className="material-symbols-outlined">inventory</span>
                </div>
              </div>
              <p className="admin-stat-subtitle">Current Stock</p>
              <h3 className="admin-stat-value">{metrics.currentStock.toLocaleString()}</h3>
            </div>
            
            <div className="admin-stat-card alert-card">
              <div className="admin-stat-header">
                <div className="admin-icon-box bg-error">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <Link to="/admin/Notifications" className="text-error" style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>View Details</Link>
              </div>
              <p className="admin-stat-subtitle">Low Stock Products</p>
              <h3 className="admin-stat-value text-error">{metrics.lowStock}</h3>
            </div>
          </div>

          <div className="admin-mini-grid">
            <div className="admin-mini-card">
              <p>Total Products</p><p>{metrics.totalProducts}</p>
            </div>
            <div className="admin-mini-card">
              <p>Total Categories</p><p>{metrics.totalCategories}</p>
            </div>
            <div className="admin-mini-card">
              <p>Total Brands</p><p>{metrics.totalBrands}</p>
            </div>
            <div className="admin-mini-card">
              <p>Total Employees</p><p>{metrics.totalEmployees}</p>
            </div>
            <div className="admin-mini-card">
              <p>Monthly Revenue</p><p>₹{metrics.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="admin-mini-card">
              <p>Total Profit</p><p>₹{metrics.totalProfit.toLocaleString()}</p>
            </div>
          </div>

          <div className="admin-charts-grid">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <div>
                  <h3>Revenue vs Sales Performance</h3>
                  <p>Monthly comparative analytics</p>
                </div>
                <div className="admin-chart-legend">
                  <div className="admin-legend-item">
                    <span className="admin-legend-color" style={{ backgroundColor: 'var(--admin-primary)' }}></span>
                    Revenue
                  </div>
                  <div className="admin-legend-item">
                    <span className="admin-legend-color" style={{ backgroundColor: 'var(--admin-secondary)' }}></span>
                    Sales
                  </div>
                </div>
              </div>
              <div className="chart-container">
                <canvas ref={perfChartRef}></canvas>
              </div>
            </div>
            
            <div className="admin-chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="admin-chart-header">
                <h3>Category Distribution</h3>
              </div>
              <div className="chart-container" style={{ flex: 1, maxHeight: '224px' }}>
                <canvas ref={catChartRef}></canvas>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(categoryData).map(([catName, count], idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{catName}</span><span style={{ fontWeight: 700 }}>{count} Products</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-bottom-grid">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3>Top Selling Products</h3>
              </div>
                            <div className="admin-product-list">
                {topProducts.map((prod, idx) => {
                  const percent = 85 - (idx * 15); 
                  
                  return (
                    <div className="admin-product-item" key={idx}>
                      <div className="admin-product-info">
                        <p>{prod.name}</p>
                        <div className="admin-progress-bar">
                          <div className="admin-progress-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <span className="admin-product-value text-success">{prod.sold} Sold</span>
                        <span style={{fontSize: '0.75rem', color: '#9ca3af'}}>{prod.stock} left</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
            
            <div className="admin-chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="admin-chart-header">
                <h3>Weekly Sales Flow</h3>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '200px' }}>
                <canvas ref={weekChartRef}></canvas>
              </div>
            </div>
            
            <div className="admin-chart-card dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', zIndex: 10 }}>
                <h3 style={{ fontSize: '1.125rem', margin: '0 0 4px 0' }}>Inventory Health</h3>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Low stock alerts trend (7 Days)</p>
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--admin-error)', margin: 0 }}>{metrics.lowStock} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>Items</span></h4>
                </div>
              </div>
              <div className="chart-container-xs">
                <canvas ref={sparkChartRef}></canvas>
              </div>
              <div style={{ position: 'absolute', right: '-32px', top: '-32px', width: '128px', height: '128px', backgroundColor: 'rgba(171, 53, 0, 0.2)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-header">
              <h3>Recent Sales Transactions</h3>
              <Link to="/admin/Sales" className="admin-outline-btn" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>View All Sales</Link>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Employee</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{sale.id}</td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-sm" style={{ backgroundColor: sale.customerColor }}>{sale.customerInitials}</div>
                          <span>{sale.customerName}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-on-surface-variant)' }}>{sale.employee}</td>
                      <td style={{ fontWeight: 700 }}>{sale.amount}</td>
                      <td>{sale.payment}</td>
                      <td><span className={`admin-badge ${sale.statusClass}`}>{sale.status}</span></td>
                      <td style={{ color: 'var(--admin-on-surface-variant)' }}>{sale.date}</td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--admin-on-surface-variant)' }}>
                        No results found for "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>

      {isQuickActionOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h2>Quick Actions</h2>
              <button className="admin-modal-close" onClick={() => setIsQuickActionOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
              <button className="admin-outline-btn" style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', fontWeight: 600, border: '1px solid var(--admin-outline-variant)', borderRadius: '12px' }} onClick={() => navigate('/admin/Inventory')}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>inventory_2</span>
                Add New Product
              </button>
              <button className="admin-outline-btn" style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', fontWeight: 600, border: '1px solid var(--admin-outline-variant)', borderRadius: '12px' }} onClick={() => navigate('/admin/Sales')}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>point_of_sale</span>
                Process New Sale
              </button>
              <button className="admin-outline-btn" style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '1rem', fontWeight: 600, border: '1px solid var(--admin-outline-variant)', borderRadius: '12px' }} onClick={() => navigate('/admin/Customers')}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>person_add</span>
                Add New Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashbord;
