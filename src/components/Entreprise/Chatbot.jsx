import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const DashboardHome  = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Fonction pour faire défiler vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Réponses prédéfinies du bot
  const botResponses = {
    'salut': 'Bonjour ! Comment puis-je vous aider ?',
    'bonjour': 'Bonjour ! Comment allez-vous aujourd\'hui ?',
    'aide': 'Je suis là pour vous aider. Dites-moi ce dont vous avez besoin.',
    'merci': 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions.',
    'au revoir': 'Au revoir ! À bientôt !',
    'heure': `Il est ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    'date': `Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    'default': 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre question ?'
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simuler une réponse du bot après un court délai
    setTimeout(() => {
      const userText = inputValue.toLowerCase();
      let botResponse = botResponses.default;

      // Chercher une réponse correspondante
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

  // Formater l'heure pour l'affichage
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <div className="chatbot-info">
          <div className="chatbot-avatar">
            <span>🤖</span>
          </div>
          <div className="chatbot-details">
            <h2>Assistant Virtuel</h2>
            <p>En ligne • Répond instantanément</p>
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
          <span>Aujourd'hui</span>
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
            placeholder="Tapez votre message..."
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

export default DashboardHome ;