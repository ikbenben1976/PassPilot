import { Router } from 'express';
import { listAlerts, createAlert, deleteAlert } from '../controllers/alertController.js';

const router = Router();

router.get('/', listAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);

export default router;
