import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRol } from '../middleware/rbac';
import {
  reporteMensual, reporteTrimestral, reportePersonalizado, tendencias,
  listarAuditorias, crearAuditoria, listarLogs,
  listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas
} from '../controllers/reports.controller';

const router = Router();
router.use(authMiddleware);

router.get('/reports/monthly', reporteMensual);
router.get('/reports/quarterly', reporteTrimestral);
router.get('/reports/custom', reportePersonalizado);
router.get('/reports/trends', tendencias);

router.get('/audits', listarAuditorias);
router.post('/audits', requireRol('AUDITOR', 'GERENTE', 'ADMIN'), crearAuditoria);

router.get('/logs', requireRol('ADMIN', 'GERENTE', 'AUDITOR'), listarLogs);

router.get('/notifications', listarNotificaciones);
router.put('/notifications/:id/read', marcarNotificacionLeida);
router.put('/notifications/read-all', marcarTodasLeidas);

export default router;
