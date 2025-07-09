import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import axios from 'axios';
import { setAuthToken } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (formData) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/api/login', {
        email: formData.email,
        password: formData.password
      });
      
      // Stockage du token et configuration d'Axios
      setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirection
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Authentication failed. Please try again.'
      );
    }
  };

  return (
    <AuthForm 
      type="login" 
      onSubmit={handleLogin}
      error={error}
    />
  );
};

export default Login;