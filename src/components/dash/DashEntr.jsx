import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiShoppingCart, 
  FiLogOut, 
  FiUser, 
  FiFileText, 
  FiUsers,
  FiSearch,
  FiSettings,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiCalendar,
  FiMessageSquare,
  FiImage
} from 'react-icons/fi';
import defaultAvatar from '../../assets/default-avatar.png';
import './Dashboard.css';

const DashEntr = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [darkMode, setDarkMode] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Load user data
    const loadUserData = () => {
      try {
        const data = JSON.parse(localStorage.getItem('userData')) || {};
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    // Check theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

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
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
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

  const handleNavigation = (path) => {
    navigate(path);
    if (windowWidth <= 768) {
      setMobileMenuOpen(false);
    }
    setShowProfileDropdown(false);
    setShowNotifications(false);
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div className={`ai-dashboard ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Business Sidebar */}
      <div className="ai-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          {/* Business Profile at top */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              {userData?.logo && !logoError ? (
                <img 
                  src={userData.logo} 
                  alt={`Logo of ${userData.entreprise || userData.username || userData.nom || 'Business'}`}
                  onError={handleLogoError}
                />
              ) : (
                <div className="logo-placeholder">
                  <FiImage size={24} />
                  <span>{userData.entreprise ? userData.entreprise.charAt(0) : 
                         userData.username ? userData.username.charAt(0) : 
                         userData.nom ? userData.nom.charAt(0) : 'B'}</span>
                </div>
              )}
            </div>
            <div className="sidebar-user-info">
              <h4>{userData.entreprise || userData.username || userData.nom || 'Business'}</h4>
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
                  className={location.pathname === '/dash-entr' ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr')}
                >
                  <FiHome className="icon" /> 
                  <span>Home</span>
                </li>
                <li 
                  className={location.pathname === '/dash-entr/dashb_entre' ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/dashb_entre')}
                >
                  <FiTrendingUp className="icon" /> 
                  <span>Dashboard</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/devis') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/devis')}
                >
                  <FiFileText className="icon" /> 
                  <span>Quotes</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/calendrier') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/calendriers')}
                >
                  <FiCalendar className="icon" /> 
                  <span>Calendar</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/factures') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/factures')}
                >
                  <FiFileText className="icon" /> 
                  <span>Invoices</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/profile') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/profile')}
                >
                  <FiUser className="icon" /> 
                  <span>Profile</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/chatbot') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/chatbot')}
                >
                  <FiMessageSquare className="icon" />
                  <span>Chatbot</span>
                </li>
              </ul>
            </div>

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

      <div className="ai-main">
        <div className="ai-content">
          <Outlet context={{ userData }} />
        </div>
      </div>
    </div>
  );
};

export default DashEntr;