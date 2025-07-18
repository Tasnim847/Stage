import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiTrash2, FiLoader, FiPlus, FiSearch, FiDownload, FiEye } from 'react-icons/fi';
import './comptable.css';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

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
    facture.numero?.toLowerCase().includes(search.toLowerCase())
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
        <h1>Gestion des Factures</h1>
        <div className="factures-controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par client ou numéro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="add-button">
            <FiPlus /> Nouvelle Facture
          </button>
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
                    <td>{facture.client_name || 'N/A'}</td>
                    <td>{formatDate(facture.date_emission)}</td>
                    <td>{formatCurrency(facture.montant_ttc)}</td>
                    <td>{getStatusBadge(facture.statut)}</td>
                    <td className="actions">
                      <button className="view-button" title="Voir">
                        <FiEye />
                      </button>
                      <button className="download-button" title="Télécharger">
                        <FiDownload />
                      </button>
                      <button className="edit-btn" title="Modifier">
                        <FiEdit2 />
                      </button>
                      <button className="delete-btn" title="Supprimer">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    Aucune facture trouvée
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