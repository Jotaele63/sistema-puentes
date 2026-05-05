import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRol } from '../middleware/rbac';
import { listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, obtenerPerfil } from '../controllers/users.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', requireRol('ADMIN', 'GERENTE'), listarUsuarios);
router.post('/', requireRol('ADMIN'), crearUsuario);
router.get('/:id', obtenerPerfil);
router.put('/:id', requireRol('ADMIN'), actualizarUsuario);
router.delete('/:id', requireRol('ADMIN'), desactivarUsuario);

export default router;
