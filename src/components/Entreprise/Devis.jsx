import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiPrinter, FiEye, FiDownload } from 'react-icons/fi';
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
  const [formData, setFormData] = useState({
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

      setDevis(response.data.data || []);
      setError(null);
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
    const totalHT = formData.lignes.reduce((sum, ligne) => sum + (ligne.prix_unitaire_ht * ligne.quantite), 0);
    const remiseAmount = totalHT * (formData.remise / 100);
    const totalAfterRemise = totalHT - remiseAmount;
    const tvaAmount = totalAfterRemise * (formData.tva / 100);
    const totalTTC = totalAfterRemise + tvaAmount;
    return {
      totalHT: totalHT.toFixed(2),
      tvaAmount: tvaAmount.toFixed(2),
      totalTTC: totalTTC.toFixed(2)
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
      suggestions.push("Certains articles ont un prix unitaire à 0€. Vérifiez les tarifs.");
    }

    // Si pas de suggestions spécifiques
    if (suggestions.length === 0) {
      suggestions.push("Tout semble en ordre avec ce devis. Pensez à l'envoyer au client si ce n'est pas déjà fait.");
    }

    return suggestions;
  };

  // Fonction pour soumettre le devis
  const submitDevis = async () => {
    const token = getToken();
    const dataToSend = {
      ...formData,
      remise: parseFloat(formData.remise) || 0,
      tva: parseFloat(formData.tva) || 20,
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
        } else {
          throw new Error(response.data?.message || 'Erreur lors de la soumission');
        }
      }
    } catch (error) {
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
    } catch (error) {
      setError(error.response?.data?.message || error.message);
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

  const { totalHT, tvaAmount, totalTTC } = calculateTotal();

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="devis-container">
      <h2>Gestion des Devis</h2>
      <button onClick={handleAddDevis} className="btn-add">
        <FiPlus /> Ajouter un devis
      </button>

      {error && <div className="error-message">{error}</div>}

      <table className="devis-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Client</th>
            <th>Date</th>
            <th>Valide jusqu'à</th>
            <th>Montant HT</th>
            <th>TVA</th>
            <th>Montant TTC</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {devis.map(item => (
            <tr key={item.id}>
              <td>{item.numero}</td>
              <td>{item.client_name || '----'}</td>
              <td>{new Date(item.date_creation).toLocaleDateString()}</td>
              <td>{item.date_validite ? new Date(item.date_validite).toLocaleDateString() : 'N/A'}</td>
              <td>{item.montant_ht?.toFixed(2)} €</td>
              <td>{item.tva} %</td>
              <td>{item.montant_ttc?.toFixed(2)} €</td>
              <td>
                <span className={`status-badge ${getStatusColor(item.statut)}`}>
  {item.statut} {/* Correction ici */}
</span>
              </td>
              <td className="actions">
                <button onClick={() => handleViewDevis(item)} className="btn-icon">
                  <FiEye />
                </button>
                <button onClick={() => handlePrintDevis(item)} className="btn-icon">
                  <FiPrinter />
                </button>
                <button onClick={() => handleEditDevis(item)} className="btn-icon">
                  <FiEdit2 />
                </button>
                <button onClick={() => handleDeleteDevis(item.id)} className="btn-icon">
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
                  <span>{totalHT} €</span>
                </div>
                <div className="total-item">
                  <span>Remise ({formData.remise}%):</span>
                  <span>-{(totalHT * formData.remise / 100).toFixed(2)} €</span>
                </div>
                <div className="total-item">
                  <span>TVA ({formData.tva}%):</span>
                  <span>{tvaAmount} €</span>
                </div>
                <div className="total-item total-ttc">
                  <span>Total TTC:</span>
                  <span>{totalTTC} €</span>
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
    </div>
  );
};

export default Devis;