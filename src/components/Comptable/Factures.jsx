import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiTrash2, FiLoader, FiPlus, FiSearch, FiDownload, FiEye, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import InvoicePDF from './InvoicePDF';
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
  const [entreprise, setEntreprise] = useState(null);
  
  // States for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // 8 rows per page

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
      setError('User not authenticated');
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
          throw new Error(errorData.message || 'Error loading invoices');
        }

        const result = await response.json();
        const data = result.data?.factures || result.data || [];
        setFactures(data);
        
        // Récupérer les informations de l'entreprise si l'utilisateur est une entreprise
        if (role === 'entreprise') {
          try {
            const entrepriseResponse = await fetch('http://localhost:5000/api/entreprise/mon-profil', {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (entrepriseResponse.ok) {
              const entrepriseData = await entrepriseResponse.json();
              setEntreprise(entrepriseData.data);
            }
          } catch (err) {
            console.error('Error fetching entreprise data:', err);
          }
        }
        
        // Calculate statistics
        setStats({
          total: data.length,
          payees: data.filter(f => f.statut_paiement?.toLowerCase() === 'payé').length,
          impayees: data.filter(f => f.statut_paiement?.toLowerCase() === 'impayé').length
        });
      } catch (err) {
        console.error('Error fetchFactures:', err);
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
    facture.statut_paiement?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFactures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
        return <span className="status-badge payé">Paid</span>;
      case 'impayé':
        return <span className="status-badge impayé">Unpaid</span>;
      case 'partiel':
        return <span className="status-badge partiel">Partial payment</span>;
      default:
        return <span className="status-badge">Unknown</span>;
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="factures-container">
      <div className="factures-header">
        <div>
          <h1>Invoice Management</h1>
          <p className="factures-subtitle">
            {stats.total} invoice{stats.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="factures-controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by client or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <FiLoader className="spin" size={24} />
          <p>Loading invoices...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="factures-table-container">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((facture) => (
                    <tr key={facture.id}>
                      <td>
                        <strong>{facture.numero || facture.id}</strong>
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
                      <td className="actions">
                        <button className="action-btn view" title="View">
                          <FiEye />
                        </button>
                        <InvoicePDF 
                          facture={facture} 
                          entreprise={entreprise} 
                          onDownloadComplete={() => console.log('Téléchargement terminé')}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">
                      <div className="empty-state">
                        <FiFileText size={48} />
                        <p>No invoices found</p>
                        {search && (
                          <button 
                            className="clear-search" 
                            onClick={() => setSearch('')}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredFactures.length > itemsPerPage && (
            <div className="pagination">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <FiChevronLeft />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                >
                  {number}
                </button>
              ))}
              
              <button 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Factures;