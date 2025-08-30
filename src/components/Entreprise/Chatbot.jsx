import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot= () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I am your virtual assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Function to scroll to the last message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Predefined bot responses
  const botResponses = {
    'hi': 'Hello! How can I help you?',
    'hello': 'Hello! How are you today?',
    'help': 'I am here to help. Tell me what you need.',
    'thank you': 'You\'re welcome! Don\'t hesitate if you have other questions.',
    'goodbye': 'Goodbye! See you soon!',
    'time': `It is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    'date': `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    'default': 'I\'m not sure I understand. Could you rephrase your question?'
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const userText = inputValue.toLowerCase();
      let botResponse = botResponses.default;

      // Find a matching response
      Object.keys(botResponses).forEach(key => {
        if (userText.includes(key)) {
          botResponse = botResponses[key];
        }
      });

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <div className="chatbot-info">
          <div className="chatbot-avatar">
            <span>🤖</span>
          </div>
          <div className="chatbot-details">
            <h2>Virtual Assistant</h2>
            <p>Online • Responds instantly</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button">
            <i className="fas fa-video"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-phone"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <div className="messenger-chat">
        <div className="chat-date-indicator">
          <span>Today</span>
        </div>
        
        <div className="messages-container">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="messenger-input">
        <div className="input-actions">
          <button className="icon-button">
            <i className="fas fa-plus"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-paperclip"></i>
          </button>
          <button className="icon-button">
            <i className="fas fa-image"></i>
          </button>
        </div>
        <div className="text-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="message-input"
          />
        </div>
        <div className="send-actions">
          <button className="icon-button">
            <i className="fas fa-microphone"></i>
          </button>
          <button 
            onClick={handleSendMessage}
            className="send-button"
            disabled={inputValue.trim() === ''}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;