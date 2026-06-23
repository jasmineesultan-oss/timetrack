import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTimeEntries, getRunningEntry, startTimer, stopTimer,
  createManualEntry, updateTimeEntry, deleteTimeEntry
} from '../controllers/timeEntries';

const router = Router();
router.use(authenticate);

router.get('/', getTimeEntries);
router.get('/running', getRunningEntry);
router.post('/start', startTimer);
router.post('/:id/stop', stopTimer);
router.post('/manual', createManualEntry);
router.put('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
