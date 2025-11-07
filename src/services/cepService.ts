import axios from 'axios';

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export class CepService {
  // Buscar dados do CEP
  static async getCepData(cep: string): Promise<{ success: boolean; data?: CepData; error?: string }> {
    try {
      // Remove caracteres especiais do CEP
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return {
          success: false,
          error: 'CEP deve conter 8 dígitos',
        };
      }

      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (response.data.erro) {
        return {
          success: false,
          error: 'CEP não encontrado',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao consultar CEP',
      };
    }
  }

  // Validar formato do CEP
  static validateCepFormat(cep: string): boolean {
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep);
  }

  // Formatar CEP
  static formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
  }
}