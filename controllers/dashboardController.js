import Entreprise from '../models/Entreprise.js';
import Facture from "../models/Facture.js";

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