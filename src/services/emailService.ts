import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  // Enviar email
  static async sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const mailOptions = {
        from: config.email.user,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado para ${data.to}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error('Erro ao enviar email:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Email de boas-vindas
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bem-vindo à Pneus Store!</h1>
        <p>Olá ${userName},</p>
        <p>Sua conta foi criada com sucesso. Agora você pode aproveitar nossas ofertas exclusivas em pneus!</p>
        <p>Acesse nosso site e encontre os melhores pneus para seu veículo.</p>
        <p>Atenciosamente,<br>Equipe Pneus Store</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Bem-vindo à Pneus Store!',
      html,
      text: `Olá ${userName}, sua conta foi criada com sucesso na Pneus Store!`,
    });
  }

  // Email de confirmação de pedido
  static async sendOrderConfirmationEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    orderTotal: number
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Pedido Confirmado!</h1>
        <p>Olá ${userName},</p>
        <p>Seu pedido <strong>#${orderNumber}</strong> foi confirmado com sucesso!</p>
        <p><strong>Valor total:</strong> R$ ${orderTotal.toFixed(2)}</p>
        <p>Você receberá atualizações sobre o status do seu pedido por email.</p>
        <p>Obrigado por escolher a Pneus Store!</p>
        <p>Atenciosamente,<br>Equipe Pneus Store</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Pedido #${orderNumber} - Confirmado`,
      html,
      text: `Olá ${userName}, seu pedido #${orderNumber} foi confirmado! Valor: R$ ${orderTotal.toFixed(2)}`,
    });
  }

  // Email de atualização de status do pedido
  static async sendOrderStatusUpdateEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    status: string,
    trackingCode?: string
  ) {
    const statusMessages: { [key: string]: string } = {
      confirmed: 'confirmado e está sendo preparado',
      processing: 'em processamento',
      shipped: 'enviado',
      delivered: 'entregue',
    };

    const statusMessage = statusMessages[status] || status;
    
    let trackingInfo = '';
    if (trackingCode) {
      trackingInfo = `<p><strong>Código de rastreamento:</strong> ${trackingCode}</p>`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Atualização do Pedido</h1>
        <p>Olá ${userName},</p>
        <p>Seu pedido <strong>#${orderNumber}</strong> foi ${statusMessage}.</p>
        ${trackingInfo}
        <p>Continue acompanhando o status do seu pedido em nosso site.</p>
        <p>Atenciosamente,<br>Equipe Pneus Store</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Pedido #${orderNumber} - ${statusMessage}`,
      html,
      text: `Olá ${userName}, seu pedido #${orderNumber} foi ${statusMessage}.`,
    });
  }
}