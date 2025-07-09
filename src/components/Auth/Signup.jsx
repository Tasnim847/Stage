import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import axios from 'axios';
import { setAuthToken } from '../../utils/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSignup = async (formData) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Connexion automatique après inscription
      setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Registration failed. Please try again.'
      );
    }
  };

  return (
    <AuthForm 
      type="signup" 
      onSubmit={handleSignup}
      error={error}
    />
  );
};

export default Signup;