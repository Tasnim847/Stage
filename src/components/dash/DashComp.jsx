import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiBriefcase, 
  FiLogOut, 
  FiUser, 
  FiTrendingUp,
  FiFileText, 
  FiAlertTriangle,
  FiSettings,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import defaultAvatar from '../../assets/default-avatar.png';
import './Dashboard.css';

const DashComp = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [darkMode, setDarkMode] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const sidebarRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  // Dark theme management
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // Resize management and menu closing on desktop
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    // Close menus when clicking outside
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target) && 
          !event.target.closest('.user-mini-profile-container')) {
        setShowProfileDropdown(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target) && 
          !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/';
    }
  };

  const notifications = [
    { id: 1, text: "New claim received", time: "10 min ago", read: false },
    { id: 2, text: "Invoice paid", time: "1h ago", read: true },
    { id: 3, text: "System update", time: "2h ago", read: true }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (windowWidth <= 768) {
      setMobileMenuOpen(false);
    }
    setShowProfileDropdown(false);
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    // Here you could update notification status
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`ai-dashboard ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Sidebar */}
      <div className="ai-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          {/* Accountant Profile at top */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              {userData?.image && !avatarError ? (
                <img 
                  src={userData.image} 
                  alt={`${userData.name || userData.username }`}
                  onError={handleAvatarError}
                />
              ) : (
                <div className="avatar-placeholder">
                  <FiUser size={24} />
                  <span>{userData.name ? userData.name.charAt(0) : 
                         userData.username ? userData.username.charAt(0) : 
                         userData.lastname ? userData.lastname.charAt(0) :''}</span>
                </div>
              )}
            </div>
            <div className="sidebar-user-info">
              <h4>{userData.name || userData.username || 'Comptable'}</h4>
              <p>{userData.email || ''}</p>
            </div>
          </div>
          
          {windowWidth <= 768 && (
            <button 
              className="mobile-menu-button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          )}
        </div>

        {(windowWidth > 768 || mobileMenuOpen) && (
          <>
            <div className="ai-sidebar-section">
              <h4>Navigation</h4>
              <ul className="ai-sidebar-menu">
                <li 
                  className={location.pathname === '/dash-comp' ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp')}
                >
                  <FiHome className="icon" /> 
                  <span>Home</span>
                </li>
                <li 
                  className={location.pathname === '/dash-comp/dashb_comp' ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/dashb_comp')}
                >
                  <FiTrendingUp className="icon" />
                  <span>Dashboard</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-comp/entreprises') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/entreprises')}
                >
                  <FiBriefcase className="icon" /> 
                  <span>Businesses</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-comp/notification') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/notification')}
                >
                  <FiAlertTriangle className="icon" /> 
                  <span>Notification</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-comp/factures') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/factures')}
                >
                  <FiFileText className="icon" /> 
                  <span>Invoices</span>
                </li>
                {/* Profile addition */}
                <li 
                  className={location.pathname.includes('/dash-comp/profile') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/profile')}
                >
                  <FiUser className="icon" /> 
                  <span>Profile</span>
                </li>
              </ul>
            </div>

            {/* Buttons at bottom of sidebar */}
            <div className="sidebar-footer">
              <button 
                className="theme-toggle-btn sidebar-btn" 
                onClick={toggleDarkMode}
              >
                {darkMode ? <FiSun className="icon" /> : <FiMoon className="icon" />}
                <span>{darkMode ? 'Day Mode' : 'Night Mode'}</span>
              </button>
              
              <button 
                className="logout-btn sidebar-btn" 
                onClick={handleLogout}
              >
                <FiLogOut className="icon" /> 
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main content (without header) */}
      <div className="ai-main">
        <div className="ai-content">
          <Outlet context={{ userData }} />
        </div>
      </div>
    </div>
  );
};

export default DashComp;