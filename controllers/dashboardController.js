import Entreprise from '../models/Entreprise.js';
import Facture from "../models/Facture.js";
import Devis from "../models/Devis.js";
import sequelize from '../config/database.js';
import { Op } from 'sequelize'; // ← AJOUT IMPORTANT

export const getComptableDashboard = async (req, res) => {
    try {
        if (!req.comptableId) {
            return res.status(403).json({
                success: false,
                message: 'Comptable non trouvé'
            });
        }

        const entreprises = await Entreprise.findAll({
            where: { comptableId: req.comptableId },
            attributes: ['id', 'nom', 'logo']
        });

        const factures = await Facture.findAll({
            where: { comptable_id: req.comptableId },
            include: [{
                model: Entreprise,
                as: 'entrepriseFacturee',
                attributes: ['nom']
            }]
        });

        const totals = factures.reduce((acc, facture) => ({
            totalFactures: acc.totalFactures + 1,
            totalTTC: acc.totalTTC + parseFloat(facture.montant_ttc),
            totalHT: acc.totalHT + parseFloat(facture.montant_ht)
        }), { totalFactures: 0, totalTTC: 0, totalHT: 0 });

        const chartData = entreprises.map(entreprise => {
            const entrepriseFactures = factures.filter(f => f.entreprise_id === entreprise.id);
            return {
                entreprise: entreprise.nom,
                montantTTC: entrepriseFactures.reduce((sum, f) => sum + parseFloat(f.montant_ttc), 0),
                montantHT: entrepriseFactures.reduce((sum, f) => sum + parseFloat(f.montant_ht), 0)
            };
        });

        res.json({
            success: true,
            data: {
                comptable: req.user,
                entreprises,
                totals,
                factures: factures.slice(0, 5),
                chartData
            }
        });

    } catch (error) {
        console.error('[BACKEND] Erreur dans getComptableDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getEntrepriseDashboard = async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur connecté
        const userId = req.user.id;

        // Trouver l'entreprise qui appartient à cet utilisateur
        const entreprise = await Entreprise.findOne({
            where: { userId: userId }
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Aucune entreprise trouvée pour cet utilisateur'
            });
        }

        const entrepriseId = entreprise.id;

        // Récupérer les statistiques des factures
        const facturesStats = await Facture.findAll({
            where: { entreprise_id: entrepriseId },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.col('montant_ttc')), 'total_ttc'],
                [sequelize.fn('SUM', sequelize.col('montant_ht')), 'total_ht']
            ],
            raw: true
        });

        // Récupérer les statistiques des devis par statut
        const devisStats = await Devis.findAll({
            where: { entreprise_id: entrepriseId },
            attributes: [
                'statut',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['statut'],
            raw: true
        });

        // Récupérer les données des factures de cette semaine
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Début de semaine (dimanche)
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Fin de semaine (samedi)
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyInvoices = await Facture.findAll({
            where: {
                entreprise_id: entrepriseId,
                date_emission: {
                    [Op.between]: [startOfWeek, endOfWeek]
                }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('date_emission')), 'day'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('date_emission'))],
            order: [[sequelize.fn('DATE', sequelize.col('date_emission')), 'ASC']],
            raw: true
        });

        // Récupérer les factures générées à partir de devis
        const facturesFromDevis = await Facture.findAll({
            where: {
                entreprise_id: entrepriseId,
                devis_id: { [Op.not]: null } // Seulement les factures générées à partir de devis
            },
            attributes: ['id', 'devis_id']
        });

        // Compter les factures générées à partir de devis
        const facturesFromDevisCount = facturesFromDevis.length;

        // Créer un tableau complet pour tous les jours de la semaine
        const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const formattedWeeklyInvoices = [];

        // Remplir avec les 7 jours de la semaine
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];

            const dayData = weeklyInvoices.find(item => item.day === dateString);

            formattedWeeklyInvoices.push({
                day: dateString,
                dayName: daysOfWeek[i],
                count: dayData ? parseInt(dayData.count || 0) : 0
            });
        }

        // Formater les statistiques des devis
        const statsDevis = {
            total: 0,
            acceptes: 0,
            refuses: 0,
            brouillon: 0,
            en_attente: 0
        };

        devisStats.forEach(stat => {
            const count = parseInt(stat.count || 0);
            statsDevis.total += count;

            switch (stat.statut) {
                case 'accepté':
                    statsDevis.acceptes = count;
                    break;
                case 'refusé':
                    statsDevis.refuses = count;
                    break;
                case 'brouillon':
                    statsDevis.brouillon = count;
                    break;
                case 'en_attente':
                    statsDevis.en_attente = count;
                    break;
            }
        });

        // Récupérer les documents récents
        const recentFactures = await Facture.findAll({
            where: { entreprise_id: entrepriseId },
            order: [['date_emission', 'DESC']],
            limit: 5,
            attributes: ['id', 'numero', 'date_emission', 'montant_ttc', 'statut_paiement']
        });

        const recentDevis = await Devis.findAll({
            where: { entreprise_id: entrepriseId },
            order: [['date_creation', 'DESC']],
            limit: 5,
            attributes: ['id', 'numero', 'date_creation', 'montant_ttc', 'statut']
        });

        res.json({
            success: true,
            data: {
                entreprise: {
                    id: entreprise.id,
                    nom: entreprise.nom,
                    logo: entreprise.logo
                },
                stats: {
                    factures: parseInt(facturesStats[0]?.total || 0),
                    devis: statsDevis.total,
                    devisAcceptes: statsDevis.acceptes,
                    devisRefuses: statsDevis.refuses,
                    devisBrouillon: statsDevis.brouillon,
                    devisEnAttente: statsDevis.en_attente,
                    totalTTC: parseFloat(facturesStats[0]?.total_ttc || 0),
                    totalHT: parseFloat(facturesStats[0]?.total_ht || 0),
                    facturesFromDevis: facturesFromDevisCount,
                    // Calculer le taux de conversion réel (factures générées / devis acceptés)
                    conversionRate: statsDevis.acceptes > 0
                        ? (facturesFromDevisCount / statsDevis.acceptes) * 100
                        : 0
                },
                recent: {
                    factures: recentFactures,
                    devis: recentDevis
                },
                analytics: {
                    weeklyInvoices: formattedWeeklyInvoices
                }
            }
        });

    } catch (error) {
        console.error('[BACKEND] Erreur dans getEntrepriseDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getEntrepriseDetails = async (req, res) => {
    try {
        const { entrepriseName } = req.params;

        if (!req.comptableId) {
            return res.status(403).json({
                success: false,
                message: 'Comptable non trouvé'
            });
        }

        // Find the specific company
        const entreprise = await Entreprise.findOne({
            where: {
                nom: entrepriseName,
                comptableId: req.comptableId
            }
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        const entrepriseId = entreprise.id;

        // Get invoices for this company
        const factures = await Facture.findAll({
            where: {
                entreprise_id: entrepriseId,
                comptable_id: req.comptableId
            },
            order: [['date_emission', 'DESC']]
        });

        // Get quotes for this company
        const devis = await Devis.findAll({
            where: {
                entreprise_id: entrepriseId
            },
            order: [['date_creation', 'DESC']]
        });

        // Calculate stats
        const stats = {
            factures: factures.length,
            devis: devis.length,
            devisAcceptes: devis.filter(d => d.statut === 'accepté').length,
            devisRefuses: devis.filter(d => d.statut === 'refusé').length,
            devisEnAttente: devis.filter(d => d.statut === 'en_attente').length,
            devisBrouillon: devis.filter(d => d.statut === 'brouillon').length,
            facturesPayees: factures.filter(f => f.statut_paiement === 'payée').length,
            facturesImpayees: factures.filter(f => f.statut_paiement === 'impayée').length,
            facturesEnRetard: factures.filter(f => f.statut_paiement === 'en_retard').length,
            totalTTC: factures.reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0),
            totalHT: factures.reduce((sum, f) => sum + parseFloat(f.montant_ht || 0), 0)
        };

        // Get weekly revenue data for the last 12 weeks
        const weeklyRevenueData = await getWeeklyRevenueData(entrepriseId);

        // Calculate revenue growth
        const revenueGrowth = calculateRevenueGrowth(weeklyRevenueData);

        res.json({
            success: true,
            data: {
                entreprise,
                stats: {
                    ...stats,
                    revenueGrowth
                },
                recent: {
                    factures: factures.slice(0, 5),
                    devis: devis.slice(0, 5)
                },
                analytics: {
                    weeklyRevenue: weeklyRevenueData
                }
            }
        });

    } catch (error) {
        console.error('[BACKEND] Erreur dans getEntrepriseDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to get weekly revenue data with dynamic week calculation
const getWeeklyRevenueData = async (entrepriseId) => {
    const weeklyData = [];
    const now = new Date();

    // Get data for the last 12 weeks including the current week
    for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (7 * i) - (now.getDay() === 0 ? 0 : now.getDay()));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekInvoices = await Facture.findAll({
            where: {
                entreprise_id: entrepriseId,
                date_emission: {
                    [Op.between]: [weekStart, weekEnd]
                }
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('montant_ttc')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'invoice_count']
            ],
            raw: true
        });

        const weekRevenue = parseFloat(weekInvoices[0]?.total_revenue || 0);
        const invoiceCount = parseInt(weekInvoices[0]?.invoice_count || 0);

        // Format week label based on whether it's current week or past week
        let weekLabel;
        if (i === 0) {
            weekLabel = 'Current Week';
        } else if (i === 1) {
            weekLabel = 'Last Week';
        } else {
            weekLabel = `${i} Weeks Ago`;
        }

        weeklyData.push({
            week: weekLabel,
            revenue: weekRevenue,
            invoiceCount: invoiceCount,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            isCurrentWeek: i === 0
        });
    }

    return weeklyData;
};

// Improved growth calculation that handles empty weeks
const calculateRevenueGrowth = (weeklyData) => {
    if (weeklyData.length < 2) return 0;

    const currentWeek = weeklyData.find(w => w.isCurrentWeek);
    const previousWeek = weeklyData[weeklyData.length - 2]; // The week before current

    if (!currentWeek || !previousWeek || previousWeek.revenue === 0) {
        return 0;
    }

    return ((currentWeek.revenue - previousWeek.revenue) / previousWeek.revenue);
};