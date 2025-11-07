import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Criar pedido
export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod, deliveryEstimate, notes } = req.body;

    // Validar dados obrigatórios
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Endereço de entrega e método de pagamento são obrigatórios',
      });
    }

    // Buscar carrinho do usuário
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Carrinho está vazio',
      });
    }

    // Verificar estoque dos produtos
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produto não encontrado`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para ${product.name}`,
        });
      }
    }

    // Preparar itens do pedido
    const orderItems = cart.items.map((item: any) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      name: item.product.name,
      image: item.product.images[0],
    }));

    // Calcular valores
    const subtotal = cart.totalAmount;
    const shippingCost = calculateShippingInternal(subtotal, shippingAddress.state);
    const discount = 0; // Implementar lógica de desconto se necessário
    const totalAmount = subtotal + shippingCost - discount;

    // Criar pedido
    const order = new Order({
      user: userId,
      items: orderItems,
      subtotal,
      shippingCost,
      discount,
      totalAmount,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: 'pending',
      },
      deliveryEstimate: deliveryEstimate || getDefaultDeliveryEstimate(),
      notes,
    });

    await order.save();

    // Atualizar estoque dos produtos
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Limpar carrinho
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: order,
    });
  } catch (error) {
    logger.error('Erro ao criar pedido:', error);
    next(error);
  }
};

// Listar todos os pedidos (admin)
export const getAllOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Filtros
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.paymentMethod) {
      filters['paymentInfo.method'] = req.query.paymentMethod;
    }

    if (req.query.search) {
      const search = req.query.search as string;
      filters.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filters.createdAt = {};
      if (req.query.dateFrom) {
        filters.createdAt.$gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filters.createdAt.$lte = new Date(req.query.dateTo as string);
      }
    }

    const orders = await Order.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('items.product', 'name price');

    const total = await Order.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    // Converter para formato esperado pelo frontend
    const formattedOrders = orders.map(order => {
      const orderUser = order.user as any;
      return {
        _id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id}`,
        user: {
          name: orderUser?.name || 'N/A',
          email: orderUser?.email || 'N/A'
        },
        items: order.items.map(item => ({
          productId: item.product?._id || item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shipping: {
          address: order.shippingAddress?.street || 'N/A',
          city: order.shippingAddress?.city || 'N/A',
          zipCode: order.shippingAddress?.zipCode || 'N/A',
          method: 'Padrão',
          cost: order.shippingCost || 0
        },
        payment: {
          method: order.paymentInfo?.method || 'N/A',
          status: order.paymentInfo?.status || 'pending',
          amount: order.totalAmount || 0,
          transactionId: order.paymentInfo?.transactionId
        },
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      };
    });

    res.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar todos os pedidos:', error);
    next(error);
  }
};

// Listar pedidos do usuário
export const getUserOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product');

    const total = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar pedidos:', error);
    next(error);
  }
};

// Obter detalhes de um pedido
export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('items.product')
      .populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Erro ao buscar pedido:', error);
    next(error);
  }
};

// Alias para getOrderById
export const getOrderDetails = getOrderById;

// Cancelar pedido
export const cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    // Verificar se o pedido pode ser cancelado
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Pedido não pode ser cancelado',
      });
    }

    // Atualizar status do pedido
    order.status = 'cancelled';
    order.cancelReason = reason;

    // Retornar produtos ao estoque
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    await order.save();

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      data: order,
    });
  } catch (error) {
    logger.error('Erro ao cancelar pedido:', error);
    next(error);
  }
};



// Atualizar status do pedido (admin)
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { status, trackingCode } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
      });
    }

    order.status = status;
    if (trackingCode) order.trackingCode = trackingCode;

    await order.save();

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: order,
    });
  } catch (error) {
    logger.error('Erro ao atualizar status do pedido:', error);
    next(error);
  }
};

// Calcular frete (endpoint público)
export const calculateShipping = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, state, subtotal } = req.body;

    let calculatedSubtotal = subtotal || 0;
    
    if (items && Array.isArray(items)) {
      calculatedSubtotal = 0;
      for (const item of items) {
        const product = await Product.findById(item.productId || item.product);
        if (product) {
          calculatedSubtotal += product.price * (item.quantity || 1);
        }
      }
    }

    // Lógica básica de cálculo de frete
    let shippingCost = 0;
    let estimatedDays = 7;

    // Frete grátis para compras acima de R$ 300
    if (calculatedSubtotal >= 300) {
      shippingCost = 0;
    } else {
      // Frete baseado no estado
      const shippingRates: { [key: string]: number } = {
        'SP': 15,
        'RJ': 18,
        'MG': 20,
        'ES': 22,
        'PR': 25,
        'SC': 25,
        'RS': 30,
      };
      
      shippingCost = state ? (shippingRates[state] || 25) : 25;
    }

    const shippingOptions = [
      {
        id: 'standard',
        name: 'Entrega Padrão',
        cost: shippingCost,
        estimatedDays: estimatedDays,
        description: calculatedSubtotal >= 300 ? 'Frete grátis acima de R$ 300' : 'Entrega em até 7 dias úteis'
      },
      {
        id: 'express',
        name: 'Entrega Expressa',
        cost: shippingCost > 0 ? shippingCost + 15 : 15,
        estimatedDays: 3,
        description: 'Entrega em até 3 dias úteis'
      }
    ];

    res.json({
      success: true,
      shippingOptions,
      subtotal: calculatedSubtotal
    });
  } catch (error) {
    logger.error('Erro ao calcular frete:', error);
    next(error);
  }
};

// Webhook Mercado Pago
export const mercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body ?? {};
    const eventType: string | undefined = (payload as any).type ?? (payload as any).topic;
    const data: any = (payload as any).data ?? {};
    const paymentStatus: string | undefined = data.status ?? (payload as any).status;
    const paymentId: string | undefined = data.id ?? data.payment_id ?? data.paymentId;
    const orderId: string | undefined =
      data.metadata?.orderId ??
      data.metadata?.order_id ??
      data.external_reference ??
      (payload as any).orderId;

    logger.info('Mercado Pago webhook recebido', {
      service: 'pneus-store-api',
      eventType,
      paymentId,
      orderId,
      paymentStatus,
    });

    if (eventType !== 'payment') {
      res.status(200).json({ message: 'Evento ignorado' });
      return;
    }

    if (!orderId) {
      logger.warn('Webhook Mercado Pago sem orderId', {
        service: 'pneus-store-api',
        paymentId,
      });
      res.status(200).json({ message: 'Webhook reconhecido sem orderId' });
      return;
    }

    const statusMap: Record<string, 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = {
      approved: 'processing',
      authorized: 'processing',
      in_process: 'processing',
      in_mediation: 'processing',
      pending: 'pending',
      rejected: 'cancelled',
      cancelled: 'cancelled',
      refunded: 'cancelled',
      charged_back: 'cancelled',
    };

    const normalizedStatus = paymentStatus?.toLowerCase() ?? 'pending';
    const mappedStatus = statusMap[normalizedStatus] ?? 'pending';

    const update: Record<string, unknown> = {
      status: mappedStatus,
      updatedAt: new Date(),
    };

    if (paymentStatus) {
      update.paymentStatus = paymentStatus;
    }

    if (paymentId) {
      update.paymentId = paymentId;
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, update, { new: true });

    if (!updatedOrder) {
      logger.warn('Pedido não encontrado para webhook Mercado Pago', {
        service: 'pneus-store-api',
        orderId,
        paymentId,
      });
      res.status(200).json({ message: 'Webhook reconhecido, porém pedido não encontrado' });
      return;
    }

    logger.info('Pedido atualizado via webhook Mercado Pago', {
      service: 'pneus-store-api',
      orderId,
      paymentId,
      paymentStatus,
      newStatus: mappedStatus,
    });

    res.status(200).json({ message: 'Webhook processado com sucesso' });
  } catch (error) {
    logger.error('Erro ao processar webhook Mercado Pago', {
      service: 'pneus-store-api',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Funções auxiliares internas

// Calcular frete interno
function calculateShippingInternal(subtotal: number, state: string): number {
  // Lógica básica de cálculo de frete
  // Frete grátis para compras acima de R$ 300
  if (subtotal >= 300) return 0;
  
  // Frete baseado no estado
  const shippingRates: { [key: string]: number } = {
    'SP': 15,
    'RJ': 18,
    'MG': 20,
    // Adicionar mais estados
  };
  
  return shippingRates[state] || 25; // Frete padrão
}

// Obter estimativa de entrega padrão
function getDefaultDeliveryEstimate(): Date {
  const estimateDate = new Date();
  estimateDate.setDate(estimateDate.getDate() + 7); // 7 dias úteis
  return estimateDate;
}