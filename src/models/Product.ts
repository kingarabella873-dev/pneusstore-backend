import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  brand: string;
  modelName: string;
  size: string; // Ex: "195/55R16"
  category: 'carro' | 'moto' | 'caminhao' | 'van' | 'trator' | 'ort';
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  images: string[];
  specifications: {
    width: string; // Largura do pneu
    profile: string; // Perfil do pneu
    diameter: string; // Diâmetro da roda
    loadIndex: string; // Índice de carga
    speedRating: string; // Classificação de velocidade
    season: 'verão' | 'inverno' | 'all-season';
    pattern: string; // Padrão do desenho
  };
  features: string[]; // Características especiais
  compatibility: string[]; // Veículos compatíveis
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Nome do produto é obrigatório'],
    trim: true,
    maxLength: [200, 'Nome não pode ter mais de 200 caracteres'],
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxLength: [1000, 'Descrição não pode ter mais de 1000 caracteres'],
  },
  brand: {
    type: String,
    required: [true, 'Marca é obrigatória'],
    trim: true,
  },
  modelName: {
    type: String,
    required: [true, 'Modelo é obrigatório'],
    trim: true,
  },
  size: {
    type: String,
    required: [true, 'Tamanho é obrigatório'],
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: ['carro', 'moto', 'caminhao', 'van', 'trator', 'ort'],
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo'],
  },
  originalPrice: {
    type: Number,
    min: [0, 'Preço original não pode ser negativo'],
  },
  discount: {
    type: Number,
    min: [0, 'Desconto não pode ser negativo'],
    max: [100, 'Desconto não pode ser maior que 100%'],
  },
  stock: {
    type: Number,
    required: [true, 'Estoque é obrigatório'],
    min: [0, 'Estoque não pode ser negativo'],
  },
  images: [{
    type: String,
    required: true,
  }],
  specifications: {
    width: { type: String, required: true },
    profile: { type: String, required: true },
    diameter: { type: String, required: true },
    loadIndex: { type: String, required: true },
    speedRating: { type: String, required: true },
    season: {
      type: String,
      enum: ['verão', 'inverno', 'all-season'],
      default: 'all-season',
    },
    pattern: { type: String, required: true },
  },
  features: [String],
  compatibility: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: [0, 'Rating mínimo é 0'],
    max: [5, 'Rating máximo é 5'],
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  tags: [String],
  seoTitle: String,
  seoDescription: String,
}, {
  timestamps: true,
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

export default mongoose.model<IProduct>('Product', productSchema);