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
    name: '',
    lastname: '',
    rememberMe: false
  });
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isScrolling = useRef(false);
  const currentSection = useRef(0);
  const navigate = useNavigate();

  // Images pour le carrousel
  const carouselImages = [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80'
  ];

  // Fonctions API pour communiquer avec le backend
  const registerAPI = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Échec de l\'inscription');
      return data;
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      throw err;
    }
  };

  const loginAPI = async (credentials) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Réponse du serveur invalide');
      }

      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  // SUPPRIMER le useEffect de vérification d'authentification au chargement
  // Cela empêche la redirection automatique quand on ouvre la page

  // Gestion du défilement fluide
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

  // Rotation automatique des images du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

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

  // Fonction pour ouvrir/fermer AuthForm
  const toggleAuthForm = () => {
    setShowAuthForm(!showAuthForm);
    setErrorMessage('');
    // Réinitialiser le formulaire quand on ouvre/ferme
    if (!showAuthForm) {
      setFormData({
        email: '',
        password: '',
        name: '',
        lastname: '',
        rememberMe: false
      });
    }
  };

  // Gestion des changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMessage(''); // Effacer les erreurs quand l'utilisateur tape
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
  
    try {
      if (isLogin) {
        // Validation pour la connexion
        if (!formData.email || !formData.password) {
          throw new Error('Veuillez remplir tous les champs');
        }

        // Connexion
        const response = await loginAPI({
          email: formData.email.trim(),
          password: formData.password
        });
      
        // Stocker les données d'authentification
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        storage.setItem('userData', JSON.stringify(response.user));
      
        toggleAuthForm();
      
        // Forcer un rechargement complet de la page pour mettre à jour l'état d'authentification
        setTimeout(() => {
          if (response.user.role === 'comptable') {
            window.location.href = '/dash-comp';
          } else if (response.user.role === 'entreprise') {
            window.location.href = '/dash-entr';
          }
        }, 100);
      
      } else {
        // Validation pour l'inscription
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        if (formData.password.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        // Inscription
        const response = await registerAPI({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name,
          lastname: formData.lastname || formData.name
        });
      
         // Stocker les données d'authentification
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        storage.setItem('userData', JSON.stringify(response.user));
      
        toggleAuthForm();
      
         // Forcer un rechargement complet de la page pour mettre à jour l'état d'authentification
        setTimeout(() => {
          if (response.user.role === 'comptable') {
            window.location.href = '/dash-comp';
          } else if (response.user.role === 'entreprise') {
            window.location.href = '/dash-entr';
          }
        }, 100);
      }
    
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      setErrorMessage(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Basculer entre connexion et inscription
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    // Réinitialiser les données du formulaire
    setFormData({
      email: formData.email, // Garder l'email
      password: '',
      name: '',
      lastname: '',
      rememberMe: formData.rememberMe
    });
  };

  return (
    <div className="facturapro-app">
      
      {/* Navigation fixe */}
      <div className="navbar-container">
        <nav className="navbar">
          <div className="logo">FacturaPro</div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('home')}>Accueil</button>
            <button onClick={() => scrollToSection('features')}>Fonctionnalités</button>
            <button onClick={() => scrollToSection('tools')}>Outils</button>
            <button onClick={() => scrollToSection('objectives')}>Objectifs</button>
            <button onClick={() => scrollToSection('about')}>À propos</button>
            <button onClick={() => scrollToSection('advantages')}>Avantages</button>
            <button onClick={() => scrollToSection('contact')}>Contact</button>
          </div>
          <button onClick={toggleAuthForm} className="login-btn">Connexion</button>
        </nav>
      </div>

      {/* Modale pour AuthForm */}
      {showAuthForm && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <button className="close-modal" onClick={toggleAuthForm} aria-label="Fermer la fenêtre de connexion">
              <span className="close-icon">×</span>
            </button>

            {/* Intelligence Artificielle - Assistant Virtuel */}
            <div className="ai-assistant">
              <div className="ai-header">
                <div className="ai-avatar">
                  <span className="ai-icon">🤖</span>
                  <div className="ai-status"></div>
                </div>
                <div className="ai-info">
                  <h4>Assistant FacturaPro</h4>
                  <p>En ligne • Prêt à vous aider</p>
                </div>
              </div>
            
              <div className="ai-message">
                <p>Bonjour ! Je suis là pour vous guider dans votre {isLogin ? 'connexion' : 'inscription'}.</p>
              </div>
            
              <div className="ai-suggestions">
                <div className="suggestion-chip" onClick={() => console.log('Mot de passe oublié')}>
                  <span>💡 Mot de passe oublié ?</span>
                </div>
                <div className="suggestion-chip" onClick={toggleAuthMode}>
                  <span>🚀 {isLogin ? 'Créer un compte' : 'Se connecter'}</span>
                </div>
                <div className="suggestion-chip" onClick={() => console.log('Sécurité')}>
                  <span>🔐 Sécurité renforcée</span>
                </div>
              </div>
            </div>

            {/* Formulaire d'authentification */}
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
              
              {errorMessage && (
                <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>
                  {errorMessage}
                </div>
              )}
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Nom complet *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Votre nom complet"
                  />
                </div>
              )}
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="lastname">Nom de famille</label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    placeholder="Votre nom de famille (optionnel)"
                  />
                </div>
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
                  placeholder="votre@email.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Mot de passe *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={isLogin ? 'Votre mot de passe' : 'Minimum 6 caractères'}
                />
              </div>
              
              <div className="form-options">
                {isLogin && (
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="rememberMe">Se souvenir de moi</label>
                  </div>
                )}
                
                {isLogin && (
                  <a href="#forgot-password" className="forgot-password">
                    Mot de passe oublié?
                  </a>
                )}
              </div>
              
              <button 
                type="submit" 
                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Chargement...</span>
                ) : (
                  isLogin ? 'Se connecter' : 'Créer un compte'
                )}
              </button>
              
              <div className="auth-switch">
                <p>
                  {isLogin ? 'Pas encore de compte? ' : 'Déjà un compte? '}
                  <span onClick={toggleAuthMode} className="auth-switch-link">
                    {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
                  </span>
                </p>
              </div>
            </form>
            
            <div className="trust-badges">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>Chiffrement AES-256</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🤖</span>
                <span>IA de détection de fraude</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>Certifié RGPD</span>
              </div>
            </div>
          </div>

          <div className="modal-overlay" onClick={toggleAuthForm}></div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="scroll-container">
        {/* Section Hero avec carrousel d'images */}
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
              <h1 className="main-title">Facturation Simplifiée</h1>
              <h2 className="sub-title">Succès Accéléré</h2>
              <p className="hero-description">
                Dites adieu aux maux de tête de la facturation.<br />
                Créez des devis et factures pro en un clin d'œil.
              </p>
              
              <div className="cta-section">
                <button className="primary-cta" onClick={toggleAuthForm}>
                  Commencer
                </button>
                <p className="cta-subtext">Votre partenaire pour une gestion commerciale sans tracas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Fonctionnalités */}
        <section id="features" className="fullpage-section features-section">
          <div className="section-container">
            <h2>Fonctionnalités <span className="highlight">Intelligentes</span></h2>
            <p className="section-description">
              Découvrez comment notre application révolutionne votre gestion financière avec l'IA
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Devis Professionnels</h3>
                <p>Générez des devis élégants et personnalisés en quelques clics seulement.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🧾</div>
                <h3>Facturation Automatisée</h3>
                <p>Transformez vos devis en factures et suivez les paiements automatiquement.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>Assistant IA</h3>
                <p>Notre intelligence artificielle vous suggère les meilleures pratiques de facturation.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Analyses Avancées</h3>
                <p>Visualisez vos performances financières avec des tableaux de bord intuitifs.</p>
                </div>
            </div>
          </div>
        </section>

        {/* Section Outils */}
        <section id="tools" className="fullpage-section tools-section">
          <div className="section-container">
            <h2>Vos <span className="highlight">Outils</span></h2>
            <p className="section-subtitle">Vos Factures, Vos Règles</p>
            
            <div className="tools-grid">
              <div className="tool-card">
                <div className="tool-icon">📝</div>
                <h3>Devis<br /><span className="tool-action">Créer</span></h3>
                <p>Transformez vos idées en propositions commerciales percutantes en un clin d'œil.</p>
                <button className="tool-button" onClick={toggleAuthForm}>Commencer</button>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">🧾</div>
                <h3>Factures<br /><span className="tool-action">Générer</span></h3>
                <p>Convertissez vos devis en factures professionnelles sans effort, pour un flux de trésorerie optimisé.</p>
                <button className="tool-button" onClick={toggleAuthForm}>Commencer</button>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">👤</div>
                <h3>Profil<br /><span className="tool-action">Gérer</span></h3>
                <p>Personnalisez votre espace et gérez vos informations d'entreprise avec une aisance déconcertante.</p>
                <button className="tool-button" onClick={toggleAuthForm}>Commencer</button>
              </div>
            </div>
          </div>
        </section>

        {/* Section Objectifs */}
        <section id="objectives" className="fullpage-section objectives-section">
          <div className="section-container">
            <h2>Objectifs</h2>
            <p className="section-description">
              Notre mission : rendre la génération de devis et factures un jeu d'enfant, 
              faciliter la conversion, et offrir une gestion multi-entreprises avec un tableau de bord intuitif.
            </p>
            
            <div className="magic-strip">
              <div className="magic-strip-content">
                <div className="magic-item">
                  <span className="magic-icon">✨</span>
                  <span className="magic-text">Devis Magiques</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">⚡</span>
                  <span className="magic-text">Factures Instantanées</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">🏢</span>
                  <span className="magic-text">Gestion Multi-entreprises</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">📊</span>
                  <span className="magic-text">Tableau de Bord Intuitif</span>
                </div>
                <div className="magic-item">
                  <span className="magic-icon">🔄</span>
                  <span className="magic-text">Conversion Facile</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section À propos */}
        <section id="about" className="fullpage-section about-section">
          <div className="section-container">
            <div className="about-content">
              <div className="about-text">
                <h2>Notre Vision : <span className="highlight">La Facturation Réinventée</span></h2>
                <p>
                  L'Application Web de Facturation est votre nouvel assistant personnel pour la gestion commerciale. 
                  Créez des devis percutants, transformez-les en factures impeccables, gérez votre profil et les détails 
                  de votre entreprise. Conçue pour les indépendants et les PME, elle rend la facturation aussi simple qu'un café.
                </p>
                
                <div className="stats-container">
                  {[
                    { value: '100%', label: 'Sécurisé' },
                    { value: '5min', label: 'Configuration' },
                    { value: '24/7', label: 'Disponible' }
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
                    <h4>Facture Pro Format</h4>
                    <span>№ INV-2023-0582</span>
                  </div>
                  <div className="card-content">
                    <div className="invoice-line">
                      <span>Design de site web</span>
                      <span>1 200,00 €</span>
                    </div>
                    <div className="invoice-line">
                      <span>Développement frontend</span>
                      <span>2 400,00 €</span>
                    </div>
                    <div className="invoice-total">
                      <span>TOTAL TTC</span>
                      <span>3 600,00 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Avantages */}
        <section id="advantages" className="fullpage-section advantages-section">
          <div className="section-container">
            <div className="advantages-header">
              <h2>Pourquoi choisir <span className="highlight">FacturaPro</span> ?</h2>
              <p className="section-description">
                Découvrez tous les avantages qui rendent notre solution de facturation incontournable
              </p>
            </div>
            
            <div className="advantages-grid">
              <div className="advantage-card">
                <div className="advantage-icon">🚀</div>
                <h3>Gain de temps exceptionnel</h3>
                <p>Réduisez de 70% le temps passé sur la création de devis et factures grâce à nos modèles intelligents.</p>
                <div className="advantage-stats">
                  <span className="stat-value">70% </span>
                  <span className="stat-label"> de temps économisé</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">💰</div>
                <h3>Économies garanties</h3>
                <p>Fini les erreurs coûteuses. Notre système détecte automatiquement les incohérences et omissions.</p>
                <div className="advantage-stats">
                  <span className="stat-value">45% </span>
                  <span className="stat-label"> d'erreurs en moins</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">📈</div>
                <h3>Croissance accélérée</h3>
                <p>Facturez plus rapidement, encaissez plus tôt et améliorez votre trésorerie avec notre suivi intelligent.</p>
                <div className="advantage-stats">
                  <span className="stat-value">2x </span>
                  <span className="stat-label"> plus rapide</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🌐</div>
                <h3>Accessibilité totale</h3>
                <p>Accédez à vos documents depuis n'importe quel appareil, à tout moment, même hors connexion.</p>
                <div className="advantage-stats">
                  <span className="stat-value">100% </span>
                  <span className="stat-label"> disponible</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🔒</div>
                <h3>Sécurité renforcée</h3>
                <p>Vos données sont cryptées et sauvegardées automatiquement avec la technologie de pointe.</p>
                <div className="advantage-stats">
                  <span className="stat-value">100% </span>
                  <span className="stat-label"> sécurisé</span>
                </div>
              </div>
              
              <div className="advantage-card">
                <div className="advantage-icon">🤝</div>
                <h3>Support réactif</h3>
                <p>Notre équipe est là pour vous aider à chaque étape avec un support personnalisé et rapide.</p>
                <div className="advantage-stats">
                  <span className="stat-value">24/7 </span>
                  <span className="stat-label"> support</span>
                </div>
              </div>
            </div>
            
            <div className="advantages-cta">
              <h3>Prêt à révolutionner votre facturation ?</h3>
              <button className="cta-button" onClick={toggleAuthForm}>Essayer gratuitement</button>
            </div>
          </div>
        </section>

        {/* Section Contact */}
        <section id="contact" className="fullpage-section contact-section">
          <div className="section-container">
            <h2>Contactez-nous</h2>
            <p className="section-description">Prêt à simplifier votre facturation ?</p>
            
            <div className="contact-content">
              <form className="contact-form">
                <div className="form-group">
                  <input type="text" placeholder="Votre nom" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Votre email" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Votre message" rows="5" required></textarea>
                </div>
                <button type="submit" className="cta-button">Envoyer le message</button>
              </form>
              
              <div className="contact-info">
                <h3>Informations de contact</h3>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>contact@facturapro.fr</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>Tunis, Tunis</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;