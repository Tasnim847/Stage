// components/dash/DashEntr.js
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
  FiGlobe,
  FiStar,
  FiMenu,
  FiX
} from 'react-icons/fi';
import DashboardHome from './DashboardHome';
import './Dashboard.css';

const DashEntr = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
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

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      if (setIsAuthenticated) {
        setIsAuthenticated({
          isAuthenticated: false,
          userRole: null,
          isLoading: false
        });
      }
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      window.location.href = '/login';
    }
  };

  const notifications = [
    { id: 1, text: "Nouvelle commande reçue", time: "10 min ago", read: false },
    { id: 2, text: "Paiement reçu", time: "1h ago", read: true },
    { id: 3, text: "Nouveau client", time: "2h ago", read: true }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (windowWidth <= 768) {
      setMobileMenuOpen(false);
    }
    setShowProfileDropdown(false);
    setShowNotifications(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className={`ai-dashboard ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Sidebar Entreprise */}
      <div className="ai-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <h1>E-Commerce</h1>
          {windowWidth <= 768 && (
            <button 
              className="mobile-menu-button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          )}
        </div>

        {(windowWidth > 768 || mobileMenuOpen) && (
          <div className="ai-sidebar-section">
            <h4>Navigation</h4>
            <ul className="ai-sidebar-menu">
              <li 
                className={location.pathname === '/dash-entr' ? 'active' : ''} 
                onClick={() => handleNavigation('/dash-entr')}
              >
                <FiHome className="icon" /> 
                <span>Accueil</span>
              </li>
              <li 
                className={location.pathname.includes('/dash-entr/dashboard') ? 'active' : ''} 
                onClick={() => handleNavigation('/dash-entr/dashboard')}
              >
                <FiTrendingUp className="icon" /> 
                <span>Dashboard</span>
              </li>
              <li 
                className={location.pathname.includes('/dash-entr/devis') ? 'active' : ''} 
                onClick={() => handleNavigation('/dash-entr/devis')}
              >
                <FiFileText className="icon" /> 
                <span>Devis</span>
              </li>
              <li 
                className={location.pathname.includes('/dash-entr/customers') ? 'active' : ''} 
                onClick={() => handleNavigation('/dash-entr/customers')}
              >
                <FiUsers className="icon" /> 
                <span>Clients</span>
              </li>
              <li 
                className={location.pathname.includes('/dash-entr/invoices') ? 'active' : ''} 
                onClick={() => handleNavigation('/dash-entr/invoices')}
              >
                <FiFileText className="icon" /> 
                <span>Factures</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="ai-main">
        <header className="ai-header">
          <div className="ai-search">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher clients, factures..." 
              aria-label="Rechercher"
            />
          </div>
          
          <div className="header-right">
            {/* Notifications */}
            <div className="notification-container">
              <button 
                className="notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} non lues)` : ''}`}
                aria-expanded={showNotifications}
              >
                <FiBell className="icon" />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown" ref={notificationsDropdownRef}>
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button 
                      className="mark-all-read" 
                      onClick={() => setShowNotifications(false)}
                    >
                      Marquer comme lues
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? '' : 'unread'}`}
                        onClick={() => {
                          // Logique pour gérer le clic sur une notification
                          setShowNotifications(false);
                        }}
                      >
                        <p className="notification-text">{notification.text}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profil utilisateur */}
            <div className="user-mini-profile-container">
              <div 
                className="user-mini-profile" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-expanded={showProfileDropdown}
                aria-label="Menu utilisateur"
              >
                <div className="user-avatar-mini">
                  {userData?.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt={`Avatar de ${userData.name || userData.username || 'utilisateur'}`} 
                      className="user-avatar-img" 
                    />
                  ) : (
                    <div className="default-avatar-mini">
                      {userData?.name?.charAt(0)?.toUpperCase() || 
                       userData?.username?.charAt(0)?.toUpperCase() || 
                       'E'}
                    </div>
                  )}
                </div>
                {showProfileDropdown ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              
              {showProfileDropdown && (
                <div className="profile-dropdown" ref={profileDropdownRef}>
                  <div 
                    className="dropdown-item" 
                    onClick={() => handleNavigation('/dash-entr/profile')}
                  >
                    <FiUser className="icon" /> 
                    <span>Profil Entreprise</span>
                  </div>
                  <div 
                    className="dropdown-item" 
                    onClick={() => handleNavigation('/dash-entr/parametres')}
                  >
                    <FiSettings className="icon" /> 
                    <span>Paramètres</span>
                  </div>
                  <div 
                    className="dropdown-item" 
                    onClick={handleLogout}
                  >
                    <FiLogOut className="icon" /> 
                    <span>Déconnexion</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenu */}
        <div className="ai-content">
          <Outlet context={{ userData }} />
          {location.pathname === '/dash-entr' && <DashboardHome />}
        </div>
      </div>
    </div>
  );
};

export default DashEntr;