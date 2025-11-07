import mongoose from 'mongoose';
import User from '../models/User';
import { config } from '../config/config';

const createAdmin = async () => {
  try {
    // Conecta ao banco de dados
    await mongoose.connect(config.mongodbUri);
    console.log('✓ Conectado ao MongoDB');

    // Verifica se já existe um admin
    const existingAdmin = await User.findOne({ email: 'admin@pneus.com' });

    if (existingAdmin) {
      console.log('⚠ Admin já existe!');
      console.log('Email:', existingAdmin.email);
      console.log('Nome:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      
      // Atualiza a role para garantir que é admin
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✓ Role atualizada para admin');
      }
    } else {
      // Cria novo usuário admin
      const admin = await User.create({
        name: 'Administrador',
        email: 'admin@pneus.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });

      console.log('✓ Admin criado com sucesso!');
      console.log('Email:', admin.email);
      console.log('Senha: admin123');
      console.log('Role:', admin.role);
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Erro ao criar admin:', error);
    process.exit(1);
  }
};

createAdmin();
