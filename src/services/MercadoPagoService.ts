import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { IOrder } from '../models/Order';
import { config } from '../config/config';

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: config.mercadoPago.accessToken!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

export interface PaymentData {
  token: string;
  issuer_id: number;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  description: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface PreferenceData {
  items: Array<{
    id?: string;
    title: string;
    unit_price: number;
    quantity: number;
    currency_id?: string;
  }>;
  payer: {
    email: string;
    name?: string;
    surname?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type: string;
      number: string;
    };
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  notification_url?: string;
  external_reference?: string;
}

class MercadoPagoService {
  private payment: Payment;
  private preference: Preference;

  constructor() {
    this.payment = new Payment(client);
    this.preference = new Preference(client);
  }

  // Processar pagamento com cartão de crédito
  async processCardPayment(paymentData: PaymentData, order: IOrder) {
    try {
      const payment = await this.payment.create({
        body: {
          token: paymentData.token,
          issuer_id: paymentData.issuer_id,
          payment_method_id: paymentData.payment_method_id,
          transaction_amount: paymentData.transaction_amount,
          installments: paymentData.installments,
          description: paymentData.description,
          payer: {
            email: paymentData.payer.email,
            identification: {
              type: paymentData.payer.identification.type,
              number: paymentData.payer.identification.number,
            },
          },
          external_reference: order.orderNumber,
          metadata: {
            order_id: order._id?.toString() || order.id?.toString(),
            order_number: order.orderNumber
          }
        }
      });

      return {
        success: true,
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        installments: payment.installments,
        date_created: payment.date_created,
        date_approved: payment.date_approved
      };

    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      return {
        success: false,
        error: error.message || 'Erro no processamento do pagamento',
        cause: error.cause || []
      };
    }
  }

  // Criar preferência para PIX e outros métodos
  async createPreference(preferenceData: PreferenceData) {
    try {
      const preference = await this.preference.create({
        body: {
          items: preferenceData.items.map((item, index) => ({
            id: item.id || `item_${index}`,
            title: item.title,
            unit_price: item.unit_price,
            quantity: item.quantity,
            currency_id: item.currency_id || 'BRL'
          })),
          payer: preferenceData.payer,
          back_urls: preferenceData.back_urls,
          auto_return: preferenceData.auto_return || 'approved',
          payment_methods: {
            excluded_payment_methods: preferenceData.payment_methods?.excluded_payment_methods || [],
            excluded_payment_types: preferenceData.payment_methods?.excluded_payment_types || [],
            installments: preferenceData.payment_methods?.installments || 12
          },
          notification_url: preferenceData.notification_url,
          external_reference: preferenceData.external_reference,
          expires: false,
          binary_mode: true
        }
      });

      return {
        success: true,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      };

    } catch (error: any) {
      console.error('Erro ao criar preferência:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar preferência de pagamento'
      };
    }
  }

  // Criar pagamento PIX
  async createPixPayment(amount: number, description: string, email: string, orderNumber: string) {
    try {
      const payment = await this.payment.create({
        body: {
          transaction_amount: amount,
          description: description,
          payment_method_id: 'pix',
          payer: {
            email: email,
          },
          external_reference: orderNumber,
          notification_url: `${config.apiBaseUrl}/api/webhook/mercadopago`
        }
      });

      return {
        success: true,
        payment_id: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
        transaction_amount: payment.transaction_amount,
        date_created: payment.date_created,
        date_of_expiration: payment.date_of_expiration
      };

    } catch (error: any) {
      console.error('Erro no pagamento PIX:', error);
      return {
        success: false,
        error: error.message || 'Erro no processamento do PIX'
      };
    }
  }

  // Consultar status do pagamento
  async getPaymentStatus(paymentId: number) {
    try {
      const payment = await this.payment.get({ id: paymentId });
      
      return {
        success: true,
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        net_received_amount: payment.transaction_details?.net_received_amount,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        external_reference: payment.external_reference
      };

    } catch (error: any) {
      console.error('Erro ao consultar pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao consultar pagamento'
      };
    }
  }

  // Processar notificação webhook
  async processWebhook(data: any) {
    try {
      if (data.type === 'payment') {
        const paymentId = data.data?.id;
        if (paymentId) {
          const paymentInfo = await this.getPaymentStatus(paymentId);
          return paymentInfo;
        }
      }
      
      return {
        success: false,
        error: 'Tipo de notificação não suportado'
      };

    } catch (error: any) {
      console.error('Erro no webhook:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar webhook'
      };
    }
  }

  // Obter métodos de pagamento disponíveis
  async getPaymentMethods() {
    // Esta é uma implementação básica - você pode expandir conforme necessário
    return {
      success: true,
      methods: [
        {
          id: 'pix',
          name: 'PIX',
          type: 'bank_transfer',
          status: 'active'
        },
        {
          id: 'visa',
          name: 'Visa',
          type: 'credit_card',
          status: 'active'
        },
        {
          id: 'master',
          name: 'Mastercard',
          type: 'credit_card',
          status: 'active'
        }
      ]
    };
  }
}

const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;