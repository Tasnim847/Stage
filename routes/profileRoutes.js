import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../config/multerConfig.js'; // Import nommé
import { validateImageUrl } from '../middleware/validateImageUrl.js';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, upload.single('image'), updateProfile);

router.put('/', authenticateToken, upload.single('image'), validateImageUrl, updateProfile);

export default router;