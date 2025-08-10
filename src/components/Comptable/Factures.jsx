import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiTrash2, FiLoader, FiPlus, FiSearch, FiDownload, FiEye, FiFileText } from 'react-icons/fi';
import './comptable.css';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    payees: 0,
    impayees: 0
  });

  // Token handling
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  let role = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role || null;
    } catch (err) {
      console.error('Token decoding error:', err);
      role = null;
    }
  }

  useEffect(() => {
    if (!token || !role) {
      setLoading(false);
      setError('Utilisateur non authentifié');
      return;
    }

    const fetchFactures = async () => {
      try {
        setLoading(true);
        setError('');

        const endpoint = role === 'comptable'
          ? 'http://localhost:5000/api/factures/comptable/mes-factures'
          : 'http://localhost:5000/api/factures';

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement des factures');
        }

        const result = await response.json();
        const data = result.data?.factures || result.data || [];
        setFactures(data);
        
        // Calcul des statistiques
        setStats({
          total: data.length,
          payees: data.filter(f => f.statut?.toLowerCase() === 'payé').length,
          impayees: data.filter(f => f.statut?.toLowerCase() === 'impayé').length
        });
      } catch (err) {
        console.error('Erreur fetchFactures:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [token, role]);

  const filteredFactures = factures.filter(facture =>
    facture.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    facture.numero?.toLowerCase().includes(search.toLowerCase()) ||
    facture.statut?.toLowerCase().includes(search.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'payé':
        return <span className="status-badge payé">Payé</span>;
      case 'impayé':
        return <span className="status-badge impayé">Impayé</span>;
      case 'partiel':
        return <span className="status-badge partiel">Paiement partiel</span>;
      default:
        return <span className="status-badge">Inconnu</span>;
    }
  };

  return (
    <div className="factures-container">
      <div className="factures-header">
        <div>
          <h1>Gestion des Factures</h1>
          <p className="factures-subtitle">
            {stats.total} facture{stats.total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="factures-controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par client, numéro ou statut..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="add-button">
            <FiPlus /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card payees">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-content">
            <span className="stat-label">Payées</span>
            <span className="stat-value">{stats.payees}</span>
          </div>
        </div>
        <div className="stat-card impayees">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-content">
            <span className="stat-label">Impayées</span>
            <span className="stat-value">{stats.impayees}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <FiLoader className="spin" size={24} />
          <p>Chargement des factures...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="factures-table-container">
          <table className="factures-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.length > 0 ? (
                filteredFactures.map((facture) => (
                  <tr key={facture.id}>
                    <td>
                      <strong>#{facture.numero || facture.id}</strong>
                    </td>
                    <td>
                      <div className="client-cell">
                        <div className="client-avatar">
                          {facture.client_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span>{facture.client_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{formatDate(facture.date_emission)}</td>
                    <td className="amount-cell">{formatCurrency(facture.montant_ttc)}</td>
                    <td>{getStatusBadge(facture.statut)}</td>
                    <td className="actions">
                      <button className="action-btn view" title="Voir">
                        <FiEye />
                      </button>
                      <button className="action-btn download" title="Télécharger">
                        <FiDownload />
                      </button>
                      <button className="action-btn edit" title="Modifier">
                        <FiEdit2 />
                      </button>
                      <button className="action-btn delete" title="Supprimer">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    <div className="empty-state">
                      <FiFileText size={48} />
                      <p>Aucune facture trouvée</p>
                      {search && (
                        <button 
                          className="clear-search" 
                          onClick={() => setSearch('')}
                        >
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Factures;