import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './css/AdminReports.css';
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";


const AdminReports = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };

  const [chartData, setChartData] = useState([
    { week: 'Wk 1', val: '0.0k', height: '5%', amount: 0 },
    { week: 'Wk 2', val: '0.0k', height: '5%', amount: 0 },
    { week: 'Wk 3', val: '0.0k', height: '5%', amount: 0 },
    { week: 'Wk 4', val: '0.0k', height: '5%', amount: 0 }
  ]);

  const [topProducts, setTopProducts] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    mtdRevenue: 0,
    mtdPairs: 0,
    topCategory: "Loading...",
    refundRate: "0%"
  });

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const productsRef = collection(db, 'products');

    let allOrders = [];
    let allProducts = [];

    const updateReports = () => {
      let wk1 = 0, wk2 = 0, wk3 = 0, wk4 = 0;
      let totalRev = 0, totalPairs = 0, refundCount = 0;
      const productSales = {}; 

      allOrders.forEach(data => {
        const amt = parseFloat(data.totalAmount) || 0;
        const itemCount = parseInt(data.itemCount) || 1;
        
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

        const day = dateObj.getDate();

        if (data.status === 'Refunded') refundCount++;

        totalRev += amt;
        totalPairs += itemCount;
        
        if (day <= 7) wk1 += amt;
        else if (day <= 14) wk2 += amt;
        else if (day <= 21) wk3 += amt;
        else wk4 += amt;

        if (data.status !== 'Refunded') {
           const key = data.sku || data.productName;
           if (key) {
             if (!productSales[key]) productSales[key] = { sold: 0, revenue: 0 };
             productSales[key].sold += itemCount;
             productSales[key].revenue += amt;
           }
        }
      });

      const rate = allOrders.length > 0 ? ((refundCount / allOrders.length) * 100).toFixed(1) : 0;

      const catCounts = {};
      const mergedProducts = allProducts.map(p => {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        const salesData = productSales[p.sku] || productSales[p.name] || { sold: 0, revenue: 0 };
        return {
          ...p,
          sold: salesData.sold,
          revenue: salesData.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
      });

      mergedProducts.sort((a, b) => b.sold - a.sold);
      setTopProducts(mergedProducts.slice(0, 10));

      let topCat = "None", maxCount = 0;
      for (const [cat, count] of Object.entries(catCounts)) {
        if (count > maxCount) { maxCount = count; topCat = cat; }
      }

      setReportMetrics(prev => ({
        ...prev,
        mtdRevenue: totalRev,
        mtdPairs: totalPairs,
        refundRate: `${rate}%`,
        topCategory: topCat
      }));

      const maxWk = Math.max(wk1, wk2, wk3, wk4, 1);
      setChartData([
        { week: 'Wk 1', val: `${(wk1/1000).toFixed(1)}k`, height: `${Math.max(5, (wk1/maxWk)*100)}%`, amount: wk1 },
        { week: 'Wk 2', val: `${(wk2/1000).toFixed(1)}k`, height: `${Math.max(5, (wk2/maxWk)*100)}%`, amount: wk2 },
        { week: 'Wk 3', val: `${(wk3/1000).toFixed(1)}k`, height: `${Math.max(5, (wk3/maxWk)*100)}%`, amount: wk3 },
        { week: 'Wk 4', val: `${(wk4/1000).toFixed(1)}k`, height: `${Math.max(5, (wk4/maxWk)*100)}%`, amount: wk4 }
      ]);
    };


    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      allOrders = snapshot.docs.map(doc => doc.data());
      updateReports();
    });

    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateReports();
    });

  
  return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);


   const handleExportCSV = async () => {
    const headers = ["Product Name", "Category", "SKU", "Units Sold", "Total Revenue (INR)", "Stock Status"];

    const rows = topProducts.map(p => [
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.sku}"`,
      p.sold,
      p.revenue.replace(/,/g, ''),
      `"${p.status}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\\n");

    try {
      if (Capacitor.isNativePlatform()) {
        const fileName = `top_selling_products_${new Date().getTime()}.csv`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Export Top Products',
          text: 'Top Selling Products CSV',
          url: result.uri,
          dialogTitle: 'Share or Save CSV',
        });
      } else {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "top_selling_products.csv");
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (e) {
      alert("Error exporting CSV: " + e.message);
    }
  };

  
  const handlePrint = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const reportContent = "NICE FOOTWARE - STORE REPORT\n\n"
          + `Month-to-Date Revenue: Rs.${reportMetrics.mtdRevenue}\n`
          + `Total Pairs Sold (MTD): ${reportMetrics.mtdPairs}\n`
          + `Top Category: ${reportMetrics.topCategory}\n`
          + `Refund Rate: ${reportMetrics.refundRate}\n`;
        
        const fileName = `store_report_${new Date().getTime()}.txt`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: reportContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'Store Report',
          text: 'NICE FOOTWARE - STORE REPORT',
          url: result.uri,
          dialogTitle: 'Print or Share Report',
        });
      } catch (e) {
        alert("Error generating print file: " + e.message);
      }
    } else {
      window.print();
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
          {/* <a href="/admin/Customers" className="admin-nav-item ">
            <span className="material-symbols-outlined">group</span>
            <span>Customers</span>
          </a> */}
          <a href="/admin/Employees" className="admin-nav-item">
            <span className="material-symbols-outlined">badge</span>
            <span>Employees</span>
          </a>
          <a href="/admin/Reports" className="admin-nav-item active">
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
            <input type="text" placeholder="Search analytics..." />
          </div>

          <div className="admin-top-actions">
            <div className="admin-profile">
              <div className="admin-profile-img">
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--admin-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>A</div>
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
              <h2>Analytics & Reports</h2>
              <p>Review store performance, sales trends, and top-selling products.</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-filled-btn" onClick={handlePrint}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                Print Report
              </button>
            </div>
          </div>

          <div className="admin-bento-grid admin-bento-4">
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Month-to-Date Revenue</p>
              <h3 className="admin-stat-value" style={{ color: 'var(--admin-primary)' }}>
                ₹{reportMetrics.mtdRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Total Pairs Sold (MTD)</p>
              <h3 className="admin-stat-value">{reportMetrics.mtdPairs}</h3>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-subtitle">Top Category</p>
              <h3 className="admin-stat-value">{reportMetrics.topCategory}</h3>
            </div>
            <div className="admin-stat-card alert-card">
              <p className="admin-stat-subtitle">Refund Rate</p>
              <h3 className="admin-stat-value text-error">{reportMetrics.refundRate}</h3>
            </div>
          </div>


          <div className="admin-reports-grid">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h3>Weekly Revenue Trend</h3>
              </div>

              <div className="admin-bar-chart">
                {chartData.map((data, index) => (
                  <div className="admin-bar-col" key={index}>
                    <div className="admin-bar-value">₹{data.val}</div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ height: data.height }}></div>
                    </div>
                    <div className="admin-bar-label">{data.week}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-table-card" style={{ flex: 1, margin: 0 }}>
              <div className="admin-table-header">
                <h3>Top Selling Products</h3>
                <button className="admin-action-btn edit" onClick={handleExportCSV} title="Export CSV">
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-on-surface-variant)' }}>{product.sku}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{product.sold}</td>
                        <td style={{ color: 'var(--admin-primary)', fontWeight: 700 }}>₹{product.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
