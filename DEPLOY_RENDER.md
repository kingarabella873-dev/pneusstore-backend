# 🚀 Guia de Deploy no Render

## Configurações Necessárias

### 1. Configuração no Dashboard do Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** e selecione **"Web Service"**
3. Conecte seu repositório GitHub: `kingarabella873-dev/pneusstore-backend`
4. Configure o serviço:

#### Configurações Básicas:
- **Name**: `pneus-store-backend`
- **Region**: `Ohio (US East)` ou sua preferência
- **Branch**: `master`
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

#### Environment Variables (Variáveis de Ambiente):

Configure as seguintes variáveis no Render Dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=sua_conexao_mongodb
JWT_SECRET=seu_jwt_secret_seguro
FRONTEND_URL=https://seu-frontend.com

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_live_...

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# PIX (opcional)
PIX_KEY=sua_chave_pix
PIX_KEY_TYPE=email
PIX_MERCHANT_NAME=Sua Loja
PIX_MERCHANT_CITY=Sua Cidade
```

### 2. Configuração do MongoDB

Você precisa de um banco MongoDB em produção:

#### Opção 1: MongoDB Atlas (Recomendado)
1. Acesse [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster gratuito (M0)
4. Configure o IP whitelist: `0.0.0.0/0` (permite qualquer IP)
5. Crie um usuário do banco de dados
6. Copie a connection string e adicione no Render como `MONGODB_URI`

Exemplo de connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/pneus-store?retryWrites=true&w=majority
```

### 3. Verificação Pré-Deploy

Execute localmente antes de fazer o deploy:

```bash
# Compile o projeto
npm run build

# Verifique se a pasta dist foi criada
ls -la dist/

# Teste o build
npm start
```

### 4. Deploy

Após configurar tudo no Render:

1. Clique em **"Create Web Service"**
2. O Render fará o deploy automaticamente
3. Aguarde o build e deploy completarem (pode levar 5-10 minutos)
4. Sua API estará disponível em: `https://pneus-store-backend.onrender.com`

### 5. Endpoints de Verificação

Após o deploy, teste:

- **Health Check**: `https://sua-api.onrender.com/health`
- **API Base**: `https://sua-api.onrender.com/api/products`

### 6. Logs e Monitoramento

Para ver os logs:
1. Acesse seu serviço no Dashboard do Render
2. Clique na aba **"Logs"**
3. Veja os logs em tempo real

### 7. Atualizações Futuras

O Render faz deploy automático quando você:
1. Faz push para o branch `master`
2. O GitHub notifica o Render
3. O Render inicia um novo build automaticamente

### 8. Troubleshooting

#### Build falha:
- Verifique se todas as dependências estão em `package.json`
- Confirme que `typescript` está em `devDependencies`

#### Deploy falha (MODULE_NOT_FOUND):
- Verifique se o comando de build está correto: `npm run build`
- Confirme que o `start` command é: `npm start`

#### Erro de conexão com banco:
- Verifique se a `MONGODB_URI` está correta
- Confirme que o IP do Render está no whitelist do MongoDB

#### Timeout ou 503:
- O Render free tier hiberna após 15 minutos de inatividade
- A primeira requisição pode demorar ~1 minuto para "acordar" o servidor

### 9. Plano Free vs Paid

**Free Tier Limitations:**
- Hiberna após 15 minutos de inatividade
- 750 horas/mês de computação
- Cold starts podem demorar 30-60 segundos
- Compartilha recursos

**Paid Starter ($7/mês):**
- Sem hibernação
- Sem cold starts
- Recursos dedicados
- Melhor performance

### 10. Migração de Dados

Se você tem dados locais para migrar:

```bash
# Export do MongoDB local
mongodump --db pneus-store --out ./backup

# Import para MongoDB Atlas (ajuste a connection string)
mongorestore --uri "mongodb+srv://..." --db pneus-store ./backup/pneus-store
```

## Checklist de Deploy ✅

- [ ] Repositório GitHub configurado
- [ ] MongoDB Atlas configurado
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Health check funcionando: `/health`
- [ ] Frontend configurado com a URL da API do Render
- [ ] CORS configurado com a URL do frontend

## Suporte

Se encontrar problemas:
1. Verifique os logs no Render Dashboard
2. Teste o endpoint `/health`
3. Confirme as variáveis de ambiente
4. Verifique a conexão com o MongoDB

---

**Nota**: Lembre-se de nunca commitar suas variáveis de ambiente (arquivo `.env`) no Git!
