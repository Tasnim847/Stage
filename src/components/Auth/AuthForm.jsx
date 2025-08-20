import React, { useState } from 'react';
import './AuthForm.css';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validation des données
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
          setIsLoading(false);
          return;
        }
      }

      // Déterminer l'URL et les données à envoyer
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const dataToSend = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password,
            name: formData.firstName,
            lastname: formData.lastName,
            username: formData.username
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        // Stocker le token et rediriger si nécessaire
        if (result.token) {
          localStorage.setItem('token', result.token);
          // Redirection ou mise à jour de l'état de l'application
          setTimeout(() => {
            window.location.reload(); // Ou redirection vers le dashboard
          }, 1500);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setResetEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la demande de réinitialisation' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFormMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setMessage({ type: '', text: '' });
  };

  const showPasswordReset = () => {
    setShowForgotPassword(true);
    setMessage({ type: '', text: '' });
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="auth-form-container">
      {showForgotPassword ? (
        <>
          <h2>Réinitialiser le mot de passe</h2>
          <p className="auth-instructions">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
          
          <form onSubmit={handleForgotPassword} className="auth-form">
            <input
              type="email"
              name="resetEmail"
              placeholder="Adresse email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              <span onClick={backToLogin} className="auth-link">
                Retour à la connexion
              </span>
            </p>
          </div>
        </>
      ) : (
        <>
          <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="form-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
                
                <input
                  type="text"
                  name="username"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </>
            )}
            
            <input
              type="email"
              name="email"
              placeholder="Adresse email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
              />
            )}
            
            {isLogin && (
              <div className="forgot-password-link">
                <span onClick={showPasswordReset}>
                  Mot de passe oublié ?
                </span>
              </div>
            )}
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading 
                ? (isLogin ? 'Connexion...' : 'Création...') 
                : (isLogin ? 'Se connecter' : 'Créer un compte')
              }
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
              <span onClick={toggleFormMode} className="auth-link">
                {isLogin ? 'Créer un compte' : 'Se connecter'}
              </span>
            </p>
          </div>
        </>
      )}
      
      {message.text && (
        <div className={`auth-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default AuthForm;