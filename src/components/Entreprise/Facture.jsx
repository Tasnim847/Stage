import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiFileText, FiPlusCircle, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Entreprise.css';

const Facture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Récupération du contexte
  const context = useOutletContext();
  
  if (!context || !context.userData) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données utilisateur...</p>
      </div>
    );
  }

  const { userData } = context;

  const fetchFactures = async (page = 1) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/factures', {
          params: {
          page: page,
          limit: pagination.itemsPerPage
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.data?.success) {
        setFactures(response.data.data.factures);
        setPagination({
          currentPage: page,
          totalPages: response.data.data.pagination.totalPages,
          itemsPerPage: response.data.data.pagination.itemsPerPage,
          totalItems: response.data.data.pagination.totalItems
        });
      } else {
        throw new Error(response.data?.message || "Données invalides reçues du serveur");
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || err.message || "Erreur lors du chargement des factures");
      
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Fonctions utilitaires
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'payé':
        return 'status-paid';
      case 'impayé':
        return 'status-unpaid';
      case 'partiel':
        return 'status-partial';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des factures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-alert">
          <p>Erreur: {error}</p>
          <button 
            className="btn-retry"
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="facture-container">
      <div className="facture-header">
        <h2>Gestion des Factures</h2>
        <button 
          className="btn-primary"
          onClick={() => navigate('/dash-entr/factures/nouvelle')}
        >
          <FiPlusCircle /> Nouvelle Facture
        </button>
      </div>

      <div className="facture-filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Rechercher par client, numéro..." 
          />
          <button className="btn-search">Rechercher</button>
        </div>
        <div className="filter-options">
          <select>
            <option value="">Tous les statuts</option>
            <option value="payé">Payé</option>
            <option value="impayé">Impayé</option>
            <option value="partiel">Paiement partiel</option>
          </select>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="no-data">
          <p>Aucune facture trouvée</p>
          <button 
            className="btn-refresh"
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Actualiser
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="facture-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Date émission</th>
                  <th>Échéance</th>
                  <th>Montant TTC</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map(facture => (
                  <tr key={facture.id}>
                    <td className="invoice-number">{facture.numero}</td>
                    <td className="client-name">{facture.client_name}</td>
                    <td className="invoice-date">{formatDate(facture.date_emission)}</td>
                    <td className="due-date">{formatDate(facture.date_echeance)}</td>
                    <td className="amount">{formatCurrency(facture.montant_ttc)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(facture.statut_paiement)}`}>
                        {facture.statut_paiement}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-action btn-view"
                        onClick={() => navigate(`/dash-entr/factures/${facture.id}`)}
                        title="Voir détails"
                      >
                        Détails
                      </button>
                      <button
                        className="btn-action btn-pdf"
                        onClick={() => navigate(`/dash-entr/factures/${facture.id}/pdf`)}
                        title="Télécharger PDF"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              Affichage de {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} à{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur{' '}
              {pagination.totalItems} factures
            </div>
            
            <div className="pagination-controls">
              <button
                className="btn-pagination"
                disabled={pagination.currentPage === 1}
                onClick={() => fetchFactures(pagination.currentPage - 1)}
                aria-label="Page précédente"
              >
                <FiChevronLeft /> Précédent
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`btn-page ${pagination.currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => fetchFactures(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="btn-pagination"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchFactures(pagination.currentPage + 1)}
                aria-label="Page suivante"
              >
                Suivant <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Facture;