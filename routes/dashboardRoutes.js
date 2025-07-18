import express from 'express';
import { getComptableDashboard } from '../controllers/dashboardController.js';
import { authComptable } from '../middleware/auth.js';

const router = express.Router();

// Route protégée pour comptables
router.get('/comptable', authComptable, getComptableDashboard);

export default router;