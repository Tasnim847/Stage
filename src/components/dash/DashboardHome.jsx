// DashboardHome.jsx
import React, { useState, useEffect } from 'react';

const DashboardHome = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [kpiData, setKpiData] = useState({
    activeClients: 0,
    monthlyInvoices: 0,
    companies: 0
  });
  const [activities, setActivities] = useState([]);
  const [robotMessage, setRobotMessage] = useState('');

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
      }, 1000);
    };
    
    loadData();
    const dataInterval = setInterval(loadData, 300000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  return (
    <div className="ai-main-section">
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
          <h1>{greeting}, Welcome to your Dashboard!</h1>
          <p>Current time is {currentTime}. {robotMessage}</p>
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;