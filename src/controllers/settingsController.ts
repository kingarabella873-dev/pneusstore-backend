import { Request, Response } from 'express';
import Settings from '../models/Settings';
import { logger } from '../utils/logger';

// Obter configurações
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await Settings.findOne();

    // Se não existir, criar configurações padrão
    if (!settings) {
      settings = await Settings.create({
        pixKey: '',
        pixKeyType: 'random',
        merchantName: 'PNEUS STORE',
        merchantCity: 'SAO PAULO',
        siteName: 'Pneus Store',
        siteUrl: 'https://pneus-store.com',
        supportEmail: 'contato@pneus-store.com',
        supportPhone: '(11) 99999-9999',
        freeShippingMinValue: 500,
        defaultShippingCost: 30,
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    logger.error('Erro ao buscar configurações:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações',
      error: error.message,
    });
  }
};

// Atualizar configurações (apenas admin)
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pixKey, merchantName, merchantCity } = req.body;

    // Validações
    if (pixKey && !pixKey.trim()) {
      res.status(400).json({
        success: false,
        message: 'Chave PIX é obrigatória',
      });
      return;
    }

    if (merchantName && merchantName.length > 25) {
      res.status(400).json({
        success: false,
        message: 'Nome do recebedor não pode ter mais de 25 caracteres',
      });
      return;
    }

    if (merchantCity && merchantCity.length > 15) {
      res.status(400).json({
        success: false,
        message: 'Cidade não pode ter mais de 15 caracteres',
      });
      return;
    }

    let settings = await Settings.findOne();

    if (!settings) {
      // Criar se não existir
      settings = await Settings.create(req.body);
    } else {
      // Atualizar
      Object.assign(settings, req.body);
      await settings.save();
    }

    logger.info('Configurações atualizadas', {
      userId: (req as any).user?.id,
    });

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: settings,
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message,
    });
  }
};

// Obter apenas configurações públicas (sem dados sensíveis)
export const getPublicSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne().select(
      'siteName siteUrl supportEmail supportPhone freeShippingMinValue pixKey pixKeyType merchantName merchantCity'
    );

    res.json({
      success: true,
      data: settings || {
        siteName: 'Pneus Store',
        siteUrl: 'https://pneus-store.com',
        supportEmail: 'contato@pneus-store.com',
        supportPhone: '(11) 99999-9999',
        freeShippingMinValue: 500,
        pixKey: null,
        pixKeyType: null,
        merchantName: null,
        merchantCity: null,
      },
    });
  } catch (error: any) {
    logger.error('Erro ao buscar configurações públicas:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações',
      error: error.message,
    });
  }
};
