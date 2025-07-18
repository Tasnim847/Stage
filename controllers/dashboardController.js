import Entreprise from '../models/Entreprise.js';
import Facture from "../models/Facture.js";

export const getComptableDashboard = async (req, res) => {
    console.log('[BACKEND] Début getComptableDashboard');
    try {
        console.log('[BACKEND] req.comptableId:', req.comptableId);
        console.log('[BACKEND] req.user:', req.user);

        if (!req.comptableId) {
            console.log('[BACKEND] Erreur: comptableId manquant');
            return res.status(403).json({
                success: false,
                message: 'Comptable non trouvé'
            });
        }

        console.log('[BACKEND] Recherche des entreprises...');
        const entreprises = await Entreprise.findAll({
            where: { comptableId: req.comptableId },
            attributes: ['id', 'nom', 'logo']
        });
        console.log(`[BACKEND] ${entreprises.length} entreprises trouvées`);

        console.log('[BACKEND] Recherche des factures...');
        const factures = await Facture.findAll({
            where: { comptable_id: req.comptableId },
            include: [{
                model: Entreprise,
                as: 'entrepriseFacturee',
                attributes: ['nom']
            }]
        });
        console.log(`[BACKEND] ${factures.length} factures trouvées`);

        const totals = factures.reduce((acc, facture) => ({
            totalFactures: acc.totalFactures + 1,
            totalTTC: acc.totalTTC + parseFloat(facture.montant_ttc),
            totalHT: acc.totalHT + parseFloat(facture.montant_ht)
        }), { totalFactures: 0, totalTTC: 0, totalHT: 0 });

        console.log('[BACKEND] Préparation des données pour le graphique...');
        const chartData = entreprises.map(entreprise => {
            const entrepriseFactures = factures.filter(f => f.entreprise_id === entreprise.id);
            return {
                entreprise: entreprise.nom,
                montantTTC: entrepriseFactures.reduce((sum, f) => sum + parseFloat(f.montant_ttc), 0),
                montantHT: entrepriseFactures.reduce((sum, f) => sum + parseFloat(f.montant_ht), 0)
            };
        });

        console.log('[BACKEND] Envoi de la réponse...');
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