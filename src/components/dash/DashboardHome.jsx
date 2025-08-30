import React, { useState, useEffect } from 'react';
import './Home.css';

const DashboardHome = () => {
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const greetings = [
    "Hello! How can I help you today?",
    "Welcome back among us!",
    "Greetings! I'm here to assist you.",
    "Glad to see you again!",
    "Hello! Ready to explore new ideas?",
    "Welcome! How was your day?",
    "Pleased to see you again!",
    "Happy to see you back!",
    "I'm at your service!",
    "How can I help you today?"
  ];

  const addMessage = () => {
    const randomMessage = greetings[Math.floor(Math.random() * greetings.length)];
    const newMessage = {
      id: Date.now(),
      text: randomMessage,
      position: {
        top: `${Math.random() * 70 + 15}%`,
        left: `${Math.random() * 70 + 15}%`
      }
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsSpeaking(true);
    
    setTimeout(() => setIsSpeaking(false), 1500);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      addMessage();
    }, 1000);
    
    const interval = setInterval(() => {
      addMessage();
    }, 8000 + Math.random() * 4000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="home-container">
      <div className="ai-icon">
        <div className={`ai-face ${isSpeaking ? 'speaking' : ''}`}>
          <div className="ai-head">
            <div className="ai-eye left-eye"></div>
            <div className="ai-eye right-eye"></div>
            <div className="ai-antenna left-antenna"></div>
            <div className="ai-antenna right-antenna"></div>
            <div className="ai-mouth"></div>
          </div>
        </div>
        <div className="pulse-ring"></div>
        <div className="pulse-ring ring-2"></div>
        <div className="glow-effect"></div>
      </div>
      
      {messages.map(message => (
        <div 
          key={message.id} 
          className="message-bubble"
          style={message.position}
        >
          {message.text}
          <div className="bubble-tail"></div>
        </div>
      ))}
      
      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--delay': `${i * 0.7}s`,
            '--size': `${Math.random() * 6 + 4}px`,
            '--duration': `${Math.random() * 15 + 15}s`,
            '--left': `${Math.random() * 100}%`
          }}></div>
        ))}
      </div>
      
    </div>
  );
};

export default DashboardHome;