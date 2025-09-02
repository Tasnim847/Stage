import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Entreprise.css';

const DashboardEntreprise = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const getAuthData = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
    
    return {
      token,
      userRole: userData.role
    };
  };

  const generateAiInsights = (data) => {
    const insights = [];
    
    if (!data || !data.stats) return insights;
    
    const { stats, recent } = data;
    
    // Check if properties exist before doing calculations
    const devisTotal = stats.devis || 0;
    const devisAcceptes = stats.devisAcceptes || 0;
    
    const acceptanceRate = devisTotal > 0 ? (devisAcceptes / devisTotal) * 100 : 0;
    
    if (acceptanceRate < 30 && devisTotal > 0) {
        insights.push({
            type: 'warning',
            title: 'Low acceptance rate',
            message: `Your quote acceptance rate is ${acceptanceRate.toFixed(1)}%. Consider reviewing your pricing or communication strategies.`,
            icon: '📉'
        });
    } else if (acceptanceRate > 70 && devisTotal > 0) {
        insights.push({
            type: 'success',
            title: 'Excellent performance',
            message: `Congratulations! Your quote acceptance rate is ${acceptanceRate.toFixed(1)}%, which is excellent.`,
            icon: '🚀'
        });
    }
    
    // Check for unpaid invoices
    if (recent.factures && recent.factures.length > 0) {
      const unpaidInvoices = recent.factures.filter(f => 
        f.statut_paiement === 'impayé' || f.statut_paiement === 'en_retard'
      );
      if (unpaidInvoices.length > 3) {
        insights.push({
          type: 'warning',
          title: 'Pending invoices',
          message: `You have ${unpaidInvoices.length} invoices awaiting payment. Consider setting up a reminder system.`,
          icon: '⏰'
        });
      }
    }
    
    // Check for draft quotes
    if (stats.devisBrouillon > 5) {
      insights.push({
        type: 'info',
        title: 'Pending quotes',
        message: `You have ${stats.devisBrouillon} draft quotes. Finalize them to increase your conversion chances.`,
        icon: '📝'
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
        setError('Access reserved for business accounts. Your role: ' + userRole);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/dashboard/entreprise?range=${timeRange}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'You do not have permission to access this business');
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
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Data received:', data.data);
          setDashboardData(data.data);
          setAiInsights(generateAiInsights(data.data));
        } else {
          setError(data.message || 'Unknown server error');
        }
      } catch (err) {
        console.error('Detailed error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const formatInteger = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const devisStatusData = dashboardData ? [
    { name: 'Accepted', value: dashboardData.stats.devisAcceptes, color: '#10b981' },
    { name: 'Rejected', value: dashboardData.stats.devisRefuses, color: '#ef4444' },
    { name: 'Pending', value: dashboardData.stats.devisEnAttente, color: '#f59e0b' },
    { name: 'Drafts', value: dashboardData.stats.devisBrouillon, color: '#6b7280' }
  ] : [];

  const invoiceStatusData = dashboardData ? [
    { name: 'Paid', value: dashboardData.stats.facturesPayees || 0, color: '#10b981' },
    { name: 'Unpaid', value: dashboardData.stats.facturesImpayees || 0, color: '#ef4444' },
    { name: 'Overdue', value: dashboardData.stats.facturesEnRetard || 0, color: '#f59e0b' }
  ] : [];

  // Préparer les données pour le graphique hebdomadaire
  const weeklyInvoiceData = dashboardData?.analytics?.weeklyInvoices || [];
  const weeklyTotal = weeklyInvoiceData.reduce((sum, day) => sum + (day.count || 0), 0);
  
  const formattedWeeklyData = weeklyInvoiceData.map(day => ({
    name: day.dayName,
    count: day.count || 0,
    day: day.day
  }));

  const AiInsightsModal = () => {
    if (!showAiModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
        <div className="modal-content ai-enhanced" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>AI-Powered Insights</h2>
            <button className="close-btn" onClick={() => setShowAiModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="ai-insights-section">
              <div className="section-header">
                <div className="section-icon">🤖</div>
                <h3>Smart Recommendations</h3>
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
                      <h4>Insufficient data</h4>
                      <p>Continue using the platform to receive personalized recommendations.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-section">
              <div className="section-header">
                <div className="section-icon">📊</div>
                <h4>How these analyses are generated</h4>
              </div>
              <p>Our artificial intelligence analyzes your data in real time to identify trends, opportunities, and areas for improvement. These recommendations will evolve as you use the platform.</p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-action btn-secondary" onClick={() => setShowAiModal(false)}>
              Close
            </button>
            <button className="btn-action btn-primary" onClick={() => window.location.reload()}>
              Refresh data
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OverviewTab = () => (
    <>
      <div className="stats-grid">
        <div className="stat-card factures">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{formatInteger(dashboardData?.stats.factures || 0)}</div>
          <div className="stat-label">Total Invoices</div> 
        </div>

        <div className="stat-card devis">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{formatInteger(dashboardData?.stats.devis || 0)}</div>
          <div className="stat-label">Total Quotes</div>
        </div>

        <div className="stat-card acceptes">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{formatInteger(dashboardData?.stats.devisAcceptes || 0)}</div>
          <div className="stat-label">Accepted Quotes</div>
        </div>

        <div className="stat-card refuses">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{formatInteger(dashboardData?.stats.devisRefuses || 0)}</div>
          <div className="stat-label">Rejected Quotes</div>
        </div>

        <div className="stat-card brouillons">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{formatInteger(dashboardData?.stats.devisBrouillon || 0)}</div>
          <div className="stat-label">Draft Quotes</div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatNumber(dashboardData?.stats.totalTTC || 0)} TND</div>
          <div className="stat-label">Revenue</div>
        </div>
      </div>

      <div className="recent-container">
        <div className="recent-section">
          <div className="section-header-with-action">
            <h2>Recent Invoices</h2>
            <button className="btn-view-all" onClick={() => window.location.href = '/dash-entr/factures'}>
              View all
            </button>
          </div>
          <div className="recent-list">
            {dashboardData?.recent?.factures && dashboardData.recent.factures.length > 0 ? (
              dashboardData.recent.factures.map((facture) => (
                <div key={facture.id} className="recent-item">
                  <div className="item-main">
                    <span className="item-title">Invoice #{facture.numero}</span>
                    <span className="item-date">
                      {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-amount">{formatNumber(facture.montant_ttc)} TND</span>
                    <span className={`item-status status-${facture.statut_paiement}`}>
                      {facture.statut_paiement}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-empty">No recent invoices</div>
            )}
          </div>
        </div>

        <div className="recent-section">
          <div className="section-header-with-action">
            <h2>Recent Quotes</h2>
            <button className="btn-view-all" onClick={() => window.location.href = '/dash-entr/devis'}>
              View all
            </button>
          </div>
          <div className="recent-list">
            {dashboardData?.recent?.devis && dashboardData.recent.devis.length > 0 ? (
              dashboardData.recent.devis.map((devis) => (
                <div key={devis.id} className="recent-item">
                  <div className="item-main">
                    <span className="item-title">Quote #{devis.numero}</span>
                    <span className="item-date">
                      {new Date(devis.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-amount">{formatNumber(devis.montant_ttc)} TND</span>
                    <span className={`item-status status-${devis.statut}`}>
                      {devis.statut}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-empty">No recent quotes</div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const AnalyticsTab = () => {
    const acceptanceRate = dashboardData?.stats.devis > 0 ? 
        ((dashboardData.stats.devisAcceptes / dashboardData.stats.devis) * 100).toFixed(1) : 0;
    
    // Calculer le taux de facturation (factures générées / devis acceptés)
    const billingRate = dashboardData?.stats.devisAcceptes > 0 ? 
        ((dashboardData.stats.facturesFromDevis / dashboardData.stats.devisAcceptes) * 100).toFixed(1) : 0;
    
    // Préparer les données pour le graphique à deux niveaux
    const quoteStatsData = [
      { 
        name: 'Devis acceptés non facturés', 
        value: Math.max(0, dashboardData?.stats.devisAcceptes - dashboardData?.stats.facturesFromDevis || 0), 
        color: '#10b981' 
      },
      { 
        name: 'Factures générées', 
        value: dashboardData?.stats.facturesFromDevis || 0, 
        color: '#2563eb' 
      },
      { 
        name: 'Devis refusés', 
        value: dashboardData?.stats.devisRefuses || 0, 
        color: '#ef4444' 
      },
      { 
        name: 'En attente', 
        value: dashboardData?.stats.devisEnAttente || 0, 
        color: '#f59e0b' 
      },
      { 
        name: 'Brouillons', 
        value: dashboardData?.stats.devisBrouillon || 0, 
        color: '#6b7280' 
      }
    ];

    return (
      <div className="analytics-container">
        <div className="charts-container">
          <div className="chart-card">
            <h3>Quote acceptance & billing rate</h3>
            <div className="acceptance-rate-card">
              <div className="double-circular-progress">
                <div className="progress-outer">
                  <div 
                    className="progress-circle acceptance" 
                    style={{ 
                      background: `conic-gradient(#10b981 ${acceptanceRate * 3.6}deg, #e5e7eb 0deg)` 
                    }}
                  >
                    <div className="progress-inner">
                      <span className="rate-value">{acceptanceRate}%</span>
                      <span className="rate-label">Acceptance</span>
                    </div>
                  </div>
                  
                  <div 
                    className="progress-circle billing" 
                    style={{ 
                      background: `conic-gradient(#2563eb ${billingRate * 3.6}deg, transparent 0deg)` 
                    }}
                  >
                    <div className="progress-inner">
                      <span className="rate-value">{billingRate}%</span>
                      <span className="rate-label">Billing</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="acceptance-info">
                <div className="acceptance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total quotes</span>
                    <span className="stat-value">{dashboardData?.stats.devis || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Accepted</span>
                    <span className="stat-value">{dashboardData?.stats.devisAcceptes || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Invoiced</span>
                    <span className="stat-value">{dashboardData?.stats.facturesFromDevis || 0}</span>
                  </div>
                </div>
                <div className="performance-status">
                  {acceptanceRate >= 60 ? (
                    <div className="status success">
                      <span>✓ Excellent acceptance rate</span>
                    </div>
                  ) : acceptanceRate >= 40 ? (
                    <div className="status warning">
                      <span>⚠️ Average acceptance rate</span>
                    </div>
                  ) : (
                    <div className="status danger">
                      <span>✗ Low acceptance rate</span>
                    </div>
                  )}
                  {billingRate >= 90 ? (
                    <div className="status success">
                      <span>✓ Excellent billing rate</span>
                    </div>
                  ) : billingRate >= 70 ? (
                    <div className="status warning">
                      <span>⚠️ Average billing rate</span>
                    </div>
                  ) : (
                    <div className="status danger">
                      <span>✗ Low billing rate</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Quote to invoice conversion</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quoteStatsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {quoteStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatInteger(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Quote distribution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={devisStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {devisStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatInteger(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Invoices processed this week</h3>
            <div className="stats-summary">
              <div className="stat-badge">
                <span className="stat-label">Weekly total</span>
                <span className="stat-value">{formatInteger(weeklyTotal)}</span>
              </div>
              <div className="stat-badge">
                <span className="stat-label">Days with invoices</span>
                <span className="stat-value">
                  {weeklyInvoiceData.filter(day => day.count > 0).length}
                </span>
              </div>
            </div>
            <div className="chart-wrapper">
              {formattedWeeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formattedWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Invoices']}
                      labelFormatter={(value, payload) => {
                        if (payload && payload.length > 0) {
                          return new Date(payload[0].payload.day).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Processed invoices" 
                      fill="#44745c" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  <p>No invoice data available this week</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Access error</h3>
        <p>{error}</p>
        <div style={{marginTop: '20px'}}>
          <button onClick={() => window.location.reload()}>Try again</button>
          <button onClick={() => window.location.href = '/'} style={{marginLeft: '10px', background: '#dc3545'}}>
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <p>No data available at the moment</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Dashboard</h1>
        </div>
        
        <div className="dashboard-nav">
          <ul>
            <li 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </li>
            <li 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </li>
          </ul>
        </div>
      </div>

      {activeTab === 'overview' ? <OverviewTab /> : <AnalyticsTab />}

      <AiInsightsModal />
    </div>
  );
};

export default DashboardEntreprise;