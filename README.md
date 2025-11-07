# Pneus Store Backend API

Backend Node.js para a loja de pneus, construído com Express, TypeScript, MongoDB e integração com sistemas de pagamento.

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Iniciar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start
```

### Deploy no Render

```bash
# 1. Verificar se está pronto para deploy
./pre-deploy-check.sh

# 2. Commit e push
git add .
git commit -m "Deploy backend"
git push origin master

# 3. Seguir guia completo em RENDER_DEPLOY.md
```

📚 **[Ver Guia Completo de Deploy →](RENDER_DEPLOY.md)**

## 🗄️ Banco de Dados

**MongoDB Atlas** já configurado:
```
mongodb+srv://kingarabella873_db_user:***@pneu-store.og6vpor.mongodb.net/
```

## 🚀 Tecnologias Utilizadas

- **Node.js** + **Express.js** - Backend framework
- **TypeScript** - Linguagem tipada
- **MongoDB** + **Mongoose** - Banco de dados
- **JWT** - Autenticação
- **Mercado Pago** - Pagamentos PIX
- **Multer** - Upload de arquivos
- **Nodemailer** - Envio de emails
- **Winston** - Logs
- **Helmet** - Segurança

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (banco, env)
├── controllers/     # Controladores das rotas
├── middlewares/     # Middlewares customizados
├── models/          # Modelos do banco de dados
├── routes/          # Definição das rotas
├── services/        # Serviços (pagamentos, email, etc)
├── utils/           # Utilitários (logger, helpers)
└── server.ts        # Arquivo principal
```

## ⚙️ Configuração

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   - `MONGODB_URI` - String de conexão MongoDB
   - `JWT_SECRET` - Chave secreta JWT
   - `STRIPE_SECRET_KEY` - Chave secreta Stripe
   - `EMAIL_USER` e `EMAIL_PASS` - Credenciais de email

3. **Executar em desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Build para produção**:
   ```bash
   npm run build
   npm start
   ```

## 🔗 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/addresses` - Adicionar endereço

### Produtos
- `GET /api/products` - Listar produtos (com filtros)
- `GET /api/products/featured` - Produtos em destaque
- `GET /api/products/category/:category` - Produtos por categoria
- `GET /api/products/:id` - Detalhes do produto
- `GET /api/products/:id/similar` - Produtos similares
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/:id` - Atualizar produto (admin)
- `DELETE /api/products/:id` - Remover produto (admin)

### Carrinho
- `GET /api/cart` - Obter carrinho
- `POST /api/cart/add` - Adicionar item
- `PUT /api/cart/item/:itemId` - Atualizar quantidade
- `DELETE /api/cart/item/:itemId` - Remover item
- `DELETE /api/cart/clear` - Limpar carrinho

### Pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders/my-orders` - Pedidos do usuário
- `GET /api/orders/:orderId` - Detalhes do pedido
- `PUT /api/orders/:orderId/cancel` - Cancelar pedido
- `GET /api/orders` - Todos os pedidos (admin)
- `PUT /api/orders/:orderId/status` - Atualizar status (admin)

### Pagamentos
- `POST /api/payments/card` - Pagamento cartão
- `POST /api/payments/pix` - Criar PIX
- `GET /api/payments/pix/status/:orderId` - Status PIX
- `POST /api/payments/webhook/stripe` - Webhook Stripe
- `POST /api/payments/webhook/pix` - Webhook PIX

### Upload
- `POST /api/upload/image` - Upload imagem única
- `POST /api/upload/images` - Upload múltiplas imagens

## 🛡️ Segurança

- **Helmet** - Headers de segurança
- **CORS** - Configurado para frontend
- **Rate Limiting** - Limite de requisições
- **JWT** - Autenticação segura
- **Validação** - Dados validados com Joi
- **Hash de senhas** - bcryptjs

## 📧 Email Templates

O sistema inclui templates para:
- Email de boas-vindas
- Confirmação de pedido
- Atualização de status do pedido

## 💳 Pagamentos

### Stripe (Cartão de Crédito)
- Suporte a parcelamento
- Webhooks para confirmação
- Processamento seguro

### PIX
- Geração de código PIX
- QR Code para pagamento
- Verificação de status

## 🗄️ Banco de Dados

### Modelos principais:
- **User** - Usuários e endereços
- **Product** - Produtos e especificações
- **Cart** - Carrinho de compras
- **Order** - Pedidos e pagamentos

## 🚀 Deploy

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Heroku
```bash
git add .
git commit -m "Deploy backend"
git push heroku main
```

## 📊 Monitoring

- **Winston** para logs estruturados
- **Morgan** para logs HTTP
- Health check em `/health`

## 🔧 Scripts Disponíveis

- `npm run dev` - Desenvolvimento com nodemon
- `npm run build` - Build TypeScript
- `npm start` - Executar produção
- `npm test` - Executar testes

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.