import { v4 as uuidv4 } from 'uuid';
import { QrCodePix } from 'qrcode-pix';
import Settings from '../models/Settings';

export interface PixPaymentData {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  description: string;
}

export interface PixPaymentResponse {
  success: boolean;
  pixCode?: string;
  pixQrCode?: string;
  paymentId?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Serviço PIX usando biblioteca qrcode-pix
 * Padrão Banco Central do Brasil
 */
export class PixService {
  /**
   * Gerar pagamento PIX com QR Code
   */
  static async createPixPayment(data: PixPaymentData): Promise<PixPaymentResponse> {
    try {
      // Buscar configurações do sistema
      const settings = await Settings.findOne();
      
      if (!settings || !settings.pixKey) {
        return {
          success: false,
          error: 'Chave PIX não configurada no sistema',
        };
      }

      // Validar dados obrigatórios
      if (!settings.merchantName || !settings.merchantCity) {
        return {
          success: false,
          error: 'Nome do comerciante e cidade são obrigatórios',
        };
      }

      const paymentId = uuidv4();
      
      // Gerar ID de transação (max 25 caracteres)
      const transactionId = `ORD-${Date.now()}`.substring(0, 25);

      // Criar QR Code PIX usando biblioteca oficial
      const qrCodePix = QrCodePix({
        version: '01',
        key: settings.pixKey, // Chave PIX configurada
        name: settings.merchantName.substring(0, 25).toUpperCase(), // max 25 caracteres
        city: settings.merchantCity.substring(0, 15).toUpperCase(), // max 15 caracteres
        transactionId: transactionId,
        message: data.description ? data.description.substring(0, 72) : '', // max 72 caracteres
        value: data.amount,
        currency: 986, // BRL (Real Brasileiro)
        countryCode: 'BR',
      });

      // Gerar código PIX base (payload EMV)
      let pixCode = qrCodePix.payload();
      
      // CORREÇÃO 1: Adicionar tag 01 (Point of Initiation Method) após tag 00
      // Tag 01 indica se o PIX é estático (12) ou dinâmico (11)
      // 01 02 12 = PIX Estático (NUNCA EXPIRA - pode ser pago a qualquer momento)
      // 01 02 11 = PIX Dinâmico (expira em 30 min)
      // A biblioteca qrcode-pix não gera essa tag, mas ela é obrigatória
      if (!pixCode.includes('0102')) {
        const versionTag = '000201'; // Tag 00 com versão 01
        const pointInitTag = '010212'; // Tag 01: PIX ESTÁTICO (nunca expira)
        
        if (pixCode.startsWith(versionTag)) {
          pixCode = versionTag + pointInitTag + pixCode.substring(versionTag.length);
        }
      }
      
      // CORREÇÃO 2: Remover .00 dos valores (alguns bancos rejeitam)
      // Exemplo: 15.00 → 15, mas 15.50 permanece 15.50
      const crc16 = require('crc').crc16ccitt;
      
      // Encontrar e corrigir tag 54 (valor)
      // Tag 54 tem formato: 54 [tamanho em 2 dígitos] [valor]
      const tag54Regex = /54(\d{2})([^\d]*[\d]+\.[\d]{2})/;
      const tag54Match = pixCode.match(tag54Regex);
      
      if (tag54Match) {
        const fullMatch = tag54Match[0]; // Ex: "5406100.00"
        let valor = tag54Match[2];        // Ex: "100.00"
        
        // Remover caracteres não numéricos no início (ex: caracteres de controle)
        valor = valor.replace(/^[^\d]+/, '');
        
        // Se terminar com .00, remover
        if (valor.endsWith('.00')) {
          valor = valor.replace('.00', '');
          const newLen = valor.length.toString().padStart(2, '0');
          
          // Substituir a tag 54 inteira
          const newTag54 = `54${newLen}${valor}`;
          
          pixCode = pixCode.replace(fullMatch, newTag54);
        }
      }
      
      // Recalcular CRC após todas as correções
      const payloadWithoutCRC = pixCode.substring(0, pixCode.length - 4);
      const newCRC = crc16(payloadWithoutCRC).toString(16).toUpperCase().padStart(4, '0');
      pixCode = payloadWithoutCRC + newCRC;

      // Gerar QR Code em base64
      const pixQrCode = await qrCodePix.base64();
      
      // Expira em 30 minutos
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      return {
        success: true,
        pixCode,
        pixQrCode,
        paymentId,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerar código PIX',
      };
    }
  }
}
