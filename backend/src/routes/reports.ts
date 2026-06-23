import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getSummaryReport, getDashboardStats, getPayrollReport, exportCSV, exportExcel } from '../controllers/reports';

const router = Router();
router.use(authenticate);

router.get('/summary', getSummaryReport);
router.get('/dashboard', getDashboardStats);
router.get('/payroll', requireAdmin, getPayrollReport);
router.get('/export/csv', exportCSV);
router.get('/export/excel', exportExcel);

export default router;
