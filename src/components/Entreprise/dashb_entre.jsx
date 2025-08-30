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
    
    const entrepriseId = userData.entrepriseId || userData.entrepriseID || userData.id_entreprise || userData.id;
    
    return {
      token,
      entrepriseId,
      userRole: userData.role
    };
  };

  const generateAiInsights = (data) => {
    const insights = [];
    
    if (!data || !data.stats) return insights;
    
    const { stats, recent, analytics } = data;
    
    const acceptanceRate = stats.devis > 0 ? (stats.devisAcceptes / stats.devis) * 100 : 0;
    if (acceptanceRate < 30) {
      insights.push({
        type: 'warning',
        title: 'Low acceptance rate',
        message: `Your quote acceptance rate is ${acceptanceRate.toFixed(1)}%. Consider reviewing your pricing or communication strategies.`,
        icon: '📉'
      });
    } else if (acceptanceRate > 70) {
      insights.push({
        type: 'success',
        title: 'Excellent performance',
        message: `Congratulations! Your quote acceptance rate is ${acceptanceRate.toFixed(1)}%, which is excellent.`,
        icon: '🚀'
      });
    }
    
    if (recent.factures && recent.factures.length > 0) {
      const unpaidInvoices = recent.factures.filter(f => f.statut_paiement === 'unpaid' || f.statut_paiement === 'overdue');
      if (unpaidInvoices.length > 3) {
        insights.push({
          type: 'warning',
          title: 'Pending invoices',
          message: `You have ${unpaidInvoices.length} invoices awaiting payment. Consider implementing a reminder system.`,
          icon: '⏰'
        });
      }
    }
    
    if (stats.devisBrouillon > 5) {
      insights.push({
        type: 'info',
        title: 'Pending quotes',
        message: `You have ${stats.devisBrouillon} draft quotes. Finalize them to increase your conversion chances.`,
        icon: '📝'
      });
    }
    
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10 || currentMonth <= 1) {
      insights.push({
        type: 'info',
        title: 'Seasonal opportunity',
        message: 'We are approaching the holiday season. Consider special offers to boost your sales.',
        icon: '🎄'
      });
    }

    if (analytics && analytics.revenueTrend) {
      const lastMonthRevenue = analytics.revenueTrend[analytics.revenueTrend.length - 1]?.revenue || 0;
      const previousMonthRevenue = analytics.revenueTrend[analytics.revenueTrend.length - 2]?.revenue || 0;
      
      if (lastMonthRevenue < previousMonthRevenue) {
        insights.push({
          type: 'warning',
          title: 'Revenue decline',
          message: `Your revenue decreased by ${((previousMonthRevenue - lastMonthRevenue) / previousMonthRevenue * 100).toFixed(1)}% compared to last month.`,
          icon: '📉'
        });
      } else if (lastMonthRevenue > previousMonthRevenue) {
        insights.push({
          type: 'success',
          title: 'Revenue growth',
          message: `Your revenue increased by ${((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)}% compared to last month.`,
          icon: '📈'
        });
      }
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
            setError('Access restricted to business accounts. Your role: ' + userRole);
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
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const formatInteger = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const devisStatusData = dashboardData ? [
    { name: 'Accepted', value: dashboardData.stats.devisAcceptes, color: '#10b981' },
    { name: 'Rejected', value: dashboardData.stats.devisRefuses, color: '#ef4444' },
    { name: 'Pending', value: dashboardData.stats.devis - dashboardData.stats.devisAcceptes - dashboardData.stats.devisRefuses, color: '#f59e0b' },
    { name: 'Drafts', value: dashboardData.stats.devisBrouillon, color: '#6b7280' }
  ] : [];

  const revenueData = dashboardData?.analytics?.revenueTrend || [];

  const invoiceStatusData = dashboardData ? [
    { name: 'Paid', value: dashboardData.stats.facturesPayees || 0, color: '#10b981' },
    { name: 'Unpaid', value: dashboardData.stats.facturesImpayees || 0, color: '#ef4444' },
    { name: 'Overdue', value: dashboardData.stats.facturesEnRetard || 0, color: '#f59e0b' }
  ] : [];

  const AiInsightsModal = () => {
    if (!showAiModal) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
        <div className="modal-content ai-enhanced" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <div className="modal-title-icon">🤖</div>
              <div>
                <h3>Artificial Intelligence Insights</h3>
                <p className="modal-subtitle">Analyses and recommendations based on your data</p>
              </div>
            </div>
            <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="ai-insights-section">
              <div className="ai-header">
                <div className="ai-icon">AI</div>
                <h4>Personalized recommendations</h4>
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
                <h4>How these insights are generated</h4>
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
          <div className="stat-value">{formatNumber(dashboardData?.stats.chiffreAffaire || 0)} TND</div>
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
                      {new Date(facture.date_emission).toLocaleDateString('en-US')}
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
                      {new Date(devis.date_creation).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-amount">{formatNumber(devis.montant_ttc)} TND</span>
                    <span className={`item-status status-${devis.status}`}>
                      {devis.status}
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
    
    return (
      <div className="analytics-container">
        <div className="charts-container">
          <div className="chart-card">
            <h3>Quote acceptance rate</h3>
            <div className="acceptance-rate-card">
              <div className="circular-progress">
                <div 
                  className="progress-circle" 
                  style={{ 
                    background: `conic-gradient(#10b981 ${acceptanceRate * 3.6}deg, #e5e7eb 0deg)` 
                  }}
                >
                  <div className="progress-inner">
                    <span className="rate-value">{acceptanceRate}%</span>
                  </div>
                </div>
              </div>
              <div className="acceptance-info">
                <div className="acceptance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Accepted</span>
                    <span className="stat-value">{dashboardData?.stats.devisAcceptes || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total quotes</span>
                    <span className="stat-value">{dashboardData?.stats.devis || 0}</span>
                  </div>
                </div>
                <div className="performance-status">
                  {acceptanceRate >= 60 ? (
                    <div className="status success">
                      <span>✓ Excellent performance</span>
                    </div>
                  ) : acceptanceRate >= 40 ? (
                    <div className="status warning">
                      <span>⚠️ Average performance</span>
                    </div>
                  ) : (
                    <div className="status danger">
                      <span>✗ Needs improvement</span>
                    </div>
                  )}
                </div>
              </div>
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
            <h3>Revenue evolution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Revenue (TND)']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue (TND)" fill="#44745c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Invoice status</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatInteger(value)} />
                </PieChart>
              </ResponsiveContainer>
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

      {aiInsights.length > 0 && (
        <div className="ai-insights-bar">
          <div className="ai-insights-preview">
            <div className="ai-preview-icon">🤖</div>
            <div className="ai-preview-content">
              <h4>AI Recommendation</h4>
              <p>{aiInsights[0].message}</p>
            </div>
            <button className="btn-view-insights" onClick={() => setShowAiModal(true)}>
              View all insights
            </button>
          </div>
        </div>
      )}

      {activeTab === 'overview' ? <OverviewTab /> : <AnalyticsTab />}

      <AiInsightsModal />
    </div>
  );
};

export default DashboardEntreprise;