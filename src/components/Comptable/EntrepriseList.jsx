import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiLoader } from 'react-icons/fi';
import './comptable.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EntrepriseList = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState(null);
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

    // Vérification que l'ID existe bien en mode édition
    if (editingEntreprise && !editingEntreprise.id) {
      throw new Error('ID entreprise manquant pour la modification');
    }

    const url = editingEntreprise 
      ? `http://localhost:5000/api/entreprises/${editingEntreprise.id}`
      : 'http://localhost:5000/api/entreprises';

    const method = editingEntreprise ? 'PUT' : 'POST';

    console.log('Envoi requête:', { 
      url, 
      method, 
      editingId: editingEntreprise?.id,
      body: {
        ...newEntreprise,
        telephone: newEntreprise.telephone || null
      } 
    });

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

    // Gestion spécifique des erreurs 404
    if (response.status === 404) {
      throw new Error('Entreprise non trouvée (404) - Actualisez la liste');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    // Mise à jour de l'état
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
    console.error("Erreur détaillée:", error);
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
    console.log('Modification entreprise:', entreprise);
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
        <button 
          className="add-button"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          <FiPlus /> Ajouter
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          if (!isSubmitting) {
            setShowAddModal(false);
            setEditingEntreprise(null);
            resetForm();
          }
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEntreprise ? 'Modifier Entreprise' : 'Nouvelle Entreprise'}</h3>
              <button
                className="close-button"
                onClick={() => {
                  if (!isSubmitting) {
                    setShowAddModal(false);
                    setEditingEntreprise(null);
                    resetForm();
                  }
                }}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {['nom', 'email', 'adresse', 'telephone', 'numeroIdentificationFiscale', 'motDePasse'].map((field) => (
                <div className="form-group" key={field}>
                  <label>
                    {field === 'motDePasse' ? 'Mot de passe *' : 
                     field === 'numeroIdentificationFiscale' ? 'NIF *' :
                     field.charAt(0).toUpperCase() + field.slice(1) + (['nom', 'email', 'adresse'].includes(field) ? ' *' : '')}
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
                  />
                  {formErrors[field] && <span className="error-message">{formErrors[field]}</span>}
                </div>
              ))}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntreprise(null);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="spinner" />
                      {editingEntreprise ? 'Modification...' : 'Création...'}
                    </>
                  ) : editingEntreprise ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {entreprises.length === 0 ? (
        <div className="empty-state">
          <p>Aucune entreprise enregistrée</p>
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Ajouter une entreprise
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="entreprise-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Adresse</th>
                <th>Téléphone</th>
                <th>NIF</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map(entreprise => (
                <tr key={entreprise.id}>
                  <td>{entreprise.nom}</td>
                  <td>{entreprise.email}</td>
                  <td>{entreprise.adresse}</td>
                  <td>{entreprise.telephone || '-'}</td>
                  <td>{entreprise.numeroIdentificationFiscale}</td>
                  <td className="actions">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EntrepriseList;