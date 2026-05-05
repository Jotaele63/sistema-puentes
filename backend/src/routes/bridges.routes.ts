import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listarPuentes, obtenerPuente, crearPuente, actualizarPuente,
  enviarParaAprobacion, aprobarPuente, rechazarPuente, renovarPuente,
  cerrarPuente, activarPuente, obtenerPDF, agregarControl,
  pendientesAprobacion, dashboardStats
} from '../controllers/bridges.controller';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', dashboardStats);
router.get('/pendientes', pendientesAprobacion);
router.get('/', listarPuentes);
router.post('/', crearPuente);
router.get('/:id', obtenerPuente);
router.put('/:id', actualizarPuente);
router.post('/:id/submit', enviarParaAprobacion);
router.post('/:id/approve', aprobarPuente);
router.post('/:id/reject', rechazarPuente);
router.post('/:id/renew', renovarPuente);
router.post('/:id/close', cerrarPuente);
router.post('/:id/activate', activarPuente);
router.get('/:id/pdf', obtenerPDF);
router.post('/:id/control', agregarControl);

export default router;
