import express from 'express';
import {
    getFacturesByEntreprise,
    getFactureById,
    generateFromDevis,
    updateFacture,
    generateFacturePdf,
    getFacturesByComptable,
    deleteFacture
} from '../controllers/factureController.js';
import { protect, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Routes pour les entreprises
router.route('/')
    .get(protect, checkRole(['entreprise']), getFacturesByEntreprise)
    .post(protect, checkRole(['entreprise']), generateFromDevis);

router.route('/:id')
    .get(protect, checkRole(['entreprise', 'comptable']), getFactureById)
    .put(protect, checkRole(['entreprise']), updateFacture)
    .delete(protect, checkRole(['entreprise']), deleteFacture);

router.route('/:id/pdf')
    .get(protect, checkRole(['entreprise', 'comptable']), generateFacturePdf);

// Route spécifique pour les comptables
router.route('/comptable/mes-factures')
    .get(protect, checkRole(['comptable']), getFacturesByComptable);

export default router;