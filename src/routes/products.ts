import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  getSimilarProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterOptions,
} from '../controllers/productController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

// Modo de desenvolvimento - remover autenticação temporariamente
const isDevelopment = process.env.NODE_ENV !== 'production';

// Rotas públicas
router.get('/', getProducts);
router.get('/filters/options', getFilterOptions);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/:id/similar', getSimilarProducts);

// Rotas protegidas (admin) - sem auth em desenvolvimento
if (isDevelopment) {
  router.post('/', createProduct);
  router.put('/:id', updateProduct);
  router.delete('/:id', deleteProduct);
} else {
  router.post('/', protect, authorize('admin'), createProduct);
  router.put('/:id', protect, authorize('admin'), updateProduct);
  router.delete('/:id', protect, authorize('admin'), deleteProduct);
}

export default router;