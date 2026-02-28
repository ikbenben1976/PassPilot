import { Router } from 'express';
import { getSubscription, createSubscription, cancelSubscription } from '../controllers/subscriptionController.js';

const router = Router();

router.get('/', getSubscription);
router.post('/', createSubscription);
router.delete('/', cancelSubscription);

export default router;
