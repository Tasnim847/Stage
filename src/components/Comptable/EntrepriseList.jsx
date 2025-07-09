import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiLoader, FiSearch, FiExternalLink, FiX } from 'react-icons/fi';
import './comptable.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EntrepriseList = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntreprise, setNewEntreprise] = useState({
    nom: '',
    email: '',
    adresse: '',
    telephone: '',
    numeroIdentificationFiscale: '',
    motDePasse: 'NIF******'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/entreprises/comptable', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur de récupération des entreprises');
        }

        const data = await response.json();
        setEntreprises(data);
      } catch (error) {
        console.error("Erreur:", error);
        setError(error.message);
        
        if (error.message.includes('authentification') || error.message.includes('token')) {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { state: { error: 'Session expirée. Veuillez vous reconnecter.' } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntreprises();
  }, [navigate]);

  const filteredEntreprises = entreprises.filter(entreprise =>
    Object.values(entreprise).some(
      value => typeof value === 'string' && 
      value.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntreprise(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nifRegex = /^[A-Za-z0-9]{8,15}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!newEntreprise.nom.trim()) errors.nom = 'Le nom est requis';
    if (!newEntreprise.email) {
      errors.email = 'Email requis';
    } else if (!emailRegex.test(newEntreprise.email)) {
      errors.email = 'Email invalide';
    }
    if (!newEntreprise.adresse.trim()) errors.adresse = 'Adresse requise';
    if (!newEntreprise.numeroIdentificationFiscale) {
      errors.numeroIdentificationFiscale = 'NIF requis';
    } else if (!nifRegex.test(newEntreprise.numeroIdentificationFiscale)) {
      errors.numeroIdentificationFiscale = 'Format NIF invalide';
    }
    
    if (!editingEntreprise && !newEntreprise.motDePasse) {
      errors.motDePasse = 'Mot de passe requis';
    } else if (newEntreprise.motDePasse && !passwordRegex.test(newEntreprise.motDePasse)) {
      errors.motDePasse = '8 caractères minimum avec chiffres et lettres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/login');
        return;
      }

      const url = editingEntreprise 
        ? `http://localhost:5000/api/entreprises/${editingEntreprise.id}`
        : 'http://localhost:5000/api/entreprises';

      const method = editingEntreprise ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: newEntreprise.nom,
          email: newEntreprise.email,
          adresse: newEntreprise.adresse,
          telephone: newEntreprise.telephone || null,
          numeroIdentificationFiscale: newEntreprise.numeroIdentificationFiscale,
          ...(newEntreprise.motDePasse && { motDePasse: newEntreprise.motDePasse })
        })
      });

      if (response.status === 404) {
        throw new Error('Entreprise non trouvée (404) - Actualisez la liste');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      setEntreprises(prev => 
        editingEntreprise 
          ? prev.map(e => e.id === editingEntreprise.id ? data.entreprise : e)
          : [...prev, data.entreprise]
      );

      toast.success(
        editingEntreprise 
          ? 'Entreprise modifiée avec succès!' 
          : 'Entreprise créée avec succès!',
        { position: "top-center", autoClose: 3000 }
      );

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error.message.includes('404') 
          ? 'Entreprise introuvable - Actualisez la liste et réessayez'
          : error.message || 'Erreur lors de la requête',
        { position: "top-center" }
      );
    } finally {
      setIsSubmitting(false);
      setEditingEntreprise(null);
    }
  };

  const resetForm = () => {
    setNewEntreprise({
      nom: '',
      email: '',
      adresse: '',
      telephone: '',
      numeroIdentificationFiscale: '',
      motDePasse: 'NIF******'
    });
    setFormErrors({});
    setEditingEntreprise(null);
  };

  const handleEdit = (entreprise) => {
    setEditingEntreprise(entreprise);
    setNewEntreprise({
      nom: entreprise.nom,
      email: entreprise.email,
      adresse: entreprise.adresse,
      telephone: entreprise.telephone || '',
      numeroIdentificationFiscale: entreprise.numeroIdentificationFiscale,
      motDePasse: ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (entrepriseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/entreprises/${entrepriseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setEntreprises(prev => prev.filter(e => e.id !== entrepriseId));
      toast.success('Entreprise supprimée avec succès', {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.message || 'Erreur lors de la suppression', {
        position: "top-center",
      });
    }
  };

  const openDetailModal = (entreprise) => {
    setSelectedEntreprise(entreprise);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FiLoader className="spinner" />
        <p>Chargement en cours...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            navigate('/login');
          }}
          className="error-button"
        >
          Se reconnecter
        </button>
      </div>
    );
  }

  return (
    <div className="entreprise-container">
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="header-section">
        <h2>Gestion des Entreprises</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
          >
            <FiPlus /> Ajouter
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEntreprise ? 'Modifier Entreprise' : 'Nouvelle Entreprise'}</h3>
              <button
                className="modal-close-btn"
                onClick={() => !isSubmitting && setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {['nom', 'email', 'adresse', 'telephone', 'numeroIdentificationFiscale', 'motDePasse'].map((field) => (
                  <div className="form-group" key={field}>
                    <label>
                      {field === 'motDePasse' ? 'Mot de passe' : 
                       field === 'numeroIdentificationFiscale' ? 'NIF' :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                      {['nom', 'email', 'adresse', 'numeroIdentificationFiscale'].includes(field) && ' *'}
                    </label>
                    <input
                      type={field === 'motDePasse' ? 'password' : 
                            field === 'email' ? 'email' : 
                            field === 'telephone' ? 'tel' : 'text'}
                      name={field}
                      value={newEntreprise[field]}
                      onChange={handleInputChange}
                      className={formErrors[field] ? 'error' : ''}
                      disabled={isSubmitting}
                      placeholder={
                        field === 'motDePasse' ? 'Laisser vide pour ne pas modifier' :
                        field === 'telephone' ? 'Optionnel' : ''
                      }
                    />
                    {formErrors[field] && <span className="error-message">{formErrors[field]}</span>}
                  </div>
                ))}
              </form>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="spinner" size={16} />
                    {editingEntreprise ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : editingEntreprise ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedEntreprise && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de l'entreprise</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-container">
                <div className="detail-logo">
                  {selectedEntreprise.nom.charAt(0).toUpperCase()}
                </div>
                <h4>{selectedEntreprise.nom}</h4>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedEntreprise.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Adresse:</span>
                    <span className="detail-value">{selectedEntreprise.adresse}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Téléphone:</span>
                    <span className="detail-value">{selectedEntreprise.telephone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">NIF:</span>
                    <span className="detail-value">{selectedEntreprise.numeroIdentificationFiscale}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Statut:</span>
                    <span className="detail-value status-active">Actif</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date de création:</span>
                    <span className="detail-value">
                      {new Date(selectedEntreprise.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={() => setShowDetailModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredEntreprises.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <p>Aucune entreprise trouvée pour "{searchTerm}"</p>
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                Effacer la recherche
              </button>
            </>
          ) : (
            <>
              <p>Aucune entreprise enregistrée</p>
              <button className="add-button" onClick={() => setShowAddModal(true)}>
                <FiPlus /> Ajouter une entreprise
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="entreprise-cards">
          {filteredEntreprises.map(entreprise => (
            <div className="entreprise-card" key={entreprise.id}>
              <div className="card-gradient"></div>
              <div className="card-header">
                <div className="company-logo">
                  {entreprise.nom.charAt(0).toUpperCase()}
                </div>
                <div className="company-info">
                  <h3>{entreprise.nom}</h3>
                  <span className="company-id">ID: {entreprise.numeroIdentificationFiscale}</span>
                </div>
                <div className="card-actions">
                  <button 
                    className="edit-btn" 
                    title="Modifier"
                    onClick={() => handleEdit(entreprise)}
                  >
                    <FiEdit2 />
                  </button>
                  <button 
                    className="delete-btn" 
                    title="Supprimer"
                    onClick={() => handleDelete(entreprise.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{entreprise.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Adresse</span>
                    <span className="info-value">{entreprise.adresse}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Téléphone</span>
                    <span className="info-value">{entreprise.telephone || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Statut</span>
                    <span className="info-value status-active">Actif</span>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <span className="last-update">
                  Créé le: {new Date(entreprise.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <button 
                  className="details-btn"
                  onClick={() => openDetailModal(entreprise)}
                >
                  <FiExternalLink /> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntrepriseList;