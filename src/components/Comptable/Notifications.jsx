import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import './comptable.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);
  const navigate = useNavigate();
  const context = useOutletContext();
  
  const { userData } = context || {};

  useEffect(() => {
    if (!userData) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setNotifications(response.data.data.map(notif => ({
          ...notif,
          comptable: notif.Comptable ? {
            id: notif.Comptable.id,
            nom: notif.Comptable.name,
            prenom: notif.Comptable.lastname
          } : null
        })));
        
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Error:', error);
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    if (userData && userData.role === 'comptable') {
      const websocket = new WebSocket(`ws://${window.location.host}/ws?userId=${userData.id}`);

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'NEW_NOTIFICATION') {
          setNotifications(prev => [{
            ...message.data,
            comptable: {
              id: userData.id,
              nom: userData.name,
              prenom: userData.lastname
            }
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        }
      };

      setWs(websocket);

      return () => {
        websocket.close();
      };
    }
  }, [userData]);

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const wasUnread = notifications.find(n => n.id === id && !n.read);
      setNotifications(notifications.filter(notif => notif.id !== id));
      if (wasUnread) setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.type === 'NEW_FACTURE' && notification.relatedEntityId) {
      navigate(`/factures/${notification.relatedEntityId}`);
    } else if (notification.type === 'NEW_DEVIS' && notification.relatedEntityId) {
      navigate(`/devis/${notification.relatedEntityId}`);
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationTypeClass = (type) => {
    if (!type) return '';
    const typeMap = {
      'NEW_FACTURE': 'new-facture',
      'NEW_DEVIS': 'new-devis',
      'PAYMENT': 'payment',
      'REMINDER': 'reminder',
      'SYSTEM': 'system'
    };
    return typeMap[type] || '';
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading-spinner">
          <div className="spin"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-container">
        <div className="error-message">
          <p>{error}</p>
          <button className="error-button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`notifications-container ${context?.darkMode ? 'dark' : ''}`}>
      <div className="notifications-header">
        <h1>
          <FiBell /> Notifications 
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read-btn">
            <FiCheck /> Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <p>Aucune notification disponible</p>
        </div>
      ) : (
        <ul className="notifications-list">
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={`notification-item ${notification.read ? '' : 'unread'} ${getNotificationTypeClass(notification.type)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                {notification.type && (
                  <span className={`notification-type type-${notification.type.toLowerCase().replace('_', '-')}`}>
                    {notification.type.replace('_', ' ')}
                  </span>
                )}
                <p>{notification.message}</p>
                <span className="notification-time">
                  {formatTime(notification.createdAt)}
                  {!notification.read && <span className="unread-dot"></span>}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;