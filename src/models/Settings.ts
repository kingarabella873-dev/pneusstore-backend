import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  // Configurações PIX
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantCity: string;
  
  // Outras configurações
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  
  // Configurações de frete
  freeShippingMinValue: number;
  defaultShippingCost: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    // Configurações PIX
    pixKey: {
      type: String,
      required: true,
      trim: true,
    },
    pixKeyType: {
      type: String,
      enum: ['cpf', 'cnpj', 'email', 'phone', 'random'],
      required: true,
      default: 'random',
    },
    merchantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25, // Limite do padrão EMV
    },
    merchantCity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15, // Limite do padrão EMV
    },
    
    // Outras configurações
    siteName: {
      type: String,
      default: 'Pneus Store',
    },
    siteUrl: {
      type: String,
      default: 'https://pneus-store.com',
    },
    supportEmail: {
      type: String,
      default: 'contato@pneus-store.com',
    },
    supportPhone: {
      type: String,
      default: '(11) 99999-9999',
    },
    
    // Configurações de frete
    freeShippingMinValue: {
      type: Number,
      default: 500,
    },
    defaultShippingCost: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Garantir que exista apenas um documento de configurações
settingsSchema.index({}, { unique: true });

const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;
