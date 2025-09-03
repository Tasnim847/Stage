import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import axios from 'axios';
import './comptable.css';

const DashbComp = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'details'
  const [selectedCompanyData, setSelectedCompanyData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null');
        
        if (!token || !userData || userData.role !== 'comptable') {
          console.warn('[DASHB_COMP] Redirecting to /home - Invalid authentication');
          navigate('/');
          return;
        }

        const response = await axios.get('https://stage-slk6.onrender.com/api/dashboard/comptable', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Error loading data');
        }
        
        setData(response.data.data);
        
        // Extract unique companies list
        const uniqueCompanies = [...new Set(response.data.data.chartData.map(item => item.entreprise))];
        setCompanies(uniqueCompanies);
        
        setError(null);
      } catch (err) {
        console.error('[DASHB_COMP] Error:', err);
        setError(err.response?.data?.message || err.message);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userData');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      console.log('[DASHB_COMP] Cleaning up effect');
    };
  }, [navigate]);

  const handleCompanySelect = async (companyName) => {
    setSelectedCompany(companyName);
    setViewMode('details');
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Use the correct endpoint
      const response = await axios.get(`https://stage-slk6.onrender.com/api/dashboard/comptable/entreprise/${encodeURIComponent(companyName)}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setSelectedCompanyData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error loading company details');
      }
    } catch (err) {
      console.error('[DASHB_COMP] Error loading company details:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedCompany(null);
    setSelectedCompanyData(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 3
    }).format(value || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value || 0);
  };

  // Filter data based on selected company
  const filteredData = selectedCompany && data 
    ? {
        ...data,
        chartData: data.chartData.filter(item => item.entreprise === selectedCompany),
        factures: data.factures.filter(facture => 
          facture.entrepriseFacturee?.nom === selectedCompany
        ),
        totals: {
          totalFactures: data.factures.filter(facture => 
            facture.entrepriseFacturee?.nom === selectedCompany
          ).length,
          totalTTC: data.factures
            .filter(facture => facture.entrepriseFacturee?.nom === selectedCompany)
            .reduce((sum, facture) => sum + (facture.montant_ttc || 0), 0),
          totalHT: data.factures
            .filter(facture => facture.entrepriseFacturee?.nom === selectedCompany)
            .reduce((sum, facture) => sum + (facture.montant_ht || 0), 0)
        }
      }
    : data;

  if (loading) {
    return (
      <div className="dashboard-comptable">
        <div className="loading-container">
          <div className="spinner">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-comptable">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="error-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-comptable">
        <div className="empty-state">
          <p>No data available</p>
          <button className="error-button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Component for detailed company view
  const CompanyDetailView = () => {
    if (!selectedCompanyData) return null;
    
    const { entreprise, stats, recent, analytics } = selectedCompanyData;
    
    // Prepare data for charts
    const quotesStatusData = [
        { name: 'Accepted', value: stats.devisAcceptes || 0, color: '#10b981' },
        { name: 'Rejected', value: stats.devisRefuses || 0, color: '#ef4444' },
        { name: 'Pending', value: stats.devisEnAttente || 0, color: '#f59e0b' },
        { name: 'Drafts', value: stats.devisBrouillon || 0, color: '#6b7280' }
    ];

    // Use real weekly revenue data from API
    const revenueGrowthData = analytics?.weeklyRevenue || [];
    const revenueGrowth = stats.revenueGrowth || 0;
    const isPositiveGrowth = revenueGrowth >= 0;

    // Find current week data
    const currentWeekData = revenueGrowthData.find(week => week.isCurrentWeek);
    const currentWeekRevenue = currentWeekData?.revenue || 0;
    const currentWeekInvoices = currentWeekData?.invoiceCount || 0;

    // Calculate statistics
    const totalPeriodRevenue = revenueGrowthData.reduce((sum, week) => sum + week.revenue, 0);
    const averageWeeklyRevenue = totalPeriodRevenue / Math.max(revenueGrowthData.length, 1);
    const totalInvoicesPeriod = revenueGrowthData.reduce((sum, week) => sum + week.invoiceCount, 0);

    return (
      <div className="entreprise-detail">
        <div className="detail-header">
          <button className="back-button" onClick={handleBackToOverview}>
            &larr; Back to Dashboard
          </button>
          <h1>Company Details: {entreprise.nom}</h1>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">📄</div>
              <div className="company-info">
                <h3>Total Invoices</h3>
                <p>{formatNumber(stats.factures)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">📋</div>
              <div className="company-info">
                <h3>Total Quotes</h3>
                <p>{formatNumber(stats.devis)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">✅</div>
              <div className="company-info">
                <h3>Accepted Quotes</h3>
                <p>{formatNumber(stats.devisAcceptes)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">💰</div>
              <div className="company-info">
                <h3>Total Revenue</h3>
                <p>{formatCurrency(stats.totalTTC)}</p>
              </div>
            </div>
          </div>

          {/* Current Week Revenue Card */}
          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">📅</div>
              <div className="company-info">
                <h3>This Week Revenue</h3>
                <p>{formatCurrency(currentWeekRevenue)}</p>
                <small>{currentWeekInvoices} invoices</small>
              </div>
            </div>
          </div>

          {/* Revenue Growth Card */}
          <div className="stat-card">
            <div className="card-gradient"></div>
            <div className="card-header">
              <div className="company-logo">{isPositiveGrowth ? '📈' : '📉'}</div>
              <div className="company-info">
                <h3>Weekly Growth</h3>
                <p className={isPositiveGrowth ? 'positive-growth' : 'negative-growth'}>
                  {isPositiveGrowth ? '+' : ''}{formatPercent(revenueGrowth)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-section">
          <h2>Analytics and Statistics</h2>
          
          <div className="charts-container">
            <div className="chart-card">
              <h3>Quotes Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quotesStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {quotesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h3>Weekly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="week" tick={{ fill: '#6c757d' }} />
                  <YAxis tick={{ fill: '#6c757d' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(value);
                      if (name === 'invoiceCount') return `${value} invoices`;
                      return value;
                    }}
                    labelFormatter={(value) => {
                      const weekData = revenueGrowthData.find(item => item.week === value);
                      if (weekData) {
                        return `${value}\n${weekData.startDate} to ${weekData.endDate}`;
                      }
                      return value;
                    }}
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Revenue Growth Analysis Section */}
          <div className="growth-stats">
            <h3>Revenue Growth Analysis (Last 12 Weeks)</h3>
            <div className="growth-cards">
              <div className="growth-card">
                <h4>Weekly Growth Rate</h4>
                <p className={isPositiveGrowth ? 'positive-growth' : 'negative-growth'}>
                  {isPositiveGrowth ? '+' : ''}{formatPercent(revenueGrowth)}
                </p>
              </div>
              <div className="growth-card">
                <h4>Average Weekly Revenue</h4>
                <p>{formatCurrency(averageWeeklyRevenue)}</p>
                <small>per week</small>
              </div>
              <div className="growth-card">
                <h4>Total Period Revenue</h4>
                <p>{formatCurrency(totalPeriodRevenue)}</p>
                <small>{totalInvoicesPeriod} invoices</small>
              </div>
              <div className="growth-card">
                <h4>Current Week Performance</h4>
                <p>{formatCurrency(currentWeekRevenue)}</p>
                <small>{currentWeekInvoices} invoices</small>
              </div>
            </div>
          </div>

          {/* Weekly Revenue Table */}
          <div className="weekly-revenue-table">
            <h3>Weekly Revenue Details</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Invoices</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueGrowthData.map((week, index) => (
                    <tr key={index} className={week.isCurrentWeek ? 'current-week' : ''}>
                      <td>{week.week}</td>
                      <td>{week.startDate} to {week.endDate}</td>
                      <td className="currency">{formatCurrency(week.revenue)}</td>
                      <td className="number">{week.invoiceCount}</td>
                      <td>
                        <span className={`status-indicator ${week.isCurrentWeek ? 'current' : 'completed'}`}>
                          {week.isCurrentWeek ? 'In Progress' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="recent-documents">
          <div className="recent-section">
            <h2>Recent Invoices</h2>
            {recent.factures && recent.factures.length > 0 ? (
              <div className="documents-list">
                {recent.factures.map((facture, index) => (
                  <div key={index} className="document-item">
                    <div className="doc-main">
                      <span className="doc-title">Invoice #{facture.numero}</span>
                      <span className="doc-date">
                        {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="doc-details">
                      <span className="doc-amount">{formatCurrency(facture.montant_ttc)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent invoices</p>
              </div>
            )}
          </div>
          
          <div className="recent-section">
            <h2>Recent Quotes</h2>
            {recent.devis && recent.devis.length > 0 ? (
              <div className="documents-list">
                {recent.devis.map((devis, index) => (
                  <div key={index} className="document-item">
                    <div className="doc-main">
                      <span className="doc-title">Quote #{devis.numero}</span>
                      <span className="doc-date">
                        {new Date(devis.date_creation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="doc-details">
                      <span className="doc-amount">{formatCurrency(devis.montant_ttc)}</span>
                      <span className={`doc-status status-${devis.statut}`}>
                        {devis.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent quotes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dashboard overview view
  const OverviewView = () => (
    <>
      <header className="dashboard-header">
        <h1>
          <span className="header-icon">📊</span>
          Accounting Dashboard
        </h1>
        <div className="header-actions">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          
          {companies.length > 0 && (
            <div className="entreprise-selector">
              <select 
                value={selectedCompany || ''} 
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="entreprise-dropdown"
              >
                <option value="">All companies</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button className="refresh-button" onClick={() => window.location.reload()}>
            <span>🔄</span> Refresh
          </button>
        </div>
      </header>

      {selectedCompany && (
        <div className="selected-entreprise-header">
          <h2>Data for: {selectedCompany}</h2>
          <button 
            className="view-details-btn"
            onClick={() => handleCompanySelect(selectedCompany)}
          >
            View details &rarr;
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">📄</div>
            <div className="company-info">
              <h3>Total Invoices</h3>
              <p>{formatNumber(filteredData?.totals?.totalFactures || 0)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">DT</div>
            <div className="company-info">
              <h3>TTC Amount</h3>
              <p>{formatCurrency(filteredData?.totals?.totalTTC || 0)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">DT</div>
            <div className="company-info">
              <h3>HT Amount</h3>
              <p>{formatCurrency(filteredData?.totals?.totalHT || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>
            <span className="section-icon">📈</span>
            {selectedCompany ? `${selectedCompany} - Financial Data` : 'Distribution by Company'}
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={filteredData?.chartData || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
              <XAxis 
                dataKey="entreprise" 
                tick={{ fill: '#6c757d' }}
                axisLine={{ stroke: '#dee2e6' }}
              />
              <YAxis 
                tick={{ fill: '#6c757d' }}
                axisLine={{ stroke: '#dee2e6' }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(value) => `Company: ${value}`}
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              <Bar 
                dataKey="montantTTC" 
                fill="#72ac8d" 
                name="TTC Amount" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="montantHT" 
                fill="#b2d2c1" 
                name="HT Amount" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="factures-section">
          <h2>
            <span className="section-icon">🧾</span>
            {selectedCompany ? `${selectedCompany} - Recent Invoices` : 'Recent Invoices'}
          </h2>
          {filteredData?.factures?.length > 0 ? (
            <div className="factures-table-container">
              <table className="factures-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Company</th>
                    <th>Date</th>
                    <th>TTC Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.factures.map((facture, index) => (
                    <tr key={index}>
                      <td>{facture.numero || 'N/A'}</td>
                      <td>{facture.entrepriseFacturee?.nom || 'Unknown'}</td>
                      <td>{new Date(facture.date_emission).toLocaleDateString('fr-FR')}</td>
                      <td className="currency">{formatCurrency(facture.montant_ttc)}</td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No invoices available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-comptable">
      {viewMode === 'overview' ? <OverviewView /> : <CompanyDetailView />}
    </div>
  );
};

export default DashbComp;