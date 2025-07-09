import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import { useState } from 'react';

const AuthPage = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (response) => {
    setIsLoading(true);
    try {
      onLogin(response); // La redirection est maintenant gérée par App.js
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      )}
      <AuthForm onLogin={handleLogin} />
    </>
  );
};

export default AuthPage;