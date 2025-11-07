import express from 'express';
import * as orderController from '../controllers/orderController';
import { protect } from '../middlewares/auth';
import Order from '../models/Order';
import { logger } from '../utils/logger';

const router = express.Router();

// Webhook Mercado Pago (não precisa de auth)
router.post('/webhook/mercadopago', orderController.mercadoPagoWebhook);

// Calcular frete (pode ser público)
router.post('/calculate-shipping', orderController.calculateShipping);

// Rotas protegidas
router.use(protect);

// Criar pedido
router.post('/', orderController.createOrder);

// Listar pedidos do usuário
router.get('/', orderController.getUserOrders);

// Obter detalhes do pedido
router.get('/:id', orderController.getOrderDetails);

// Update order status
router.patch('/:id/status', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Status inválido',
        validStatuses 
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'name email');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    logger.info(`Order ${id} status updated to ${status}`, {
      service: 'pneus-store-api',
      orderId: id,
      newStatus: status,
      updatedBy: req.user?.userId
    });

    res.json({
      message: 'Status do pedido atualizado com sucesso',
      order: updatedOrder
    });

  } catch (error) {
    logger.error('Error updating order status:', {
      service: 'pneus-store-api',
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id
    });

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Cancelar pedido
router.patch('/:orderId/cancel', orderController.cancelOrder);

export default router;