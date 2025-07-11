import { useState } from 'react';
import PropTypes from 'prop-types';
import authImage from '../../assets/LOG.jpg';
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

  const [showAIErrorPopup, setShowAIErrorPopup] = useState(false);
  const [aiErrorDetails, setAiErrorDetails] = useState({
    title: '',
    message: '',
    solution: ''
  });

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

  

  // Fonction pour gérer les erreurs avec IA
  const handleAIError = (errorMessage) => {
  let title = "Form Validation Error";
  let message = errorMessage;
  let solution = "Please check all fields and try again.";

  // Analyse des erreurs de validation
  if (errorMessage.includes('required')) {
    title = "Missing Information";
    message = "Some required fields are empty.";
    solution = "Please fill in all fields marked with an asterisk (*).";
  } else if (errorMessage.includes('email')) {
    title = "Email Problem";
    message = "There's an issue with your email address.";
    solution = "Make sure you're using a valid email format (e.g., user@example.com).";
  } else if (errorMessage.includes('password')) {
    title = "Password Issue";
    message = "There's a problem with your password.";
    solution = "Password must be at least 6 characters long. Make sure both passwords match if confirming.";
  }

  setAiErrorDetails({ title, message, solution });
  setShowAIErrorPopup(true);
};

  // Fermer le popup
  const closeAIErrorPopup = () => {
    setShowAIErrorPopup(false);
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
  let hasError = false;
  
  if (!formData.email.trim()) {
    newErrors.email = 'Email required';
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
    hasError = true;
  }

  if (!formData.password) {
    newErrors.password = 'Password required';
    hasError = true;
  } else if (formData.password.length < 6) {
    newErrors.password = 'Minimum 6 characters';
    hasError = true;
  }

  setErrors(newErrors);
  
  if (hasError) {
    handleAIError('Please fill in all required fields correctly');
    return false;
  }
  
  return true;
};

const validateRegister = () => {
  const newErrors = {};
  let hasError = false;
  
  if (!formData.name.trim()) {
    newErrors.name = 'First name required';
    hasError = true;
  }
  if (!formData.lastname.trim()) {
    newErrors.lastname = 'Last name required';
    hasError = true;
  }
  if (!formData.username.trim()) {
    newErrors.username = 'Username required';
    hasError = true;
  }
  
  if (!formData.email.trim()) {
    newErrors.email = 'Email required';
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
    hasError = true;
  }

  if (!formData.password) {
    newErrors.password = 'Password required';
    hasError = true;
  } else if (formData.password.length < 6) {
    newErrors.password = 'Minimum 6 characters';
    hasError = true;
  }

  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Confirmation required';
    hasError = true;
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
    hasError = true;
  }

  setErrors(newErrors);
  
  if (hasError) {
    handleAIError('Please complete all fields with valid information');
    return false;
  }
  
  return true;
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
    handleAIError(error.message.includes('401') 
      ? 'Incorrect email or password' 
      : error.message || 'Technical error');
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
    handleAIError(error.message || 'Registration error. Please try again.');
    // Retirez l'ancienne gestion d'erreur
    // setErrors({ 
    //   submit: error.message || 'Registration error. Please try again.'
    // });
  }
};

  const handleResetSubmit = async (e) => {
  e.preventDefault();
  
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
    handleAIError(error.message || 'Password reset failed. Please try again.');
  }
};

const validateForgotPassword = () => {
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

  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Confirmation required';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
    // Ajout pour déclencher le popup IA
    handleAIError('The passwords you entered do not match. Please make sure both fields contain the same password.');
    return false;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Valide en fonction du type de formulaire
  let isValid;
  if (type === 'login') {
    isValid = validateLogin();
  } else if (type === 'signup') {
    isValid = validateRegister();
  } else if (type === 'forgot') {
    isValid = validateForgotPassword();
  }

  // Si la validation échoue, ne pas continuer
  if (!isValid) return;

  // Si la validation réussit, procéder à la soumission
  try {
    if (type === 'login') {
      await handleLoginSubmit(e);
    } else if (type === 'signup') {
      await handleRegisterSubmit(e);
    } else if (type === 'forgot') {
      await handleResetSubmit(e);
    }
  } catch (error) {
    handleAIError(error.message || 'An error occurred. Please try again.');
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
    <div className="auth-container" style={{ 
      backgroundImage: `url(${authImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex'
    }}>
      <div className="form-side" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        width: '50%',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className={`auth-card ${animation}`} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          padding: '2rem',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
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
                    <div className="error-message-container">
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
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
                    <div className="error-message-container">
                      {errors.lastname && <span className="error-message">{errors.lastname}</span>}
                    </div>
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
                  <div className="error-message-container">
                    {errors.username && <span className="error-message">{errors.username}</span>}
                  </div>
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
              <div className="error-message-container">
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
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
                  <div className="error-message-container">
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>
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
                  <div className="error-message-container">
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
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
                  <div className="error-message-container">
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>
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

      <div className="welcome-side" style={{
        width: '50%',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: 'white',
        textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Hello!</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pharetra magna nisi, at posuere sem dapibus sed.
        </p>
      </div>

      {showAIErrorPopup && (
        <>
          <div className="overlay" onClick={closeAIErrorPopup} />
          <div className="ai-error-popup">
            <div className="ai-error-popup-content">
              <div className="ai-error-header">
                <div className="ai-icon">AI</div>
                <h3 className="ai-error-title">{aiErrorDetails.title}</h3>
              </div>
              <p className="ai-error-message">{aiErrorDetails.message}</p>
              
              <div className="ai-error-solution">
                <div className="ai-error-solution-title">AI Suggestion:</div>
                <p>{aiErrorDetails.solution}</p>
              </div>
              
              <button 
                className="ai-error-close" 
                onClick={closeAIErrorPopup}
              >
                Got it!
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

AuthForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default AuthForm;