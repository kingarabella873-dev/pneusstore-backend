import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { logger } from '../utils/logger';

// Listar produtos com filtros e paginação
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Filtros
    const filters: any = { isActive: true };
    
    // Filtro de categoria - aceitar tanto português quanto inglês
    if (req.query.category && req.query.category !== 'all' && req.query.category !== '') {
      let category = req.query.category as string;
      // Converter de inglês para português se necessário
      const categoryMap: any = {
        'cars': 'carro',
        'trucks': 'caminhao',
        'carro': 'carro',
        'caminhao': 'caminhao'
      };
      filters.category = categoryMap[category.toLowerCase()] || category;
    }
    
    // Filtro de marca
    if (req.query.brand && req.query.brand !== 'all' && req.query.brand !== '') {
      filters.brand = new RegExp(req.query.brand as string, 'i');
    }
    
    // Filtro de preço
    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {};
      if (req.query.minPrice) filters.price.$gte = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) filters.price.$lte = parseFloat(req.query.maxPrice as string);
    }
    
    // Filtro de tamanho
    if (req.query.size && req.query.size !== 'all' && req.query.size !== '') {
      filters.size = req.query.size;
    }
    
    // Filtro de estação
    if (req.query.season && req.query.season !== 'all' && req.query.season !== '') {
      filters['specifications.season'] = req.query.season;
    }
    
    // Filtro de largura
    if (req.query.width && req.query.width !== '') {
      filters['specifications.width'] = req.query.width;
    }
    
    // Filtro de perfil
    if (req.query.profile && req.query.profile !== '') {
      filters['specifications.profile'] = req.query.profile;
    }
    
    // Filtro de diâmetro
    if (req.query.diameter && req.query.diameter !== '') {
      filters['specifications.diameter'] = req.query.diameter;
    }
    
    // Busca por texto (nome, descrição, marca)
    if (req.query.search && req.query.search !== '') {
      const searchTerm = req.query.search as string;
      filters.$or = [
        { name: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') },
        { brand: new RegExp(searchTerm, 'i') },
        { size: new RegExp(searchTerm, 'i') },
        { modelName: new RegExp(searchTerm, 'i') }
      ];
    }

    // Ordenação
    let sortBy: any = { createdAt: -1 };
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'price_asc':
        case 'price':
          sortBy = { price: req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'price_desc':
          sortBy = { price: -1 };
          break;
        case 'name':
          sortBy = { name: req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'rating':
          sortBy = { rating: req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'brand':
          sortBy = { brand: req.query.sortOrder === 'desc' ? -1 : 1 };
          break;
        default:
          sortBy = { createdAt: -1 };
      }
    }

    const products = await Product.find(filters)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao listar produtos:', error);
    next(error);
  }
};

// Obter produto por ID
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Erro ao buscar produto:', error);
    next(error);
  }
};

// Obter produtos em destaque
export const getFeaturedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logger.error('Erro ao buscar produtos em destaque:', error);
    next(error);
  }
};

// Obter produtos por categoria
export const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({ 
      category,
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments({ category, isActive: true });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar produtos por categoria:', error);
    next(error);
  }
};

// Buscar produtos similares
export const getSimilarProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    const similarProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      brand: product.brand,
      isActive: true,
    })
      .sort({ rating: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: similarProducts,
    });
  } catch (error) {
    logger.error('Erro ao buscar produtos similares:', error);
    next(error);
  }
};

// Criar produto (admin)
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: product,
    });
  } catch (error) {
    logger.error('Erro ao criar produto:', error);
    // Retornar erros de validação do Mongoose de forma amigável
    if ((error as any).name === 'ValidationError') {
      const errors: Record<string, string> = {};
      for (const key in (error as any).errors) {
        errors[key] = (error as any).errors[key].message;
      }
      return res.status(400).json({ success: false, message: 'Erro de validação', errors });
    }
    next(error);
  }
};

// Atualizar produto (admin)
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: product,
    });
  } catch (error) {
    logger.error('Erro ao atualizar produto:', error);
    if ((error as any).name === 'ValidationError') {
      const errors: Record<string, string> = {};
      for (const key in (error as any).errors) {
        errors[key] = (error as any).errors[key].message;
      }
      return res.status(400).json({ success: false, message: 'Erro de validação', errors });
    }
    next(error);
  }
};

// Deletar produto (admin)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Produto removido com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao deletar produto:', error);
    next(error);
  }
};

// Obter opções de filtro
export const getFilterOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Buscar marcas únicas
    const brands = await Product.distinct('brand', { isActive: true });
    
    // Buscar tamanhos únicos
    const sizes = await Product.distinct('size', { isActive: true });
    
    // Buscar estações únicas
    const seasons = await Product.distinct('specifications.season', { isActive: true });
    
    // Buscar larguras únicas
    const widths = await Product.distinct('specifications.width', { isActive: true });
    
    // Buscar perfis únicos
    const profiles = await Product.distinct('specifications.profile', { isActive: true });
    
    // Buscar diâmetros únicos
    const diameters = await Product.distinct('specifications.diameter', { isActive: true });
    
    // Buscar faixa de preço
    const priceStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    const priceRange = priceStats.length > 0 
      ? { min: Math.floor(priceStats[0].minPrice), max: Math.ceil(priceStats[0].maxPrice) }
      : { min: 0, max: 1000 };

    res.json({
      success: true,
      data: {
        brands: brands.sort(),
        sizes: sizes.sort(),
        seasons: seasons.filter(s => s).sort(),
        widths: widths.sort((a, b) => parseInt(a) - parseInt(b)),
        profiles: profiles.sort((a, b) => parseInt(a) - parseInt(b)),
        diameters: diameters.sort((a, b) => {
          const aNum = parseFloat(a);
          const bNum = parseFloat(b);
          return aNum - bNum;
        }),
        priceRange
      }
    });
  } catch (error) {
    logger.error('Erro ao obter opções de filtro:', error);
    next(error);
  }
};