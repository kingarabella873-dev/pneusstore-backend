import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { protect } from '../middlewares/auth';

const router = Router();

// Todas as rotas do carrinho são protegidas
router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/item/:itemId', protect, updateCartItem);
router.delete('/item/:itemId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

export default router;