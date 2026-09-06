import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LogIn from './Login/LogIn'
import Dashbord from './employee/Dashbord'
import Inventory from './employee/Inventory'
import Sales from './employee/Sales' 
import Orders from './employee/Orders'
import Customers from './employee/Customers'
import Reports from './employee/Reports'
import Messages from './employee/Messages'
import Notifications from './employee/Notifications'
import LoginHistory from './employee/LoginHistory'
import Settings from './employee/Settings'
import AdminDashbord from './admin/AdminDashbord'
import AdminInventory from './admin/AdminInventory';
import AdminSales from './admin/AdminSales';
import AdminOrders from './admin/AdminOrders';
import AdminCustomers from './admin/AdminCustomers';
import AdminReports from './admin/AdminReports';
import AdminActivityLogs from './admin/AdminActivityLogs';
import AdminNotifications from './admin/AdminNotifications';
import AdminSettings from './admin/AdminSettings';
import AdminEmployees from './admin/AdminEmployees';





import './App.css'

const ProtectedRoute = ({ children, allowedRole }) => {
  const userStr = localStorage.getItem('currentUser');
  
  if (!userStr) {
    return <Navigate to="/" replace />;
  }
  
  try {
    const userObj = JSON.parse(userStr);
    
    if (allowedRole && userObj.role !== allowedRole) {
      if (userObj.role === 'admin') {
        return <Navigate to="/admin/Dashbord" replace />;
      } else {
        return <Navigate to="/employee" replace />;
      }
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
  
  return children;
};


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'Dark Mode') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
            <Routes>
        <Route path="/" element={<LogIn />} />
        
        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashbord /></ProtectedRoute>} />
        <Route path="/admin/Dashbord" element={<ProtectedRoute allowedRole="admin"><AdminDashbord /></ProtectedRoute>} />
        <Route path="/admin/Inventory" element={<ProtectedRoute allowedRole="admin"><AdminInventory /></ProtectedRoute>} /> 
        <Route path="/admin/Sales" element={<ProtectedRoute allowedRole="admin"><AdminSales /></ProtectedRoute>} />
        <Route path="/admin/Orders" element={<ProtectedRoute allowedRole="admin"><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/Customers" element={<ProtectedRoute allowedRole="admin"><AdminCustomers /></ProtectedRoute>} />
        <Route path="/admin/Reports" element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/ActivityLogs" element={<ProtectedRoute allowedRole="admin"><AdminActivityLogs /></ProtectedRoute>} />
        <Route path="/admin/Notifications" element={<ProtectedRoute allowedRole="admin"><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/Settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/Employees" element={<ProtectedRoute allowedRole="admin"><AdminEmployees /></ProtectedRoute>} />

        <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><Dashbord /></ProtectedRoute>} />
        <Route path="/employee/inventory" element={<ProtectedRoute allowedRole="employee"><Inventory /></ProtectedRoute>} />
        <Route path="/employee/sales" element={<ProtectedRoute allowedRole="employee"><Sales /></ProtectedRoute>} />
        <Route path="/employee/orders" element={<ProtectedRoute allowedRole="employee"><Orders /></ProtectedRoute>} />
        <Route path="/employee/customers" element={<ProtectedRoute allowedRole="employee"><Customers /></ProtectedRoute>} />
        <Route path="/employee/reports" element={<ProtectedRoute allowedRole="employee"><Reports /></ProtectedRoute>} />
        <Route path="/employee/messages" element={<ProtectedRoute allowedRole="employee"><Messages /></ProtectedRoute>} />
        <Route path="/employee/notifications" element={<ProtectedRoute allowedRole="employee"><Notifications /></ProtectedRoute>} />
        <Route path="/employee/history" element={<ProtectedRoute allowedRole="employee"><LoginHistory /></ProtectedRoute>} />
        <Route path="/employee/settings" element={<ProtectedRoute allowedRole="employee"><Settings /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App
