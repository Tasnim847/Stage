import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiTrash2, FiLoader, FiPlus } from 'react-icons/fi';
import './Factures.css';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Récupération du token (localStorage ou sessionStorage)
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  // Extraction du rôle depuis le token
  let role = null;
if (token) {
  try {
    const decoded = jwtDecode(token);
    role = decoded.role || null;
  } catch (err) {
    console.error('Token decoding error:', err);
    role = null;
  }
}

  useEffect(() => {
    if (!token || !role) {
      setLoading(false);
      setError('Utilisateur non authentifié');
      return;
    }

    const fetchFactures = async () => {
      try {
        setLoading(true);
        setError('');

        // Choix de l’endpoint selon le rôle
        const endpoint = role === 'comptable'
          ? 'http://localhost:5000/api/factures/comptable/mes-factures'
          : 'http://localhost:5000/api/factures';


        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement des factures');
        }

        const result = await response.json();

        // Selon ta structure API : adapte ici
        // Exemple : { data: { factures: [...] } } ou { data: [...] }
        const data = result.data?.factures || result.data || [];

        setFactures(data);
      } catch (err) {
        console.error('Erreur fetchFactures:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [token, role]);

  // Filtrer les factures par client (exemple)
  const filteredFactures = factures.filter(facture =>
    facture.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="facture-container">
      <h1 className="facture-title">Liste des Factures</h1>

      <div className="facture-actions">
        <input
          type="text"
          placeholder="Rechercher une facture..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="facture-search"
        />
        <button className="add-button">
          <FiPlus /> Ajouter Facture
        </button>
      </div>

      {loading ? (
        <div className="loader">
          <FiLoader className="spin" size={24} />
          Chargement des factures...
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="facture-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant (€)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.length > 0 ? (
              filteredFactures.map(facture => (
                <tr key={facture.id}>
                  <td>{facture.id}</td>
                  <td>{facture.client_name || 'N/A'}</td>
                  <td>{facture.date_emission ? new Date(facture.date_emission).toLocaleDateString() : 'N/A'}</td>
                  <td>{facture.montant_ttc !== undefined ? facture.montant_ttc.toFixed(2) : '0.00'} DT</td>
                  <td>
                    <button className="edit-btn" title="Modifier"><FiEdit2 /></button>
                    <button className="delete-btn" title="Supprimer"><FiTrash2 /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Aucune facture trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Factures;
