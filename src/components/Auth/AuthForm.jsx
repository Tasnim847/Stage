import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

function AuthForm({ onLogin }) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setAiTyping(true);
    const timer = setTimeout(() => {
      setAiTyping(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [type]);

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

  const registerAPI = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Échec de l\'inscription');
      return data;
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
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
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Réponse du serveur invalide');
      }

      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
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
      if (!res.ok) throw new Error(data.message || 'Échec de la réinitialisation');
      return data;
    } catch (err) {
      console.error('Erreur de réinitialisation:', err);
      throw err;
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = '6 caractères minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Prénom requis';
    if (!formData.lastname.trim()) newErrors.lastname = 'Nom requis';
    if (!formData.username.trim()) newErrors.username = 'Pseudonyme requis';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = '6 caractères minimum';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const response = await loginAPI({
        email: formData.email.trim(),
        password: formData.password
      });

      // Ajouter rememberMe à la réponse
      const responseWithRememberMe = {
        ...response,
        rememberMe
      };

      setSuccessMessage('Connexion réussie !');
      onLogin(responseWithRememberMe);

    } catch (error) {
      console.error("Détails de l'erreur:", error);
      setErrors({ 
        submit: error.message.includes('401') 
          ? 'Email ou mot de passe incorrect' 
          : error.message || 'Erreur technique'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setIsLoading(true);
    try {
      const response = await registerAPI(formData);
      setSuccessMessage('Inscription réussie ! Connexion...');

      const loginResponse = await loginAPI({
        email: formData.email,
        password: formData.password
      });
      
      // Ajouter rememberMe à la réponse
      const loginResponseWithRememberMe = {
        ...loginResponse,
        rememberMe
      };

      onLogin(loginResponseWithRememberMe);

    } catch (error) {
      setErrors({ 
        submit: error.message || 'Échec de l\'inscription. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      await resetPasswordAPI(formData.email, formData.password);
      setSuccessMessage('Mot de passe réinitialisé ! Redirection...');

      setTimeout(() => {
        setSuccessMessage('');
        setType('login');
        setFormData({
          email: '',
          password: '',
          username: '',
          confirmPassword: '',
          name: '',
          lastname: ''
        });
      }, 1500);
    } catch (error) {
      setErrors({
        submit: error.message || 'Échec de la réinitialisation. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
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

  const handleForgotPassword = () => {
    changeFormType('forgot');
  };

  const handleSecurityInfo = () => {
    console.log('Info sécurité cliquée');
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="close-modal" onClick={() => navigate('/')} aria-label="Fermer">
          <span className="close-icon">×</span>
        </button>

        {/* Assistant IA avec animations */}
        <div className="ai-assistant">
          <div className="ai-header">
            <div className="ai-avatar">
              <span className="ai-icon">🤖</span>
              <div className="ai-status"></div>
            </div>
            <div className="ai-info">
              <h4>Assistant FacturaPro IA</h4>
              <p>En ligne • Analyse en cours...</p>
            </div>
          </div>
        
          <div className="ai-message">
            {aiTyping ? (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <p>
                {type === 'login' 
                  ? "Bonjour ! Je détecte que vous souhaitez accéder à votre compte. Laissez-moi vous guider."
                  : type === 'signup'
                    ? "Bienvenue ! Je vous assiste pour créer votre compte et optimiser votre expérience de facturation."
                    : "Je vous assiste pour réinitialiser votre mot de passe en toute sécurité."
                }
              </p>
            )}
          </div>
        
          <div className="ai-suggestions">
            {type !== 'forgot' && (
              <div className="suggestion-chip" onClick={handleForgotPassword}>
                <span>💡 Mot de passe oublié ?</span>
              </div>
            )}
            <div className="suggestion-chip" onClick={() => changeFormType(type === 'login' ? 'signup' : 'login')}>
              <span>🚀 {type === 'login' ? 'Créer un compte' : 'Se connecter'}</span>
            </div>
            <div className="suggestion-chip" onClick={handleSecurityInfo}>
              <span>🔐 Sécurité renforcée</span>
            </div>
          </div>
        </div>

        {/* Formulaire avec validation intelligente */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>
            {type === 'login' ? 'Connexion' : 
             type === 'signup' ? 'Inscription' : 'Réinitialisation'}
          </h2>
          
          {errors.submit && <div className="error-message">{errors.submit}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          {type === 'signup' && (
            <>
              <div className="form-group-inline">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Prénom"
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
                    placeholder="Nom"
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
                  placeholder="Pseudonyme"
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

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={type === 'forgot' ? 'Nouveau mot de passe' : 'Mot de passe'}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {(type === 'signup' || type === 'forgot') && (
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}

          {type === 'login' && (
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="rememberMe">Se souvenir de moi</label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {type === 'login' ? 'Connexion en cours...' : 
                 type === 'signup' ? 'Création en cours...' : 'Réinitialisation en cours...'}
              </>
            ) : (
              type === 'login' ? 'Se connecter' : 
              type === 'signup' ? 'S\'inscrire' : 'Réinitialiser'
            )}
          </button>
          
          <div className="auth-switch">
            <p>
              {type === 'login' ? 'Pas encore de compte? ' : 
               type === 'signup' ? 'Déjà un compte? ' : 'Retour à la connexion? '}
              <span onClick={() => changeFormType(type === 'login' ? 'signup' : 'login')} className="auth-switch-link">
                {type === 'login' ? 'Inscrivez-vous' : 
                 type === 'signup' ? 'Connectez-vous' : 'Se connecter'}
              </span>
            </p>
          </div>
        </form>
        
        {/* Badges de confiance avec animations */}
        <div className="trust-badges">
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>Chiffrement AES-256</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🤖</span>
            <span>IA de détection de fraude</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✅</span>
            <span>Certifié RGPD</span>
          </div>
        </div>

        {/* Analyse de sécurité en temps réel (simulation IA) */}
        <div className="security-scan">
          <div className="scan-progress">
            <div className="scan-bar"></div>
          </div>
          <p>Analyse de sécurité en temps réel...</p>
        </div>
      </div>

      <div className="modal-overlay" onClick={() => navigate('/')}></div>
    </div>
  );
}

export default AuthForm;