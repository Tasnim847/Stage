import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiLoader, FiSearch, FiExternalLink, FiX, FiUser, FiDollarSign } from 'react-icons/fi';
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

  // Fonction pour générer des couleurs uniques basées sur le nom
  const getColorFromName = (name) => {
    if (!name) return '#72ac8d';
    const colors = ['#72ac8d', '#4c9f70', '#3d8b63', '#2e7656', '#1f6249'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f8fafc'
      }}>
        <FiLoader className="spinner" size={32} style={{ animation: 'spin 1s linear infinite', color: '#72ac8d' }} />
        <p style={{ marginTop: '1rem', color: '#4a5568' }}>Chargement en cours...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f8fafc',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h3 style={{ color: '#f72585', marginBottom: '1rem' }}>Erreur</h3>
          <p style={{ color: '#4a5568', marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              navigate('/login');
            }}
            style={{
              background: '#f72585',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.3s',
              ':hover': {
                background: '#e5177b'
              }
            }}
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto',
      padding: '2rem 1rem',
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.8rem', 
            fontWeight: '600',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiUser size={24} /> Gestion des Entreprises
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#718096', fontSize: '0.95rem' }}>
            {entreprises.length} entreprise{entreprises.length !== 1 ? 's' : ''} enregistrée{entreprises.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FiSearch style={{ 
              position: 'absolute', 
              left: '1rem', 
              color: '#a0aec0' 
            }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '280px',
                fontSize: '0.95rem',
                transition: 'all 0.3s',
                outline: 'none',
                ':focus': {
                  borderColor: '#72ac8d',
                  boxShadow: '0 0 0 3px rgba(114, 172, 141, 0.1)'
                }
              }}
            />
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#72ac8d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.3s',
              ':hover': {
                background: '#5d9979'
              }
            }}
          >
            <FiPlus /> Ajouter
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #72ac8d, #5d9979)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          textAlign: 'left',
          height: '100%',
          boxShadow: '0 4px 12px rgba(114, 172, 141, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiUser size={20} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Total Entreprises</span>
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: '700',
            lineHeight: '1.2'
          }}>
            {entreprises.length}
          </p>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #4c9f70, #3d8b63)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          textAlign: 'left',
          height: '100%',
          boxShadow: '0 4px 12px rgba(76, 159, 112, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiDollarSign size={20} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Entreprises Actives</span>
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: '700',
            lineHeight: '1.2'
          }}>
            {entreprises.filter(e => e.statut === 'active').length}
          </p>
        </div>
      </div>

      {/* Liste des entreprises */}
      {filteredEntreprises.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ 
            color: '#718096', 
            marginBottom: '1.5rem',
            fontSize: '1.1rem'
          }}>
            {searchTerm ? `Aucune entreprise trouvée pour "${searchTerm}"` : 'Aucune entreprise enregistrée'}
          </p>
          {searchTerm ? (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.3s',
                ':hover': {
                  borderColor: '#72ac8d',
                  color: '#72ac8d'
                }
              }}
            >
              Effacer la recherche
            </button>
          ) : (
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#72ac8d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.3s',
                ':hover': {
                  background: '#5d9979'
                }
              }}
            >
              <FiPlus /> Ajouter une entreprise
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredEntreprises.map(entreprise => (
            <div 
              key={entreprise.id} 
              style={{ 
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                ':hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <div style={{ 
                height: '6px',
                background: getColorFromName(entreprise.nom)
              }}></div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: getColorFromName(entreprise.nom),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {entreprise.nom.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 0.25rem', 
                      color: '#2d3748',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}>
                      {entreprise.nom}
                    </h3>
                    <span style={{ 
                      fontSize: '0.8rem',
                      color: '#718096',
                      background: '#f7fafc',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      ID: {entreprise.numeroIdentificationFiscale}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(entreprise)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#a0aec0',
                        fontSize: '1rem',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                        ':hover': {
                          background: 'rgba(114, 172, 141, 0.1)',
                          color: '#72ac8d'
                        }
                      }}
                    >
                      <FiEdit2 />
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(entreprise.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#a0aec0',
                        fontSize: '1rem',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                        ':hover': {
                          background: 'rgba(247, 37, 133, 0.1)',
                          color: '#f72585'
                        }
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Email
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: '#4a5568',
                      fontWeight: '500',
                      wordBreak: 'break-word'
                    }}>
                      {entreprise.email}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Adresse
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: '#4a5568',
                      fontWeight: '500',
                      wordBreak: 'break-word'
                    }}>
                      {entreprise.adresse || '-'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Téléphone
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: '#4a5568',
                      fontWeight: '500'
                    }}>
                      {entreprise.telephone || '-'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Statut
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: '#38a169',
                      background: 'rgba(56, 161, 105, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: '500',
                      display: 'inline-block'
                    }}>
                      Actif
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem 1.5rem',
                borderTop: '1px solid #edf2f7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}>
                <span style={{ 
                  fontSize: '0.8rem',
                  color: '#718096'
                }}>
                  Créé le: {new Date(entreprise.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                
                <button 
                  onClick={() => openDetailModal(entreprise)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#72ac8d',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    transition: 'all 0.3s',
                    ':hover': {
                      background: 'rgba(114, 172, 141, 0.1)'
                    }
                  }}
                >
                  <FiExternalLink /> Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#2d3748' }}>
                {editingEntreprise ? 'Modifier Entreprise' : 'Nouvelle Entreprise'}
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a0aec0',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                  ':hover': {
                    color: '#718096'
                  }
                }}
                onClick={() => !isSubmitting && setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <FiX />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleSubmit}>
                {['nom', 'email', 'adresse', 'telephone', 'numeroIdentificationFiscale', 'motDePasse'].map((field) => (
                  <div key={field} style={{ marginBottom: '1.25rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#4a5568'
                    }}>
                      {field === 'motDePasse' ? 'Mot de passe' : 
                       field === 'numeroIdentificationFiscale' ? 'NIF' :
                       field.charAt(0).toUpperCase() + field.slice(1)}
                      {['nom', 'email', 'adresse', 'numeroIdentificationFiscale'].includes(field) && (
                        <span style={{ color: '#f56565', marginLeft: '0.25rem' }}>*</span>
                      )}
                    </label>
                    <input
                      type={field === 'motDePasse' ? 'password' : 
                            field === 'email' ? 'email' : 
                            field === 'telephone' ? 'tel' : 'text'}
                      name={field}
                      value={newEntreprise[field]}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: formErrors[field] ? '1px solid #f56565' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s',
                        outline: 'none',
                        ':focus': {
                          borderColor: formErrors[field] ? '#f56565' : '#72ac8d',
                          boxShadow: formErrors[field] 
                            ? '0 0 0 3px rgba(245, 101, 101, 0.1)' 
                            : '0 0 0 3px rgba(114, 172, 141, 0.1)'
                        }
                      }}
                      disabled={isSubmitting}
                      placeholder={
                        field === 'motDePasse' ? 'Laisser vide pour ne pas modifier' :
                        field === 'telephone' ? 'Optionnel' : ''
                      }
                    />
                    {formErrors[field] && (
                      <span style={{
                        display: 'block',
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#f56565'
                      }}>
                        {formErrors[field]}
                      </span>
                    )}
                  </div>
                ))}
              </form>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button 
                type="button" 
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#4a5568',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  ':hover': {
                    borderColor: '#a0aec0'
                  },
                  ':disabled': {
                    opacity: 0.7,
                    cursor: 'not-allowed'
                  }
                }}
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  background: '#72ac8d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  ':hover': {
                    background: '#5d9979'
                  },
                  ':disabled': {
                    background: '#a0aec0',
                    cursor: 'not-allowed'
                  }
                }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    {editingEntreprise ? 'Enregistrement...' : 'Création...'}
                  </>
                ) : editingEntreprise ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedEntreprise && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowDetailModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#2d3748' }}>
                Détails de l'entreprise
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a0aec0',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                  ':hover': {
                    color: '#718096'
                  }
                }}
                onClick={() => setShowDetailModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  background: getColorFromName(selectedEntreprise.nom),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem'
                }}>
                  {selectedEntreprise.nom.charAt(0).toUpperCase()}
                </div>
                <h4 style={{ 
                  margin: '0 0 0.25rem', 
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#2d3748',
                  textAlign: 'center'
                }}>
                  {selectedEntreprise.nom}
                </h4>
                <span style={{ 
                  fontSize: '0.9rem',
                  color: '#718096',
                  background: '#f7fafc',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  display: 'inline-block'
                }}>
                  ID: {selectedEntreprise.numeroIdentificationFiscale}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1.25rem'
              }}>
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Email
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: '#4a5568',
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {selectedEntreprise.email}
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Adresse
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: '#4a5568',
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {selectedEntreprise.adresse || '-'}
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Téléphone
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: '#4a5568',
                    fontWeight: '500'
                  }}>
                    {selectedEntreprise.telephone || '-'}
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Statut
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: '#38a169',
                    background: 'rgba(56, 161, 105, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}>
                    Actif
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Date de création
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: '#4a5568',
                    fontWeight: '500'
                  }}>
                    {new Date(selectedEntreprise.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button 
                type="button" 
                style={{
                  background: '#72ac8d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  ':hover': {
                    background: '#5d9979'
                  }
                }}
                onClick={() => setShowDetailModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrepriseList;