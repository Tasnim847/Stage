// src/components/dash/Dashboard.jsx
import React, { useState } from 'react';
import { FiDollarSign, FiUsers, FiShoppingCart, FiActivity, FiTrendingUp, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  // Récupérer le rôle de l'utilisateur
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
  const userRole = userData.role; // 'entreprise' ou 'comptable'
  // Données pour les graphiques
  const salesData = [
    { name: 'Lun', ventes: 4000 },
    { name: 'Mar', ventes: 3000 },
    { name: 'Mer', ventes: 5000 },
    { name: 'Jeu', ventes: 2780 },
    { name: 'Ven', ventes: 1890 },
    { name: 'Sam', ventes: 2390 },
    { name: 'Dim', ventes: 3490 }
  ];

  // Statistiques pour entreprise
  const entrepriseStats = [
    { id: 1, title: "Chiffre d'affaires", value: "24,500 TND", change: "+12%", icon: <FiDollarSign /> },
    { id: 2, title: "Nouveaux clients", value: "56", change: "+5%", icon: <FiUsers /> },
    { id: 3, title: "Commandes", value: "124", change: "+8%", icon: <FiShoppingCart /> },
    { id: 4, title: "Activité", value: "Élevée", change: "+22%", icon: <FiActivity /> }
  ];

  // Statistiques pour comptable
  const comptableStats = [
    { id: 1, title: "Entreprises gérées", value: "15", change: "+2", icon: <FiUsers /> },
    { id: 2, title: "Factures traitées", value: "87", change: "+12", icon: <FiFileText /> },
    { id: 3, title: "Revenus générés", value: "45,200 TND", change: "+18%", icon: <FiDollarSign /> },
    { id: 4, title: "Réclamations", value: "3", change: "-1", icon: <FiAlertCircle /> }
  ];

  // Activités récentes différentes selon le rôle
  const entrepriseActivities = [
    { id: 1, type: 'success', text: "Nouvelle commande #1256", time: "Il y a 2 heures", amount: "+1,200 TND" },
    { id: 2, type: 'warning', text: "Paiement en attente #1248", time: "Il y a 5 heures", amount: "+850 TND" },
    { id: 3, type: 'info', text: "Nouveau client enregistré", time: "Il y a 1 jour" }
  ];

  const comptableActivities = [
    { id: 1, type: 'success', text: "Facture validée #4587", time: "Il y a 1 heure", amount: "2,400 TND" },
    { id: 2, type: 'warning', text: "Réclamation à traiter #124", time: "Il y a 3 heures" },
    { id: 3, type: 'info', text: "Nouvelle entreprise ajoutée", time: "Il y a 2 jours" }
  ];

  const stats = userRole === 'entreprise' ? entrepriseStats : comptableStats;
  const activities = userRole === 'entreprise' ? entrepriseActivities : comptableActivities;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de Bord {userRole === 'comptable' ? 'Comptable' : 'Entreprise'}</h1>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.id} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
              <p className={`stat-change ${stat.change.startsWith('+') ? 'positive' : stat.change.startsWith('-') ? 'negative' : 'neutral'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique principal - différent selon le rôle */}
      <div className="chart-container">
        <h2>
          {userRole === 'entreprise' ? 'Ventes hebdomadaires' : 'Activité mensuelle'}
        </h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="ventes" 
                fill={userRole === 'entreprise' ? "#44745c" : "#3a7bd5"} 
                name={userRole === 'entreprise' ? "Ventes (TND)" : "Activité"} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dernières activités */}
      <div className="recent-activity">
        <h2>Dernières activités</h2>
        <div className="activity-list">
          {activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'success' ? '✓' : activity.type === 'warning' ? '!' : '+'}
              </div>
              <div className="activity-content">
                <p>{activity.text}</p>
                <small>{activity.time}</small>
              </div>
              {activity.amount && (
                <div className="activity-amount">{activity.amount}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section spécifique aux comptables */}
      {userRole === 'comptable' && (
        <div className="comptable-specific-section">
          <h2>Entreprises récentes</h2>
          <div className="mini-entreprise-list">
            {/* Ici vous pourriez afficher une liste réduite des dernières entreprises */}
            <div className="mini-entreprise-item">
              <span>Entreprise ABC</span>
              <span>5 factures ce mois</span>
            </div>
            <div className="mini-entreprise-item">
              <span>Entreprise XYZ</span>
              <span>2 réclamations</span>
            </div>
          </div>
        </div>
      )}

      {/* Section spécifique aux entreprises */}
      {userRole === 'entreprise' && (
        <div className="entreprise-specific-section">
          <h2>Statut des documents</h2>
          <div className="document-status">
            <div className="status-item">
              <span>Factures en attente</span>
              <span className="status-value">3</span>
            </div>
            <div className="status-item">
              <span>Devis à envoyer</span>
              <span className="status-value">2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;