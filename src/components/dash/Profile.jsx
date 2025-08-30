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
        
        // Make sure all fields are initialized
        const profileData = {
          ville: '',
          region: '',
          codePostal: '',
          ...response.data
        };
        
        setProfile(profileData);
        setFormData(profileData);
        
        if (response.data.image || response.data.logo) {
          setImagePreview(response.data.image || response.data.logo);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.response?.data?.message || 'Error loading profile');
        
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
      
      // Include all necessary fields
      const fieldsToSend = [
        'nom', 'name', 'lastname', 'email', 'password', 
        'adresse', 'ville', 'region', 'codePostal', 
        'telephone', 'siteWeb', 'numeroIdentificationFiscale'
      ];
      
      fieldsToSend.forEach(key => {
        if (formData[key] !== undefined) {
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
      
      // Update state with response
      const updatedProfile = {
        ville: '',
        region: '',
        codePostal: '',
        ...response.data
      };
      
      setProfile(updatedProfile);
      setIsEditing(false);
      setError(null);
      
      if (response.data.image || response.data.logo) {
        setImagePreview(response.data.image || response.data.logo);
      }
      
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error updating profile');
      
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
      <p>Loading your profile...</p>
    </div>
  );

  if (error) return (
    <div className="profile-error">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Try again
      </button>
    </div>
  );

  if (!profile) return (
    <div className="profile-empty">
      <p>No profile data available</p>
    </div>
  );

  return (
    <div className="profile-container">
      {showSuccessAlert && (
        <div className="success-alert">
          <span>✓</span> Your changes have been saved successfully!
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar-container">
          {imagePreview ? (
            <img src={imagePreview} alt="Profile" className="profile-avatar" />
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
                Change photo
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
          {profile.role === 'comptable' ? 'Accountant' : 'Business'}
        </div>
      </div>

      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name={profile.role === 'comptable' ? 'name' : 'nom'}
                    value={formData[profile.role === 'comptable' ? 'name' : 'nom']?.split(' ')[0] || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
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
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="New password"
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Postal Code</label>
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
                <h3>Associated Accountant</h3>
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
                Cancel
              </button>
              <button 
                type="submit" 
                className={`save-button ${isSaving ? 'loading' : ''}`}
                disabled={isSaving}
              >
                {isSaving ? '' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="details-section">
              <h3>Personal Information</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>First Name</label>
                  <p>{profile.role === 'comptable' ? profile.name : profile.nom?.split(' ')[0]}</p>
                </div>
                
                <div className="detail-item">
                  <label>Last Name</label>
                  <p>{profile.role === 'comptable' ? profile.lastname : profile.nom?.split(' ')[1] || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
                
                <div className="detail-item">
                  <label>Password</label>
                  <p>••••••••</p>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Contact Information</h3>
              <div className="details-grid">
                <div className="detail-item full-width">
                  <label>Address</label>
                  <p>{profile.adresse || 'Not specified'}</p>
                </div>
                
                <div className="detail-item">
                  <label>City</label>
                  <p>{profile.ville || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Region</label>
                  <p>{profile.region || '-'}</p>
                </div>
                
                <div className="detail-item">
                  <label>Postal Code</label>
                  <p>{profile.codePostal || '-'}</p>
                </div>

                <div className="detail-item">
                  <label>Phone</label>
                  <p>{profile.telephone || '-'}</p>
                </div>
              </div>
            </div>

            {profile.role === 'entreprise' && profile.comptable && (
              <div className="comptable-section">
                <h3>Associated Accountant</h3>
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
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;