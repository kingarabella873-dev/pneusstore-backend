import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pneus-store',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  
  // Payment
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  
  pagseguro: {
    email: process.env.PAGSEGURO_EMAIL || '',
    token: process.env.PAGSEGURO_TOKEN || '',
  },
  
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
  },
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};