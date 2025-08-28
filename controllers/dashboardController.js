import Entreprise from '../models/Entreprise.js';
import Facture from "../models/Facture.js";
import Devis from "../models/Devis.js";
import  sequelize  from '../config/database.js'; // ← AJOUT IMPORTANT


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

// controllers/dashboardController.js - Version corrigée
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
                    totalHT: parseFloat(facturesStats[0]?.total_ht || 0)
                },
                recent: {
                    factures: recentFactures,
                    devis: recentDevis
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