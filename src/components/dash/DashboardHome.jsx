import React, { useState, useEffect } from 'react';

const DashboardHome = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [temperature, setTemperature] = useState(20);
  const [weather, setWeather] = useState('sunny');
  const [kpiData, setKpiData] = useState({
    activeClients: 0,
    monthlyInvoices: 0,
    companies: 0
  });
  const [activities, setActivities] = useState([]);
  const [robotMessage, setRobotMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Function to generate random assistant messages
  const generateRobotMessage = () => {
    const messages = [
      "I'm here to help you manage your accounting efficiently.",
      "Need help creating a new invoice? Just ask me!",
      "Your VAT declaration is up to date. Good job!",
      "I've analyzed your financial data, everything looks good.",
      "Feel free to ask me for advice to optimize your finances.",
      "Let me know if you need reports or analytics.",
      "I can help you track expenses and revenues."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Function to generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Data loading simulation
  useEffect(() => {
    // Update current time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setGreeting(getGreeting());
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    
    // Simulate KPI data loading
    const loadData = () => {
      // In reality, you would make an API call here
      setTimeout(() => {
        setKpiData({
          activeClients: Math.floor(Math.random() * 50) + 20, // 20-70
          monthlyInvoices: Math.floor(Math.random() * 100) + 30, // 30-130
          companies: Math.floor(Math.random() * 20) + 5 // 5-25
        });
        
        setActivities([
          `New company ${['ABC Corp', 'XYZ Ltd', '123 LLC'][Math.floor(Math.random() * 3)]} added`,
          `Invoice #${Math.floor(Math.random() * 9000) + 1000} created`,
          'VAT declaration submitted',
          `${['Meeting', 'Call', 'Email'][Math.floor(Math.random() * 3)]} with ${['client', 'supplier', 'accountant'][Math.floor(Math.random() * 3)]}`
        ]);
        
        setRobotMessage(generateRobotMessage());
        
        // Simulate weather data
        const weatherTypes = ['sunny', 'cloudy', 'rainy'];
        setWeather(weatherTypes[Math.floor(Math.random() * weatherTypes.length)]);
        setTemperature(Math.floor(Math.random() * 10) + 18); // 18-28°C
      }, 1000);
    };
    
    loadData();
    const dataInterval = setInterval(loadData, 300000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  // Function to navigate months
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="ai-main-section">
      <div className="dashboard-header-container">
        <div className="ai-assistant-container">
          <div className="ai-robot">
            <div className="ai-robot-face">
              <div className="ai-robot-eyes">
                <div className="ai-robot-eye"></div>
                <div className="ai-robot-eye"></div>
              </div>
              <div className="ai-robot-mouth"></div>
            </div>
          </div>
          
          <div className="ai-welcome-message">
            <h1>{greeting}, Jennifer</h1>
            <p>Current time is {currentTime}. {robotMessage}</p>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={() => navigateMonth('prev')} className="calendar-nav-button">
              &lt;
            </button>
            <h3>{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={() => navigateMonth('next')} className="calendar-nav-button">
              &gt;
            </button>
          </div>
          <table className="calendar-table">
            <thead>
              <tr>
                {dayNames.map(day => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
                <tr key={weekIndex}>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = days[weekIndex * 7 + dayIndex];
                    const isToday = day === new Date().getDate() && 
                                    currentMonth === new Date().getMonth() && 
                                    currentYear === new Date().getFullYear();
                    return (
                      <td 
                        key={dayIndex} 
                        className={`calendar-day ${isToday ? 'today' : ''} ${day ? '' : 'empty'}`}
                      >
                        {day || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="weather-card">
          <div className="weather-info">
            <h3>Golden temperature</h3>
            <div className="temperature-display">
              <span className="temperature-value">{temperature}°</span>
              <span className="weather-condition">Toward sunshine</span>
            </div>
          </div>
          <div className="weather-icon">
            {weather === 'sunny' && <i className="fas fa-sun"></i>}
            {weather === 'cloudy' && <i className="fas fa-cloud"></i>}
            {weather === 'rainy' && <i className="fas fa-cloud-rain"></i>}
          </div>
        </div>

        <div className="music-info">
          <h3>Songs</h3>
          <p>Japan Globe Ltd. 2014. Sound Design and Design of the Golden Energy Company in Great Britain.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;