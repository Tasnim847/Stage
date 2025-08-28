import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const DashboardHome = () => {
  const [user, setUser] = useState({ name: 'Jean Dupont', role: 'Administrateur' });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation de données récupérées depuis une API
  useEffect(() => {
    // Simulation du chargement de données
    const timer = setTimeout(() => {
      setAiSuggestions([
        { id: 1, text: 'Optimiser le processus de validation des documents', priority: 'high' },
        { id: 2, text: 'Revoir les autorisations d\'accès de l\'équipe marketing', priority: 'medium' },
        { id: 3, text: 'Planifier une sauvegarde des données critiques', priority: 'low' }
      ]);

      setRecentActivity([
        { id: 1, action: 'Connexion', time: 'Il y a 2 minutes', user: 'Vous' },
        { id: 2, action: 'Mise à jour du profil', time: 'Il y a 10 minutes', user: 'Vous' },
        { id: 3, action: 'Nouveau fichier partagé', time: 'Il y a 15 minutes', user: 'Marie Lambert' }
      ]);

      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="homepage-container">
      {/* En-tête */}
      <header className="homepage-header">
        <div className="welcome-section">
          <h1>Bonjour, {user.name}!</h1>
          <p>Heureux de vous revoir. Voici ce qui s'est passé depuis votre dernière connexion.</p>
        </div>
        <div className="user-info">
          <span className="user-role">{user.role}</span>
          <div className="user-avatar">
            {user.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* Tableaux de bord principaux */}
      <div className="dashboard-grid">
        {/* Carte des suggestions IA */}
        <div className="dashboard-card ai-suggestions">
          <h2>
            Suggestions de l'IA 
            <span className="badge">{aiSuggestions.length}</span>
          </h2>
          {isLoading ? (
            <div className="loading-placeholder">
              <div className="loading-spinner"></div>
              <p>Analyse en cours...</p>
            </div>
          ) : (
            <ul className="suggestions-list">
              {aiSuggestions.map(suggestion => (
                <li key={suggestion.id} className={`suggestion-item ${suggestion.priority}`}>
                  <span className="suggestion-text">{suggestion.text}</span>
                  <span className="priority-indicator"></span>
                </li>
              ))}
            </ul>
          )}
          <button className="action-button">Voir toutes les suggestions</button>
        </div>

        {/* Carte d'activité récente */}
        <div className="dashboard-card recent-activity">
          <h2>Activité récente</h2>
          {isLoading ? (
            <div className="loading-placeholder">
              <div className="loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : (
            <ul className="activity-list">
              {recentActivity.map(activity => (
                <li key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <p className="activity-action">{activity.action}</p>
                    <span className="activity-user">{activity.user}</span>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="action-button">Voir toute l'activité</button>
        </div>

        {/* Carte de statistiques */}
        <div className="dashboard-card stats">
          <h2>Vue d'ensemble</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">128</span>
              <span className="stat-label">Documents traités</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">24</span>
              <span className="stat-label">Tâches en cours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">92%</span>
              <span className="stat-label">Efficacité</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">Notifications</span>
            </div>
          </div>
        </div>

        {/* Carte d'actions rapides */}
        <div className="dashboard-card quick-actions">
          <h2>Actions rapides</h2>
          <div className="actions-grid">
            <button className="quick-action-button">
              <span className="action-icon">📊</span>
              <span>Rapports</span>
            </button>
            <button className="quick-action-button">
              <span className="action-icon">📁</span>
              <span>Fichiers</span>
            </button>
            <button className="quick-action-button">
              <span className="action-icon">👥</span>
              <span>Équipe</span>
            </button>
            <button className="quick-action-button">
              <span className="action-icon">⚙️</span>
              <span>Paramètres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section de personnalisation de l'IA */}
      <div className="ai-customization">
        <h2>Personnalisez votre assistant IA</h2>
        <p>Adaptez les suggestions de l'IA à vos préférences de travail</p>
        <div className="preference-options">
          <label className="preference-toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Suggestions automatisées</span>
          </label>
          <label className="preference-toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Analyses prédictives</span>
          </label>
          <label className="preference-toggle">
            <input type="checkbox" />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Notifications quotidiennes</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;