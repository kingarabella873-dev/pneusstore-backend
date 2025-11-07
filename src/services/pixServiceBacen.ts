import { v4 as uuidv4 } from 'uuid';
import { crc16ccitt } from 'crc';
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

/**
 * Gerar campo EMV no formato TLV (Type-Length-Value)
 */
function genEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Serviço PIX seguindo ESPECIFICAÇÃO OFICIAL do Banco Central
 * Manual BR Code - Padrão EMV-QRCPS-MPM
 */
export class PixServiceBacen {
  /**
   * Gerar pagamento PIX conforme especificação do Banco Central
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
      
      // ID de transação (Campo 62-05: max 25 caracteres)
      const transactionId = `ORD-${Date.now()}`.substring(0, 25);

      // Construir payload EMV conforme Manual BR Code
      const payload: string[] = [];

      // 00: Payload Format Indicator (obrigatório, fixo "01")
      payload.push(genEMV('00', '01'));

      // 01: Point of Initiation Method
      // 12 = PIX Estático (nunca expira, pode ser usado múltiplas vezes)
      // 11 = PIX Dinâmico (uso único, expira)
      payload.push(genEMV('01', '12'));

      // 26-51: Merchant Account Information (PIX usa 26)
      // Subcampos:
      //   00: GUI - Globally Unique Identifier = "BR.GOV.BCB.PIX"
      //   01: Chave PIX
      //   02: Descrição (opcional)
      const merchantAccount: string[] = [];
      merchantAccount.push(genEMV('00', 'BR.GOV.BCB.PIX')); // GUI oficial
      merchantAccount.push(genEMV('01', settings.pixKey)); // Chave PIX
      
      if (data.description) {
        const desc = data.description.substring(0, 72);
        merchantAccount.push(genEMV('02', desc));
      }
      
      payload.push(genEMV('26', merchantAccount.join('')));

      // 52: Merchant Category Code (4 dígitos)
      // 0000 = não informado
      payload.push(genEMV('52', '0000'));

      // 53: Transaction Currency (ISO 4217)
      // 986 = BRL (Real Brasileiro)
      payload.push(genEMV('53', '986'));

      // 54: Transaction Amount (opcional, valor da transação)
      // Formato: sem .00 se for inteiro, com centavos se necessário
      // Exemplos: "10", "10.5", "10.50"
      if (data.amount > 0) {
        let valorStr = data.amount.toFixed(2);
        // Remover .00 se for valor inteiro
        if (valorStr.endsWith('.00')) {
          valorStr = valorStr.replace('.00', '');
        }
        payload.push(genEMV('54', valorStr));
      }

      // 58: Country Code (ISO 3166-1 alpha 2)
      payload.push(genEMV('58', 'BR'));

      // 59: Merchant Name (1-25 caracteres, obrigatório)
      const merchantName = settings.merchantName
        .substring(0, 25)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
      payload.push(genEMV('59', merchantName));

      // 60: Merchant City (1-15 caracteres, obrigatório)
      const merchantCity = settings.merchantCity
        .substring(0, 15)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      payload.push(genEMV('60', merchantCity));

      // 61: Postal Code (CEP, opcional)
      // Removido para simplificar

      // 62: Additional Data Field Template (obrigatório)
      // Subcampo 05: Reference Label (ID da transação)
      const additionalData: string[] = [];
      additionalData.push(genEMV('05', transactionId));
      payload.push(genEMV('62', additionalData.join('')));

      // 63: CRC16-CCITT (4 caracteres hex, obrigatório)
      // Placeholder temporário
      payload.push('6304');

      // Montar payload completo (sem CRC)
      const payloadWithoutCRC = payload.join('');

      // Calcular CRC16-CCITT com polinômio 0x1021 e init 0xFFFF
      const crcValue = crc16ccitt(payloadWithoutCRC);
      const crcHex = crcValue.toString(16).toUpperCase().padStart(4, '0');

      // Payload final
      const pixCode = `${payloadWithoutCRC}${crcHex}`;

      // Gerar QR Code em base64
      const pixQrCode = await QRCode.toDataURL(pixCode);

      // PIX Estático não expira, mas definimos prazo simbólico
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

      return {
        success: true,
        pixCode,
        pixQrCode,
        paymentId,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Erro ao gerar PIX (Bacen):', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerar código PIX',
      };
    }
  }
}
