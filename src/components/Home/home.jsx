import React, { useEffect, useState, useRef } from 'react';
import './Home.css';

function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isScrolling = useRef(false);
  const currentSection = useRef(0);
  
  // Images pour le carrousel
  const carouselImages = [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80'
  ];

  // Gestion du défilement fluide
  useEffect(() => {
    const sections = document.querySelectorAll('.fullpage-section');
    
    // Mettre à jour currentSection lors du défilement manuel
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
      
      // Déterminer la direction
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
    }, 5000); // Change d'image toutes les 5 secondes

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const scrollToSection = (id) => {
    isScrolling.current = true;
    const element = document.getElementById(id);
    if (element) {
      // Mettre à jour currentSection
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
          <a href="#login" className="login-btn">Connexion</a>
        </nav>
      </div>

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
                <button className="primary-cta">Commencer</button>
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
                <button className="tool-button">Commencer</button>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">🧾</div>
                <h3>Factures<br /><span className="tool-action">Générer</span></h3>
                <p>Convertissez vos devis en factures professionnelles sans effort, pour un flux de trésorerie optimisé.</p>
                <button className="tool-button">Commencer</button>
              </div>
              
              <div className="tool-card">
                <div className="tool-icon">👤</div>
                <h3>Profil<br /><span className="tool-action">Gérer</span></h3>
                <p>Personnalisez votre espace et gérez vos informations d'entreprise avec une aisance déconcertante.</p>
                <button className="tool-button">Commencer</button>
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
            
            {/* Bande magique déroulante */}
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

        {/* Section Avantages - Nouveau Design */}
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
              <button className="cta-button">Essayer</button>
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
                  <span>Paris, France</span>
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