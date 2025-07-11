export const devisTemplate = ({ entreprise, devis }) => {
    const formatMontant = (montant) => {
        return parseFloat(montant || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' €';
    };

    const montantHT = parseFloat(devis.montant_ht || 0);
    const montantRemise = devis.remise > 0 ? (montantHT * devis.remise / 100) : 0;
    const montantTVA = parseFloat(devis.montant_ttc || 0) - montantHT;
    const montantTTC = parseFloat(devis.montant_ttc || 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Devis ${devis.numero || 'N°0000'}</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
    }
    
    .document-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
      align-items: center;
    }
    
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .logo-section {
      text-align: right;
    }
    
    .logo-img {
      max-width: 150px;
      max-height: 100px;
      object-fit: contain;
    }
    
    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .client-section {
      margin-top: 2rem;
      border-top: 1px solid #e0e0e0;
      padding-top: 1.5rem;
    }
    
    h1 {
      color: #2c3e50;
      text-align: center;
      font-size: 1.5rem;
      margin: 1.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #3498db;
    }
    
    .devis-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding: 0.8rem;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    
    th {
      background-color: #2c3e50;
      color: white;
      text-align: left;
      padding: 0.8rem;
    }
    
    td {
      padding: 0.8rem;
      border-bottom: 1px solid #e0e0e0;
    }
    
    tr:last-child td {
      border-bottom: 2px solid #2c3e50;
    }
    
    .totals {
      float: right;
      width: 300px;
      margin-top: 1rem;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 0.5rem 0;
    }
    
    .total-label {
      font-weight: 600;
    }
    
    .total-amount {
      font-weight: 700;
    }
    
    .ttc {
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .payment-terms {
      margin-top: 2.5rem;
      padding: 1rem;
      background-color: #f9f9f9;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .signature-area {
      margin-top: 3rem;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-line {
      width: 200px;
      border-top: 1px solid #7f8c8d;
      padding-top: 2rem;
      text-align: center;
    }
    
    .validity {
      margin-top: 1.5rem;
      font-style: italic;
      color: #7f8c8d;
      font-size: 0.9rem;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 12pt;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <div class="info-section">
      <div class="brand-name">${entreprise.nom || 'Nom entreprise'}</div>
      <div>${entreprise.adresse_complete || 'Adresse non renseignée'}</div>
      ${entreprise.telephone ? `<div>Tél: ${entreprise.telephone}</div>` : ''}
      ${entreprise.email ? `<div>Email: ${entreprise.email}</div>` : ''}
      ${entreprise.siret ? `<div>SIRET: ${entreprise.siret}</div>` : ''}
    </div>
    
    <div class="logo-section">
      ${entreprise.logo ? `<img src="${entreprise.logo}" class="logo-img" alt="Logo ${entreprise.nom || ''}">` : ''}
    </div>
  </div>

  <div class="client-section">
    <h2>À l'attention de :</h2>
    <div>${devis.client_name || 'Client non spécifié'}</div>
    ${devis.client_email ? `<div>${devis.client_email}</div>` : ''}
    ${devis.client_address ? `<div>${devis.client_address}</div>` : ''}
  </div>

  <h1>DEVIS N° ${devis.numero || '0000'}</h1>
  
  <div class="devis-meta">
    <div>Date : ${new Date(devis.date_creation).toLocaleDateString('fr-FR')}</div>
    <div>Validité : ${devis.date_validite ? new Date(devis.date_validite).toLocaleDateString('fr-FR') : '30 jours'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Prix unitaire HT</th>
        <th>Quantité</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${devis.lignes.map(ligne => `
        <tr>
          <td>${ligne.description || 'Non spécifié'}</td>
          <td>${formatMontant(ligne.prix_unitaire_ht)}</td>
          <td>${ligne.quantite || 1} ${ligne.unite || 'unité'}</td>
          <td>${formatMontant((parseFloat(ligne.prix_unitaire_ht || 0) * parseFloat(ligne.quantite || 1)))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">Total HT :</span>
      <span>${formatMontant(montantHT)}</span>
    </div>
    
    ${devis.remise > 0 ? `
    <div class="total-row">
      <span class="total-label">Remise (${devis.remise}%) :</span>
      <span>-${formatMontant(montantRemise)}</span>
    </div>
    ` : ''}
    
    <div class="total-row">
      <span class="total-label">TVA (${devis.tva || 20}%) :</span>
      <span>${formatMontant(montantTVA)}</span>
    </div>
    
    <div class="total-row ttc">
      <span class="total-label">Total TTC :</span>
      <span class="total-amount">${formatMontant(montantTTC)}</span>
    </div>
  </div>

  <div class="payment-terms">
    <h3>Conditions de paiement</h3>
    <p>Paiement par virement bancaire dans les 30 jours</p>
    ${entreprise.iban ? `<p>IBAN: ${entreprise.iban}</p>` : '<p>IBAN: Non spécifié</p>'}
  </div>

  <div class="validity">
    Ce devis est valable ${devis.date_validite ? `jusqu'au ${new Date(devis.date_validite).toLocaleDateString('fr-FR')}` : '30 jours'} à compter de sa date d'émission
  </div>

  <div class="signature-area">
    <div>
      <p>Fait à ${entreprise.ville || 'Ville non spécifiée'}, le ${new Date(devis.date_creation).toLocaleDateString('fr-FR')}</p>
    </div>
    <div class="signature-line">
      Signature
    </div>
  </div>
</body>
</html>
`;
};