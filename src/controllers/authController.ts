import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Gerar JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: '7d' });
};

// Registrar usuário
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, cpf } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email',
      });
    }

    // Criar usuário
    const user = new User({
      name,
      email,
      password,
      phone,
      cpf,
    });

    await user.save();

    // Gerar token
    const token = generateToken((user as any)._id.toString());

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Erro no registro:', error);
    next(error);
  }
};

// Login de usuário
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validar campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    }

    // Buscar usuário
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar senha
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    // Gerar token
    const token = generateToken((user as any)._id.toString());

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    next(error);
  }
};

// Obter perfil do usuário
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Erro ao buscar perfil:', error);
    next(error);
  }
};

// Atualizar perfil
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { name, phone, cpf } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, cpf },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user,
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);
    next(error);
  }
};

// Alterar senha
export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Verificar senha atual
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta',
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao alterar senha:', error);
    next(error);
  }
};

// Adicionar endereço
export const addAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const addressData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Se é o primeiro endereço ou está marcado como padrão, definir como padrão
    if (user.addresses.length === 0 || addressData.isDefault) {
      // Remover padrão dos outros endereços
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Endereço adicionado com sucesso',
      data: user.addresses,
    });
  } catch (error) {
    logger.error('Erro ao adicionar endereço:', error);
    next(error);
  }
};

// Atualizar endereço
export const updateAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;
    const addressData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    // Se está sendo marcado como padrão, remover padrão dos outros
    if (addressData.isDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    // Atualizar endereço
    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
    await user.save();

    res.json({
      success: true,
      message: 'Endereço atualizado com sucesso',
      data: user.addresses,
    });
  } catch (error) {
    logger.error('Erro ao atualizar endereço:', error);
    next(error);
  }
};

// Remover endereço
export const removeAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Endereço não encontrado',
      });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Endereço removido com sucesso',
      data: user.addresses,
    });
  } catch (error) {
    logger.error('Erro ao remover endereço:', error);
    next(error);
  }
};