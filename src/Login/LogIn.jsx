import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import './LogIn.css';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';


const LogIn = ({ onLogin }) => {

  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCreds = async () => {
      try {
        const { value } = await Preferences.get({ key: 'rememberedCredentials' });
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed.username) setUsername(parsed.username);
          if (parsed.password) setPassword(parsed.password);
          setRememberMe(true);
        }
      } catch (e) {
        console.error("Error loading credentials from Preferences", e);
      }
    };
    loadCreds();
  }, []);
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("username", "==", cleanUser), where("password", "==", cleanPass));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        
        if (userDoc.status === 'Inactive') {
          setError('Your account has been deactivated.');
          setLoading(false);
          return;
        }

        const userData = {
          username: userDoc.username,
          role: userDoc.role || 'employee',
          name: userDoc.name,
          loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          remember: rememberMe
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        try {
          if (rememberMe) {
            await Preferences.set({
              key: 'rememberedCredentials',
              value: JSON.stringify({
                username: cleanUser,
                password: cleanPass
              })
            });
          } else {
            await Preferences.remove({ key: 'rememberedCredentials' });
          }
        } catch (prefError) {
          console.error("Preferences error:", prefError);
        }

        if (onLogin) onLogin(userData);
        
        try {
          await addDoc(collection(db, 'login_history'), {
            username: userDoc.username,
            name: userDoc.name,
            role: userDoc.role || 'employee',
            status: 'Success',
            createdAt: new Date()
          });
        } catch (e) {
          console.error("Error saving login history: ", e);
        }
        if (userData.role === 'admin') {
          navigate('/admin/Dashbord');
        } else {
          navigate('/employee');
        }
      }
       else {
        setError('Invalid username or password. Please check your credentials.');
        
        if (cleanUser) {
           try {
             await addDoc(collection(db, 'login_history'), {
               username: cleanUser,
               name: 'Unknown',
               status: 'Failed',
               createdAt: new Date()
             });
           } catch (e) {
             console.error("Error saving failed login: ", e);
           }
        }
      }

    } catch (err) {
      console.error("Login error:", err);
      setError('Failed to connect to the authentication server.');
    }
    
    setLoading(false);
  };



  return (
    <div className="login-page-container">
      <section className="login-left-section">
        <div className="login-bg-decor">
          <div className="decor-circle-1"></div>
          <div className="decor-circle-2"></div>
        </div>

        <div className="login-left-content">
          <div className="brand-header">
            <img 
              src="https://i.ibb.co/1pg7Nby/icon.png" 
              alt="Nice Footware Logo" 
              className="brand-logo-img" 
            />
            <div className="brand-title-group">
              <h1>Nice Footware</h1>
              <p className="brand-subtitle">Management System</p>
            </div>
          </div>

          <div className="visual-text-box">
            <h2>Welcome to Nice Footware Management System</h2>
            <p>
              Manage products, inventory, employees and sales with one powerful dashboard. 
              Streamline your operations with our premium enterprise solutions.
            </p>
          </div>

          <div className="illustration-wrapper">
            <div className="floating-shoe-card" style={{ position: 'relative' }}>
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&ixlib=rb-4.0.3&auto=format&fit=crop" 
                alt="Featured Footwear Showcase" 
                className="floating-shoe-img"
                style={{ borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', width: '100%', maxWidth: '400px' }}
              />
              <span className="illustration-badge">⚡ Live Size-Wise Inventory</span>
            </div>
          </div>
        </div>

        <div className="left-footer">
          © {new Date().getFullYear()} Nice Footware. All rights reserved.
        </div>
      </section>

      <section className="login-right-section">
        <div className="login-dotted-pattern"></div>

        <div className="login-form-box">
          <div className="mobile-brand-box">
            <img 
              src="https://i.ibb.co/1pg7Nby/icon.png" 
              alt="Nice Footware Logo" 
              className="mobile-brand-logo" 
            />
            <h2>Nice Footware</h2>
          </div>

          <div className="login-title-box">
            <h3>Login</h3>
            <p>Access your management dashboard</p>
          </div>

          {error && (
            <div className="login-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <span>Username</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">👤</span>
                <input 
                  id="username"
                  type="text" 
                  className="login-input" 
                  placeholder="Enter your username" 
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span>Password</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">🔒</span>
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  className="login-input" 
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="checkbox-label" htmlFor="remember">
                <input 
                  id="remember"
                  type="checkbox" 
                  className="custom-checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-icon">🔄</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <span className="btn-arrow-icon">➔</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mobile-footer">
          © {new Date().getFullYear()} Nice Footware. All rights reserved.
        </div>
      </section>
    </div>
  );
};

export default LogIn;
