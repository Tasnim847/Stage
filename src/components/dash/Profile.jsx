import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = ({ handleLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data);
        setFormData(response.data);
        if (response.data.image || response.data.logo) {
          setImagePreview(response.data.image || response.data.logo);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.response?.data?.message || 'Erreur de chargement du profil');
        
        if (err.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, handleLogout]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'image' && key !== 'logo') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      const response = await axios.put('/api/profile', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfile(response.data);
      setIsEditing(false);
      setError(null);
      if (response.data.image || response.data.logo) {
        setImagePreview(response.data.image || response.data.logo);
      }
      
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!localStorage.getItem('authToken') && !sessionStorage.getItem('authToken')) {
    navigate('/login');
    return null;
  }

  if (loading) return (
    <div className="profile-loading">
      <div className="spinner"></div>
      <p>Chargement de votre profil...</p>
    </div>
  );

  if (error) return (
    <div className="profile-error">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Réessayer
      </button>
    </div>
  );

  if (!profile) return (
    <div className="profile-empty">
      <p>Aucune donnée de profil disponible</p>
    </div>
  );

  return (
    <div className="profile-container">
      {showSuccessAlert && (
        <div className="success-alert">
          <span>✓</span> Vos modifications ont bien été enregistrées !
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar-container">
          {imagePreview ? (
            <img src={imagePreview} alt="Profil" className="profile-avatar" />
          ) : (
            <div className="default-avatar">
              {profile.role === 'comptable' 
                ? (profile.name?.[0] || '') + (profile.lastname?.[0] || '')
                : profile.nom?.[0] || ''}
            </div>
          )}
          
          {isEditing && (
            <div className="avatar-edit-overlay">
              <label htmlFor="profile-image" className="edit-avatar-button">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                Changer la photo
              </label>
            </div>
          )}
        </div>

        <h1 className="profile-name">
          {profile.role === 'comptable' 
            ? `${profile.name} ${profile.lastname}`
            : profile.nom}
        </h1>
        
        <div className={`profile-role ${profile.role}`}>
          {profile.role === 'comptable' ? 'Comptable' : 'Entreprise'}
        </div>
      </div>

      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Informations personnelles</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    name={profile.role === 'comptable' ? 'name' : 'nom'}
                    value={formData[profile.role === 'comptable' ? 'name' : 'nom']?.split(' ')[0] || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nom</label>
                  {profile.role === 'comptable' ? (
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname || ''}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom?.split(' ')[1] || ''}
                      onChange={(e) => {
                        const parts = formData.nom?.split(' ') || ['', ''];
                        parts[1] = e.target.value;
                        handleInputChange({
                          target: {
                            name: 'nom',
                            value: parts.join(' ')
                          }
                        });
                      }}
                      className="form-control"
                    />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Nouveau mot de passe"
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Coordonnées</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Adresse</label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Région</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Code postal</label>
                  <input
                    type="text"
                    name="codePostal"
                    value={formData.codePostal || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {profile.role === 'entreprise' && profile.comptable && (
              <div className="comptable-section">
                <h3>Comptable associé</h3>
                <div className="comptable-card">
                  <div className="comptable-avatar">
                    {profile.comptable.name?.[0]}{profile.comptable.lastname?.[0]}
                  </div>
                  <div className="comptable-info">
                    <h4>{profile.comptable.name} {profile.comptable.lastname}</h4>
                    <p>{profile.comptable.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => {
                  setIsEditing(false);
                  setImagePreview(profile.image || profile.logo || null);
                }}
                disabled={isSaving}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className={`save-button ${isSaving ? 'loading' : ''}`}
                disabled={isSaving}
              >
                {isSaving ? '' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="details-section">
              <h3>Informations personnelles</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Prénom</label>
                  <p>{profile.role === 'comptable' ? profile.name : profile.nom?.split(' ')[0]}</p>
                </div>
                
                <div className="detail-item">
                  <label>Nom</label>
                  <p>{profile.role === 'comptable' ? profile.lastname : profile.nom?.split(' ')[1] || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
                
                <div className="detail-item">
                  <label>Mot de passe</label>
                  <p>••••••••</p>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Coordonnées</h3>
              <div className="details-grid">
                <div className="detail-item full-width">
                  <label>Adresse</label>
                  <p>{profile.adresse || 'Non spécifiée'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Ville</label>
                  <p>{profile.ville || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Région</label>
                  <p>{profile.region || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Code postal</label>
                  <p>{profile.codePostal || '-'}</p>
                </div>
              </div>
            </div>

            {profile.role === 'entreprise' && profile.comptable && (
              <div className="comptable-section">
                <h3>Comptable associé</h3>
                <div className="comptable-card">
                  <div className="comptable-avatar">
                    {profile.comptable.name?.[0]}{profile.comptable.lastname?.[0]}
                  </div>
                  <div className="comptable-info">
                    <h4>{profile.comptable.name} {profile.comptable.lastname}</h4>
                    <p>{profile.comptable.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)} className="edit-button">
                Modifier le profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;