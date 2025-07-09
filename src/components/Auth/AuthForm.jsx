import { useState } from 'react';
import PropTypes from 'prop-types';
import authImage from '../../assets/home.jpg';
import './AuthForm.css';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ onLogin, error: propError }) => {
  const [type, setType] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    name: '',
    lastname: ''
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [animation, setAnimation] = useState('enter');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // API Functions
  
  const registerAPI = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          name: userData.name,
          lastname: userData.lastname
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }
    
    return data;
  } catch (err) {
    console.error('Registration error:', err);
    throw err;
   }
  };

  const loginAPI = async (credentials) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid server response');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const resetPasswordAPI = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password reset failed');
      return data;
    } catch (err) {
      console.error('Reset password error:', err);
      throw err;
    }
  };

  // Validation Functions
  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'First name required';
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name required';
    if (!formData.username.trim()) newErrors.username = 'Username required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handlers
  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  if (!validateLogin()) return;

  try {
    const response = await loginAPI({
      email: formData.email.trim(),
      password: formData.password
    });

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authToken', response.token);
    storage.setItem('userData', JSON.stringify(response.user));

    setSuccessMessage('Login successful!');
    
    // Appel de onLogin pour mettre à jour l'état global
    onLogin({
      ...response,
      rememberMe
    });

    // Redirection basée sur le rôle
    if (response.user.role === 'comptable') {
      navigate('/dash-comp');
    } else if (response.user.role === 'entreprise') {
      navigate('/dash-entr');
    } else {
      navigate('/');
    }

  } catch (error) {
    setErrors({ 
      submit: error.message.includes('401') 
        ? 'Incorrect email or password' 
        : error.message || 'Technical error'
    });
  }
};

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    try {
      const response = await registerAPI(formData);
      
      if (response.token && response.user) {
        setSuccessMessage('Registration successful!');
        
        setTimeout(() => {
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('authToken', response.token);
          storage.setItem('userData', JSON.stringify(response.user));
          
          onLogin({
            token: response.token,
            user: response.user,
            rememberMe
          });
        }, 1000);
      } else {
        throw new Error('Unexpected server response');
      }
    } catch (error) {
      setErrors({ 
        submit: error.message || 'Registration error. Please try again.'
      });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    try {
      await resetPasswordAPI(formData.email, formData.password);
      setSuccessMessage('Password reset! Redirecting...');

      setTimeout(() => {
        setType('login');
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      setErrors({
        submit: error.message || 'Password reset failed. Please try again.'
      });
    }
  };

  const handleSubmit = async (e) => {
    if (type === 'login') {
      await handleLoginSubmit(e);
    } else if (type === 'signup') {
      await handleRegisterSubmit(e);
    } else if (type === 'forgot') {
      await handleResetSubmit(e);
    }
  };

  const changeFormType = (newType) => {
    setAnimation('exit');
    setTimeout(() => {
      setType(newType);
      setAnimation('enter');
      setErrors({});
      setSuccessMessage('');
      setFormData({
        email: '',
        password: '',
        username: '',
        confirmPassword: '',
        name: '',
        lastname: ''
      });
    }, 300);
  };

  return (
    <div className="auth-container">
      <div className="form-side">
        <div className={`auth-card ${animation}`}>
          <div className="auth-header">
            <h2 className="logo">
              {type === 'login' ? 'Welcome' :
                type === 'signup' ? 'Create account' : 'Reset password'}
            </h2>
            <p className="subtitle">
              {type === 'login'
                ? 'Login to your account'
                : type === 'signup'
                  ? 'Join our platform'
                  : 'Set a new password'}
            </p>
          </div>

          {propError && <div className="auth-message error">{propError}</div>}
          {errors.submit && <div className="auth-message error">{errors.submit}</div>}
          {successMessage && <div className="auth-message success">{successMessage}</div>}

           <form onSubmit={handleSubmit} className="auth-form">
            {type === 'signup' && (
              <>
                <div className="form-group-inline">
                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="First name"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      placeholder="Last name"
                      className={errors.lastname ? 'error' : ''}
                    />
                    {errors.lastname && <span className="error-message">{errors.lastname}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>
              </>
            )}

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {(type === 'signup' || type === 'forgot') && (
              <div className="form-group-inline">
                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={type === 'forgot' ? 'New password' : 'Password'}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
            )}

            {type === 'login' && (
              <>
                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
                <div className="form-options">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => changeFormType('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            <div className="button-container">
              <button type="submit" className="primary-button">
                {type === 'login' ? 'Login' : type === 'signup' ? 'Sign up' : 'Reset'}
              </button>

              <div className="button-separator">
                <span>or</span>
              </div>
  
              <button
                type="button"
                className="secondary-button"
                onClick={() => changeFormType(type === 'login' ? 'signup' : 'login')}
              >
                {type === 'forgot' ? 'Back to login' : type === 'login' ? 'Create account' : 'Already registered?'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="image-side">
        <img src={authImage} alt="Authentication" className="auth-image" />
        <div className="image-caption">
          <h2>Welcome to our platform</h2>
          <p>Join our community</p>
        </div>
      </div>
    </div>
  );
};

AuthForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default AuthForm;