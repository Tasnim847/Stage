import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './DashboardComptable.css';

const DashbComp = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      
      try {
        // Vérification des données d'authentification
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null');
        
        if (!token || !userData || userData.role !== 'comptable') {
          console.warn('[DASHB_COMP] Redirection vers /login - Authentification invalide');
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
          throw new Error(response.data.message || 'Erreur de chargement des données');
        }
        
        setData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('[DASHB_COMP] Erreur:', err);
        setError(err.response?.data?.message || err.message);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn('[DASHB_COMP] Authentification invalide - Nettoyage du stockage');
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
      console.log('[DASHB_COMP] Nettoyage de l\'effet');
    };
  }, [navigate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  };

  
  if (loading) {
    return (
      <div className="dashboard-comptable">
        <div className="loading">Chargement en cours...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-comptable">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-comptable">
        <div className="error">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="dashboard-comptable">
      <header className="dashboard-header">
        <h1>Tableau de Bord Comptable</h1>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Factures</h3>
          <p>{data.totals?.totalFactures || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Montant TTC</h3>
          <p>{formatCurrency(data.totals?.totalTTC || 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Montant HT</h3>
          <p>{formatCurrency(data.totals?.totalHT || 0)}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2>Répartition par Entreprise</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data.chartData || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="entreprise" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(value) => `Entreprise: ${value}`}
              />
              <Legend />
              <Bar dataKey="montantTTC" fill="#8884d8" name="Montant TTC" />
              <Bar dataKey="montantHT" fill="#82ca9d" name="Montant HT" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="factures-section">
          <h2>Dernières Factures</h2>
          {data.factures?.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N° Facture</th>
                    <th>Entreprise</th>
                    <th>Date</th>
                    <th>Montant TTC</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.factures.map((facture) => (
                    <tr key={facture.id}>
                      <td>{facture.numero || 'N/A'}</td>
                      <td>{facture.entrepriseFacturee?.nom || 'Inconnu'}</td>
                      <td>{new Date(facture.date_emission).toLocaleDateString('fr-FR')}</td>
                      <td>{formatCurrency(facture.montant_ttc)}</td>
                      <td className={`status-${facture.statut_paiement}`}>
                        {facture.statut_paiement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">Aucune facture disponible</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashbComp;