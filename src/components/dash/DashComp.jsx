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
  
  const sidebarRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  // Gestion du thème sombre
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  // Gestion du redimensionnement et fermeture des menus en desktop
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    // Fermeture des menus en cliquant à l'extérieur
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

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      window.location.href = '/login';
    }
  };

  const notifications = [
    { id: 1, text: "Nouvelle réclamation reçue", time: "10 min ago", read: false },
    { id: 2, text: "Facture payée", time: "1h ago", read: true },
    { id: 3, text: "Mise à jour du système", time: "2h ago", read: true }
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
    // Ici vous pourriez mettre à jour l'état des notifications
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`ai-dashboard ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Sidebar */}
      <div className="ai-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          {/* Profil Comptable en haut */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <img 
                src={userData?.avatar || defaultAvatar} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
          </div>
          
          {windowWidth <= 768 && (
            <button 
              className="mobile-menu-button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
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
                  <span>Accueil</span>
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
                  <span>Entreprises</span>
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
                  <span>Factures</span>
                </li>
                {/* Ajout du profil */}
                <li 
                  className={location.pathname.includes('/dash-comp/profile') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-comp/profile')}
                >
                  <FiUser className="icon" /> 
                  <span>Profil</span>
                </li>
              </ul>
            </div>

            {/* Boutons en bas de la sidebar */}
            <div className="sidebar-footer">
              <button 
                className="theme-toggle-btn sidebar-btn" 
                onClick={toggleDarkMode}
              >
                {darkMode ? <FiSun className="icon" /> : <FiMoon className="icon" />}
                <span>{darkMode ? 'Mode Jour' : 'Mode Nuit'}</span>
              </button>
              
              <button 
                className="logout-btn sidebar-btn" 
                onClick={handleLogout}
              >
                <FiLogOut className="icon" /> 
                <span>Déconnexion</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Contenu principal (sans header) */}
      <div className="ai-main">
        <div className="ai-content">
          <Outlet context={{ userData }} />
        </div>
      </div>
    </div>
  );
};

export default DashComp;