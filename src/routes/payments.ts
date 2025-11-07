import { Router } from 'express';
import {
  processCardPayment,
  createPixPayment,
  createPixPaymentDirect,
  checkPixPaymentStatus,
  stripeWebhook,
  pixWebhook,
} from '../controllers/paymentController';
import { protect } from '../middlewares/auth';

const router = Router();

// Rotas protegidas
router.post('/card', protect, processCardPayment);
router.post('/pix', protect, createPixPayment);
router.get('/pix/status/:orderId', protect, checkPixPaymentStatus);

// Rota pública para criar PIX (não requer login)
router.post('/pix/create', createPixPaymentDirect);

// Webhooks (não protegidas)
router.post('/webhook/stripe', stripeWebhook);
router.post('/webhook/pix', pixWebhook);

export default router;