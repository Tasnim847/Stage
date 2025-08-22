import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FiFileText, FiPlusCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, 
  FiX, FiDownload, FiPrinter, FiEdit, FiClock, FiDollarSign, FiUser, 
  FiCalendar, FiCheckCircle, FiAlertCircle, FiInfo, FiChevronUp,
  FiEye, FiDownloadCloud // Ajout des nouvelles icônes
} from 'react-icons/fi';
import './Entreprise.css';
import FactureTelechargement from './FactureTelechargement';

const Facture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [factures, setFactures] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 9,
    totalItems: 0
  });
  const [aiInsights, setAiInsights] = useState([]);
  const [visibleSections, setVisibleSections] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const modalBodyRef = useRef(null);

  // Récupération du contexte
  const context = useOutletContext();
  const { darkMode } = context || {};
  
  if (!context || !context.userData) {
    return (
      <div className={`loading-container ${darkMode ? 'dark' : ''}`}>
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
        navigate('/');
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

  const fetchFactureDetails = async (factureId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`/api/factures/${factureId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.data?.success) {
        const factureData = response.data.data;
        setSelectedFacture(factureData);
        setShowDetails(true);
        
        // Générer des insights IA basés sur les données de la facture
        generateAiInsights(factureData);
      } else {
        throw new Error(response.data?.message || "Données invalides reçues du serveur");
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || err.message || "Erreur lors du chargement des détails de la facture");
    }
  };

  const generateAiInsights = (facture) => {
    const insights = [];
    
    // Analyse du statut de paiement
    if (facture.statut_paiement === 'impayé') {
      const joursImpayes = Math.floor((new Date() - new Date(facture.date_echeance)) / (1000 * 60 * 60 * 24));
      if (joursImpayes > 30) {
        insights.push({
          type: 'warning',
          message: `Facture impayée depuis ${joursImpayes} jours. Considérer un rappel urgent.`,
          icon: <FiAlertCircle />
        });
      }
    }
    
    // Analyse des délais de paiement
    if (facture.statut_paiement === 'payé' && facture.date_paiement) {
      const delaiPaiement = Math.floor((new Date(facture.date_paiement) - new Date(facture.date_emission)) / (1000 * 60 * 60 * 24));
      if (delaiPaiement <= 15) {
        insights.push({
          type: 'success',
          message: `Excellent délai de paiement: ${delaiPaiement} jours.`,
          icon: <FiCheckCircle />
        });
      }
    }
    
    // Analyse du montant
    if (facture.montant_ttc > 10000) {
      insights.push({
        type: 'info',
        message: 'Facture importante. Vérifier les conditions de paiement.',
        icon: <FiInfo />
      });
    }
    
    // Suggestion de prochaines actions
    if (facture.statut_paiement === 'brouillon') {
      insights.push({
        type: 'info',
        message: 'Facture en brouillon. Finaliser et envoyer au client.',
        icon: <FiEdit />
      });
    }
    
    setAiInsights(insights);
  };

  // Observer les sections pour l'animation au défilement
  useEffect(() => {
    if (showDetails && modalBodyRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section');
              setVisibleSections(prev => [...prev, sectionId]);
            }
          });
        },
        { threshold: 0.1 }
      );

      const sections = modalBodyRef.current.querySelectorAll('.detail-section');
      sections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        observer.observe(section);
      });

      return () => observer.disconnect();
    }
  }, [showDetails]);

  // Gérer l'affichage du bouton "Retour en haut"
  useEffect(() => {
    const handleScroll = () => {
      if (modalBodyRef.current) {
        setShowBackToTop(modalBodyRef.current.scrollTop > 300);
      }
    };

    if (modalBodyRef.current) {
      modalBodyRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (modalBodyRef.current) {
        modalBodyRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showDetails]);

  useEffect(() => {
    fetchFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 3
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'payé':
      case 'payee':
        return 'status-paid';
      case 'impayé':
      case 'impayee':
        return 'status-unpaid';
      case 'partiel':
        return 'status-partial';
      case 'brouillon':
        return 'status-draft';
      default:
        return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FiInfo />;
    
    switch (status.toLowerCase()) {
      case 'payé':
      case 'payee':
        return <FiCheckCircle />;
      case 'impayé':
      case 'impayee':
        return <FiAlertCircle />;
      case 'partiel':
        return <FiClock />;
      case 'brouillon':
        return <FiEdit />;
      default:
        return <FiInfo />;
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedFacture(null);
    setAiInsights([]);
    setVisibleSections([]);
  };

  const scrollToTop = () => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSection = (sectionId) => {
    if (modalBodyRef.current) {
      const section = modalBodyRef.current.querySelector(`[data-section="${sectionId}"]`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <div className={`loading-container ${darkMode ? 'dark' : ''}`}>
        <div className="spinner"></div>
        <p>Chargement des factures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`error-container ${darkMode ? 'dark' : ''}`}>
        <div className="error-alert">
          <p>Erreur: {error}</p>
          <button 
            className={`btn-retry ${darkMode ? 'dark' : ''}`}
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`facture-container ${darkMode ? 'dark' : ''}`}>
      <div className="facture-header-container">
        <h2>Gestion des Factures</h2>
      
        <div className={`facture-filters ${darkMode ? 'dark' : ''}`}>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Rechercher par client, numéro..." 
              className={darkMode ? 'dark' : ''}
            />
            <button className={`btn-search ${darkMode ? 'dark' : ''}`}>Rechercher</button>
          </div>
          <div className="filter-options">
            <select className={darkMode ? 'dark' : ''}>
              <option value="">Tous les statuts</option>
              <option value="payé">Payé</option>
              <option value="impayé">Impayé</option>
              <option value="partiel">Paiement partiel</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className={`no-data ${darkMode ? 'dark' : ''}`}>
          <p>Aucune facture trouvée</p>
          <button 
            className={`btn-refresh ${darkMode ? 'dark' : ''}`}
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Actualiser
          </button>
        </div>
      ) : (
        <>
          <div className="facture-grid">
            {factures.map(facture => (
              <div key={facture.id} className={`facture-card ${darkMode ? 'dark' : ''}`}>
                <div className="card-header">
                  <div className="card-title-section">
                    <FiFileText className="card-icon" />
                    <h3>{facture.numero || facture.id}</h3>
                  </div>
                  <span className={`status-badge ${getStatusClass(facture.statut_paiement)} ${darkMode ? 'dark' : ''}`}>
                    {getStatusIcon(facture.statut_paiement)}
                    {facture.statut_paiement || 'Inconnu'}
                  </span>
                </div>
                
                <div className="card-client">
                  <FiUser className="client-icon" />
                  <p>{facture.client_name || 'Client non spécifié'}</p>
                </div>
                
                <div className="card-dates">
                  <div className="date-item">
                    <FiCalendar className="date-icon" />
                    <div>
                      <small>Émission</small>
                      <p>{formatDate(facture.date_emission)}</p>
                    </div>
                  </div>
                  <div className="date-item">
                    <FiDollarSign className="amount-icon" />
                    <div>
                      <small>Montant TTC</small>
                      <p>{formatCurrency(facture.montant_ttc || facture.totals?.montantTTC)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button
                    className={`btn-icon btn-view ${darkMode ? 'dark' : ''}`}
                    onClick={() => fetchFactureDetails(facture.id)}
                    title="Voir détails"
                  >
                    <FiEye className="icon" />
                  </button>
                  <button
                    className={`btn-icon btn-pdf ${darkMode ? 'dark' : ''}`}
                    onClick={() => navigate(`/dash-entr/factures/${facture.id}/pdf`)}
                    title="Télécharger PDF"
                  >
                    <FiDownloadCloud className="icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`pagination-container ${darkMode ? 'dark' : ''}`}>
            <div className="pagination-controls">
              <button
                className={`btn-pagination ${darkMode ? 'dark' : ''}`}
                disabled={pagination.currentPage === 1}
                onClick={() => fetchFactures(pagination.currentPage - 1)}
                aria-label="Page précédente"
              >
                <FiChevronLeft />
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
                      className={`btn-page ${pagination.currentPage === pageNum ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
                      onClick={() => fetchFactures(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className={`btn-pagination ${darkMode ? 'dark' : ''}`}
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchFactures(pagination.currentPage + 1)}
                aria-label="Page suivante"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      {showDetails && selectedFacture && (
        <div className={`modal-overlay ${darkMode ? 'dark' : ''}`}>
          <div className={`modal-content ai-enhanced ${darkMode ? 'dark' : ''}`}>
            <div className="modal-header">
              <div className="modal-title-section">
                <FiFileText className="modal-title-icon" />
                <div>
                  <h3>Facture #{selectedFacture.numero || selectedFacture.id}</h3>
                  <p className="modal-subtitle">Détails complets avec analyse intelligente</p>
                </div>
              </div>
              
              {/* Menu de navigation rapide */}
              <div className="quick-nav">
                <button onClick={() => scrollToSection('info')}>Informations</button>
                <button onClick={() => scrollToSection('finance')}>Finances</button>
                {selectedFacture.lignesFacture && selectedFacture.lignesFacture.length > 0 && (
                  <button onClick={() => scrollToSection('articles')}>Articles</button>
                )}
                {selectedFacture.entreprise && (
                  <button onClick={() => scrollToSection('entreprise')}>Entreprise</button>
                )}
                {selectedFacture.notes && (
                  <button onClick={() => scrollToSection('notes')}>Notes</button>
                )}
                <button onClick={() => scrollToSection('tracking')}>Suivi</button>
              </div>
              
              <button className="modal-close" onClick={closeDetails}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body" ref={modalBodyRef}>
              {/* Insights IA */}
              {aiInsights.length > 0 && (
                <div 
                  className={`detail-section ${visibleSections.includes('ai') ? 'visible' : ''}`}
                  data-section="ai"
                >
                  <div className="ai-insights-section">
                    <div className="insights-grid">
                      {aiInsights.map((insight, index) => (
                        <div key={index} className={`insight-card insight-${insight.type}`}>
                          <div className="insight-icon">
                            {insight.icon}
                          </div>
                          <div className="insight-content">
                            <p>{insight.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="facture-details-grid">
                {/* Informations générales COMPLÈTES */}
                <div 
                  className={`detail-section info-section ${visibleSections.includes('info') ? 'visible' : ''}`}
                  data-section="info"
                >
                  <div className="section-header">
                    <FiInfo className="section-icon" />
                    <h4>Informations Générales</h4>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiUser />
                        <span>Client</span>
                      </div>
                      <div className="detail-value">{selectedFacture.client_name || 'Non spécifié'}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiCalendar />
                        <span>Date d'émission</span>
                      </div>
                      <div className="detail-value">{formatDate(selectedFacture.date_emission)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiClock />
                        <span>Date d'échéance</span>
                      </div>
                      <div className="detail-value">{formatDate(selectedFacture.date_echeance)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiCalendar />
                        <span>Date de paiement</span>
                      </div>
                      <div className="detail-value">{formatDate(selectedFacture.date_paiement)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        {getStatusIcon(selectedFacture.statut_paiement)}
                        <span>Statut</span>
                      </div>
                      <div className={`detail-value status-indicator ${getStatusClass(selectedFacture.statut_paiement)}`}>
                        {selectedFacture.statut_paiement || 'Inconnu'}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiInfo />
                        <span>Mode de paiement</span>
                      </div>
                      <div className="detail-value">{selectedFacture.mode_paiement || 'Non spécifié'}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiFileText />
                        <span>Référence</span>
                      </div>
                      <div className="detail-value">{selectedFacture.numero || selectedFacture.id}</div>
                    </div>
                  </div>
                </div>

                {/* Montants DÉTAILLÉS */}
                <div 
                  className={`detail-section amount-section ${visibleSections.includes('finance') ? 'visible' : ''}`}
                  data-section="finance"
                >
                  <div className="section-header">
                    <FiDollarSign className="section-icon" />
                    <h4>Détails Financiers</h4>
                  </div>
                  <div className="amount-grid">
                    <div className="amount-item">
                      <div className="amount-label">Montant HT</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_ht || selectedFacture.totals?.montantHT)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">TVA</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_tva || selectedFacture.totals?.tva)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">Remise</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.remise || 0)}</div>
                    </div>
                    
                    <div className="amount-item total">
                      <div className="amount-label">Montant TTC</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">Montant payé</div>
                      <div className="amount-value paid">{formatCurrency(selectedFacture.montant_paye || 0)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">Reste à payer</div>
                      <div className="amount-value remaining">
                        {formatCurrency(
                          (selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC || 0) - 
                          (selectedFacture.montant_paye || 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Articles DÉTAILLÉS */}
                {selectedFacture.lignesFacture && selectedFacture.lignesFacture.length > 0 && (
                  <div 
                    className={`detail-section articles-section ${visibleSections.includes('articles') ? 'visible' : ''}`}
                    data-section="articles"
                  >
                    <div className="section-header">
                      <FiFileText className="section-icon" />
                      <h4>Articles ({selectedFacture.lignesFacture.length})</h4>
                    </div>
                    <div className="articles-table">
                      <div className="table-header">
                        <div className="table-col description">Description</div>
                        <div className="table-col quantity">Quantité</div>
                        <div className="table-col price">Prix unitaire HT</div>
                        <div className="table-col tva">TVA</div>
                        <div className="table-col total">Total TTC</div>
                      </div>
                      {selectedFacture.lignesFacture.map((ligne, index) => {
                        const totalHT = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                        const totalTVA = totalHT * ((ligne.taux_tva || 19) / 100);
                        const totalTTC = totalHT + totalTVA;
                        
                        return (
                          <div key={index} className="table-row">
                            <div className="table-col description">{ligne.description || 'Article sans description'}</div>
                            <div className="table-col quantity">{ligne.quantite || 0} {ligne.unite || 'unité'}</div>
                            <div className="table-col price">{formatCurrency(ligne.prix_unitaire_ht || 0)}</div>
                            <div className="table-col tva">{ligne.taux_tva || 19}%</div>
                            <div className="table-col total">
                              {formatCurrency(totalTTC)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Totaux des articles */}
                      <div className="table-row total-row">
                        <div className="table-col description" colSpan="4">Total général</div>
                        <div className="table-col total">
                          {formatCurrency(selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations entreprise */}
                {selectedFacture.entreprise && (
                  <div 
                    className={`detail-section entreprise-section ${visibleSections.includes('entreprise') ? 'visible' : ''}`}
                    data-section="entreprise"
                  >
                    <div className="section-header">
                      <FiUser className="section-icon" />
                      <h4>Informations Entreprise</h4>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Nom</div>
                        <div className="detail-value">{selectedFacture.entreprise.nom}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Adresse</div>
                        <div className="detail-value">{selectedFacture.entreprise.adresse}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Téléphone</div>
                        <div className="detail-value">{selectedFacture.entreprise.telephone}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{selectedFacture.entreprise.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedFacture.notes && (
                  <div 
                    className={`detail-section notes-section ${visibleSections.includes('notes') ? 'visible' : ''}`}
                    data-section="notes"
                  >
                    <div className="section-header">
                      <FiEdit className="section-icon" />
                      <h4>Notes & Commentaires</h4>
                    </div>
                    <div className="notes-content">
                      <p>{selectedFacture.notes}</p>
                    </div>
                  </div>
                )}

                {/* Informations de suivi */}
                <div 
                  className={`detail-section tracking-section ${visibleSections.includes('tracking') ? 'visible' : ''}`}
                  data-section="tracking"
                >
                  <div className="section-header">
                    <FiClock className="section-icon" />
                    <h4>Suivi de la facture</h4>
                  </div>
                  <div className="tracking-grid">
                    <div className="tracking-item">
                      <div className="tracking-label">Créée le</div>
                      <div className="tracking-value">{formatDate(selectedFacture.createdAt)}</div>
                    </div>
                    <div className="tracking-item">
                      <div className="tracking-label">Modifiée le</div>
                      <div className="tracking-value">{formatDate(selectedFacture.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {/* Remplacer l'ancien bouton par le nouveau composant */}
              <FactureTelechargement facture={selectedFacture} />
  
              <button 
                className={`btn-action btn-primary ${darkMode ? 'dark' : ''}`}
                onClick={() => window.print()}
              >
                <FiPrinter />
              </button>
              {selectedFacture.statut_paiement === 'brouillon' && (
                <button 
                  className={`btn-action btn-warning ${darkMode ? 'dark' : ''}`}
                  onClick={() => navigate(`/dash-entr/factures/${selectedFacture.id}/edit`)}
                >
                  <FiEdit />
                </button>
              )}
            </div>
          </div>
          
          {/* Bouton de retour en haut */}
          <div 
            className={`back-to-top ${showBackToTop ? 'visible' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={scrollToTop}
            title="Retour en haut"
          >
            <FiChevronUp size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Facture;