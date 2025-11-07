import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';

const router = Router();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Rotas de usuários (admin)
if (isDevelopment) {
  // Modo desenvolvimento: sem autenticação
  router.get('/', getAllUsers);
  router.get('/:id', getUserById);
  router.put('/:id', updateUser);
  router.delete('/:id', deleteUser);
} else {
  // Modo produção: requer autenticação de admin
  router.get('/', protect, authorize('admin'), getAllUsers);
  router.get('/:id', protect, authorize('admin'), getUserById);
  router.put('/:id', protect, authorize('admin'), updateUser);
  router.delete('/:id', protect, authorize('admin'), deleteUser);
}

// Perfil do usuário logado
router.get('/profile', protect, (req, res) => {
  res.json({ message: 'Profile endpoint' });
});

export default router;