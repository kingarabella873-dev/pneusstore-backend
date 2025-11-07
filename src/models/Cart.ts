import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
  calculateTotals(): void;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantidade deve ser pelo menos 1'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Preço não pode ser negativo'],
  },
});

const cartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate totals method
cartSchema.methods.calculateTotals = function() {
  this.totalItems = this.items.reduce((total: number, item: ICartItem) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total: number, item: ICartItem) => total + (item.price * item.quantity), 0);
};

// Pre-save hook to calculate totals
cartSchema.pre('save', function() {
  this.calculateTotals();
});

export default mongoose.model<ICart>('Cart', cartSchema);