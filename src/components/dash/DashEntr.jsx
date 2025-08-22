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
  FiCalendar
} from 'react-icons/fi';
import defaultAvatar from '../../assets/default-avatar.png';
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
  const [darkMode, setDarkMode] = useState(false);

  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Vérifier le thème au chargement
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
      console.error('Erreur lors de la déconnexion:', error);
      window.location.href = '/';
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

  const markAllAsRead = () => {
    // Logique pour marquer toutes les notifications comme lues
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`ai-dashboard ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Sidebar Entreprise */}
      <div className="ai-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          {/* Profil Entreprise en haut */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <img 
                src={userData?.logo || defaultAvatar} 
                alt={`Logo de ${userData.entreprise || userData.username }`}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
            <div className="sidebar-user-info">
              <h4>{userData.entreprise || userData.username }</h4>
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
                  className={location.pathname === '/dash-entr' ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr')}
                >
                  <FiHome className="icon" /> 
                  <span>Accueil</span>
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
                  <span>Devis</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/calendrier') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/calendriers')}
                >
                  <FiCalendar className="icon" /> 
                  <span>Calendrier</span>
                </li>
                <li 
                  className={location.pathname.includes('/dash-entr/factures') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/factures')}
                >
                  <FiFileText className="icon" /> 
                  <span>Factures</span>
                </li>
                {/* Ajout du profil */}
                <li 
                  className={location.pathname.includes('/dash-entr/profile') ? 'active' : ''} 
                  onClick={() => handleNavigation('/dash-entr/profile')}
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
                <span>Logout</span>
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

export default DashEntr;