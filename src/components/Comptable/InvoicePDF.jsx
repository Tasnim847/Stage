import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FiDownload, FiLoader } from 'react-icons/fi';

const InvoicePDF = ({ facture, entreprise, onDownloadComplete, displayMode = 'download' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef(null);

  // Calculs des montants avec remise
  const montantHT = parseFloat(facture.montant_ht || 0);
  const tauxRemise = parseFloat(facture.remise || 0);
  const montantRemise = montantHT * (tauxRemise / 100);
  const montantApresRemise = montantHT - montantRemise;
  const montantTVA = montantApresRemise * (parseFloat(facture.tva || 20) / 100);
  const montantTTC = montantApresRemise + montantTVA;

  // Fonction pour générer et télécharger le PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary div to render the invoice for capture
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '25mm';
      tempDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      tempDiv.style.color = '#2c3e50';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.boxSizing = 'border-box';
      
      // Render the invoice content to the temporary div
      tempDiv.innerHTML = document.getElementById('invoice-template').innerHTML;
      document.body.appendChild(tempDiv);
      
      // Wait a brief moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capturer le contenu en tant qu'image
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove the temporary div
      document.body.removeChild(tempDiv);
      
      // Créer le PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
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

  // Render the invoice content
  const renderInvoiceContent = () => (
    <div 
      ref={invoiceRef}
      id="invoice-template"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '25mm',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#2c3e50',
        backgroundColor: 'white',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #f8f9fa', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#2c3e50', margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700' }}>INVOICE</h1>
            <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>{entreprise?.nom || 'Company Name'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: '#2c3e50', color: 'white', padding: '10px 15px', display: 'inline-block', borderRadius: '4px' }}>
              <strong>Invoice #{facture.numero || 'N/A'}</strong>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ flex: '1' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Bill to:</h3>
          <p style={{ margin: '8px 0', fontWeight: '600' }}>{facture.client_name || 'Client Name'}</p>
        </div>
        
        <div style={{ flex: '1', textAlign: 'right' }}>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Details:</h3>
            <p style={{ margin: '8px 0' }}><strong>Invoice Date:</strong> {facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
            {facture.reference && <p style={{ margin: '8px 0' }}><strong>Reference:</strong> {facture.reference}</p>}
          </div>
        </div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Unit Price</th>
            <th style={{ textAlign: 'center', padding: '15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(facture.lignesFacture || []).map((ligne, index) => (
            <tr key={index} style={index % 2 === 0 ? { background: '#f8f9fa' } : {}}>
              <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', verticalAlign: 'top' }}>{ligne.description || 'Item description'}</td>
              <td style={{ textAlign: 'right', padding: '15px', borderBottom: '1px solid #e9ecef', verticalAlign: 'top' }}>DT {parseFloat(ligne.prix_unitaire_ht || 0).toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '15px', borderBottom: '1px solid #e9ecef', verticalAlign: 'top' }}>{ligne.quantite || 1}</td>
              <td style={{ textAlign: 'right', padding: '15px', borderBottom: '1px solid #e9ecef', verticalAlign: 'top' }}>DT {(parseFloat(ligne.prix_unitaire_ht || 0) * parseInt(ligne.quantite || 1)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ width: '50%', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 0', borderBottom: '1px solid #e9ecef' }}>
          <span>Subtotal</span>
          <span>DT {montantHT.toFixed(2)}</span>
        </div>
        
        {tauxRemise > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 0', borderBottom: '1px solid #e9ecef' }}>
            <span>Remise ({tauxRemise}%)</span>
            <span>-DT {montantRemise.toFixed(2)}</span>
          </div>
        )}
        
        {tauxRemise > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 0', borderBottom: '1px solid #e9ecef' }}>
            <span>Total après remise</span>
            <span>DT {montantApresRemise.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 0', borderBottom: '1px solid #e9ecef' }}>
          <span>TVA ({facture.tva || 20}%)</span>
          <span>DT {montantTVA.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '15px 0', fontSize: '18px', fontWeight: '700', borderTop: '2px solid #2c3e50' }}>
          <span>TOTAL TTC</span>
          <span>DT {montantTTC.toFixed(2)}</span>
        </div>
      </div>
      
      {entreprise && (
        <div style={{ marginTop: '50px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}>Payment Information</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {entreprise.nom && <div style={{ flex: '1', minWidth: '200px', marginBottom: '10px' }}><strong>Account Name:</strong> {entreprise.nom}</div>}
            {entreprise.iban && <div style={{ flex: '1', minWidth: '200px', marginBottom: '10px' }}><strong>IBAN:</strong> {entreprise.iban}</div>}
            {entreprise.bic && <div style={{ flex: '1', minWidth: '200px', marginBottom: '10px' }}><strong>BIC/SWIFT:</strong> {entreprise.bic}</div>}
            {entreprise.numeroIdentificationFiscale && <div style={{ flex: '1', minWidth: '200px', marginBottom: '10px' }}><strong>Tax ID:</strong> {entreprise.numeroIdentificationFiscale}</div>}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e9ecef', textAlign: 'center', color: '#7f8c8d', fontSize: '12px' }}>
        <p>Thank you for your business!</p>
        <p>{entreprise?.nom || 'Contact_Invoice'} | {entreprise?.email || 'Invoice_app@gmail.com'}</p>
      </div>
    </div>
  );

  if (displayMode === 'preview') {
    return (
      <div style={{
        width: '100%',
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '25mm',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: '#2c3e50',
          backgroundColor: 'white',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          margin: '0 auto'
        }}>
          {renderInvoiceContent()}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Always render the invoice content but hidden for PDF generation */}
      <div style={{ display: 'none' }}>
        {renderInvoiceContent()}
      </div>
      
      <button 
        className="action-btn download" 
        title="Download Invoice as PDF"
        onClick={generatePDF}
        disabled={isGenerating}
        style={{ 
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isGenerating ? '#ccc' : 'transparent',
          color: isGenerating ? '#ccc' : '#2c3e50',
          border: 'none',
          borderRadius: '4px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          transition: 'all 0.2s ease'
        }}
      >
        {isGenerating ? (
          <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <FiDownload />
        )}
      </button>
    </>
  );
};
 
export default InvoicePDF;