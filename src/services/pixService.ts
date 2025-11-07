import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
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

export class PixService {
  /**
   * Gerar pagamento PIX com QR Code EMV padrão
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

      const paymentId = uuidv4();
      const pixCode = this.generatePixEMVCode({
        pixKey: settings.pixKey,
        merchantName: settings.merchantName,
        merchantCity: settings.merchantCity,
        amount: data.amount,
        transactionId: data.orderId,
        description: data.description,
      });
      
      // Gerar QR Code real a partir do código PIX
      const pixQrCode = await this.generateQRCode(pixCode);
      
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
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gerar código PIX no padrão EMV (QRCPS-MPM)
   * Especificação: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
   */
  private static generatePixEMVCode(params: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    transactionId: string;
    description: string;
  }): string {
    const { pixKey, merchantName, merchantCity, amount, transactionId } = params;

    // ID 00: Payload Format Indicator
    const payload00 = this.createEMVTag('00', '01');

    // ID 26: Merchant Account Information (PIX)
    const merchantAccountInfo = [
      this.createEMVTag('00', 'BR.GOV.BCB.PIX'), // GUI
      this.createEMVTag('01', pixKey), // Chave PIX
    ].join('');
    const payload26 = this.createEMVTag('26', merchantAccountInfo);

    // ID 52: Merchant Category Code (MCC)
    // 5532 = Automotive Tire Stores (Lojas de Pneus)
    // 5533 = Automotive Parts and Accessories
    // IMPORTANTE: Usar categoria correta para evitar rejeição pelos bancos
    const payload52 = this.createEMVTag('52', '5532');

    // ID 53: Transaction Currency (986 = BRL)
    const payload53 = this.createEMVTag('53', '986');

    // ID 54: Transaction Amount (opcional, mas recomendado)
    // IMPORTANTE: Remover zeros desnecessários (10.00 → 10 ou 10.50 → 10.5)
    const formattedAmount = amount.toFixed(2).replace(/\.?0+$/, '');
    const payload54 = this.createEMVTag('54', formattedAmount);

    // ID 58: Country Code
    const payload58 = this.createEMVTag('58', 'BR');

    // ID 59: Merchant Name (máx 25 caracteres)
    const payload59 = this.createEMVTag('59', merchantName.substring(0, 25).toUpperCase());

    // ID 60: Merchant City (máx 15 caracteres)
    const payload60 = this.createEMVTag('60', merchantCity.substring(0, 15).toUpperCase());

    // ID 62: Additional Data Field Template
    const additionalDataField = [
      this.createEMVTag('05', transactionId.substring(0, 25)), // Reference Label
    ].join('');
    const payload62 = this.createEMVTag('62', additionalDataField);

    // Montar payload completo (sem CRC ainda)
    const payloadWithoutCRC = [
      payload00,
      payload26,
      payload52,
      payload53,
      payload54,
      payload58,
      payload59,
      payload60,
      payload62,
    ].join('');

    // ID 63: CRC16 (deve ser calculado sobre todo o payload + "6304")
    const crc = this.calculateCRC16(payloadWithoutCRC + '6304');
    const payload63 = `6304${crc}`;

    return payloadWithoutCRC + payload63;
  }

  /**
   * Criar tag EMV no formato: ID(2) + Tamanho(2) + Valor
   */
  private static createEMVTag(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  }

  /**
   * Calcular CRC16-CCITT (Polinômio 0x1021)
   * Usado no padrão PIX
   */
  private static calculateCRC16(payload: string): string {
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
      }
    }
    
    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Gerar QR Code a partir do código PIX
   */
  private static async generateQRCode(pixCode: string): Promise<string> {
    try {
      // Gerar QR Code em base64
      const qrCodeDataURL = await QRCode.toDataURL(pixCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
      
      // Remover o prefixo "data:image/png;base64,"
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      
      return base64Data;
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Verificar status do pagamento PIX
   * Nota: Em produção, implementar webhook ou consulta à API do banco
   */
  static async checkPixPaymentStatus(paymentId: string) {
    try {
      // TODO: Implementar consulta real ao status do pagamento
      // Por enquanto, retorna pending
      
      return {
        success: true,
        status: 'pending',
        paidAt: null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Webhook PIX (para receber notificações de pagamento)
   */
  static async handlePixWebhook(payload: any) {
    try {
      // Processar webhook do provedor PIX
      const { paymentId, status, transactionId } = payload;
      
      return {
        success: true,
        paymentId,
        status,
        transactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
