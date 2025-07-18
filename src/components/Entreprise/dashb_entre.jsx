import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const DashbEntre = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Données pour le graphique circulaire
  const data = [
    { name: 'Développement', value: 400 },
    { name: 'Design', value: 300 },
    { name: 'Marketing', value: 200 },
    { name: 'Gestion', value: 100 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Tableau de bord Entreprise</h1>
        <div className="user-info">
          <span>Entreprise XYZ</span>
          <img src="https://via.placeholder.com/40" alt="Profile" />
        </div>
      </header>

      <nav className="dashboard-nav">
        <ul>
          <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Aperçu
          </li>
          <li className={activeTab === 'candidates' ? 'active' : ''} onClick={() => setActiveTab('candidates')}>
            Candidats
          </li>
          <li className={activeTab === 'challenges' ? 'active' : ''} onClick={() => setActiveTab('challenges')}>
            Challenges
          </li>
          <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
            Analytics
          </li>
        </ul>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Aperçu de l'entreprise</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Candidats</h3>
                <p>156</p>
              </div>
              <div className="stat-card">
                <h3>Challenges actifs</h3>
                <p>7</p>
              </div>
              <div className="stat-card">
                <h3>Embauches</h3>
                <p>12</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Actions rapides</h3>
              <button className="btn">Créer un challenge</button>
              <button className="btn">Voir les candidats</button>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="candidates-section">
            <h2>Candidats récents</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Compétences</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jean Dupont</td>
                  <td>React, Node.js</td>
                  <td>92%</td>
                  <td>À contacter</td>
                </tr>
                <tr>
                  <td>Marie Martin</td>
                  <td>UI/UX, Figma</td>
                  <td>88%</td>
                  <td>Entretien</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>Analytics</h2>
            <div className="chart-container">
              <PieChart width={400} height={400}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashbEntre;