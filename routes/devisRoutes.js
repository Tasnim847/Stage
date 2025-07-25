import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    getDevisByEntreprise,
    createDevis,
    getDevisById,
    updateDevis,
    deleteDevis,
    generateDevisPdf
} from '../controllers/devisController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res, next) => {
    console.log('Authorization header:', req.headers['authorization']);
    console.log('User making request:', req.user);
    next();
}, getDevisByEntreprise);

router.post('/', createDevis);
router.get('/:id', getDevisById);
router.put('/:id', updateDevis);
router.delete('/:id', deleteDevis);


router.get('/:id/pdf', generateDevisPdf);


export default router;