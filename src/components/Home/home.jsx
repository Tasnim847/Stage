import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import './Modal.css';

function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastname: '',
    username: '',
    rememberMe: false
  });
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm the FacturaPro virtual assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '' });
  
  const isScrolling = useRef(false);
  const currentSection = useRef(0);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  // Images for carousel
  const carouselImages = [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80'
  ];

  // API functions to communicate with backend
  const registerAPI = async (userData) => {
    try {
      const res = await fetch('https://stage-slk6.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        throw new Error(data.message || 'Registration failed');
      }
      
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const loginAPI = async (credentials) => {
    try {
      const response = await fetch('https://stage-slk6.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid server response');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const resetPasswordAPI = async (resetData) => {
    try {
      const response = await fetch('https://stage-slk6.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reset error:', error);
      throw error;
    }
  };

  // Smooth scrolling management
  useEffect(() => {
    const sections = document.querySelectorAll('.fullpage-section');
    
    const handleScroll = () => {
      if (isScrolling.current) return;
      
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSection.current = index;
        }
      });
    };

    const handleWheel = (e) => {
      if (isScrolling.current) return;
      
      e.preventDefault();
      isScrolling.current = true;
      
      if (e.deltaY > 0 && currentSection.current < sections.length - 1) {
        currentSection.current++;
      } else if (e.deltaY < 0 && currentSection.current > 0) {
        currentSection.current--;
      }

      sections[currentSection.current].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Automatic carousel image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Check password match
  useEffect(() => {
    if ((isForgotPassword || !isLogin) && formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [formData.password, formData.confirmPassword, isLogin, isForgotPassword]);

  // Calculate password strength
  useEffect(() => {
    if ((!isLogin || isForgotPassword) && formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ strength: 0, text: '' });
    }
  }, [formData.password, isLogin, isForgotPassword]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let text = '';
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    switch (strength) {
      case 0:
      case 1:
        text = 'Weak';
        break;
      case 2:
        text = 'Medium';
        break;
      case 3:
        text = 'Strong';
        break;
      case 4:
        text = 'Very strong';
        break;
      default:
        text = '';
    }
    
    return { strength, text };
  };

  const validateFormData = (data) => {
    const errors = [];
    
    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Password validation
    if (!data.password || data.password.length < 6) {
      errors.push('Password must contain at least 6 characters');
    }
    
    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must contain at least 2 characters');
    }
    
    // Lastname validation
    if (!data.lastname || data.lastname.trim().length < 2) {
      errors.push('Last name must contain at least 2 characters');
    }
    
    // Username validation
    if (!data.username || data.username.trim().length < 3) {
      errors.push('Username must contain at least 3 characters');
    }
    
    return errors;
  };

  const scrollToSection = (id) => {
    isScrolling.current = true;
    const element = document.getElementById(id);
    if (element) {
      const sections = document.querySelectorAll('.fullpage-section');
      sections.forEach((section, index) => {
        if (section.id === id) {
          currentSection.current = index;
        }
      });
      
      element.scrollIntoView({ behavior: 'smooth' });
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  };

  // Function to open/close AuthForm
  const toggleAuthForm = () => {
    setShowAuthForm(!showAuthForm);
    setErrorMessage('');
    // Reset form when opening/closing
    if (!showAuthForm) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        lastname: '',
        username: '',
        rememberMe: false
      });
      setShowConfirmPassword(false);
      setIsForgotPassword(false);
      setIsLogin(true);
    }
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMessage(''); // Clear errors when user types

    // Show confirmation field when starting to type password
    if (name === 'password' && value.length > 0 && (isForgotPassword || !isLogin)) {
      setShowConfirmPassword(true);
    }

    // Automatically generate username from name
    if (name === 'name' && value && !isLogin && !isForgotPassword && !formData.username) {
      setFormData(prev => ({
        ...prev,
        username: value.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
      }));
    }
  };

  const handlePasswordFocus = () => {
    if ((isForgotPassword || !isLogin) && formData.password.length === 0) {
      setShowConfirmPassword(true);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isForgotPassword) {
        // Validation for reset
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          throw new Error('Please fill all fields');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must contain at least 6 characters');
        }

        // Password reset
        const response = await resetPasswordAPI({
          email: formData.email.trim(),
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword
        });

        setErrorMessage('Password reset successfully!');
        
        // Return to login after delay
        setTimeout(() => {
          setIsForgotPassword(false);
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: '',
            confirmPassword: '',
            name: '',
            lastname: '',
            username: '',
            rememberMe: false
          });
          setErrorMessage('');
        }, 2000);
        
      } else if (isLogin) {
        // Validation for login
        if (!formData.email || !formData.password) {
          throw new Error('Please fill all fields');
        }

        // Login
        const response = await loginAPI({
          email: formData.email.trim(),
          password: formData.password
        });
      
        // Store authentication data
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        storage.setItem('userData', JSON.stringify(response.user));
      
        toggleAuthForm();
      
        // Redirection
        setTimeout(() => {
          if (response.user.role === 'comptable') {
            window.location.href = '/dash-comp';
          } else if (response.user.role === 'entreprise') {
            window.location.href = '/dash-entr';
          }
        }, 100);
      
      } else {
        // Validation for registration
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.username) {
          throw new Error('Please fill all required fields');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must contain at least 6 characters');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Additional client-side validation
        const validationErrors = validateFormData({
          username: formData.username,
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name,
          lastname: formData.lastname || formData.name
        });

        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Prepare data for sending
        const userData = {
          username: formData.username,
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name,
          lastname: formData.lastname || formData.name
        };

        console.log('Data sent to backend:', userData);

        // Registration
        const response = await registerAPI(userData);
      
        // Store authentication data
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        storage.setItem('userData', JSON.stringify(response.user));
      
        toggleAuthForm();
      
        // Redirection
        setTimeout(() => {
          if (response.user.role === 'comptable') {
            window.location.href = '/dash-comp';
          } else if (response.user.role === 'entreprise') {
            window.location.href = '/dash-entr';
          }
        }, 100);
      }
    
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between login and registration
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setErrorMessage('');
    // Reset form data
    setFormData({
      email: formData.email, // Keep email
      password: '',
      confirmPassword: '',
      name: '',
      lastname: '',
      username: '',
      rememberMe: formData.rememberMe
    });
    setShowConfirmPassword(false);
  };

  // Function to switch to "forgot password" mode
  const handleForgotPassword = (e) => {
    if (e) e.preventDefault(); // Prevent default link behavior
    setIsForgotPassword(true);
    setIsLogin(false);
    setErrorMessage('');
    setShowConfirmPassword(false); // Reset visibility state
    setFormData({
      email: formData.email, // Keep email
      password: '',
      confirmPassword: '',
      name: '',
      lastname: '',
      username: '',
      rememberMe: false
    });
  };

  // Function to return to login
  const backToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
    setErrorMessage('');
    setFormData({
      email: formData.email, // Keep email
      password: '',
      confirmPassword: '',
      name: '',
      lastname: '',
      username: '',
      rememberMe: false
    });
  };

  // Functions for chatbot
  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newUserMessage]);
    setUserMessage('');

    // Simulate bot response after delay
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage);
      const newBotMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newBotMessage]);
    }, 1000);
  };

  const generateBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('bonjour')) {
      return "Hello! I'm the FacturaPro assistant. How can I help you today?";
    } else if (lowerMessage.includes('join') || lowerMessage.includes('register') || 
               lowerMessage.includes('account') || lowerMessage.includes('sign up') ||
               lowerMessage.includes('registration') || lowerMessage.includes('how to')) {
      return "I can help you join our platform! Tell me, are you:\n\n1. 🧮 An accountant who wants to manage multiple clients\n2. 🏢 A business that wants to use our invoicing services\n\nReply with 'accountant' or 'business' so I can guide you best.";
    } else if (lowerMessage.includes('accountant')) {
      return "Perfect! As an accountant, here's how to proceed:\n\n1. Click on 'Login' at the top right\n2. Choose 'Create an account'\n3. Fill out the form with your professional information\n4. Once registered, you can invite your business clients to join the platform\n\nYou'll then be able to manage all your clients from a single dashboard!";
    } else if (lowerMessage.includes('business')) {
      return "Excellent! As a business, here's how to join FacturaPro:\n\n1. Ask your accountant to create an account on our platform\n2. Your accountant will then add you to their client space\n3. You'll receive an invitation email with your credentials\n4. Log in and start creating quotes and invoices!\n\nIf you don't have an accountant, you can also create an account directly and manage your invoicing independently.";
    } else if (lowerMessage.includes('invoice') || lowerMessage.includes('quote')) {
      return "FacturaPro allows you to create professional quotes and invoices in just a few clicks. Would you like to know more about this feature?";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return "Our support team is available Monday to Friday from 9am to 6pm at 01 23 45 67 89. You can also check our online help center for detailed guides or send an email to support@facturapro.fr.";
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! Don't hesitate if you have other questions. I'm here to help you simplify your invoicing! 😊";
    } else {
      return "I understand you're mentioning: '" + message + "'.\n\nCould you rephrase your question? I can help you with:\n• Registration on the platform\n• Creating quotes/invoices\n• Our pricing and subscriptions\n• Technical support\n\nJust tell me how I can help you!";
    }
  };

  const quickSuggestions = [
    { text: "How to join the platform?", emoji: "🚀" },
    { text: "I'm an accountant", emoji: "🧮" },
    { text: "I'm a business", emoji: "🏢" }
  ];

  const handleSuggestionClick = (suggestion) => {
    setUserMessage(suggestion.text);
  };

  return (
    <div className="facturapro-app">
      
      {/* Fixed navigation */}
      <div className="navbar-container">
        <nav className="navbar">
          <div className="logo">FacturaPro</div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('home')}>Home</button>
            <button onClick={() => scrollToSection('features')}>Features</button>
            <button onClick={() => scrollToSection('tools')}>Tools</button>
            <button onClick={() => scrollToSection('objectives')}>Objectives</button>
            <button onClick={() => scrollToSection('about')}>About</button>
            <button onClick={() => scrollToSection('advantages')}>Advantages</button>
          </div>
          <button onClick={toggleAuthForm} className="login-btn">Login</button>
        </nav>
      </div>

      {/* Modal for AuthForm */}
      {showAuthForm && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <button className="close-modal" onClick={toggleAuthForm} aria-label="Close login window">
              <span className="close-icon">×</span>
            </button>

            {/* Artificial Intelligence - Virtual Assistant */}
            <div className="ai-assistant">
              <div className="ai-header">
                <div className="ai-avatar">
                  <span className="ai-icon">🤖</span>
                  <div className="ai-status"></div>
                </div>
                <div className="ai-info">
                  <h4>FacturaPro Assistant</h4>
                  <p>Online • Ready to help</p>
                </div>
              </div>
            
              <div className="ai-message">
                <p>
                  {isForgotPassword 
                    ? "I'm assisting you to reset your password securely."
                    : isLogin 
                      ? "Hello! I detect that you want to access your account. Let me guide you."
                      : "Welcome! I'm assisting you to create your account and optimize your invoicing experience."
                  }
                </p>
              </div>
            
              <div className="ai-suggestions">
                {!isForgotPassword && isLogin && (
                  <div className="suggestion-chip" onClick={handleForgotPassword}>
                    <span>💡 Forgot password?</span>
                  </div>
                )}
                {!isForgotPassword && (
                  <div className="suggestion-chip" onClick={toggleAuthMode}>
                    <span>🚀 {isLogin ? 'Create an account' : 'Login'}</span>
                  </div>
                )}
                <div className="suggestion-chip" onClick={() => console.log('Security')}>
                  <span>🔐 Enhanced security</span>
                </div>
              </div>
            </div>

            {/* Authentication form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>
                {isForgotPassword ? 'Password Reset' : 
                 isLogin ? 'Login' : 'Registration'}
              </h2>
              
              {errorMessage && (
                <div className="error-message" style={{color: errorMessage.includes('success') ? 'green' : 'red', marginBottom: '15px'}}>
                  {errorMessage}
                </div>
              )}
              
              {isForgotPassword && (
                <div className="forgot-password-info">
                  <p>Enter your email and your new password.</p>
                </div>
              )}
              
              {!isLogin && !isForgotPassword && (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastname">Last Name *</label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      required
                      placeholder="Your last name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">Username *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Choose a username"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              {/* Password field - Always displayed with appropriate label */}
              <div className="form-group">
                <label htmlFor="password">
                  {isForgotPassword ? 'New Password *' : 'Password *'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={handlePasswordFocus}
                  required
                  placeholder={
                    isForgotPassword ? 'Your new password' : 
                    isLogin ? 'Your password' : 'Minimum 6 characters'
                  }
                />
                {!isLogin && formData.password && (
                  <div className="password-strength">
                    <div 
                      className={`strength-bar ${
                        passwordStrength.strength <= 1 ? 'strength-weak' :
                        passwordStrength.strength === 2 ? 'strength-medium' : 'strength-strong'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    ></div>
                    <div className="password-strength-text">{passwordStrength.text}</div>
                  </div>
                )}
              </div>
              
              {/* Password confirmation field */}
              {(isForgotPassword || !isLogin) && (
                <div className={`confirm-password-container ${showConfirmPassword ? 'visible' : ''}`}>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      {isForgotPassword ? 'Confirm New Password *' : 'Confirm Password *'}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder={isForgotPassword ? 'Confirm your new password' : 'Confirm your password'}
                      className={!passwordMatch ? 'invalid' : ''}
                    />
                    {formData.confirmPassword && !passwordMatch && (
                      <div className="input-feedback">
                        Passwords do not match
                      </div>
                    )}
                    {formData.confirmPassword && passwordMatch && (
                      <div className="input-success">
                        ✓ Passwords match
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {isLogin && !isForgotPassword && (
                <div className="form-options">
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="rememberMe">Remember me</label>
                  </div>
                  <a href="#forgot-password" className="forgot-password" onClick={handleForgotPassword}>
                    Forgot password?
                  </a>
                </div>
              )}
              
              <button 
                type="submit" 
                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  isForgotPassword ? 'Reset Password' :
                  isLogin ? 'Login' : 'Create Account'
                )}
              </button>
              
              <div className="auth-switch">
                {isForgotPassword ? (
                  <p>
                    Back to{' '}
                    <span onClick={backToLogin} className="auth-switch-link">
                      login
                    </span>
                  </p>
                ) : (
                  <p>
                    {isLogin ? 'No account yet? ' : 'Already have an account? '}
                    <span onClick={toggleAuthMode} className="auth-switch-link">
                      {isLogin ? 'Sign up' : 'Login'}
                    </span>
                  </p>
                )}
              </div>
            </form>
            
            <div className="trust-badges">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>AES-256 Encryption</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🤖</span>
                <span>AI Fraud Detection</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>GDPR Certified</span>
              </div>
            </div>
          </div>

          <div className="modal-overlay" onClick={toggleAuthForm}></div>
        </div>
      )}

      {/* Main content */}
      <main className="scroll-container">
        {/* Hero section with image carousel */}
        <section id="home" className="fullpage-section hero-section">
          <div className="carousel-container">
            {carouselImages.map((image, index) => (
              <div 
                key={index}
                className={`carousel-slide ${index === currentImageIndex ? 'active' : ''}`}
                style={{ backgroundImage: `url(${image})` }} 
              ></div>
            ))}
            <div className="carousel-overlay"></div>
          </div>
          
          <div className="hero-content-container">
            <div className="hero-text-content">
              <h1 className="main-title">Simplified Invoicing</h1>
              <h2 className="sub-title">Accelerated Success</h2>
              <p className="hero-description">
                Say goodbye to invoicing headaches.<br />
                Create professional quotes and invoices in a blink.
              </p>
              
              <div className="cta-section">
                <button className="primary-cta" onClick={toggleAuthForm}>
                  Get Started
                </button>
                <p className="cta-subtext">Your partner for hassle-free business management</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="fullpage-section features-section">
          <div className="section-container">
            <h2>Smart <span className="highlight">Features</span></h2>
            <p className="section-description">
              Discover how our application revolutionizes your financial management with AI
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Professional Quotes</h3>
                <p>Generate elegant and personalized quotes in just a few clicks.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🧾</div>
                <h3>Automated Invoicing</h3>
                <p>Transform your quotes into invoices and track payments automatically.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>AI Assistant</h3>
                <p>Our artificial intelligence suggests best invoicing practices.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Advanced Analytics</h3>
                <p>Visualize your financial performance with intuitive dashboards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tools section */}
        <section id="tools" className="fullpage-section tools-section">
          <div className="section-container">
            <h2>Your <span className="highlight">Tools</span></h2>
            <p className="section-subtitle">Your Invoices, Your Rules</p>
            
            <div className="tools-grid">
              <div className="tool-card">
                <div className="tool-icon">📝</div>
                <h3>Quotes<br /><span className="tool-action">Create</span></h3>
                <p>Transform your ideas into compelling business proposals in a blink.</p>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">🧾</div>
                <h3>Invoices<br /><span className="tool-action">Generate</span></h3>
                <p>Convert your quotes into professional invoices effortlessly, for optimized cash flow.</p>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">👤</div>
                <h3>Profile<br /><span className="tool-action">Manage</span></h3>
                <p>Customize your space and manage your business information with ease.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Objectives section */}
        <section id="objectives" className="fullpage-section objectives-section">
          <div className="section-container">
            <h2>Objectives</h2>
            <p className="section-description">
              Our mission: make generating quotes and invoices child's play, 
              facilitate conversion, and offer multi-business management with an intuitive dashboard.
            </p>
            
            <div className="magic-strip">
              <div className="magic-strip-content">
                <div className="magic-item">
                  <span className="magic-icon">✨</span>
                  <span className="magic-text">Magic Quotes</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">⚡</span>
                  <span className="magic-text">Instant Invoices</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">🏢</span>
                  <span className="magic-text">Multi-business Management</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">📊</span>
                  <span className="magic-text">Intuitive Dashboard</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">🔄</span>
                  <span className="magic-text">Easy Conversion</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About section */}
        <section id="about" className="fullpage-section about-section">
          <div className="section-container">
            <div className="about-content">
              <div className="about-text">
                <h2>Our Vision: <span className="highlight">Invoicing Reinvented</span></h2>
                <p>
                  The Web Invoicing Application is your new personal assistant for business management. 
                  Create impactful quotes, transform them into impeccable invoices, manage your profile and 
                  business details. Designed for freelancers and SMEs, it makes invoicing as simple as coffee.
                </p>
                
                <div className="stats-container">
                  {[
                    { value: '100%', label: 'Secure' },
                    { value: '5min', label: 'Setup' },
                    { value: '24/7', label: 'Available' }
                  ].map((stat, index) => (
                    <div key={index} className="stat-item">
                      <div className="stat-number">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="about-visual">
                <div className="floating-card">
                  <div className="card-header">
                    <h4>Pro Invoice Format</h4>
                    <span>№ INV-2023-0582</span>
                  </div>
                  <div className="card-content">
                    <div className="invoice-line">
                      <span>Website design</span>
                      <span>1,200.00 TND</span>
                    </div>
                    <div className="invoice-line">
                      <span>Frontend development</span>
                      <span>2,400.00 TND</span>
                    </div>
                    <div className="invoice-total">
                      <span>TOTAL TTC</span>
                      <span>3,600.00 TND</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages section */}
        <section id="advantages" className="fullpage-section advantages-section">
          <div className="section-container">
            <div className="advantages-header">
              <h2>Why choose <span className="highlight">FacturaPro</span> ?</h2>
              <p className="section-description">
                Discover all the advantages that make our invoicing solution essential
              </p>
            </div>
            
            <div className="advantages-grid">
              <div className="advantage-card">
                <div className="advantage-icon">🚀</div>
                <h3>Exceptional time saving</h3>
                <p>Reduce by 70% the time spent on creating quotes and invoices thanks to our smart templates.</p>
                <div className="advantage-stats">
                  <span className="stat-value">70% </span>
                  <span className="stat-label"> time saved</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">💰</div>
                <h3>Guaranteed savings</h3>
                <p>No more costly errors. Our system automatically detects inconsistencies and omissions.</p>
                <div className="advantage-stats">
                  <span className="stat-value">45% </span>
                  <span className="stat-label"> fewer errors</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">📈</div>
                <h3>Accelerated growth</h3>
                <p>Invoice faster, collect earlier and improve your cash flow with our smart tracking.</p>
                <div className="advantage-stats">
                  <span className="stat-value">2x </span>
                  <span className="stat-label"> faster</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🌐</div>
                <h3>Total accessibility</h3>
                <p>Access your documents from any device, anytime, even offline.</p>
                <div className="advantage-stats">
                  <span className="stat-value">100% </span>
                  <span className="stat-label"> available</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🔒</div>
                <h3>Enhanced security</h3>
                <p>Your data is encrypted and automatically backed up with cutting-edge technology.</p>
                <div className="advantage-stats">
                  <span className="stat-value">100% </span>
                  <span className="stat-label"> secure</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🤝</div>
                <h3>Reactive support</h3>
                <p>Our team is here to help you at every step with personalized and fast support.</p>
                <div className="advantage-stats">
                  <span className="stat-value">24/7 </span>
                  <span className="stat-label"> support</span>
                </div>
              </div>
            </div>
            
            <div className="advantages-cta">
              <h3>Ready to revolutionize your invoicing?</h3>
              <button className="cta-button" onClick={toggleAuthForm}>Try for free</button>
            </div>
          </div>
        </section>

        
      </main>

      {/* Fixed chatbot at bottom right */}
      <div className={`chatbot-container ${showChatbot ? 'open' : ''}`}>
        {showChatbot ? (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-info">
                <div className="chatbot-avatar">🤖</div>
                <div>
                  <h4>FacturaPro Assistant</h4>
                  <p>Online • Ready to help</p>
                </div>
              </div>
              <button className="chatbot-close" onClick={toggleChatbot}>
                ×
              </button>
            </div>
      
          <div className="chatbot-messages" ref={chatContainerRef}>
            {chatMessages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
      
          {/* Quick suggestions */}
          <div className="chatbot-suggestions">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-emoji">{suggestion.emoji}</span>
                {suggestion.text}
              </button>
            ))}
          </div>
      
          <form className="chatbot-input" onSubmit={handleMessageSubmit}>
            <input
              type="text"
              placeholder="Type your message..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
            />
            <button type="submit">➤</button>
          </form>
        </div>
        ) : (
          <button className="chatbot-toggle" onClick={toggleChatbot}>
            <span className="chatbot-icon">💬</span>
            <span className="chatbot-label">Assistant</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;