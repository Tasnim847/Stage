import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');

  useEffect(() => {
    // Simuler un délai de vérification
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!authChecked) {
    return <div className="loading-screen">Chargement en cours...</div>;
  }

  if (!userData?.token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userData.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;