import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FiDownload, FiLoader } from 'react-icons/fi';

const InvoicePDF = ({ facture, entreprise, onDownloadComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fonction pour générer et télécharger le PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Créer un élément div pour le rendu HTML de la facture
      const invoiceElement = document.createElement('div');
      invoiceElement.style.width = '210mm'; // Format A4
      invoiceElement.style.minHeight = '297mm';
      invoiceElement.style.padding = '25mm';
      invoiceElement.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      invoiceElement.style.color = '#2c3e50';
      invoiceElement.style.backgroundColor = 'white';
      invoiceElement.style.boxSizing = 'border-box';
      
      // Générer le contenu HTML de la facture avec un design amélioré
      invoiceElement.innerHTML = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #f8f9fa; padding-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="color: #2c3e50; margin: 0 0 5px 0; font-size: 32px; font-weight: 700;">INVOICE</h1>
              <p style="margin: 0; color: #7f8c8d; font-size: 14px;">${entreprise?.nom || 'Company Name'}</p>
            </div>
            <div style="text-align: right;">
              <div style="background: #2c3e50; color: white; padding: 10px 15px; display: inline-block; border-radius: 4px;">
                <strong>Invoice #${facture.numero || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="flex: 1;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Bill to:</h3>
            <p style="margin: 8px 0; font-weight: 600;">${facture.client_name || 'Client Name'}</p>
            ${facture.client_address ? `<p style="margin: 8px 0;">${facture.client_address}</p>` : ''}
            ${facture.client_email ? `<p style="margin: 8px 0;">${facture.client_email}</p>` : ''}
          </div>
          
          <div style="flex: 1; text-align: right;">
            <div style="display: inline-block; text-align: left;">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Details:</h3>
              <p style="margin: 8px 0;"><strong>Invoice Date:</strong> ${facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
              ${facture.reference ? `<p style="margin: 8px 0;"><strong>Reference:</strong> ${facture.reference}</p>` : ''}
            </div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="text-align: left; padding: 15px; border-bottom: 2px solid #e9ecef; font-weight: 600;">Description</th>
              <th style="text-align: right; padding: 15px; border-bottom: 2px solid #e9ecef; font-weight: 600;">Unit Price</th>
              <th style="text-align: center; padding: 15px; border-bottom: 2px solid #e9ecef; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding: 15px; border-bottom: 2px solid #e9ecef; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(facture.lignesFacture || []).map((ligne, index) => `
              <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 15px; border-bottom: 1px solid #e9ecef; vertical-align: top;">${ligne.description || 'Item description'}</td>
                <td style="text-align: right; padding: 15px; border-bottom: 1px solid #e9ecef; vertical-align: top;">DT ${parseFloat(ligne.prix_unitaire_ht || 0).toFixed(2)}</td>
                <td style="text-align: center; padding: 15px; border-bottom: 1px solid #e9ecef; vertical-align: top;">${ligne.quantite || 1}</td>
                <td style="text-align: right; padding: 15px; border-bottom: 1px solid #e9ecef; vertical-align: top;">DT ${(parseFloat(ligne.prix_unitaire_ht || 0) * parseInt(ligne.quantite || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="width: 50%; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
            <span>Subtotal</span>
            <span>DT ${(facture.montant_ht || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
            <span>Tax (${facture.taux_tva ? (facture.taux_tva * 100) + '%' : 'N/A'})</span>
            <span>DT ${((facture.montant_ttc || 0) - (facture.montant_ht || 0)).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px 0; font-size: 18px; font-weight: 700; border-top: 2px solid #2c3e50;">
            <span>TOTAL</span>
            <span>DT ${(facture.montant_ttc || 0).toFixed(2)}</span>
          </div>
        </div>
        
        ${entreprise ? `
        <div style="margin-top: 50px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px;">Payment Information</h3>
          <div style="display: flex; flex-wrap: wrap;">
            ${entreprise.nom ? `<div style="flex: 1; min-width: 200px; margin-bottom: 10px;"><strong>Account Name:</strong> ${entreprise.nom}</div>` : ''}
            ${entreprise.iban ? `<div style="flex: 1; min-width: 200px; margin-bottom: 10px;"><strong>IBAN:</strong> ${entreprise.iban}</div>` : ''}
            ${entreprise.bic ? `<div style="flex: 1; min-width: 200px; margin-bottom: 10px;"><strong>BIC/SWIFT:</strong> ${entreprise.bic}</div>` : ''}
            ${entreprise.numeroIdentificationFiscale ? `<div style="flex: 1; min-width: 200px; margin-bottom: 10px;"><strong>Tax ID:</strong> ${entreprise.numeroIdentificationFiscale}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>${entreprise?.nom || 'Company Name'} | ${entreprise?.email || 'email@company.com'} | ${entreprise?.telephone || ''}</p>
        </div>
      `;
      
      // Ajouter l'élément au document pour le rendu
      document.body.appendChild(invoiceElement);
      
      // Capturer le contenu en tant qu'image
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Nettoyer
      document.body.removeChild(invoiceElement);
      
      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${facture.numero || 'unknown'}.pdf`);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      className="action-btn download" 
      title="Download Invoice as PDF"
      onClick={generatePDF}
      disabled={isGenerating}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '10px 15px',
        backgroundColor: isGenerating ? '#ccc' : '#2c3e50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s ease'
      }}
    >
      {isGenerating ? (
        <>
          <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <FiDownload />
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
};

export default InvoicePDF;