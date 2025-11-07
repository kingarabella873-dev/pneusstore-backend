import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Erro ao conectar com MongoDB:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('Conexão MongoDB fechada.');
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao fechar conexão MongoDB:', error);
    process.exit(1);
  }
});