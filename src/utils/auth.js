import axios from 'axios';
import jwt_decode from 'jwt-decode'; // Modification ici (jwt_decode au lieu de jwtDecode)

export const setAuthToken = (token, user) => {
  if (token && user) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('userData');
  return user ? JSON.parse(user) : null;
};


export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = '/login';
};

export const checkUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const authenticateUser = async (credentials) => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
    const { token, user } = response.data;

    if (!token || !user?.role) {
      throw new Error('Réponse du serveur invalide');
    }

    if (user.role !== 'comptable' && user.role !== 'entreprise') {
      throw new Error('Rôle utilisateur non reconnu');
    }

    setAuthToken(token);
    return { ...user, role: user.role.toLowerCase() };

  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    throw error;
  }
};