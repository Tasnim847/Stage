import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FiFileText, FiPlusCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, 
  FiX, FiDownload, FiPrinter, FiEdit, FiClock, FiDollarSign, FiUser, 
  FiCalendar, FiCheckCircle, FiAlertCircle, FiInfo, FiChevronUp,
  FiEye, FiDownloadCloud
} from 'react-icons/fi';
import './Entreprise.css';

const Facture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [factures, setFactures] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 9,
    totalItems: 0
  });
  const [aiInsights, setAiInsights] = useState([]);
  const [visibleSections, setVisibleSections] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const modalBodyRef = useRef(null);

  // Get context
  const context = useOutletContext();
  const { darkMode } = context || {};
  
  if (!context || !context.userData) {
    return (
      <div className={`loading-container ${darkMode ? 'dark' : ''}`}>
        <div className="spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  const { userData } = context;

  const fetchFactures = async (page = 1) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/factures', {
        params: {
          page: page,
          limit: pagination.itemsPerPage
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.data?.success) {
        setFactures(response.data.data.factures);
        setPagination({
          currentPage: page,
          totalPages: response.data.data.pagination.totalPages,
          itemsPerPage: response.data.data.pagination.itemsPerPage,
          totalItems: response.data.data.pagination.totalItems
        });
      } else {
        throw new Error(response.data?.message || "Invalid data received from server");
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message || "Error loading invoices");
      
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFactureDetails = async (factureId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`/api/factures/${factureId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.data?.success) {
        const factureData = response.data.data;
        setSelectedFacture(factureData);
        setShowDetails(true);
        
        // Generate AI insights based on invoice data
        generateAiInsights(factureData);
      } else {
        throw new Error(response.data?.message || "Invalid data received from server");
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message || "Error loading invoice details");
    }
  };

  const downloadFacturePDF = async (factureId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      setLoading(true);
    
      // First try the specific endpoint for PDF
      try {
        const response = await axios.get(`/api/factures/${factureId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'blob'
        });
      
        // Check if it's really a PDF
        if (response.headers['content-type'] === 'application/pdf') {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
        
          // File name with invoice number
          const facture = factures.find(f => f.id === factureId);
          const fileName = `facture-${facture?.numero || factureId}.pdf`;
          link.setAttribute('download', fileName);
        
          document.body.appendChild(link);
          link.click();
        
          // Clean up
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch (pdfError) {
        console.log('Specific PDF endpoint not available, client-side generation...');
      }
    
      // If PDF endpoint is not available, get data and generate PDF client-side
      try {
        const response = await axios.get(`/api/factures/${factureId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
       });
      
        if (response.data?.success) {
          const factureData = response.data.data;
          await generateAndDownloadPDF(factureData, factureId);
        } else {
          throw new Error("Unable to retrieve invoice data");
        }
      } catch (dataError) {
        console.error('Error retrieving invoice data:', dataError);
        setError("Error retrieving invoice data");
      }
    
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || err.message || "Error downloading PDF");
    } finally {
      setLoading(false);
    }
  };

  // Function to generate and download a real PDF
  const generateAndDownloadPDF = async (factureData, factureId) => {
    const facture = factureData;
  
    // Calculate totals if necessary
    const montantHT = facture.montant_ht || facture.totals?.montantHT || 
      (facture.lignesFacture ? facture.lignesFacture.reduce((sum, ligne) => 
      sum + ((ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0)), 0) : 0);
  
    const montantTVA = facture.montant_tva || facture.totals?.tva || 0;
    const montantTTC = facture.montant_ttc || facture.totals?.montantTTC || montantHT + montantTVA;

    try {
      // Import jsPDF
      const { jsPDF } = await import('jspdf');
    
      // Create a new PDF document
      const doc = new jsPDF();
    
      // Add logo or title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('INVOICE', 105, 20, { align: 'center' });
    
      doc.setFontSize(14);
      doc.text(`No. ${facture.numero || factureId}`, 105, 30, { align: 'center' });
    
      doc.setFontSize(10);
      doc.text(`Issue date: ${formatDate(facture.date_emission)}`, 105, 40, { align: 'center' });
    
      // Company information
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text('ISSUER', 20, 60);
    
      doc.setFontSize(10);
      if (facture.entreprise) {
        doc.text(facture.entreprise.nom || 'Not specified', 20, 70);
        doc.text(facture.entreprise.adresse || '', 20, 80);
        doc.text(`Tel: ${facture.entreprise.telephone || ''}`, 20, 90);
        doc.text(`Email: ${facture.entreprise.email || ''}`, 20, 100);
      }
    
      // Client information
      doc.setFontSize(12);
      doc.text('CLIENT', 140, 60);
    
      doc.setFontSize(10);
      doc.text(facture.client_name || 'Not specified', 140, 70);
    
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 110, 190, 110);
    
      // Item details
      doc.setFontSize(12);
      doc.text('INVOICE DETAILS', 20, 125);
    
      // Prepare table data - simple version without autoTable
      let yPosition = 140;
    
      // Table header
      doc.setFillColor(44, 62, 80);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.rect(20, yPosition, 170, 10, 'F');
      doc.text('Description', 25, yPosition + 7);
      doc.text('Quantity', 100, yPosition + 7);
      doc.text('Price HT', 130, yPosition + 7);
      doc.text('Total HT', 160, yPosition + 7);
    
      yPosition += 12;
    
      // Table data
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
    
      if (facture.lignesFacture && facture.lignesFacture.length > 0) {
        facture.lignesFacture.forEach((ligne, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
          }
        
        const description = ligne.description || 'Item without description';
        const quantite = `${ligne.quantite || 0} ${ligne.unite || 'unit'}`;
        const prix = formatCurrency(ligne.prix_unitaire_ht || 0);
        const total = formatCurrency((ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0));
        
        // Description (with long text handling)
        const maxWidth = 70;
        let descLines = doc.splitTextToSize(description, maxWidth);
        doc.text(descLines, 25, yPosition + 4);
        
        // Other columns
        doc.text(quantite, 100, yPosition + 4);
        doc.text(prix, 130, yPosition + 4);
        doc.text(total, 160, yPosition + 4);
        
        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition + 8, 190, yPosition + 8);
        
        yPosition += 12;
      });
    } else {
      doc.text('No items', 25, yPosition + 4);
      yPosition += 12;
    }
    
    // Totals
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    doc.text('Total HT:', 130, yPosition + 10);
    doc.text(formatCurrency(montantHT), 160, yPosition + 10, { align: 'right' });
    
    doc.text('VAT:', 130, yPosition + 20);
    doc.text(formatCurrency(montantTVA), 160, yPosition + 20, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Total TTC:', 130, yPosition + 30);
    doc.text(formatCurrency(montantTTC), 160, yPosition + 30, { align: 'right' });
    
    // Status information
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Status: ${facture.statut_paiement || 'Unknown'}`, 20, yPosition + 50);
    
    if (facture.date_echeance) {
      doc.text(`Due date: ${formatDate(facture.date_echeance)}`, 20, yPosition + 60);
    }
    
    // Notes
    if (facture.notes) {
      const notesLines = doc.splitTextToSize(`Notes: ${facture.notes}`, 170);
      doc.text(notesLines, 20, yPosition + 70);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice generated on ${new Date().toLocaleDateString('fr-FR')} | Invoice App`, 105, 280, { align: 'center' });
    
    // Save PDF
    const fileName = `facture-${facture.numero || factureId}.pdf`;
    doc.save(fileName);
    
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: use HTML printing method
      generatePDFClientSide(factureData, factureId);
    }
  };

  // Function to generate PDF client-side
  const generatePDFClientSide = (factureData, factureId) => {
    const facture = factureData;
    
    // Calculate totals if necessary
    const montantHT = facture.montant_ht || facture.totals?.montantHT || 
      (facture.lignesFacture ? facture.lignesFacture.reduce((sum, ligne) => 
        sum + ((ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0)), 0) : 0);
    
    const montantTVA = facture.montant_tva || facture.totals?.tva || 0;
    const montantTTC = facture.montant_ttc || facture.totals?.montantTTC || montantHT + montantTVA;

    // Create HTML content for printing/PDF
    const content = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${facture.numero || factureId}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #2c3e50; 
            margin: 0;
            font-size: 28px;
          }
          .company-info {
            margin-bottom: 30px;
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-weight: bold; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 8px; 
            margin-bottom: 15px;
            color: #2c3e50;
            font-size: 18px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
          }
          .total-row {
            font-weight: bold;
            background-color: #f8f9fa;
          }
          .text-right {
            text-align: right;
          }
          .amounts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
          }
          .amount-item {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .amount-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
          }
          .total {
            background-color: #e8f5e8;
            border-color: #4caf50;
          }
          .paid {
            color: #4caf50;
          }
          .remaining {
            color: #f44336;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #777;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .invoice-container {
              border: none;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>INVOICE</h1>
            <h2>${facture.numero || factureId}</h2>
            <p>Issue date: ${formatDate(facture.date_emission)}</p>
          </div>
          
          <div class="info-grid">
            <div class="section">
              <div class="section-title">Issuer</div>
              ${facture.entreprise ? `
                <div class="info-item">
                  <div class="info-label">Company:</div>
                  <div>${facture.entreprise.nom || 'Not specified'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Address:</div>
                  <div>${facture.entreprise.adresse || 'Not specified'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone:</div>
                  <div>${facture.entreprise.telephone || 'Not specified'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email:</div>
                  <div>${facture.entreprise.email || 'Not specified'}</div>
                </div>
              ` : ''}
            </div>
            
            <div class="section">
              <div class="section-title">Client</div>
              <div class="info-item">
                <div class="info-label">Name:</div>
                <div>${facture.client_name || 'Not specified'}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Invoice Details</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit price HT</th>
                  <th>Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${facture.lignesFacture ? facture.lignesFacture.map((ligne, index) => {
                  const totalHT = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                  return `
                    <tr>
                      <td>${ligne.description || 'Item without description'}</td>
                      <td>${ligne.quantite || 0} ${ligne.unite || 'unit'}</td>
                      <td>${formatCurrency(ligne.prix_unitaire_ht || 0)}</td>
                      <td>${formatCurrency(totalHT)}</td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="4">No items</td></tr>'}
              </tbody>
            </table>
          </div>
          
          <div class="amounts-grid">
            <div class="amount-item">
              <div class="amount-label">Total HT:</div>
              <div>${formatCurrency(montantHT)}</div>
            </div>
            
            <div class="amount-item">
              <div class="amount-label">VAT:</div>
              <div>${formatCurrency(montantTVA)}</div>
            </div>
            
            <div class="amount-item total">
              <div class="amount-label">Total TTC:</div>
              <div>${formatCurrency(montantTTC)}</div>
            </div>
            
            <div class="amount-item">
              <div class="amount-label">Status:</div>
              <div>${facture.statut_paiement || 'Unknown'}</div>
            </div>
          </div>
          
          ${facture.date_echeance ? `
            <div class="section">
              <div class="section-title">Due Date</div>
              <p>Due date: ${formatDate(facture.date_echeance)}</p>
            </div>
          ` : ''}
          
          ${facture.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <p>${facture.notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Invoice generated on ${new Date().toLocaleDateString('fr-FR')} | Invoice App</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Open a new window for printing/downloading
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load
    printWindow.onload = () => {
      // Give time for CSS to apply
      setTimeout(() => {
        printWindow.print();
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 500);
    };
  };

  const generateAiInsights = (facture) => {
    const insights = [];
    
    // Payment status analysis
    if (facture.statut_paiement === 'impayé') {
      const joursImpayes = Math.floor((new Date() - new Date(facture.date_echeance)) / (1000 * 60 * 60 * 24));
      if (joursImpayes > 30) {
        insights.push({
          type: 'warning',
          message: `Invoice unpaid for ${joursImpayes} days. Consider urgent reminder.`,
          icon: <FiAlertCircle />
        });
      }
    }
    
    // Payment delay analysis
    if (facture.statut_paiement === 'payé' && facture.date_paiement) {
      const delaiPaiement = Math.floor((new Date(facture.date_paiement) - new Date(facture.date_emission)) / (1000 * 60 * 60 * 24));
      if (delaiPaiement <= 15) {
        insights.push({
          type: 'success',
          message: `Excellent payment delay: ${delaiPaiement} days.`,
          icon: <FiCheckCircle />
        });
      }
    }
    
    // Amount analysis
    if (facture.montant_ttc > 10000) {
      insights.push({
        type: 'info',
        message: 'Important invoice. Check payment conditions.',
        icon: <FiInfo />
      });
    }
    
    // Next actions suggestion
    if (facture.statut_paiement === 'brouillon') {
      insights.push({
        type: 'info',
        message: 'Invoice in draft. Finalize and send to client.',
        icon: <FiEdit />
      });
    }
    
    setAiInsights(insights);
  };

  // Observe sections for scroll animation
  useEffect(() => {
    if (showDetails && modalBodyRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section');
              setVisibleSections(prev => [...prev, sectionId]);
            }
          });
        },
        { threshold: 0.1 }
      );

      const sections = modalBodyRef.current.querySelectorAll('.detail-section');
      sections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        observer.observe(section);
      });

      return () => observer.disconnect();
    }
  }, [showDetails]);

  // Handle display of "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      if (modalBodyRef.current) {
        setShowBackToTop(modalBodyRef.current.scrollTop > 300);
      }
    };

    if (modalBodyRef.current) {
      modalBodyRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (modalBodyRef.current) {
        modalBodyRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showDetails]);

  useEffect(() => {
    fetchFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 3
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'payé':
      case 'payee':
        return 'status-paid';
      case 'impayé':
      case 'impayee':
        return 'status-unpaid';
      case 'partiel':
        return 'status-partial';
      case 'brouillon':
        return 'status-draft';
      default:
        return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FiInfo />;
    /*
    switch (status.toLowerCase()) {
      case 'payé':
      case 'payee':
        return <FiCheckCircle />;
      case 'impayé':
      case 'impayee':
        return <FiAlertCircle />;
      case 'partiel':
        return <FiClock />;
      case 'brouillon':
        return <FiEdit />;
      default:
        return <FiInfo />;
    }*/
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedFacture(null);
    setAiInsights([]);
    setVisibleSections([]);
  };

  const scrollToTop = () => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSection = (sectionId) => {
    if (modalBodyRef.current) {
      const section = modalBodyRef.current.querySelector(`[data-section="${sectionId}"]`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <div className={`loading-container ${darkMode ? 'dark' : ''}`}>
        <div className="spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`error-container ${darkMode ? 'dark' : ''}`}>
        <div className="error-alert">
          <p>Error: {error}</p>
          <button 
            className={`btn-retry ${darkMode ? 'dark' : ''}`}
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`facture-container ${darkMode ? 'dark' : ''}`}>
      <div className="facture-header-container">
        <h2>Invoice Management</h2>
      
        <div className={`facture-filters ${darkMode ? 'dark' : ''}`}>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search by client, number..." 
              className={darkMode ? 'dark' : ''}
            />
            <button className={`btn-search ${darkMode ? 'dark' : ''}`}>Search</button>
          </div>
          <div className="filter-options">
            <select className={darkMode ? 'dark' : ''}>
              <option value="">All statuses</option>
              <option value="payé">Paid</option>
              <option value="impayé">Unpaid</option>
              <option value="partiel">Partial payment</option>
              <option value="brouillon">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className={`no-data ${darkMode ? 'dark' : ''}`}>
          <p>No invoices found</p>
          <button 
            className={`btn-refresh ${darkMode ? 'dark' : ''}`}
            onClick={() => fetchFactures()}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="facture-grid">
            {factures.map(facture => (
              <div key={facture.id} className={`facture-card ${darkMode ? 'dark' : ''}`}>
                <div className="card-header">
                  <div className="card-title-section">
                    <FiFileText className="card-icon" />
                    <h3>{facture.numero || facture.id}</h3>
                  </div>
                  <span className={`status-badge ${getStatusClass(facture.statut_paiement)} ${darkMode ? 'dark' : ''}`}>
                    {getStatusIcon(facture.statut_paiement)}
                    {facture.statut_paiement || 'Unknown'}
                  </span>
                </div>
                
                <div className="card-client">
                  <FiUser className="client-icon" />
                  <p>{facture.client_name || 'Client not specified'}</p>
                </div>
                
                <div className="card-dates">
                  <div className="date-item">
                    <FiCalendar className="date-icon" />
                    <div>
                      <small>Issue</small>
                      <p>{formatDate(facture.date_emission)}</p>
                    </div>
                  </div>
                  <div className="date-item">
                    <FiDollarSign className="amount-icon" />
                    <div>
                      <small>Amount TTC</small>
                      <p>{formatCurrency(facture.montant_ttc || facture.totals?.montantTTC)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button
                    className={`btn-icon btn-view ${darkMode ? 'dark' : ''}`}
                    onClick={() => fetchFactureDetails(facture.id)}
                    title="View details"
                  >
                    <FiEye className="icon" />
                  </button>
                  <button
                    className={`btn-icon btn-pdf ${darkMode ? 'dark' : ''}`}
                    onClick={() => downloadFacturePDF(facture.id)}
                    title="Download PDF"
                  >
                    <FiDownloadCloud className="icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`pagination-container ${darkMode ? 'dark' : ''}`}>
            <div className="pagination-controls">
              <button
                className={`btn-pagination ${darkMode ? 'dark' : ''}`}
                disabled={pagination.currentPage === 1}
                onClick={() => fetchFactures(pagination.currentPage - 1)}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`btn-page ${pagination.currentPage === pageNum ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
                      onClick={() => fetchFactures(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className={`btn-pagination ${darkMode ? 'dark' : ''}`}
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => fetchFactures(pagination.currentPage + 1)}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      {showDetails && selectedFacture && (
        <div className={`modal-overlay ${darkMode ? 'dark' : ''}`}>
          <div className={`modal-content ai-enhanced ${darkMode ? 'dark' : ''}`}>
            <div className="modal-header">
              <div className="modal-title-section">
                <FiFileText className="modal-title-icon" />
                <div>
                  <h3>Invoice #{selectedFacture.numero || selectedFacture.id}</h3>
                  <p className="modal-subtitle">Complete details</p>
                </div>
              </div>
              
              {/* Quick navigation menu */}
              <div className="quick-nav">
                <button onClick={() => scrollToSection('info')}>Information</button>
                <button onClick={() => scrollToSection('finance')}>Finances</button>
                {selectedFacture.lignesFacture && selectedFacture.lignesFacture.length > 0 && (
                  <button onClick={() => scrollToSection('articles')}>Items</button>
                )}
                {selectedFacture.entreprise && (
                  <button onClick={() => scrollToSection('entreprise')}>Company</button>
                )}
                {selectedFacture.notes && (
                  <button onClick={() => scrollToSection('notes')}>Notes</button>
                )}
                <button onClick={() => scrollToSection('tracking')}>Tracking</button>
              </div>
              
              <button className="modal-close" onClick={closeDetails}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body" ref={modalBodyRef}>
              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div 
                  className={`detail-section ${visibleSections.includes('ai') ? 'visible' : ''}`}
                  data-section="ai"
                >
                  <div className="ai-insights-section">
                    <div className="insights-grid">
                      {aiInsights.map((insight, index) => (
                        <div key={index} className={`insight-card insight-${insight.type}`}>
                          <div className="insight-icon">
                            {insight.icon}
                          </div>
                          <div className="insight-content">
                            <p>{insight.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="facture-details-grid">
                {/* COMPLETE General Information */}
                <div 
                  className={`detail-section info-section ${visibleSections.includes('info') ? 'visible' : ''}`}
                  data-section="info"
                >
                  <div className="section-header">
                    <FiInfo className="section-icon" />
                    <h4>General Information</h4>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiUser />
                        <span>Client</span>
                      </div>
                      <div className="detail-value">{selectedFacture.client_name || 'Not specified'}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiCalendar />
                        <span>Issue date</span>
                      </div>
                      <div className="detail-value">{formatDate(selectedFacture.date_emission)}</div>
                    </div>
                    
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        {getStatusIcon(selectedFacture.statut_paiement)}
                        <span>Status</span>
                      </div>
                      <div className={`detail-value status-indicator ${getStatusClass(selectedFacture.statut_paiement)}`}>
                        {selectedFacture.statut_paiement || 'Unknown'}
                      </div>
                    </div>
                    
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <FiFileText />
                        <span>Reference</span>
                      </div>
                      <div className="detail-value">{selectedFacture.numero || selectedFacture.id}</div>
                    </div>
                  </div>
                </div>

                {/* DETAILED Amounts */}
                <div 
                  className={`detail-section amount-section ${visibleSections.includes('finance') ? 'visible' : ''}`}
                  data-section="finance"
                >
                  <div className="section-header">
                    <FiDollarSign className="section-icon" />
                    <h4>Financial Details</h4>
                  </div>
                  <div className="amount-grid">
                    <div className="amount-item">
                      <div className="amount-label">Amount HT</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_ht || selectedFacture.totals?.montantHT)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">VAT</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_tva || selectedFacture.totals?.tva)}</div>
                    </div>
                    
                    <div className="amount-item">
                      <div className="amount-label">Discount</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.remise || 0)}</div>
                    </div>
                    
                    <div className="amount-item total">
                      <div className="amount-label">Amount TTC</div>
                      <div className="amount-value">{formatCurrency(selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC)}</div>
                    </div>
                    
                    
                    <div className="amount-item">
                      <div className="amount-label">Remaining to pay</div>
                      <div className="amount-value remaining">
                        {formatCurrency(
                          (selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC || 0) - 
                          (selectedFacture.montant_paye || 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETAILED Items */}
                {selectedFacture.lignesFacture && selectedFacture.lignesFacture.length > 0 && (
                  <div 
                    className={`detail-section articles-section ${visibleSections.includes('articles') ? 'visible' : ''}`}
                    data-section="articles"
                  >
                    <div className="section-header">
                      <FiFileText className="section-icon" />
                      <h4>Items ({selectedFacture.lignesFacture.length})</h4>
                    </div>
                    <div className="articles-table">
                      <div className="table-header">
                        <div className="table-col description">Description</div>
                        <div className="table-col quantity">Quantity</div>
                        <div className="table-col price">Unit price HT</div>
                        <div className="table-col tva">VAT</div>
                        <div className="table-col total">Total TTC</div>
                      </div>
                      {selectedFacture.lignesFacture.map((ligne, index) => {
                        const totalHT = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                        const totalTVA = totalHT * ((ligne.taux_tva || 19) / 100);
                        const totalTTC = totalHT + totalTVA;
                        
                        return (
                          <div key={index} className="table-row">
                            <div className="table-col description">{ligne.description || 'Item without description'}</div>
                            <div className="table-col quantity">{ligne.quantite || 0} {ligne.unite || 'unit'}</div>
                            <div className="table-col price">{formatCurrency(ligne.prix_unitaire_ht || 0)}</div>
                            <div className="table-col tva">{ligne.taux_tva || 19}%</div>
                            <div className="table-col total">
                              {formatCurrency(totalTTC)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Items totals */}
                      <div className="table-row total-row">
                        <div className="table-col description" colSpan="4">Total general</div>
                        <div className="table-col total">
                          {formatCurrency(selectedFacture.montant_ttc || selectedFacture.totals?.montantTTC)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company information */}
                {selectedFacture.entreprise && (
                  <div 
                    className={`detail-section entreprise-section ${visibleSections.includes('entreprise') ? 'visible' : ''}`}
                    data-section="entreprise"
                  >
                    <div className="section-header">
                      <FiUser className="section-icon" />
                      <h4>Company Information</h4>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Name</div>
                        <div className="detail-value">{selectedFacture.entreprise.nom}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Address</div>
                        <div className="detail-value">{selectedFacture.entreprise.adresse}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Phone</div>
                        <div className="detail-value">{selectedFacture.entreprise.telephone}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{selectedFacture.entreprise.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedFacture.notes && (
                  <div 
                    className={`detail-section notes-section ${visibleSections.includes('notes') ? 'visible' : ''}`}
                    data-section="notes"
                  >
                    <div className="section-header">
                      <FiEdit className="section-icon" />
                      <h4>Notes & Comments</h4>
                    </div>
                    <div className="notes-content">
                      <p>{selectedFacture.notes}</p>
                    </div>
                  </div>
                )}

                {/* Tracking information */}
                <div 
                  className={`detail-section tracking-section ${visibleSections.includes('tracking') ? 'visible' : ''}`}
                  data-section="tracking"
                >
                  <div className="section-header">
                    <FiClock className="section-icon" />
                    <h4>Invoice Tracking</h4>
                  </div>
                  <div className="tracking-grid">
                    <div className="tracking-item">
                      <div className="tracking-label">Created on</div>
                      <div className="tracking-value">{formatDate(selectedFacture.createdAt)}</div>
                    </div>
                    <div className="tracking-item">
                      <div className="tracking-label">Modified on</div>
                      <div className="tracking-value">{formatDate(selectedFacture.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons in modal */}
            <div className="modal-actions">
              <button 
                className={`btn-download-pdf ${darkMode ? 'dark' : ''}`}
                onClick={() => downloadFacturePDF(selectedFacture.id)}
              >
                <FiDownload /> Download PDF
              </button>
              <button className={`btn-print ${darkMode ? 'dark' : ''}`}>
                <FiPrinter /> Print
              </button>
            </div>
          </div>
          
          {/* Back to top button */}
          <div 
            className={`back-to-top ${showBackToTop ? 'visible' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={scrollToTop}
            title="Back to top"
          >
            <FiChevronUp size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Facture;