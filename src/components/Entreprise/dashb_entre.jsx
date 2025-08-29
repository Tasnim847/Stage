import React, { useState, useEffect } from 'react';
import './Entreprise.css';

const DashboardEntreprise = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);

  const getAuthData = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
    
    const entrepriseId = userData.entrepriseId || userData.entrepriseID || userData.id_entreprise || userData.id;
    
    return {
      token,
      entrepriseId,
      userRole: userData.role
    };
  };
  
  // Générer des insights IA basés sur les données du tableau de bord
  const generateAiInsights = (data) => {
    const insights = [];
    
    if (!data || !data.stats) return insights;
    
    const { stats, recent } = data;
    
    // Insight 1: Performance des devis
    const acceptanceRate = stats.devis > 0 ? (stats.devisAcceptes / stats.devis) * 100 : 0;
    if (acceptanceRate < 30) {
      insights.push({
        type: 'warning',
        title: 'Taux d\'acceptation faible',
        message: `Votre taux d'acceptation des devis est de ${acceptanceRate.toFixed(1)}%. Envisagez de revoir vos stratégies de pricing ou de communication.`,
        icon: '📉'
      });
    } else if (acceptanceRate > 70) {
      insights.push({
        type: 'success',
        title: 'Excellente performance',
        message: `Félicitations! Votre taux d'acceptation des devis est de ${acceptanceRate.toFixed(1)}%, ce qui est excellent.`,
        icon: '🚀'
      });
    }
    
    // Insight 2: Factures impayées
    if (recent.factures && recent.factures.length > 0) {
      const unpaidInvoices = recent.factures.filter(f => f.statut_paiement === 'impayé' || f.statut_paiement === 'en_retard');
      if (unpaidInvoices.length > 3) {
        insights.push({
          type: 'warning',
          title: 'Factures en attente',
          message: `Vous avez ${unpaidInvoices.length} factures en attente de paiement. Envisagez de mettre en place un système de relance.`,
          icon: '⏰'
        });
      }
    }
    
    // Insight 3: Devis en brouillon
    if (stats.devisBrouillon > 5) {
      insights.push({
        type: 'info',
        title: 'Devis en attente',
        message: `Vous avez ${stats.devisBrouillon} devis en brouillon. Finalisez-les pour augmenter vos chances de conversion.`,
        icon: '📝'
      });
    }
    
    // Insight 4: Recommandation basée sur la saisonnalité
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10 || currentMonth <= 1) {
      // Novembre à février - période des fêtes
      insights.push({
        type: 'info',
        title: 'Opportunité saisonnière',
        message: 'Nous approchons de la période des fêtes. Envisagez des offres spéciales pour stimuler vos ventes.',
        icon: '🎄'
      });
    }
    
    return insights;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
        const { token, userRole } = getAuthData();
        
        if (!token) {
            window.location.href = '/';
            return;
        }

        if (userRole !== 'entreprise') {
            setError('Accès réservé aux comptes entreprise. Votre rôle: ' + userRole);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/dashboard/entreprise`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.status === 403) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Vous n\'avez pas les permissions pour accéder à cette entreprise');
            }

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('userData');
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setDashboardData(data.data);
                // Générer les insights IA
                setAiInsights(generateAiInsights(data.data));
            } else {
                setError(data.message || 'Erreur inconnue du serveur');
            }
        } catch (err) {
            console.error('Erreur détaillée:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchDashboardData();
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  // Afficher les données de débogage
  const debugInfo = () => {
    const { token, entrepriseId, userRole } = getAuthData();
    return (
      <div style={{padding: '10px', background: '#f8f9fa', border: '1px solid #ddd', margin: '10px 0'}}>
        <h4>Info Débogage:</h4>
        <p>ID Entreprise: {entrepriseId}</p>
        <p>Rôle Utilisateur: {userRole}</p>
        <p>Token Présent: {token ? 'Oui' : 'Non'}</p>
        <button onClick={() => {
          console.log('Données userData:', JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}'));
          console.log('Token:', localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
        }}>Afficher les données dans la console</button>
      </div>
    );
  };

  // Composant pour les insights IA
  const AiInsightsModal = () => {
    if (!showAiModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
        <div className="modal-content ai-enhanced" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <div className="modal-title-icon">🤖</div>
              <div>
                <h3>Insights Intelligence Artificielle</h3>
                <p className="modal-subtitle">Analyses et recommandations basées sur vos données</p>
              </div>
            </div>
            <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="ai-insights-section">
              <div className="ai-header">
                <div className="ai-icon">AI</div>
                <h4>Recommandations personnalisées</h4>
              </div>
              
              <div className="insights-grid">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, index) => (
                    <div key={index} className={`insight-card insight-${insight.type}`}>
                      <div className="insight-icon">{insight.icon}</div>
                      <div className="insight-content">
                        <h4>{insight.title}</h4>
                        <p>{insight.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="insight-card insight-info">
                    <div className="insight-icon">ℹ️</div>
                    <div className="insight-content">
                      <h4>Données insuffisantes</h4>
                      <p>Continuez à utiliser la plateforme pour recevoir des recommandations personnalisées.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-section">
              <div className="section-header">
                <div className="section-icon">📊</div>
                <h4>Comment ces insights sont générés</h4>
              </div>
              <p>Notre intelligence artificielle analyse vos données en temps réel pour identifier des tendances, des opportunités et des points d'amélioration. Ces recommandations évolueront au fur et à mesure que vous utiliserez la plateforme.</p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-action btn-secondary" onClick={() => setShowAiModal(false)}>
              Fermer
            </button>
            <button className="btn-action btn-primary" onClick={() => window.location.reload()}>
              Actualiser les données
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Chargement du tableau de bord...</div>
        {debugInfo()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Erreur d'accès</h3>
        <p>{error}</p>
        {debugInfo()}
        <div style={{marginTop: '20px'}}>
          <button onClick={() => window.location.reload()}>Réessayer</button>
          <button onClick={() => window.location.href = '/login'} style={{marginLeft: '10px', background: '#dc3545'}}>
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <p>Aucune donnée disponible pour le moment</p>
        {debugInfo()}
      </div>
    );
  }

  const { stats, recent, entreprise } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Tableau de Bord </h1>
          
        </div>
        
        <div className="dashboard-nav">
          <ul>
            <li className="active">Vue d'ensemble</li>
            <li>Analytiques</li>
          </ul>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card factures">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{formatNumber(stats.factures)}</div>
          <div className="stat-label">Total Factures</div> 
        </div>

        <div className="stat-card devis">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{formatNumber(stats.devis)}</div>
          <div className="stat-label">Total Devis</div>
        </div>

        <div className="stat-card acceptes">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{formatNumber(stats.devisAcceptes)}</div>
          <div className="stat-label">Devis Acceptés</div>
        </div>

        <div className="stat-card refuses">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{formatNumber(stats.devisRefuses)}</div>
          <div className="stat-label">Devis Refusés</div>
        </div>

        <div className="stat-card brouillons">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{formatNumber(stats.devisBrouillon)}</div>
          <div className="stat-label">Devis en Brouillon</div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatNumber(stats.chiffreAffaire || 0)} DT</div>
          <div className="stat-label">Chiffre d'Affaires</div>
        </div>
      </div>

      <div className="recent-container">
        <div className="recent-section">
          <div className="section-header-with-action">
            <h2>Dernières Factures</h2>
            <button 
              className="btn-view-all" 
              onClick={() => window.location.href = '/dash-entr/factures'}
            >Voir tout</button>
          </div>
          <div className="recent-list">
            {recent.factures && recent.factures.length > 0 ? (
              recent.factures.map((facture) => (
                <div key={facture.id} className="recent-item">
                  <div className="item-main">
                    <span className="item-title">Facture #{facture.numero}</span>
                    <span className="item-date">
                      {new Date(facture.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-amount">{formatNumber(facture.montant_ttc)} DT</span>
                    <span className={`item-status status-${facture.statut_paiement}`}>
                      {facture.statut_paiement}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-empty">Aucune facture récente</div>
            )}
          </div>
        </div>

        <div className="recent-section">
          <div className="section-header-with-action">
            <h2>Derniers Devis</h2>
            <button 
              className="btn-view-all" 
              onClick={() => window.location.href = '/dash-entr/devis'}
            >Voir tout</button>
          </div>
          <div className="recent-list">
            {recent.devis && recent.devis.length > 0 ? (
              recent.devis.map((devis) => (
                <div key={devis.id} className="recent-item">
                  <div className="item-main">
                    <span className="item-title">Devis #{devis.numero}</span>
                    <span className="item-date">
                      {new Date(devis.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-amount">{formatNumber(devis.montant_ttc)} DT</span>
                    <span className={`item-status status-${devis.status}`}>
                      {devis.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-empty">Aucun devis récent</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal des insights IA */}
      <AiInsightsModal />
    </div>
  );
};

export default DashboardEntreprise;