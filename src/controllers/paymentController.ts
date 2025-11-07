import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import { StripeService } from '../services/stripeService';
import { PixServiceBacen } from '../services/pixServiceBacen';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Processar pagamento com cartão de crédito
export const processCardPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentMethodId, installments } = req.body;

    if (!orderId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'ID do pedido e método de pagamento são obrigatórios',
      });
    }

    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Processar pagamento
    const paymentResult = await StripeService.processCardPayment({
      paymentMethodId,
      amount: order.totalAmount,
      orderId: (order._id as any).toString(),
      installments,
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao processar pagamento',
        error: paymentResult.error,
      });
    }

    // Atualizar informações de pagamento no pedido
    order.paymentInfo.status = paymentResult.status === 'succeeded' ? 'completed' : 'processing';
    order.paymentInfo.transactionId = paymentResult.paymentIntent?.id;
    order.paymentInfo.installments = installments;
    
    if (paymentResult.status === 'succeeded') {
      order.paymentInfo.paidAt = new Date();
      order.status = 'confirmed';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      data: {
        order,
        paymentStatus: paymentResult.status,
      },
    });
  } catch (error) {
    logger.error('Erro ao processar pagamento com cartão:', error);
    next(error);
  }
};

// Criar pagamento PIX direto (sem order prévio)
export const createPixPaymentDirect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress, amount, paymentMethod } = req.body;

    if (!shippingAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Endereço de entrega e valor são obrigatórios',
      });
    }

    // Gerar PIX usando o serviço (Bacen spec)
    const pixResult = await PixServiceBacen.createPixPayment({
      amount,
      orderId: `ORD-${Date.now()}`, // Gera ID temporário
      customerName: req.user?.name || shippingAddress.recipientName,
      customerEmail: req.user?.email || '',
      customerCpf: req.user?.cpf || '',
      description: `Pagamento de ${amount}`,
    });

    if (!pixResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao gerar PIX',
        error: pixResult.error,
      });
    }

    res.json({
      success: true,
      message: 'PIX gerado com sucesso',
      data: {
        pixCode: pixResult.pixCode,
        qrCodeImage: pixResult.pixQrCode, // qrcode-pix já retorna com data:image/png;base64,
        pixQrCode: pixResult.pixQrCode,
        expiresAt: pixResult.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Erro ao criar pagamento PIX direto:', error);
    next(error);
  }
};

// Criar pagamento PIX
export const createPixPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório',
      });
    }

    // Buscar pedido
    const order = await Order.findById(orderId).populate('user', 'name email cpf');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Gerar PIX (Bacen spec)
    const pixResult = await PixServiceBacen.createPixPayment({
      amount: order.totalAmount,
      orderId: order.orderNumber,
      customerName: (order.user as any).name,
      customerEmail: (order.user as any).email,
      customerCpf: (order.user as any).cpf || '',
      description: `Pedido ${order.orderNumber}`,
    });

    if (!pixResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao gerar PIX',
        error: pixResult.error,
      });
    }

    // Atualizar informações de pagamento no pedido
    order.paymentInfo.paymentId = pixResult.paymentId;
    order.paymentInfo.pixCode = pixResult.pixCode;
    order.paymentInfo.pixQrCode = pixResult.pixQrCode;
    
    await order.save();

    res.json({
      success: true,
      message: 'PIX gerado com sucesso',
      data: {
        pixCode: pixResult.pixCode,
        pixQrCode: pixResult.pixQrCode,
        expiresAt: pixResult.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Erro ao criar pagamento PIX:', error);
    next(error);
  }
};

// Verificar status do pagamento PIX
export const checkPixPaymentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    if (!order.paymentInfo.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'PIX não encontrado para este pedido',
      });
    }

    // Verificar status do PIX
    // TODO: Implementar checkPixPaymentStatus no PixServiceBacen
    const statusResult: any = { success: true, status: 'pending', paidAt: undefined }; 

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao verificar status do PIX',
        error: 'Status check not implemented',
      });
    }

    // Atualizar status do pedido se necessário
    if (statusResult.status === 'paid' && order.paymentInfo.status === 'pending') {
      order.paymentInfo.status = 'completed';
      order.paymentInfo.paidAt = statusResult.paidAt || undefined;
      order.status = 'confirmed';
      await order.save();
    }

    res.json({
      success: true,
      data: {
        status: statusResult.status,
        paidAt: statusResult.paidAt,
        order: order.paymentInfo.status,
      },
    });
  } catch (error) {
    logger.error('Erro ao verificar status do PIX:', error);
    next(error);
  }
};

// Webhook Stripe
export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;
    try {
      event = StripeService.constructWebhookEvent(req.body, signature, endpointSecret);
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Processar evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
      
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Erro no webhook Stripe:', error);
    next(error);
  }
};

// Webhook PIX
export const pixWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    
    // TODO: Implementar handlePixWebhook no PixServiceBacen
    const result: any = { success: true }; // await PixServiceBacen.handlePixWebhook(payload);
    
    if (result.success) {
      // Atualizar pedido com base na notificação PIX
      await updateOrderFromPixNotification(result);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Erro no webhook PIX:', error);
    next(error);
  }
};

// Funções auxiliares

async function handleSuccessfulPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    
    if (order) {
      order.paymentInfo.status = 'completed';
      order.paymentInfo.paidAt = new Date();
      order.status = 'confirmed';
      await order.save();
      
      logger.info(`Pagamento confirmado para pedido ${orderId}`);
    }
  } catch (error) {
    logger.error('Erro ao processar pagamento bem-sucedido:', error);
  }
}

async function handleFailedPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    
    if (order) {
      order.paymentInfo.status = 'failed';
      await order.save();
      
      logger.info(`Pagamento falhou para pedido ${orderId}`);
    }
  } catch (error) {
    logger.error('Erro ao processar falha de pagamento:', error);
  }
}

async function updateOrderFromPixNotification(pixData: any) {
  try {
    const order = await Order.findOne({ 
      'paymentInfo.paymentId': pixData.paymentId 
    });
    
    if (order) {
      if (pixData.status === 'paid') {
        order.paymentInfo.status = 'completed';
        order.paymentInfo.paidAt = new Date();
        order.status = 'confirmed';
      } else if (pixData.status === 'cancelled') {
        order.paymentInfo.status = 'cancelled';
      }
      
      await order.save();
      logger.info(`Status PIX atualizado para pedido ${order.orderNumber}`);
    }
  } catch (error) {
    logger.error('Erro ao atualizar pedido via notificação PIX:', error);
  }
}