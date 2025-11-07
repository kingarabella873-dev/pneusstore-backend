import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface IShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  recipientName: string;
  recipientPhone: string;
}

export interface IPaymentInfo {
  method: 'credit_card' | 'pix' | 'bank_slip';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  paymentId?: string;
  pixCode?: string;
  pixQrCode?: string;
  installments?: number;
  cardBrand?: string;
  cardLastFour?: string;
  paidAt?: Date;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: IShippingAddress;
  paymentInfo: IPaymentInfo;
  deliveryEstimate: Date;
  notes?: string;
  trackingCode?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
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
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  street: { type: String, required: true },
  number: { type: String, required: true },
  complement: String,
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
});

const paymentInfoSchema = new Schema<IPaymentInfo>({
  method: {
    type: String,
    required: true,
    enum: ['credit_card', 'pix', 'bank_slip'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  transactionId: String,
  paymentId: String,
  pixCode: String,
  pixQrCode: String,
  installments: {
    type: Number,
    min: 1,
    max: 12,
  },
  cardBrand: String,
  cardLastFour: String,
  paidAt: Date,
});

const orderSchema = new Schema<IOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Valor total não pode ser negativo'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal não pode ser negativo'],
  },
  shippingCost: {
    type: Number,
    required: true,
    min: [0, 'Frete não pode ser negativo'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Desconto não pode ser negativo'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  paymentInfo: {
    type: paymentInfoSchema,
    required: true,
  },
  deliveryEstimate: {
    type: Date,
    required: true,
  },
  notes: String,
  trackingCode: String,
  cancelReason: String,
}, {
  timestamps: true,
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = `PN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);