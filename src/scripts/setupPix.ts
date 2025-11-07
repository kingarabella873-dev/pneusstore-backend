import mongoose from 'mongoose';
import Settings from '../models/Settings';
import { config } from '../config/config';

const setupPix = async () => {
  try {
    // Conecta ao banco de dados
    await mongoose.connect(config.mongodbUri);
    console.log('✓ Conectado ao MongoDB');

    // Buscar ou criar configurações
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({
        siteName: 'Pneus Store',
        siteUrl: 'https://pneus-store.com',
        supportEmail: 'contato@pneus-store.com',
        supportPhone: '(11) 99999-9999',
        freeShippingMinValue: 500,
        defaultShippingCost: 30,
      });
    }

    // Configurar chave PIX REAL
    // IMPORTANTE: Substitua com SUA chave PIX real
    settings.pixKey = 'silasandrade94@gmail.com'; // MUDE PARA SUA CHAVE PIX REAL!
    settings.pixKeyType = 'email';
    settings.merchantName = 'PNEUS STORE';
    settings.merchantCity = 'SAO PAULO';

    await settings.save();

    console.log('✓ Configurações PIX atualizadas com sucesso!');
    console.log('');
    console.log('📱 Configuração PIX:');
    console.log('  Chave:', settings.pixKey);
    console.log('  Tipo:', settings.pixKeyType);
    console.log('  Nome:', settings.merchantName);
    console.log('  Cidade:', settings.merchantCity);
    console.log('');
    console.log('⚠️  IMPORTANTE: Certifique-se de que esta é uma chave PIX válida e ativa!');
    console.log('   Para testar, escaneie o QR Code com seu app bancário.');

    process.exit(0);
  } catch (error) {
    console.error('✗ Erro ao configurar PIX:', error);
    process.exit(1);
  }
};

setupPix();
