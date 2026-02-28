import { Router } from 'express';
import { listSavedSearches, createSavedSearch, deleteSavedSearch } from '../controllers/savedSearchController.js';

const router = Router();

router.get('/', listSavedSearches);
router.post('/', createSavedSearch);
router.delete('/:id', deleteSavedSearch);

export default router;
