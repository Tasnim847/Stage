import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Profile = ({ handleLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
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

  /*
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const formDataToSend = new FormData();
      
      // Ajouter les champs texte
      Object.keys(formData).forEach(key => {
        if (key !== 'image' && key !== 'logo') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Ajouter le fichier image s'il existe
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
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };
*/

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      
      // Afficher l'alerte de succès
      setShowSuccessAlert(true);
      // Masquer automatiquement après 3 secondes
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  if (!localStorage.getItem('authToken') && !sessionStorage.getItem('authToken')) {
    navigate('/login');
    return null;
  }

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="no-data">Aucune donnée de profil disponible</div>;

  return (
     <div className="dashboard-container">
      {/* Alerte de succès */}
      {showSuccessAlert && (
        <div className="success-alert animate__animated animate__fadeInDown">
          <span role="img" aria-label="smiley">😊</span> Vos modifications ont bien été enregistrées !
        </div>
      )}

      <div className="profile-layout">
        <div className="left-column">
          <div className="avatar-container">
            {isEditing ? (
              <>
                {imagePreview ? (
                  <img src={imagePreview} alt="Profil" className="avatar" />
                ) : (
                  <div className="avatar-default">
                    {profile.role === 'comptable' 
                      ? (profile.name?.[0] + profile.lastname?.[0] || 'CP')
                      : profile.nom?.[0] || 'EN'}
                  </div>
                )}
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-image" className="image-upload-label">
                    Changer l'image
                  </label>
                </div>
              </>
            ) : (
              imagePreview ? (
                <img src={imagePreview} alt="Profil" className="avatar" />
              ) : (
                <div className="avatar-default">
                  {profile.role === 'comptable' 
                    ? (profile.name?.[0] + profile.lastname?.[0] || 'CP')
                    : profile.nom?.[0] || 'EN'}
                </div>
              )
            )}
          </div>
          
          <div className="basic-info">
            <h3>
              {profile.role === 'comptable' 
                ? `${profile.name} ${profile.lastname}`
                : profile.nom}
            </h3>
            <p className="profile-title">
              {profile.role === 'comptable' ? 'Comptable' : 'Entreprise'}
            </p>
          </div>
        </div>

        <div className="right-column">
          <div className="account-details">
            <h3>Détails du compte</h3>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="details-grid">
                  <div className="detail-group">
                    <div className="detail-item">
                      <label>Prénom</label>
                      <input
                        type="text"
                        name={profile.role === 'comptable' ? 'name' : 'nom'}
                        value={formData[profile.role === 'comptable' ? 'name' : 'nom']?.split(' ')[0] || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="detail-group">
                    <div className="detail-item">
                      <label>Nom</label>
                      {profile.role === 'comptable' ? (
                        <input
                          type="text"
                          name="lastname"
                          value={formData.lastname || ''}
                          onChange={handleInputChange}
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
                        />
                      )}
                    </div>
                    <div className="detail-item">
                      <label>Mot de passe</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Nouveau mot de passe"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="detail-item full-width">
                    <label>Adresse</label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="location-group">
                    <div className="detail-item">
                      <label>Ville</label>
                      <input
                        type="text"
                        name="ville"
                        value={formData.ville || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Région</label>
                      <input
                        type="text"
                        name="region"
                        value={formData.region || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Code postal</label>
                      <input
                        type="text"
                        name="codePostal"
                        value={formData.codePostal || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  {profile.role === 'entreprise' && profile.comptable && (
                    <div className="comptable-info">
                      <h4>Comptable Associé</h4>
                      <p>{profile.comptable.name} {profile.comptable.lastname}</p>
                      <p>{profile.comptable.email}</p>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-button">Enregistrer</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setIsEditing(false);
                      setImagePreview(profile.image || profile.logo || null);
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="details-grid">
                  <div className="detail-group">
                    <div className="detail-item">
                      <label>Prénom</label>
                      <p>{profile.role === 'comptable' ? profile.name : profile.nom?.split(' ')[0]}</p>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <p>{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="detail-group">
                    <div className="detail-item">
                      <label>Nom</label>
                      <p>{profile.role === 'comptable' ? profile.lastname : profile.nom?.split(' ')[1] || '-'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Mot de passe</label>
                      <p>••••••••</p>
                    </div>
                  </div>
                  
                  <div className="detail-item full-width">
                    <label>Adresse</label>
                    <p>{profile.adresse || 'Non spécifiée'}</p>
                  </div>
                  
                  <div className="location-group">
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
                  
                  {profile.role === 'entreprise' && profile.comptable && (
                    <div className="comptable-info">
                      <h4>Comptable Associé</h4>
                      <p>{profile.comptable.name} {profile.comptable.lastname}</p>
                      <p>{profile.comptable.email}</p>
                    </div>
                  )}
                </div>
                
                <button 
                  className="update-button" 
                  onClick={() => setIsEditing(true)}
                >
                  Modifier le profil
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;