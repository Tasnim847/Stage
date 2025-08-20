import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiPrinter, FiEye, FiDownload, FiFileText } from 'react-icons/fi';
import './Entreprise.css';

const Devis = () => {
  const { userData } = useOutletContext();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [currentDevis, setCurrentDevis] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [currentPdfDevis, setCurrentPdfDevis] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
  // Vérifie la préférence utilisateur ou le localStorage
    return localStorage.getItem('darkMode') === 'true' || 
         window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [formData, setFormData] = useState({
    numero: '',
    date_creation: new Date().toISOString().split('T')[0],
    date_validite: '',
    remise: 0,
    tva: 20,
    statut: 'brouillon',
    client_name: '',
    montant_ht: 0, // Ajouté
    montant_ttc: 0, // Ajouté
    lignes: [{
        description: '',
        prix_unitaire_ht: 0,
        quantite: 1,
        unite: 'unité'
    }]
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const pdfModalStyle = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      width: '90%',
      maxWidth: '900px',
      height: '90%',
      maxHeight: '800px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      overflow: 'hidden',
    },
    header: {
      padding: '1rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
    },
    body: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    footer: {
      padding: '0.75rem 1rem',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.75rem',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
    },
    secondaryButton: {
      backgroundColor: '#e2e8f0',
      color: '#1e293b',
      border: 'none',
    },
    loading: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  };

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Fonction pour récupérer le token
  const getToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  };

  // Redirige vers login si pas de token valide
  const handleSessionExpired = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    navigate('/login', { state: { sessionExpired: true } });
  };

  // Chargement des devis
  const fetchDevis = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        console.warn('Pas de token dans localStorage ni sessionStorage');
        handleSessionExpired();
        return;
      }

      const response = await axios.get('http://localhost:5000/api/devis', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Transformez les données pour s'assurer que les montants sont des nombres
    const formattedDevis = response.data.data.map(devis => ({
      ...devis,
      montant_ht: parseFloat(devis.montant_ht) || 0,
      montant_ttc: parseFloat(devis.montant_ttc) || 0
    }));

    setDevis(formattedDevis || []);

    } catch (error) {
      console.error('Erreur lors fetchDevis:', error.response || error);
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        setError(error.response?.data?.message || 'Erreur lors du chargement des devis');
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifie l'authentification avant action
  const checkAuth = () => {
    const token = getToken();
    if (!token) handleSessionExpired();
  };

  // useEffect pour charger les devis une fois au montage
  useEffect(() => {
    checkAuth();
    fetchDevis();
  }, []);

  const handleAddDevis = () => {
    checkAuth();
    setCurrentDevis(null);
    setFormData({
      numero: '',
      date_creation: new Date().toISOString().split('T')[0],
      date_validite: '',
      remise: 0,
      tva: 20,
      statut: 'brouillon',
      client_name: '',
      lignes: [{
        description: '',
        prix_unitaire_ht: 0,
        quantite: 1,
        unite: 'unité'
      }]
    });
    setShowModal(true);
  };

  const handleEditDevis = (devis) => {
    checkAuth();
    setCurrentDevis(devis);
    setFormData({
        numero: devis.numero,
        date_creation: devis.date_creation.split('T')[0],
        date_validite: devis.date_validite?.split('T')[0] || '',
        remise: devis.remise,
        tva: devis.tva,
        statut: devis.statut,
        client_name: devis.client_name,
        montant_ht: parseFloat(devis.montant_ht) || 0,
        montant_ttc: parseFloat(devis.montant_ttc) || 0,
        lignes: devis.lignes?.length > 0 ? devis.lignes : [{
            description: '',
            prix_unitaire_ht: 0,
            quantite: 1,
            unite: 'unité'
        }]
    });
    setShowModal(true);
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLigneChange = (index, e) => {
    const { name, value } = e.target;
    const newLignes = [...formData.lignes];
    newLignes[index] = {
      ...newLignes[index],
      [name]: name === 'prix_unitaire_ht' || name === 'quantite' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({ ...prev, lignes: newLignes }));
  };

  const addLigne = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, {
        description: '',
        prix_unitaire_ht: 0,
        quantite: 1,
        unite: 'unité'
      }]
    }));
  };

  const removeLigne = (index) => {
    const newLignes = formData.lignes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, lignes: newLignes }));
  };

  const calculateTotal = () => {
  const totalHT = formData.lignes.reduce((sum, ligne) => 
    sum + (parseFloat(ligne.prix_unitaire_ht || 0) * parseInt(ligne.quantite || 1)), 0);
  
  const remiseAmount = totalHT * (parseFloat(formData.remise || 0) / 100);
  const totalAfterRemise = totalHT - remiseAmount;
  const tvaAmount = totalAfterRemise * (parseFloat(formData.tva || 20) / 100);
  const totalTTC = totalAfterRemise + tvaAmount;
  
  return {
    totalHT: totalHT.toFixed(2),
    tvaAmount: tvaAmount.toFixed(2),
    totalTTC: totalTTC.toFixed(2),
    montant_ht: totalHT,
    montant_ttc: totalTTC
  };
};

  // Fonction pour générer des suggestions IA
  const generateAISuggestion = () => {
    const { statut, date_validite, lignes } = formData;
    const today = new Date();
    const validiteDate = date_validite ? new Date(date_validite) : null;
    
    let suggestions = [];

    // Suggestions basées sur le statut
    if (statut === 'brouillon') {
      suggestions.push("Ce devis est encore en brouillon. Pensez à le finaliser et l'envoyer au client.");
    } else if (statut === 'envoyé') {
      suggestions.push("Le devis a été envoyé au client. Pensez à faire un suivi dans quelques jours.");
    }

    // Suggestions basées sur la date de validité
    if (validiteDate && validiteDate < today) {
      suggestions.push("Attention ! La date de validité de ce devis est dépassée. Pensez à la mettre à jour.");
    } else if (validiteDate) {
      const daysLeft = Math.floor((validiteDate - today) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        suggestions.push(`Le devis expire dans ${daysLeft} jour(s). Pensez à relancer le client.`);
      }
    }

    // Suggestions basées sur les lignes
    if (lignes.length === 0) {
      suggestions.push("Vous n'avez ajouté aucune ligne à ce devis. Ajoutez des produits ou services.");
    } else if (lignes.some(l => l.prix_unitaire_ht === 0)) {
      suggestions.push("Certains articles ont un prix unitaire à 0DT. Vérifiez les tarifs.");
    }

    // Si pas de suggestions spécifiques
    if (suggestions.length === 0) {
      suggestions.push("Tout semble en ordre avec ce devis. Pensez à l'envoyer au client si ce n'est pas déjà fait.");
    }

    return suggestions;
  };

  // Fonction pour soumettre le devis
  const submitDevis = async () => {
    const totals = calculateTotal();
    const token = getToken();
    const dataToSend = {
        ...formData,
        remise: parseFloat(formData.remise) || 0,
        tva: parseFloat(formData.tva) || 20,
        montant_ht: totals.montant_ht, // Ajouté
        montant_ttc: totals.montant_ttc, // Ajouté
        lignes: formData.lignes.map(l => ({
            description: l.description,
            prix_unitaire_ht: parseFloat(l.prix_unitaire_ht) || 0,
            quantite: parseInt(l.quantite) || 1,
            unite: l.unite || 'unité'
        }))
    };

    const url = currentDevis 
      ? `http://localhost:5000/api/devis/${currentDevis.id}` 
      : 'http://localhost:5000/api/devis';
      
    const method = currentDevis ? 'put' : 'post';
    
    const response = await axios[method](url, dataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      checkAuth();
      
      // Validation des données
      if (!formData.numero) throw new Error('Le numéro de devis est obligatoire');
      if (!formData.client_name) throw new Error('Le client est requis');
      if (formData.lignes.some(l => !l.description)) {
        throw new Error('Toutes les lignes doivent avoir une description');
      }

      // Générer les suggestions IA
      const suggestions = generateAISuggestion();
      setAiSuggestions(suggestions);
      
      // Si des suggestions existent, afficher le modal IA
      if (suggestions.length > 0) {
        setShowAIModal(true);
      } else {
        // Sinon, soumettre directement
          const response = await submitDevis();
          if (response.data?.success) {
            await fetchDevis();
            setShowModal(false);
            setAlert({
              show: true,
              message: currentDevis 
              ? 'Devis mis à jour avec succès' 
              : 'Devis créé avec succès',
              type: 'success'
            });
          }
        }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || error.message,
        type: 'error'
      });
      console.error('Erreur soumission devis:', error);
      setError(error.response?.data?.message || error.message);
    }
  };

  // Fonction pour confirmer après les suggestions IA
  const confirmAfterAISuggestions = async () => {
    setShowAIModal(false);
    try {
      const response = await submitDevis();
      if (response.data?.success) {
        await fetchDevis();
        setShowModal(false);
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur soumission devis:', error);
      setError(error.response?.data?.message || error.message);
    }
  };

  const handleDeleteDevis = async (id) => {
  if (!window.confirm('Confirmez la suppression ?')) return;
  try {
    const token = getToken();
    await axios.delete(`http://localhost:5000/api/devis/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchDevis();
    setAlert({
      show: true,
      message: 'Devis supprimé avec succès',
      type: 'success'
    });
  } catch (error) {
    setAlert({
      show: true,
      message: error.response?.data?.message || error.message,
      type: 'error'
    });
  }
};

  const handlePrintDevis = (devis) => {
    console.log('Impression:', devis);
    // Implémentez la logique d'impression ici
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'brouillon': return 'draft';
      case 'envoyé': return 'sent';
      case 'accepté': return 'accepted';
      case 'refusé': return 'rejected';
      case 'payé': return 'paid';
      default: return 'draft';
    }
  };

  const handleViewDevis = async (devis) => {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:5000/api/devis/${devis.id}/pdf`, {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${token}` }
        });

        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        setPdfUrl(pdfUrl);
        setCurrentPdfDevis(devis); // Utilisez setCurrentPdfDevis ici
        setPdfModalOpen(true);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors du chargement du PDF");
    }
  };

  const handleGenerateFacture = async (devis) => {
  try {
    if (devis.statut !== 'accepté') {
      setAlert({
        show: true,
        message: 'Seuls les devis avec le statut "accepté" peuvent être convertis en facture',
        type: 'error'
      });
      return;
    }

    if (!devis.client_name) {
      setAlert({
        show: true,
        message: 'Le devis doit avoir un client associé avant de générer une facture',
        type: 'error'
      });
      return;
    }

    const isConfirmed = window.confirm(`Voulez-vous convertir le devis ${devis.numero} en facture ?`);
    if (!isConfirmed) return;
    
    const token = getToken();
    const response = await axios.post(
      'http://localhost:5000/api/factures', 
      { devis_id: devis.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      setAlert({
  show: true,
  message: (
    <div className="ai-success-message">
      <div className="ai-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        </svg>
      </div>
      <div className="ai-content">
        <h4>Facture générée avec succès</h4>
        <p>La facture {response.data.data.numero} a été créée à partir du devis {devis.numero}.</p>
        <p>Nous vous recommandons de :</p>
        <ul>
          <li>Vérifier les détails de la facture</li>
          <li>Envoyer un email de confirmation au client</li>
          <li>Planifier un rappel pour le suivi du paiement</li>
        </ul>
      </div>
    </div>
  ),
  type: 'success'
});
      
      await fetchDevis();
      
      setTimeout(() => {
        navigate('/factures');
      }, 1500);
    }
  } catch (error) {
    setAlert({
      show: true,
      message: error.response?.data?.message || error.message,
      type: 'error'
    });
  }
};


  const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Pour gérer les messages complexes (composants React)
  const renderMessage = () => {
    if (React.isValidElement(message)) {
      return message;
    }
    return <span>{message}</span>;
  };

  return (
    <div className={`alert-popup alert-${type}`}>
      <div className="alert-content">
        <div className="alert-icon">
          {type === 'success' ? (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
          )}
        </div>
        <div className="alert-message">
          {renderMessage()}
        </div>
        <button className="alert-close" onClick={onClose}>
          <FiX />
        </button>
      </div>
    </div>
  );
};

  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: '' // 'success' ou 'error'
  });

  const { totalHT, tvaAmount, totalTTC } = calculateTotal();

  if (loading) return <div className="loading-spinner">Chargement...</div>
  
  return (
    <div className={`devis-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* En-tête avec statistiques */}
      <div className="dashboard-header">
        <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 style={{ margin: 0 }}>Mes Devis</h1>
          <div className="action-bar">
            <button onClick={handleAddDevis} className="primary-button">
              <FiPlus /> Nouveau devis
            </button>
          </div>
        </div>
        
      </div>

      {/* Liste des devis sous forme de cartes */}
      <div className="devis-grid">
        {devis.map(item => (
          <div key={item.id} className={`devis-card ${getStatusColor(item.statut)}`}>
            <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFileText className="devis-icon" /> {/* Icône ajoutée ici */}
          <h3>Devis</h3>
        </div>
        <span className="status-badge">{item.statut}</span>
      </div>
            
            <div className="card-client">{item.client_name || '----'}</div>
            
            <div className="card-dates">
              <div>
                <small>Créé le</small>
                <p>{new Date(item.date_creation).toLocaleDateString()}</p>
              </div>
              <div>
                <small>Validité</small>
                <p>{item.date_validite ? new Date(item.date_validite).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            
            <div className="card-amount">
              <div>
                <small>Montant TTC</small>
                <p>{typeof item.montant_ttc === 'number' ? item.montant_ttc.toFixed(2) : '0.00'} DT</p>
              </div>
            </div>
            
            <div className="card-actions">
              <button onClick={() => handleViewDevis(item)} title="Voir">
                <FiEye />
              </button>
              {item.statut === 'accepté' && (
                <button onClick={() => handleGenerateFacture(item)} title="Générer facture">
                  <FiFileText />
                </button>
              )}
              <button onClick={() => handleEditDevis(item)} title="Modifier">
                <FiEdit2 />
              </button>
              <button onClick={() => handleDeleteDevis(item.id)} title="Supprimer">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création/édition de devis */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentDevis ? 'Modifier Devis' : 'Nouveau Devis'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="devis-form">
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-grid">
                <div className="form-section">
                  <h4>Informations générales</h4>
                  <div className="form-group">
                    <label>Numéro*</label>
                    <input 
                      type="text" 
                      name="numero" 
                      value={formData.numero} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date de création*</label>
                      <input 
                        type="date" 
                        name="date_creation" 
                        value={formData.date_creation} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Date de validité</label>
                      <input 
                        type="date" 
                        name="date_validite" 
                        value={formData.date_validite} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Client*</label>
                    <input 
                      type="text" 
                      name="client_name" 
                      value={formData.client_name} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h4>Paramètres</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Remise (%)</label>
                      <input 
                        type="number" 
                        name="remise" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        value={formData.remise} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>TVA (%)</label>
                      <input 
                        type="number" 
                        name="tva" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        value={formData.tva} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Statut</label>
                      <select 
                        name="statut" 
                        value={formData.statut} 
                        onChange={handleInputChange}
                      >
                        <option value="brouillon">Brouillon</option>
                        <option value="envoyé">Envoyé</option>
                        <option value="accepté">Accepté</option>
                        <option value="refusé">Refusé</option>
                        <option value="payé">Payé</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <h4>Lignes de devis</h4>
                  <button type="button" className="add-line" onClick={addLigne}>
                    <FiPlus /> Ajouter une ligne
                  </button>
                </div>
                
                <div className="lignes-container">
                  {formData.lignes.map((ligne, index) => (
                    <div key={index} className="ligne-devis">
                      <div className="form-group">
                        <label>Description*</label>
                        <input
                          type="text"
                          name="description"
                          value={ligne.description}
                          onChange={(e) => handleLigneChange(index, e)}
                          required
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Prix unitaire HT*</label>
                          <input
                            type="number"
                            name="prix_unitaire_ht"
                            min="0"
                            step="0.01"
                            value={ligne.prix_unitaire_ht}
                            onChange={(e) => handleLigneChange(index, e)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Quantité*</label>
                          <input
                            type="number"
                            name="quantite"
                            min="1"
                            step="1"
                            value={ligne.quantite}
                            onChange={(e) => handleLigneChange(index, e)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Unité</label>
                          <select
                            name="unite"
                            value={ligne.unite}
                            onChange={(e) => handleLigneChange(index, e)}
                          >
                            <option value="unité">Unité</option>
                            <option value="heure">Heure</option>
                            <option value="jour">Jour</option>
                            <option value="mois">Mois</option>
                            <option value="kg">Kilogramme</option>
                            <option value="m">Mètre</option>
                          </select>
                        </div>
                        
                        {formData.lignes.length > 1 && (
                          <button 
                            type="button" 
                            className="remove-line" 
                            onClick={() => removeLigne(index)}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="totals-section">
                <div className="total-item">
                  <span>Total HT:</span>
                  <span>{totalHT} DT</span>
                </div>
                <div className="total-item">
                  <span>Remise ({formData.remise}%):</span>
                  <span>-{(totalHT * formData.remise / 100).toFixed(2)} DT</span>
                </div>
                <div className="total-item">
                  <span>TVA ({formData.tva}%):</span>
                  <span>{tvaAmount} DT</span>
                </div>
                <div className="total-item total-ttc">
                  <span>Total TTC:</span>
                  <span>{totalTTC} DT</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  {currentDevis ? 'Mettre à jour' : 'Créer le devis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal des suggestions IA */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal-content ai-suggestions">
            <h3>Suggestions de l'IA</h3>
            <ul>
              {aiSuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button onClick={() => setShowAIModal(false)} className="cancel-btn">
                Annuler
              </button>
              <button onClick={confirmAfterAISuggestions} className="submit-btn">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfModalOpen && (
        <div style={pdfModalStyle.overlay}>
          <div style={pdfModalStyle.content}>
            <div style={pdfModalStyle.header}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Devis {currentPdfDevis?.numero}
              </h3>
              <button 
                onClick={() => {
                  setPdfModalOpen(false);
                  setPdfUrl(null);
                }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#64748b'
                }}
              >
                <FiX />
              </button>
            </div>
            
            <div style={pdfModalStyle.body}>
              {pdfUrl ? (
                <iframe 
                  src={pdfUrl}
                  title={`Devis ${currentPdfDevis?.numero}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  frameBorder="0"
                />
              ) : (
                <div style={pdfModalStyle.loading}>
                  <p>Chargement du PDF en cours...</p>
                </div>
              )}
            </div>
            
            <div style={pdfModalStyle.footer}>
              <button 
                style={{ ...pdfModalStyle.button, ...pdfModalStyle.secondaryButton }}
                onClick={() => window.print()}
              >
                <FiPrinter /> Imprimer
              </button>
              <a
                href={pdfUrl || '#'}
                download={`devis-${currentPdfDevis?.numero}.pdf`}
                style={{ 
                  ...pdfModalStyle.button, 
                  ...pdfModalStyle.primaryButton,
                  textDecoration: 'none'
                }}
                onClick={(e) => !pdfUrl && e.preventDefault()}
              >
                <FiDownload /> Télécharger
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Ajoutez ceci juste avant la fermeture de la div principale */}
    {alert.show && (
      <Alert 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert({...alert, show: false})} 
      />
    )}
    </div>
  );
};

export default Devis; 