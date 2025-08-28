// routes/dashboard.js - Version corrigée
import express from 'express';
import { getComptableDashboard, getEntrepriseDashboard } from '../controllers/dashboardController.js';
import { authComptable, authEntreprise } from '../middleware/auth.js';

const router = express.Router();

// Route protégée pour comptables
router.get('/comptable', authComptable, getComptableDashboard);

// Route protégée pour entreprises - PLUS BESOIN DE L'ID DANS L'URL
router.get('/entreprise', authEntreprise, getEntrepriseDashboard);

export default router;