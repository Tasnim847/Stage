import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthPage from './components/Auth/AuthPage';
import Home from './components/Home/home';
import DashComp from './components/dash/DashComp';
import DashEntr from './components/dash/DashEntr';
import EntrepriseList from './components/Comptable/EntrepriseList';
import DashboardHome from './components/dash/DashboardHome';
import Profile from './components/dash/Profile';
import Devis from './components/Entreprise/Devis';
import Facture from './components/Entreprise/Facture';
import DashbComp from './components/Comptable/dashb_comp';
import DashbEntre from './components/Entreprise/dashb_entre';
import Factures from './components/Comptable/Factures';
import Notifications from './components/Comptable/Notifications';
import MyFullCalendar from './components/Entreprise/MyFullCalendar';
import './App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userRole: null,
    isLoading: true
  });

  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null');
    
    return {
      isAuthenticated: !!token && !!userData,
      userRole: userData?.role || null
    };
  };

  useEffect(() => {
    const authStatus = checkAuthStatus();
    setAuthState({
      ...authStatus,
      isLoading: false
    });
  }, []);

  const handleLogin = (response) => {
    const storage = response.rememberMe ? localStorage : sessionStorage;
    storage.setItem('authToken', response.token);
    storage.setItem('userData', JSON.stringify(response.user));

    setAuthState({
      isAuthenticated: true,
      userRole: response.user.role,
      isLoading: false
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');

    setAuthState({
      isAuthenticated: false,
      userRole: null,
      isLoading: false
    });
    
    // Force a full page reload to reset all states
    window.location.href = '/login';
  };

  const ProtectedRoute = ({ requiredRole, children }) => {
    if (authState.isLoading) {
      return <div className="loading-screen">Chargement en cours...</div>;
    }

    if (!authState.isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && authState.userRole !== requiredRole) {
      return <Navigate to={authState.userRole === 'comptable' ? '/dash-comp' : '/dash-entr'} replace />;
    }

    return children ? children : <Outlet />;
  };

  if (authState.isLoading) {
    return <div className="loading-screen">Chargement en cours...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          authState.isAuthenticated 
          ? <Navigate to={authState.userRole === 'comptable' ? '/dash-comp' : '/dash-entr'} replace />
          : <Home />
        } />
        
        <Route
          path="/login"
          element={
            authState.isAuthenticated ? (
              <Navigate to={authState.userRole === 'comptable' ? '/dash-comp' : '/dash-entr'} replace />
            ) : (
              <AuthPage onLogin={handleLogin} />
            )
          }
        />

        <Route path="/dash-comp" element={
          <ProtectedRoute requiredRole="comptable">
            <DashComp setIsAuthenticated={setAuthState} userData={userData} />
          </ProtectedRoute>
        }>
        <Route index element={<DashboardHome />} />
        <Route path="dashb_comp" element={<DashbComp />} />
          <Route path="entreprises" element={<EntrepriseList />} />
          <Route path="factures" element={<Factures />} />
          <Route path="notification" element={<Notifications />} />
          <Route path="profile" element={<Profile handleLogout={handleLogout} />} />
        </Route>

        <Route path="/dash-entr" element={
          <ProtectedRoute requiredRole="entreprise">
            <DashEntr setIsAuthenticated={setAuthState} />
          </ProtectedRoute>
        }>
        <Route index element={<DashboardHome />} />
        <Route path="devis" element={<Devis />} />
        <Route path="factures" element={<Facture />} />
        <Route path="dashb_entre" element={<DashbEntre />} />
        <Route path="calendriers" element={<MyFullCalendar />} />
        <Route path="profile" element={<Profile handleLogout={handleLogout} />} />
      </Route>

        <Route path="/" element={
          <Navigate to={
            authState.isAuthenticated 
              ? (authState.userRole === 'comptable' ? '/dash-comp' : '/dash-entr') 
              : '/login'
          } replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;