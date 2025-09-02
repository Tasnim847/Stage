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
  // Check user preference or localStorage
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
    montant_ht: 0, // Added
    montant_ttc: 0, // Added
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

  const getToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  };

  const handleSessionExpired = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    navigate('/', { state: { sessionExpired: true } });
  };

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        console.warn('No token in localStorage or sessionStorage');
        handleSessionExpired();
        return;
      }

      const response = await axios.get('http://localhost:5000/api/devis', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const formattedDevis = response.data.data.map(devis => ({
        ...devis,
        montant_ht: parseFloat(devis.montant_ht) || 0,
        montant_ttc: parseFloat(devis.montant_ttc) || 0
      }));

      setDevis(formattedDevis || []);

    } catch (error) {
      console.error('Error during fetchDevis:', error.response || error);
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        setError(error.response?.data?.message || 'Error loading quotes');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = getToken();
    if (!token) handleSessionExpired();
  };

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
    console.log('Quote to edit:', devis);
  
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
      lignes: devis.lignesDevis?.length > 0 ? devis.lignesDevis.map(line => ({
          id: line.id,
          description: line.description,
          prix_unitaire_ht: line.prix_unitaire_ht,
          quantite: line.quantite,
          unite: line.unite || 'unité'
      })) : devis.lignes?.length > 0 ? devis.lignes.map(line => ({
          id: line.id,
          description: line.description,
          prix_unitaire_ht: line.prix_unitaire_ht,
          quantite: line.quantite,
          unite: line.unite || 'unité'
      })) : [{
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

  const generateAISuggestion = () => {
    const { statut, date_validite, lignes } = formData;
    const today = new Date();
    const validiteDate = date_validite ? new Date(date_validite) : null;
    
    let suggestions = [];

    if (statut === 'brouillon') {
      suggestions.push("This quote is still in draft. Remember to finalize and send it to the client.");
    } else if (statut === 'envoyé') {
      suggestions.push("The quote has been sent to the client. Consider following up in a few days.");
    }

    if (validiteDate && validiteDate < today) {
      suggestions.push("Warning! The validity date of this quote has expired. Remember to update it.");
    } else if (validiteDate) {
      const daysLeft = Math.floor((validiteDate - today) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        suggestions.push(`The quote expires in ${daysLeft} day(s). Consider reminding the client.`);
      }
    }

    if (lignes.length === 0) {
      suggestions.push("You haven't added any lines to this quote. Add products or services.");
    } else if (lignes.some(l => l.prix_unitaire_ht === 0)) {
      suggestions.push("Some items have a unit price of 0DT. Check the prices.");
    }

    if (suggestions.length === 0) {
      suggestions.push("Everything seems in order with this quote. Remember to send it to the client if not already done.");
    }

    return suggestions;
  };

  const submitDevis = async () => {
    const totals = calculateTotal();
    const token = getToken();
    const dataToSend = {
        ...formData,
        remise: parseFloat(formData.remise) || 0,
        tva: parseFloat(formData.tva) || 20,
        montant_ht: totals.montant_ht,
        montant_ttc: totals.montant_ttc,
        lignes: formData.lignes.map(l => ({
            id: l.id,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      checkAuth();
      
      if (!formData.numero) throw new Error('Quote number is required');
      if (!formData.client_name) throw new Error('Client is required');
      if (formData.lignes.some(l => !l.description)) {
        throw new Error('All lines must have a description');
      }

      const suggestions = generateAISuggestion();
      setAiSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        setShowAIModal(true);
      } else {
        const response = await submitDevis();
        if (response.data?.success) {
          await fetchDevis();
          setShowModal(false);
          setAlert({
            show: true,
            message: currentDevis 
            ? 'Quote updated successfully' 
            : 'Quote created successfully',
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
      console.error('Quote submission error:', error);
      setError(error.response?.data?.message || error.message);
    }
  };

  const confirmAfterAISuggestions = async () => {
    setShowAIModal(false);
    try {
      const response = await submitDevis();
      if (response.data?.success) {
        await fetchDevis();
        setShowModal(false);
      } else {
        throw new Error(response.data?.message || 'Error during submission');
      }
    } catch (error) {
      console.error('Quote submission error:', error);
      setError(error.response?.data?.message || error.message);
    }
  };

  const handleDeleteDevis = async (id) => {
    if (!window.confirm('Confirm deletion?')) return;
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/devis/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDevis();
      setAlert({
        show: true,
        message: 'Quote deleted successfully',
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
    console.log('Printing:', devis);
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
        setCurrentPdfDevis(devis);
        setPdfModalOpen(true);
    } catch (error) {
        console.error("Error:", error);
        alert("Error loading PDF");
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

      const isConfirmed = window.confirm(`Convertir le devis ${devis.numero} en facture ?`);
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
          message: `Facture ${response.data.data.numero} générée avec succès à partir du devis ${devis.numero}`,
          type: 'success'
        });
      
        // Actualiser la liste des devis
        await fetchDevis();
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
    type: ''
  });

  const { totalHT, tvaAmount, totalTTC } = calculateTotal();

  if (loading) return <div className="loading-spinner">Loading...</div>
  
  return (
    <div className={`devis-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with statistics */}
      <div className="dashboard-header">
        <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 style={{ margin: 0 }}>My Quotes</h1>
          <div className="action-bar">
            <button onClick={handleAddDevis} className="primary-button">
              <FiPlus /> New quote
            </button>
          </div>
        </div>
      </div>

      {/* List of quotes as cards */}
      <div className="devis-grid">
        {devis.map(item => (
          <div key={item.id} className={`devis-card ${getStatusColor(item.statut)}`}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiFileText className="devis-icon" />
                <h3>Quote</h3>
              </div>
              <span className="status-badge">{item.statut}</span>
            </div>
            
            <div className="card-client">{item.client_name || '----'}</div>
            
            <div className="card-dates">
              <div>
                <small>Created on</small>
                <p>{new Date(item.date_creation).toLocaleDateString()}</p>
              </div>
              <div>
                <small>Validity</small>
                <p>{item.date_validite ? new Date(item.date_validite).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            
            <div className="card-amount">
              <div>
                <small>Total TTC</small>
                <p>{typeof item.montant_ttc === 'number' ? item.montant_ttc.toFixed(2) : '0.00'} TND</p>
              </div>
            </div>
            
            <div className="card-actions">
              <button onClick={() => handleViewDevis(item)} title="View">
                <FiEye />
              </button>
              {item.statut === 'accepté' && (
                <button onClick={() => handleGenerateFacture(item)} title="Generate invoice">
                  <FiFileText />
                </button>
              )}
              <button onClick={() => handleEditDevis(item)} title="Edit">
                <FiEdit2 />
              </button>
              <button onClick={() => handleDeleteDevis(item.id)} title="Delete">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/edit quote modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentDevis ? 'Edit Quote' : 'New Quote'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="devis-form">
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-grid">
                <div className="form-section">
                  <h4>General information</h4>
                  <div className="form-group">
                    <label>Number*</label>
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
                      <label>Creation date*</label>
                      <input 
                        type="date" 
                        name="date_creation" 
                        value={formData.date_creation} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Validity date</label>
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
                  <h4>Settings</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount (%)</label>
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
                      <label>VAT (%)</label>
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
                      <label>Status</label>
                      <select 
                        name="statut" 
                        value={formData.statut} 
                        onChange={handleInputChange}
                      >
                        <option value="brouillon">Draft</option>
                        <option value="envoyé">Sent</option>
                        <option value="accepté">Accepted</option>
                        <option value="refusé">Rejected</option>
                        <option value="payé">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <h4>Quote lines</h4>
                  <button type="button" className="add-line" onClick={addLigne}>
                    <FiPlus /> Add a line
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
                          <label>Unit price HT*</label>
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
                          <label>Quantity*</label>
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
                          <label>Unit</label>
                          <select
                            name="unite"
                            value={ligne.unite}
                            onChange={(e) => handleLigneChange(index, e)}
                          >
                            <option value="unité">Unit</option>
                            <option value="heure">Hour</option>
                            <option value="jour">Day</option>
                            <option value="mois">Month</option>
                            <option value="kg">Kilogram</option>
                            <option value="m">Meter</option>
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
                  <span>{totalHT} TND</span>
                </div>
                <div className="total-item">
                  <span>Discount ({formData.remise}%):</span>
                  <span>-{(totalHT * formData.remise / 100).toFixed(2)} TND</span>
                </div>
                <div className="total-item">
                  <span>VAT ({formData.tva}%):</span>
                  <span>{tvaAmount} TND</span>
                </div>
                <div className="total-item total-ttc">
                  <span>Total TTC:</span>
                  <span>{totalTTC} TND</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {currentDevis ? 'Update' : 'Create quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI suggestions modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal-content ai-suggestions">
            <h3>AI Suggestions</h3>
            <ul>
              {aiSuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button onClick={() => setShowAIModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmAfterAISuggestions} className="submit-btn">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF modal */}
      {pdfModalOpen && (
        <div style={pdfModalStyle.overlay}>
          <div style={pdfModalStyle.content}>
            <div style={pdfModalStyle.header}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Quote {currentPdfDevis?.numero}
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
                  title={`Quote ${currentPdfDevis?.numero}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  frameBorder="0"
                />
              ) : (
                <div style={pdfModalStyle.loading}>
                  <p>Loading PDF...</p>
                </div>
              )}
            </div>
            
            <div style={pdfModalStyle.footer}>
              <button 
                style={{ ...pdfModalStyle.button, ...pdfModalStyle.secondaryButton }}
                onClick={() => window.print()}
              >
                <FiPrinter /> Print
              </button>
              <a
                href={pdfUrl || '#'}
                download={`quote-${currentPdfDevis?.numero}.pdf`}
                style={{ 
                  ...pdfModalStyle.button, 
                  ...pdfModalStyle.primaryButton,
                  textDecoration: 'none'
                }}
                onClick={(e) => !pdfUrl && e.preventDefault()}
              >
                <FiDownload /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add this just before closing the main div */}
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