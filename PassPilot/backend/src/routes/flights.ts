import { Router } from 'express';
import { searchFlights, getCalendar, getDestinations } from '../controllers/flightController.js';

const router = Router();

router.post('/search', searchFlights);
router.get('/calendar', getCalendar);
router.get('/destinations', getDestinations);

export default router;
