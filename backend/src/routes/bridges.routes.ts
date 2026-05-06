import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listarPuentes, obtenerPuente, crearPuente, actualizarPuente,
  enviarParaAprobacion, aprobarPuente, rechazarPuente, renovarPuente,
  cerrarPuente, activarPuente, obtenerPDF, agregarControl,
  pendientesAprobacion, dashboardStats
} from '../controllers/bridges.controller';
import { validarEquipoJDE } from '../services/jde.service';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', dashboardStats);
router.get('/pendientes', pendientesAprobacion);

// Validación de equipo contra JDE F1201
router.get('/validate-equipment', async (req: Request, res: Response) => {
  const { equipoId } = req.query;
  if (!equipoId || typeof equipoId !== 'string') {
    res.status(400).json({ error: 'equipoId requerido' });
    return;
  }
  const resultado = await validarEquipoJDE(equipoId);
  res.json(resultado);
});
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
