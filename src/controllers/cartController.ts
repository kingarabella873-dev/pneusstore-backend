import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Obter carrinho do usuário
export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao buscar carrinho:', error);
    next(error);
  }
};

// Adicionar item ao carrinho
export const addToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID do produto é obrigatório',
      });
    }

    // Verificar se o produto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    // Verificar estoque
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Estoque insuficiente',
      });
    }

    // Buscar ou criar carrinho
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Verificar se o item já existe no carrinho
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Atualizar quantidade
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade solicitada excede o estoque disponível',
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Adicionar novo item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Item adicionado ao carrinho',
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao adicionar item ao carrinho:', error);
    next(error);
  }
};

// Atualizar quantidade de item no carrinho
export const updateCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser maior que zero',
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }

    // Verificar estoque
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada excede o estoque disponível',
      });
    }

    // Atualizar quantidade
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;

    await cart.save();
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Carrinho atualizado',
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao atualizar item do carrinho:', error);
    next(error);
  }
};

// Remover item do carrinho
export const removeFromCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Item removido do carrinho',
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao remover item do carrinho:', error);
    next(error);
  }
};

// Limpar carrinho
export const clearCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado',
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Carrinho limpo',
      data: cart,
    });
  } catch (error) {
    logger.error('Erro ao limpar carrinho:', error);
    next(error);
  }
};