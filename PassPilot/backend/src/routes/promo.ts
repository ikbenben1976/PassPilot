import { Router } from 'express';
import { redeemPromo, checkPromo } from '../controllers/promoController.js';

const router = Router();

router.post('/redeem', redeemPromo);
router.get('/check', checkPromo);

export default router;
