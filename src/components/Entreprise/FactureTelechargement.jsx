import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiDownload, FiLoader } from 'react-icons/fi';

const FactureTelechargement = ({ facture }) => {
  const factureRef = useRef();
  const [isPreparing, setIsPreparing] = useState(false);

  const handleDownload = useReactToPrint({
    content: () => factureRef.current,
    documentTitle: `Facture_${facture.numero || facture.id}`,
    onBeforeGetContent: () => {
      console.log('Préparation du contenu pour impression...');
      setIsPreparing(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Impression terminée');
      setIsPreparing(false);
    },
    onPrintError: (errorLocation, error) => {
      console.error('Erreur lors de l\'impression:', errorLocation, error);
      setIsPreparing(false);
    }
  });

  // Fonction pour formater la date au format français
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour formater les montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <>
      <button 
        className={`btn-action btn-primary ${isPreparing ? 'loading' : ''}`}
        onClick={handleDownload}
        disabled={isPreparing}
      >
        {isPreparing ? <FiLoader className="spinner" /> : <FiDownload />}
        {isPreparing ? 'Préparation...' : 'Télécharger PDF'}
      </button>

      {/* Styles d'impression */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .facture-print, .facture-print * {
              visibility: visible;
            }
            .facture-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>

      {/* Contenu à imprimer - rendu mais caché */}
      <div ref={factureRef} style={{ display: 'none' }}>
        <div  className="facture-print">
          <div style={{ 
            fontFamily: 'Arial, sans-serif', 
            maxWidth: '800px', 
            margin: '0 auto',
            padding: '20px'
          }}>
            {/* En-tête de la facture */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '28px', margin: '0' }}>Le petit potager</h1>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>113, Rue de Saint d'Or</p>
              <p style={{ margin: '5px 0' }}>Pergo Saint Diderot au Mont d'Or</p>
              <p style={{ margin: '5px 0' }}>Est: 09 62 62 59 38</p>
              <p style={{ margin: '5px 0' }}>Email: clichature@gmail.com</p>
            </div>

            <hr style={{ margin: '20px 0', border: '1px solid #ddd' }} />

            {/* Numéro de facture et titre */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', margin: '0' }}>Facture N° {facture.numero || facture.id}</h2>
              <h3 style={{ fontSize: '16px', margin: '5px 0' }}>Location de fruits et légumes</h3>
            </div>

            {/* Informations du client */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Client</h4>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{facture.client_name || 'Non spécifié'}</p>
              {facture.client_adresse && <p style={{ margin: '5px 0' }}>{facture.client_adresse}</p>}
              {facture.client_code_postal && facture.client_ville && (
                <p style={{ margin: '5px 0' }}>{facture.client_code_postal} {facture.client_ville}</p>
              )}
            </div>

            {/* Détails de la facture */}
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Date d'émission:</strong> {formatDate(facture.date_emission)}</p>
              <p><strong>Date d'échéance:</strong> {formatDate(facture.date_echeance)}</p>
              {facture.date_paiement && (
                <p><strong>Date de paiement:</strong> {formatDate(facture.date_paiement)}</p>
              )}
              <p><strong>Statut:</strong> {facture.statut_paiement || 'Inconnu'}</p>
            </div>

            {/* Tableau des produits */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              marginBottom: '20px' 
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #ddd',
                    fontWeight: 'bold'
                  }}>Description</th>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #ddd',
                    fontWeight: 'bold'
                  }}>Quantité</th>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #ddd',
                    fontWeight: 'bold'
                  }}>Prix Unitaire HT</th>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #ddd',
                    fontWeight: 'bold'
                  }}>TVA</th>
                  <th style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #ddd',
                    fontWeight: 'bold'
                  }}>Total HT</th>
                </tr>
              </thead>
              <tbody>
                {facture.lignesFacture && facture.lignesFacture.map((ligne, index) => {
                  const totalHT = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                  
                  return (
                    <tr key={index}>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #ddd'
                      }}>{ligne.description || 'Article sans description'}</td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd'
                      }}>{ligne.quantite || 0} {ligne.unite || 'unité'}</td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd'
                      }}>{formatCurrency(ligne.prix_unitaire_ht || 0)}</td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd'
                      }}>{ligne.taux_tva || 5.5}%</td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd'
                      }}>{formatCurrency(totalHT)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Section des totaux */}
            <div style={{ 
              marginTop: '30px', 
              padding: '15px', 
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Total HT</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>TVA</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Total TTC</p>
                  {facture.montant_paye > 0 && (
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Montant payé</p>
                  )}
                  {facture.montant_paye > 0 && (
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Reste à payer</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '5px 0' }}>{formatCurrency(facture.montant_ht || facture.totals?.montantHT)}</p>
                  <p style={{ margin: '5px 0' }}>{formatCurrency(facture.montant_tva || facture.totals?.tva)}</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{formatCurrency(facture.montant_ttc || facture.totals?.montantTTC)}</p>
                  {facture.montant_paye > 0 && (
                    <p style={{ margin: '5px 0', color: 'green' }}>{formatCurrency(facture.montant_paye)}</p>
                  )}
                  {facture.montant_paye > 0 && (
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                      {formatCurrency(facture.montant_ttc - facture.montant_paye)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mentions légales */}
            <div style={{ 
              marginTop: '30px', 
              fontSize: '12px', 
              borderTop: '1px solid #ddd',
              paddingTop: '15px'
            }}>
              <p>En cas de retard de paiement, indemnité forfaitaire pour frais de recouvrement, de 40 euros (art. L.441-3 et L.441-6 code du commerce).</p>
              <p>Membre d'un centre de gestion agréé, le règlement par chèque est accepté.</p>
            </div>

            {/* Pied de page */}
            <div style={{ 
              marginTop: '40px', 
              textAlign: 'center', 
              fontSize: '12px',
              borderTop: '1px solid #ddd',
              paddingTop: '15px'
            }}>
              <p>À {facture.entreprise?.ville || 'Saint Diderot'} le {formatDate(facture.date_emission)}</p>
              <p>www.lepetitpotager.org</p>
              <p>EDIR, au capital de 1000 € - AMF 5450R - Siret 449 856 217 000 14 - N° de TVA Intracom FR 00 449565217</p>
            </div>
          </div>
        </div>
      </div>
    </>
    
  );
  
};

export default FactureTelechargement;