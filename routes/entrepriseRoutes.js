import express from 'express';
import {
    getEntreprisesForComptable,
    createEntreprise,
    deleteEntreprise,
    updateEntreprise
} from '../controllers/entrepriseController.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/comptable', authenticateToken, getEntreprisesForComptable);
router.post('/', authenticateToken, checkRole('comptable'), createEntreprise);
router.delete('/:id', authenticateToken, checkRole('comptable'), deleteEntreprise);
router.put('/:id', authenticateToken, checkRole('comptable'), updateEntreprise);

export default router;