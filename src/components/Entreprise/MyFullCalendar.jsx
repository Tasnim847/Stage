import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fonction pour récupérer le token correctement
  const getToken = () => {
    try {
      // Essayer plusieurs clés possibles pour le token
      const tokenKeys = ['token', 'authToken', 'jwtToken', 'userToken'];
      
      for (const key of tokenKeys) {
        const token = localStorage.getItem(key);
        if (token && token.length > 100) { // Un token JWT valide est long
          console.log('Token trouvé avec la clé:', key);
          return token;
        }
      }
      
      // Vérifier aussi sessionStorage
      for (const key of tokenKeys) {
        const token = sessionStorage.getItem(key);
        if (token && token.length > 100) {
          console.log('Token trouvé dans sessionStorage avec la clé:', key);
          return token;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération du token:', err);
      return null;
    }
  };

  // Récupérer les devis depuis le backend
  // Récupérer les devis depuis le backend
useEffect(() => {
  const fetchDevis = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      
      if (!token) {
        setError('Token non trouvé. Veuillez vous reconnecter.');
        setLoading(false);
        loadMockData();
        return;
      }

      const response = await axios.get('http://localhost:5000/api/devis', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // Vérifier le format de réponse
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Devis reçus:', response.data.data);
        setDevis(response.data.data);
        createDevisEvents(response.data.data);
      } else {
        setError('Format de données invalide reçu du serveur');
        console.error('Réponse inattendue:', response.data);
        loadMockData();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur complète lors de la récupération des devis:', error);
      
      // Gestion spécifique des erreurs
      if (error.response?.status === 403) {
        setError('Accès non autorisé. Vous devez être une entreprise.');
      } else if (error.response?.status === 404) {
        setError('Aucune entreprise trouvée pour votre compte.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Timeout de connexion au serveur.');
      } else if (error.response?.data?.message) {
        setError(`Erreur serveur: ${error.response.data.message}`);
      } else {
        setError('Erreur de connexion au serveur. Affichage des données de démonstration.');
      }
      
      setLoading(false);
      loadMockData();
    }
  };

  // Fonction pour charger des données mockées
  const loadMockData = () => {
    const mockDevis = [
      {
        id: 1,
        numero: "DEV-2024-001",
        date_validite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        client_name: "Client Test",
        montant_ttc: 1200.00,
        statut: "brouillon",
        lignesDevis: []
      },
      {
        id: 2,
        numero: "DEV-2024-002", 
        date_validite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        client_name: "Client Important",
        montant_ttc: 3500.00,
        statut: "signé",
        lignesDevis: []
      }
    ];
    
    setDevis(mockDevis);
    createDevisEvents(mockDevis);
  };

  // Fonction pour créer les événements des devis
  const createDevisEvents = (devisData) => {
    const devisEvents = {};
    devisData.forEach(devis => {
      if (devis.date_validite) {
        try {
          const dateKey = new Date(devis.date_validite).toDateString();
          if (!devisEvents[dateKey]) {
            devisEvents[dateKey] = [];
          }
          
          devisEvents[dateKey].push({
            id: `devis-${devis.id}`,
            title: `Devis: ${devis.numero}`,
            time: '23:59',
            type: 'devis',
            statut: devis.statut,
            client: devis.client_name,
            montant: devis.montant_ttc
          });
        } catch (dateError) {
          console.error('Erreur de format de date pour le devis:', devis.id, dateError);
        }
      }
    });
    
    setEvents(devisEvents);
  };

  fetchDevis();
}, []);

  // Génération de suggestions IA (simulées)
  useEffect(() => {
    const suggestions = [
      "Réunion d'équipe à 10h00",
      "Déjeuner avec client à 12h30",
      "Préparer le rapport trimestriel",
      "Appel avec le département technique",
      "Revue des objectifs du mois"
    ];
    
    // Simulation de l'IA qui apprend des habitudes
    const now = new Date();
    if (now.getHours() >= 9 && now.getHours() < 12) {
      suggestions.unshift("Planifier les tâches de la journée");
    } else if (now.getHours() >= 15 && now.getHours() < 18) {
      suggestions.unshift("Préparer le plan pour demain");
    }
    
    setAiSuggestions(suggestions);
  }, []);

  // Fonctions pour naviguer dans le calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Obtenir les événements pour une date spécifique
  const getEventsForDate = (date) => {
    return events[date.toDateString()] || [];
  };

  // Générer les jours du mois
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startDay; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    days.reverse();
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString()
      });
    }
    
    // Jours du mois suivant
    const daysNeeded = 42 - days.length;
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = getDaysInMonth();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  // Filtrer les devis pour la date sélectionnée
  const getDevisForSelectedDate = () => {
    return devis.filter(devis => {
      if (!devis.date_validite) return false;
      try {
        return new Date(devis.date_validite).toDateString() === selectedDate.toDateString();
      } catch (error) {
        console.error('Erreur de date:', error);
        return false;
      }
    });
  };

  if (loading) {
    return (
      <div className="calendar-compact">
        <div className="loading">Chargement des devis...</div>
      </div>
    );
  }

  return (
    <div className="calendar-compact">
      <div className="calendar-header">
        <h1>Calendrier <span className="ai-text">Intelligent</span></h1>
        <p>Avec gestion des échéances de devis</p>
        {error && <div className="error-banner">{error}</div>}
      </div>
      
      <div className="calendar-content">
        <div className="calendar-left-panel">
          <div className="calendar-controls">
            <div className="month-navigation">
              <button onClick={goToPreviousMonth} className="nav-btn">&lt;</button>
              <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={goToNextMonth} className="nav-btn">&gt;</button>
            </div>
            <button onClick={goToToday} className="today-btn">Aujourd'hui</button>
          </div>
          
          <div className="calendar-grid">
            {dayNames.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              const devisEvents = dayEvents.filter(event => event.type === 'devis');
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="day-number">{day.date.getDate()}</span>
                  {devisEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id} 
                      className={`event-preview ${event.statut === 'brouillon' ? 'draft' : event.statut === 'signé' ? 'signed' : 'pending'}`}
                      title={`${event.client} - ${event.montant} DT`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {devisEvents.length > 2 && (
                    <div className="more-events">+{devisEvents.length - 2} devis</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="calendar-right-panel">
          <div className="selected-date-section">
            <h3>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            
            <div className="devis-list">
              <h4>Échéances de devis</h4>
              {getDevisForSelectedDate().length === 0 ? (
                <p className="no-events">Aucune échéance de devis</p>
              ) : (
                getDevisForSelectedDate().map(devis => (
                  <div key={devis.id} className={`devis-item ${devis.statut}`}>
                    <div className="devis-info">
                      <span className="devis-numero">{devis.numero}</span>
                      <span className="devis-client">{devis.client_name}</span>
                      <span className="devis-montant">{devis.montant_ttc} DT TTC</span>
                    </div>
                    <div className={`devis-statut ${devis.statut}`}>
                      {devis.statut}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="ai-suggestions-section">
            <h3>
              <span className="ai-icon">🤖</span> Suggestions de l'IA
            </h3>
            <div className="suggestions-list">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <div className="suggestion-text">{suggestion}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;