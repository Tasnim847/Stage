import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './comptable.css';

const DashbComp = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null');
        
        if (!token || !userData || userData.role !== 'comptable') {
          console.warn('[DASHB_COMP] Redirecting to /login - Invalid authentication');
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/dashboard/comptable', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Error loading data');
        }
        
        setData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('[DASHB_COMP] Error:', err);
        setError(err.response?.data?.message || err.message);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userData');
          navigate('/login');
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'TND',  // TND for Tunisian Dinar
      minimumFractionDigits: 3  // Standard format in Tunisia (3 decimals)
    }).format(value);
  };

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

  return (
    <div className="dashboard-comptable">
      <header className="dashboard-header">
        <h1>
          <span className="header-icon">📊</span>
          Accountant Dashboard
        </h1>
        <div className="header-actions">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          <button className="refresh-button">
            <span>🔄</span> Refresh
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">📄</div>
            <div className="company-info">
              <h3>Total Invoices</h3>
              <p>{data.totals?.totalFactures || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">DT</div>
            <div className="company-info">
              <h3>Amount TTC</h3>
              <p>{formatCurrency(data.totals?.totalTTC || 0)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-gradient"></div>
          <div className="card-header">
            <div className="company-logo">DT</div>
            <div className="company-info">
              <h3>Amount HT</h3>
              <p>{formatCurrency(data.totals?.totalHT || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>
            <span className="section-icon">📈</span>
            Distribution by Business
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data.chartData || []}
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
                labelFormatter={(value) => `Business: ${value}`}
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
                name="Amount TTC" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="montantHT" 
                fill="#b2d2c1" 
                name="Amount HT" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="factures-section">
          <h2>
            <span className="section-icon">🧾</span>
            Recent Invoices
          </h2>
          {data.factures?.length > 0 ? (
            <div className="factures-table-container">
              <table className="factures-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Business</th>
                    <th>Date</th>
                    <th>Amount TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {data.factures.map((facture) => (
                    <tr key={facture.id}>
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
    </div>
  );
};

export default DashbComp;