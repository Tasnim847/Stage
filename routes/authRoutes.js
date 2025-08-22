import express from 'express';
import { register, login, resetPassword, checkEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword); // This is correct
router.post('/check-email', checkEmail); // Nouvelle route

export default router;