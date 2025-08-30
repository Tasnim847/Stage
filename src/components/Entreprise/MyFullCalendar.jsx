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

  // Function to get token correctly
  const getToken = () => {
    try {
      // Try multiple possible keys for token
      const tokenKeys = ['token', 'authToken', 'jwtToken', 'userToken'];
      
      for (const key of tokenKeys) {
        const token = localStorage.getItem(key);
        if (token && token.length > 100) { // A valid JWT token is long
          console.log('Token found with key:', key);
          return token;
        }
      }
      
      // Also check sessionStorage
      for (const key of tokenKeys) {
        const token = sessionStorage.getItem(key);
        if (token && token.length > 100) {
          console.log('Token found in sessionStorage with key:', key);
          return token;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error retrieving token:', err);
      return null;
    }
  };

  // Get quotes from backend
  useEffect(() => {
    const fetchDevis = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = getToken();
        
        if (!token) {
          setError('Token not found. Please reconnect.');
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
        
        // Check response format
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('Quotes received:', response.data.data);
          setDevis(response.data.data);
          createDevisEvents(response.data.data);
        } else {
          setError('Invalid data format received from server');
          console.error('Unexpected response:', response.data);
          loadMockData();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Complete error when retrieving quotes:', error);
        
        // Specific error handling
        if (error.response?.status === 403) {
          setError('Unauthorized access. You must be a business.');
        } else if (error.response?.status === 404) {
          setError('No business found for your account.');
        } else if (error.code === 'ECONNABORTED') {
          setError('Server connection timeout.');
        } else if (error.response?.data?.message) {
          setError(`Server error: ${error.response.data.message}`);
        } else {
          setError('Server connection error. Displaying demo data.');
        }
        
        setLoading(false);
        loadMockData();
      }
    };

    // Function to load mock data
    const loadMockData = () => {
      const mockDevis = [
        {
          id: 1,
          numero: "DEV-2024-001",
          date_validite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          client_name: "Test Client",
          montant_ttc: 1200.00,
          statut: "brouillon",
          lignesDevis: []
        },
        {
          id: 2,
          numero: "DEV-2024-002", 
          date_validite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          client_name: "Important Client",
          montant_ttc: 3500.00,
          statut: "signé",
          lignesDevis: []
        }
      ];
      
      setDevis(mockDevis);
      createDevisEvents(mockDevis);
    };

    // Function to create quote events
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
              title: `Quote: ${devis.numero}`,
              time: '23:59',
              type: 'devis',
              statut: devis.statut,
              client: devis.client_name,
              montant: devis.montant_ttc
            });
          } catch (dateError) {
            console.error('Date format error for quote:', devis.id, dateError);
          }
        }
      });
      
      setEvents(devisEvents);
    };

    fetchDevis();
  }, []);

  // Generate AI suggestions (simulated)
  useEffect(() => {
    const suggestions = [
      "Team meeting at 10:00",
      "Lunch with client at 12:30",
      "Prepare quarterly report",
      "Call with technical department",
      "Review monthly goals"
    ];
    
    // Simulation of AI learning from habits
    const now = new Date();
    if (now.getHours() >= 9 && now.getHours() < 12) {
      suggestions.unshift("Plan daily tasks");
    } else if (now.getHours() >= 15 && now.getHours() < 18) {
      suggestions.unshift("Prepare plan for tomorrow");
    }
    
    setAiSuggestions(suggestions);
  }, []);

  // Functions to navigate calendar
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

  // Get events for specific date
  const getEventsForDate = (date) => {
    return events[date.toDateString()] || [];
  };

  // Generate days of month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Days of previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startDay; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    days.reverse();
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString()
      });
    }
    
    // Days of next month
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
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Filter quotes for selected date
  const getDevisForSelectedDate = () => {
    return devis.filter(devis => {
      if (!devis.date_validite) return false;
      try {
        return new Date(devis.date_validite).toDateString() === selectedDate.toDateString();
      } catch (error) {
        console.error('Date error:', error);
        return false;
      }
    });
  };

  if (loading) {
    return (
      <div className="calendar-compact">
        <div className="loading">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="calendar-compact">
      <div className="calendar-header">
        <h1>Calendar</h1>
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
            <button onClick={goToToday} className="today-btn">Today</button>
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
                      title={`${event.client} - ${event.montant} TND`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {devisEvents.length > 2 && (
                    <div className="more-events">+{devisEvents.length - 2} quotes</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="calendar-right-panel">
          <div className="selected-date-section">
            <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            
            <div className="devis-list">
              <h4>Quote Deadlines</h4>
              {getDevisForSelectedDate().length === 0 ? (
                <p className="no-events">No quote deadlines</p>
              ) : (
                getDevisForSelectedDate().map(devis => (
                  <div key={devis.id} className={`devis-item ${devis.statut}`}>
                    <div className="devis-info">
                      <span className="devis-numero">{devis.numero}</span>
                      <span className="devis-client">{devis.client_name}</span>
                      <span className="devis-montant">{devis.montant_ttc} TND TTC</span>
                    </div>
                    <div className={`devis-statut ${devis.statut}`}>
                      {devis.statut}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Calendar;