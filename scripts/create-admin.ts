import mongoose from 'mongoose';
import User from '../src/models/User';
import { config } from '../src/config/config';

async function createAdminUser() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('📦 Conectado ao MongoDB');

    // Verificar se admin já existe
    const existingAdmin = await User.findOne({ email: 'admin@pneus.com' });
    
    if (existingAdmin) {
      console.log('👤 Usuário admin já existe');
      
      // Atualizar para garantir que tem role admin
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Role do admin atualizada');
    } else {
      // Criar novo usuário admin
      const adminUser = new User({
        name: 'Administrador',
        email: 'admin@pneus.com',
        password: 'admin123',
        phone: '(11) 99999-9999',
        cpf: '111.444.777-35', // CPF válido no formato correto
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Usuário admin criado com sucesso!');
    }

    // Exibir informações do admin
    const admin = await User.findOne({ email: 'admin@pneus.com' });
    console.log('\n📋 Informações do Admin:');
    console.log(`   Email: ${admin?.email}`);
    console.log(`   Nome: ${admin?.name}`);
    console.log(`   Role: ${admin?.role}`);
    console.log(`   Ativo: ${admin?.isActive}`);
    console.log(`   ID: ${admin?._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();