import Stripe from 'stripe';
import { config } from '../config/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export interface PaymentIntentData {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreditCardPaymentData {
  paymentMethodId: string;
  amount: number;
  orderId: string;
  customerId?: string;
  installments?: number;
}

export class StripeService {
  // Criar Payment Intent
  static async createPaymentIntent(data: PaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Converter para centavos
        currency: data.currency || 'brl',
        customer: data.customerId,
        metadata: {
          orderId: data.orderId,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Processar pagamento com cartão de crédito
  static async processCardPayment(data: CreditCardPaymentData) {
    try {
      let paymentIntent;

      if (data.installments && data.installments > 1) {
        // Para parcelamento, usar Payment Intent com setup
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(data.amount * 100),
          currency: 'brl',
          payment_method: data.paymentMethodId,
          customer: data.customerId,
          confirm: true,
          metadata: {
            orderId: data.orderId,
            installments: data.installments.toString(),
          },
        });
      } else {
        // Pagamento à vista
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(data.amount * 100),
          currency: 'brl',
          payment_method: data.paymentMethodId,
          customer: data.customerId,
          confirm: true,
          metadata: {
            orderId: data.orderId,
          },
        });
      }

      return {
        success: true,
        paymentIntent,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Confirmar pagamento
  static async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      
      return {
        success: true,
        paymentIntent,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cancelar pagamento
  static async cancelPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      
      return {
        success: true,
        paymentIntent,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Criar cliente
  static async createCustomer(data: { name: string; email: string; phone?: string }) {
    try {
      const customer = await stripe.customers.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      return {
        success: true,
        customer,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Obter detalhes do pagamento
  static async getPaymentDetails(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        paymentIntent,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Webhook - verificar assinatura
  static constructWebhookEvent(payload: string | Buffer, signature: string, endpointSecret: string) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      throw error;
    }
  }
}