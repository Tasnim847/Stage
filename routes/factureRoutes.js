import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    getFacturesByEntreprise,
    getFactureById,
    generateFromDevis,
    updateFacture,
    generateFacturePdf
} from '../controllers/factureController.js';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes principales
router.route('/')
    .get(getFacturesByEntreprise)
    .post(generateFromDevis); // Utiliser uniquement cette route pour la génération

router.route('/:id')
    .get(getFactureById)
    .put(updateFacture);

router.get('/:id/pdf', generateFacturePdf);

// Supprimer la route redondante
// router.post('/generate-from-devis', authMiddleware, generateFactureFromDevis);

export default router;