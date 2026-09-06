import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import React, { useState, useEffect } from 'react';
import '../css/Reports.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const Reports = () => {
  
  const [reportPeriod, setReportPeriod] = useState('This Month');
  const [chartData, setChartData] = useState({
    'This Month': [
      { week: 'Wk 1', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 2', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 3', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 4', val: '0', height: '0%', amount: 0 }
    ],
    'Last Month': [
      { week: 'Wk 1', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 2', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 3', val: '0', height: '0%', amount: 0 },
      { week: 'Wk 4', val: '0', height: '0%', amount: 0 }
    ]
  });

  const [topProducts, setTopProducts] = useState([]);
  const [productsList, setProductsList] = useState([]); 

  
  const [reportMetrics, setReportMetrics] = useState({
    mtdRevenue: 0,
    mtdPairs: 0,
    topCategory: "Loading...",
    refundRate: "0%",
    busiestDay: "-",
    peakHours: "-",
    avgTicketSize: "₹0",
    cashPayments: "0%",
    productStats: {}
  });

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const productsRef = collection(db, 'products');

    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      let totalRev = 0;
      let totalPairs = 0;
      let refundCount = 0;
      let cashCount = 0;
      
      let wk1 = 0, wk2 = 0, wk3 = 0, wk4 = 0;
      
      const dayCounts = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
      const hourCounts = {};
      const productStats = {}; 

      snapshot.forEach((doc, index) => {
        const data = doc.data();
        const amt = parseFloat(data.totalAmount) || 0;
        const items = parseInt(data.itemCount) || 1;
        
        totalRev += amt;
        totalPairs += items;
        
        if (data.status === 'Refunded') {
          refundCount++;
        }
        if (data.paymentMethod === 'Cash') {
          cashCount++;
        }

        if (data.productName && data.status !== 'Refunded') {
           if (!productStats[data.productName]) {
              productStats[data.productName] = { sold: 0, rev: 0 };
           }
           productStats[data.productName].sold += items;
           productStats[data.productName].rev += amt;
        }

        const dObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        dayCounts[dObj.getDay()]++;
        const hr = dObj.getHours();
        hourCounts[hr] = (hourCounts[hr] || 0) + 1;

        if (index % 4 === 0) wk1 += amt;
        else if (index % 4 === 1) wk2 += amt;
        else if (index % 4 === 2) wk3 += amt;
        else wk4 += amt;
      });

      const rate = snapshot.size > 0 ? ((refundCount / snapshot.size) * 100).toFixed(1) : 0;
      const cashRate = snapshot.size > 0 ? Math.round((cashCount / snapshot.size) * 100) : 0;
      const avgTicket = snapshot.size > 0 ? Math.round(totalRev / snapshot.size) : 0;

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      let bestDayObj = { day: "-", count: 0 };
      for (let i = 0; i < 7; i++) {
        if (dayCounts[i] > bestDayObj.count) bestDayObj = { day: days[i], count: dayCounts[i] };
      }

      let bestHourObj = { hr: -1, count: 0 };
      for (const [h, count] of Object.entries(hourCounts)) {
        if (count > bestHourObj.count) bestHourObj = { hr: parseInt(h), count: count };
      }
      
      let peakHourString = "-";
      if (bestHourObj.hr !== -1) {
        const ampm = bestHourObj.hr >= 12 ? 'PM' : 'AM';
        let hFormat = bestHourObj.hr % 12;
        if (hFormat === 0) hFormat = 12;
        peakHourString = `${hFormat} ${ampm} - ${hFormat+1} ${ampm}`;
      }

      setReportMetrics(prev => ({
        ...prev,
        mtdRevenue: totalRev,
        mtdPairs: totalPairs,
        refundRate: `${rate}%`,
        busiestDay: bestDayObj.day,
        peakHours: peakHourString,
        avgTicketSize: `₹${avgTicket.toLocaleString('en-IN')}`,
        cashPayments: `${cashRate}%`,
        productStats: productStats 
      }));

      const maxWk = Math.max(wk1, wk2, wk3, wk4, 1); 
      setChartData(prev => ({
        ...prev,
        'This Month': [
          { week: 'Wk 1', val: `${(wk1/1000).toFixed(1)}k`, height: `${(wk1/maxWk)*100}%`, amount: wk1 },
          { week: 'Wk 2', val: `${(wk2/1000).toFixed(1)}k`, height: `${(wk2/maxWk)*100}%`, amount: wk2 },
          { week: 'Wk 3', val: `${(wk3/1000).toFixed(1)}k`, height: `${(wk3/maxWk)*100}%`, amount: wk3 },
          { week: 'Wk 4', val: `${(wk4/1000).toFixed(1)}k`, height: `${(wk4/maxWk)*100}%`, amount: wk4 }
        ]
      }));
    });

        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      const catCounts = {};
      const prodList = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const cat = data.category || 'Uncategorized';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
        
        prodList.push({
           id: doc.id,
           name: data.name || 'Unknown Product',
           category: cat,
           sku: data.sku || 'N/A',
           status: data.status || 'Active'
        });
      });
      
      let topCat = "None";
      let maxCount = 0;
      for (const [cat, count] of Object.entries(catCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topCat = cat;
        }
      }
      
      setReportMetrics(prev => ({ ...prev, topCategory: topCat }));
      setProductsList(prodList); 
    });


    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);


  useEffect(() => {
    if (productsList.length > 0) {
      const stats = reportMetrics.productStats || {};
      
      const mergedProds = productsList.map(p => {
         const pStats = stats[p.name] || { sold: 0, rev: 0 };
         
         let statusLabel = p.status;
         let statusColor = 'var(--green-700)';
         let statusBg = 'var(--green-50)';
         
         if (p.status.toLowerCase().includes('low')) {
           statusColor = 'var(--yellow-700)';
           statusBg = 'var(--orange-50)';
         } else if (p.status.toLowerCase().includes('out')) {
           statusColor = 'var(--error)';
           statusBg = 'var(--error-bg)';
         }
         
         return {
           ...p,
           icon: 'sports_score', 
           sold: pStats.sold,
           revenue: pStats.rev.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
           rawRev: pStats.rev,
           statusLabel, statusColor, statusBg
         };
      });
      
      mergedProds.sort((a, b) => b.rawRev - a.rawRev);
      
      setTopProducts(mergedProds.slice(0, 5));
    }
  }, [reportMetrics.productStats, productsList]);


  
  const handlePrintEOD = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const eodHTML = `
          <html>
            <head><title>EOD Report</title></head>
            <body style="font-family: monospace; padding: 20px; color: #000; background: #fff;">
              <h2 style="text-align:center;">NICE FOOTWEAR - EOD REPORT</h2>
              <hr/>
              <p><b>Period:</b> ${reportPeriod}</p>
              <p><b>Total Revenue:</b> ₹${reportMetrics.mtdRevenue.toLocaleString('en-IN')}</p>
              <p><b>Total Sales:</b> ${reportMetrics.productStats}</p>
              <p><b>Cash Payments:</b> ${reportMetrics.cashPayments}</p>
              <p><b>Card Payments:</b> ${reportMetrics.cardPayments}</p>
              <p><b>UPI Payments:</b> ${reportMetrics.upiPayments}</p>
              <hr/>
              <p style="text-align:center;">Generated at: ${new Date().toLocaleString()}</p>
            </body>
          </html>
        `;
        const fileName = `eod_report_${new Date().getTime()}.html`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: eodHTML,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        await Share.share({
          title: 'Print/Share EOD Report',
          text: 'End of Day Report',
          url: result.uri,
          dialogTitle: 'Share or Print EOD Report',
        });
      } catch (err) {
        alert("Failed to generate EOD report: " + err.message);
      }
    } else {
      window.print();
    }
  };

  const handleExportCSV = async () => {
    const headers = ["Product Name", "Category", "SKU", "Units Sold", "Total Revenue (INR)", "Stock Status"];
    
    const rows = topProducts.map(p => [
      `"${p.name}"`, 
      `"${p.category}"`, 
      `"${p.sku}"`, 
      p.sold, 
      p.rawRev,
      `"${p.statusLabel}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");
    
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
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="reports" />
      <Topbar searchPlaceholder="Search reports..." />
      
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Analytics & Reports</h2>
            <p>Review store performance, sales trends, and top-selling products.</p>
          </div>
          <button className="primary-btn" onClick={handlePrintEOD}>
            <span className="material-symbols-outlined">print</span>
            Print EOD Report
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <p className="card-subtitle">Month-to-Date Revenue</p>
            <h3 className="card-title text-green">₹{reportMetrics.mtdRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <span className="trend-badge positive">Real-time</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Total Pairs Sold (MTD)</p>
            <h3 className="card-title">{reportMetrics.mtdPairs.toLocaleString('en-IN')}</h3>
            <span className="trend-badge positive">All Time</span>
          </div>
          <div className="metric-card">
            <p className="card-subtitle">Top Category</p>
            <h3 className="card-title text-blue" style={{fontSize: '20px', lineHeight: '36px'}}>{reportMetrics.topCategory}</h3>
            <p className="card-desc">Most popular in store</p>
          </div>
          <div className="metric-card alert-card">
            <p className="card-subtitle">Refund Rate</p>
            <h3 className="card-title error-text">{reportMetrics.refundRate}</h3>
            <p className="card-desc">Target is below 5%</p>
          </div>
        </div>

        <div className="reports-layout">
          
          <div className="report-card">
            <div className="report-header">
              <h3>Weekly Revenue Trend</h3>
              <select 
                className="filter-small"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </select>
            </div>
            <div className="chart-container">
              <div className="chart-grid">
                {chartData[reportPeriod].map((data, index) => (
                  <div className="chart-bar" style={{height: data.height}} key={index}>
                    <span className="chart-val">{data.val}</span>
                    <span>{data.week}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-card">
            <div className="report-header">
              <h3>Quick Insights</h3>
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-label">
                  <span className="material-symbols-outlined text-green">storefront</span>
                  Busiest Day
                </div>
                <span className="summary-value">{reportMetrics.busiestDay}</span>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <span className="material-symbols-outlined text-blue">schedule</span>
                  Peak Hours
                </div>
                <span className="summary-value">{reportMetrics.peakHours}</span>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <span className="material-symbols-outlined text-purple">payments</span>
                  Avg. Ticket Size
                </div>
                <span className="summary-value">{reportMetrics.avgTicketSize}</span>
              </div>
              <div className="summary-item">
                <div className="summary-label">
                  <span className="material-symbols-outlined text-orange">account_balance_wallet</span>
                  Cash Payments
                </div>
                <span className="summary-value">{reportMetrics.cashPayments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-header">
            <h3>Top Selling Products</h3>
            <button className="filter-small" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>
          <div className="report-table-wrapper">
            <table className="report-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <div className="product-img-mini">
                        <span className="material-symbols-outlined">{product.icon}</span>
                      </div>
                      <div className="product-details">
                        <p className="product-name">{product.name}</p>
                        <p className="product-cat">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="bold-text">{product.sku}</td>
                  <td className="bold-text text-primary">{product.sold}</td>
                  <td className="bold-text">₹{product.revenue}</td>
                  <td>
                    <span className="status-badge" style={{color: product.statusColor, backgroundColor: product.statusBg}}>
                      {product.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No products sold yet!</td>
                </tr>
              )}
            </tbody>
          </table>
            </div>
        </div>

      </main>
    </div>
  );
};

export default Reports;
