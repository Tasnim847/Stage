import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiLoader, FiSearch, FiExternalLink, FiX, FiUser, FiDollarSign } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './comptable.css';

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
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Vérifier le thème au chargement
  useEffect(() => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    setDarkMode(isDarkMode);
  }, []);

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
          throw new Error(errorData.message || 'Error fetching businesses');
        }

        const data = await response.json();
        setEntreprises(data);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
        
        if (error.message.includes('authentication') || error.message.includes('token')) {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { state: { error: 'Session expired. Please log in again.' } });
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

    if (!newEntreprise.nom.trim()) errors.nom = 'Name is required';
    if (!newEntreprise.email) {
      errors.email = 'Email required';
    } else if (!emailRegex.test(newEntreprise.email)) {
      errors.email = 'Invalid email';
    }
    if (!newEntreprise.adresse.trim()) errors.adresse = 'Address required';
    if (!newEntreprise.numeroIdentificationFiscale) {
      errors.numeroIdentificationFiscale = 'NIF required';
    } else if (!nifRegex.test(newEntreprise.numeroIdentificationFiscale)) {
      errors.numeroIdentificationFiscale = 'Invalid NIF format';
    }
    
    if (!editingEntreprise && !newEntreprise.motDePasse) {
      errors.motDePasse = 'Password required';
    } else if (newEntreprise.motDePasse && !passwordRegex.test(newEntreprise.motDePasse)) {
      errors.motDePasse = 'Minimum 8 characters with numbers and letters';
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
        toast.error('Session expired, please log in again');
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
        throw new Error('Business not found (404) - Refresh the list');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      setEntreprises(prev => 
        editingEntreprise 
          ? prev.map(e => e.id === editingEntreprise.id ? data.entreprise : e)
          : [...prev, data.entreprise]
      );

      toast.success(
        editingEntreprise 
          ? 'Business updated successfully!' 
          : 'Business created successfully!',
        { position: "top-center", autoClose: 3000 }
      );

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error.message.includes('404') 
          ? 'Business not found - Refresh the list and try again'
          : error.message || 'Request error',
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
    if (!window.confirm('Are you sure you want to delete this business?')) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/entreprises/${entrepriseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error during deletion');
      }

      setEntreprises(prev => prev.filter(e => e.id !== entrepriseId));
      toast.success('Business deleted successfully', {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || 'Error during deletion', {
        position: "top-center",
      });
    }
  };

  const openDetailModal = (entreprise) => {
    setSelectedEntreprise(entreprise);
    setShowDetailModal(true);
  };

  // Function to generate unique colors based on name
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
        background: darkMode ? '#484848' : '#f8fafc'
      }}>
        <FiLoader className="spinner" size={32} style={{ animation: 'spin 1s linear infinite', color: '#72ac8d' }} />
        <p style={{ marginTop: '1rem', color: darkMode ? '#f8f9fa' : '#4a5568' }}>Loading...</p>
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
        background: darkMode ? '#484848' : '#f8fafc',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: darkMode ? '#1e1e1e' : 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h3 style={{ color: '#f72585', marginBottom: '1rem' }}>Error</h3>
          <p style={{ color: darkMode ? '#adb5bd' : '#4a5568', marginBottom: '2rem' }}>{error}</p>
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
            }}
          >
            Log in again
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
      background: darkMode ? '#484848' : '#f8fafc',
      minHeight: '100vh',
      color: darkMode ? '#f8f9fa' : '#212529'
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
            color: darkMode ? '#f8f9fa' : '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiUser size={24} /> Business Management
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: darkMode ? '#adb5bd' : '#718096', fontSize: '0.95rem' }}>
            {entreprises.length} business{entreprises.length !== 1 ? 'es' : ''} registered
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
              placeholder="Search..."
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
                backgroundColor: darkMode ? '#2d2d2d' : 'white',
                color: darkMode ? '#f8f9fa' : '#212529',
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
            }}
          >
            <FiPlus /> Add
          </button>
        </div>
      </div>

      {/* Business list */}
      {filteredEntreprises.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          background: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          color: darkMode ? '#f8f9fa' : '#212529'
        }}>
          <p style={{ 
            color: darkMode ? '#adb5bd' : '#718096', 
            marginBottom: '1.5rem',
            fontSize: '1.1rem'
          }}>
            {searchTerm ? `No business found for "${searchTerm}"` : 'No business registered'}
          </p>
          {searchTerm ? (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                background: darkMode ? '#2d2d2d' : 'white',
                border: '1px solid #e2e8f0',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.3s',
                color: darkMode ? '#f8f9fa' : '#212529',
              }}
            >
              Clear search
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
              }}
            >
              <FiPlus /> Add a business
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
                background: darkMode ? '#1e1e1e' : 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                color: darkMode ? '#f8f9fa' : '#212529'
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
                      color: darkMode ? '#f8f9fa' : '#2d3748',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}>
                      {entreprise.nom}
                    </h3>
                    <span style={{ 
                      fontSize: '0.8rem',
                      color: darkMode ? '#adb5bd' : '#718096',
                      background: darkMode ? '#2d2d2d' : '#f7fafc',
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
                      color: darkMode ? '#adb5bd' : '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Email
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: darkMode ? '#f8f9fa' : '#4a5568',
                      fontWeight: '500',
                      wordBreak: 'break-word'
                    }}>
                      {entreprise.email}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: darkMode ? '#adb5bd' : '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Address
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: darkMode ? '#f8f9fa' : '#4a5568',
                      fontWeight: '500',
                      wordBreak: 'break-word'
                    }}>
                      {entreprise.adresse || '-'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: darkMode ? '#adb5bd' : '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Phone
                    </span>
                    <span style={{ 
                      fontSize: '0.95rem',
                      color: darkMode ? '#f8f9fa' : '#4a5568',
                      fontWeight: '500'
                    }}>
                      {entreprise.telephone || '-'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: darkMode ? '#adb5bd' : '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem',
                      display: 'block'
                    }}>
                      Status
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
                      Active
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
                background: darkMode ? '#2d2d2d' : '#f8fafc'
              }}>
                <span style={{ 
                  fontSize: '0.8rem',
                  color: darkMode ? '#adb5bd' : '#718096'
                }}>
                  Created: {new Date(entreprise.createdAt).toLocaleDateString('fr-FR', {
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
                  }}
                >
                  <FiExternalLink /> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
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
            background: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            color: darkMode ? '#f8f9fa' : '#212529'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: darkMode ? '#f8f9fa' : '#2d3748' }}>
                {editingEntreprise ? 'Edit Business' : 'New Business'}
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
                      color: darkMode ? '#f8f9fa' : '#4a5568'
                    }}>
                      {field === 'motDePasse' ? 'Password' : 
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
                        backgroundColor: darkMode ? '#2d2d2d' : 'white',
                        color: darkMode ? '#f8f9fa' : '#212529',
                      }}
                      disabled={isSubmitting}
                      placeholder={
                        field === 'motDePasse' ? 'Leave empty to not modify' :
                        field === 'telephone' ? 'Optional' : ''
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
                  background: darkMode ? '#2d2d2d' : 'white',
                  border: '1px solid #e2e8f0',
                  color: darkMode ? '#f8f9fa' : '#4a5568',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Cancel
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
                }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    {editingEntreprise ? 'Saving...' : 'Creating...'}
                  </>
                ) : editingEntreprise ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
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
            background: darkMode ? '#1e1e1e' : 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            color: darkMode ? '#f8f9fa' : '#212529'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #edf2f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: darkMode ? '#f8f9fa' : '#2d3748' }}>
                Business Details
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
                  color: darkMode ? '#f8f9fa' : '#2d3748',
                  textAlign: 'center'
                }}>
                  {selectedEntreprise.nom}
                </h4>
                <span style={{ 
                  fontSize: '0.9rem',
                  color: darkMode ? '#adb5bd' : '#718096',
                  background: darkMode ? '#2d2d2d' : '#f7fafc',
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
                    color: darkMode ? '#adb5bd' : '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Email
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: darkMode ? '#f8f9fa' : '#4a5568',
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {selectedEntreprise.email}
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: darkMode ? '#adb5bd' : '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Address
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    color: darkMode ? '#f8f9fa' : '#4a5568',
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {selectedEntreprise.adresse || '-'}
                  </span>
                </div>
                
                <div>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: darkMode ? '#adb5bd' : '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Phone
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
                    Status
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
                    Active
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
                    Creation Date
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrepriseList;