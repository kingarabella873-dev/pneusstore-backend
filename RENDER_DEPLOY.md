# 🚀 Guia de Deploy no Render - Pneus Store Backend

## 📋 Pré-requisitos

- Conta no [Render](https://render.com/)
- Repositório Git com o código do backend
- Conta no MongoDB Atlas (já configurada)
- Código commitado no repositório

## 🗄️ Configuração do MongoDB Atlas

Sua connection string já está pronta:
```
mongodb+srv://kingarabella873_db_user:NRPbIphfulNVgGIv@pneu-store.og6vpor.mongodb.net/
```

### Verificações importantes no MongoDB Atlas:

1. **Acesse o MongoDB Atlas**: https://cloud.mongodb.com/
2. **Network Access**: 
   - Vá em **Security** → **Network Access**
   - Adicione `0.0.0.0/0` para permitir acesso do Render
   - Ou adicione IPs específicos do Render (recomendado)
3. **Database User**: Confirme que o usuário `kingarabella873_db_user` tem permissões de leitura/escrita
4. **Database Name**: Certifique-se de que o banco `pneus-store` existe

---

## 🎯 Métodos de Deploy

### Método 1: Deploy via Dashboard (Recomendado)

#### Passo 1: Preparar o Repositório

```bash
cd backend
git add .
git commit -m "Preparar backend para deploy no Render"
git push origin master
```

#### Passo 2: Criar Web Service no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com/)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Selecione o repositório `pneusstore-frontend`

#### Passo 3: Configurar o Serviço

Preencha os seguintes campos:

| Campo | Valor |
|-------|-------|
| **Name** | `pneus-store-backend` |
| **Region** | `Oregon` (ou mais próximo) |
| **Branch** | `master` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (para testes) |

#### Passo 4: Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione as seguintes variáveis:

```bash
# OBRIGATÓRIAS
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://kingarabella873_db_user:NRPbIphfulNVgGIv@pneu-store.og6vpor.mongodb.net/pneus-store?retryWrites=true&w=majority

# JWT (gere um valor seguro)
JWT_SECRET=<gerar-com-comando-abaixo>
JWT_EXPIRES_IN=7d

# Frontend (atualizar após deploy do frontend)
FRONTEND_URL=https://seu-site.netlify.app
CORS_ORIGIN=https://seu-site.netlify.app

# Email (opcional no início)
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu-token
MERCADO_PAGO_PUBLIC_KEY=sua-chave-publica
MERCADO_PAGO_WEBHOOK_SECRET=seu-webhook-secret

# Configurações adicionais
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/tmp/uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
LOG_LEVEL=info
ENABLE_SEED_DATA=false
MOCK_PAYMENTS=false
```

**⚠️ Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Passo 5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (5-10 minutos na primeira vez)
3. Após o deploy, você receberá uma URL: `https://pneus-store-backend.onrender.com`

---

### Método 2: Deploy via Blueprint (render.yaml)

O arquivo `render.yaml` já está configurado no projeto!

#### Passo 1: Conectar Repositório

1. Acesse [dashboard.render.com](https://dashboard.render.com/)
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte seu repositório
4. O Render detectará automaticamente o arquivo `render.yaml`

#### Passo 2: Configurar Variáveis Sensíveis

As variáveis marcadas com `sync: false` precisam ser configuradas manualmente:

- `MONGODB_URI`
- `EMAIL_USER` e `EMAIL_PASS`
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_WEBHOOK_SECRET`
- Outras chaves de API

#### Passo 3: Deploy

Clique em **"Apply"** e aguarde o deploy.

---

### Método 3: Deploy via Render CLI (Avançado)

```bash
# Instalar Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render deploy
```

---

## ⚙️ Configurações Importantes

### 1. Health Check Endpoint

Adicione um endpoint de health check no seu backend:

```typescript
// Em src/server.ts ou routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 2. Auto-Deploy

O Render faz deploy automático a cada push na branch configurada!

### 3. Logs

Acesse **Logs** no dashboard para ver logs em tempo real:
- Build logs
- Deploy logs
- Runtime logs

### 4. Plano Free - Limitações

⚠️ **Importante sobre o plano gratuito:**

- ✅ 750 horas/mês grátis
- ⚠️ **Serviço "hiberna" após 15 minutos de inatividade**
- ⏱️ Primeira requisição após hibernação demora ~30 segundos
- 💾 Sem disco persistente (uploads vão para `/tmp`)
- 📊 512 MB RAM

**Soluções:**
- Use um serviço de "ping" para manter ativo: https://uptimerobot.com/
- Ou faça upgrade para plano pago ($7/mês)

---

## 🔄 Atualizar URL do Backend no Frontend

Após o deploy, atualize a variável de ambiente no Netlify:

1. Acesse o dashboard da Netlify
2. Vá em **Site settings** → **Environment variables**
3. Atualize `REACT_APP_API_URL`:
   ```
   REACT_APP_API_URL=https://pneus-store-backend.onrender.com/api
   ```
4. Faça um novo deploy do frontend

---

## 🔍 Verificações Pós-Deploy

### Teste 1: Health Check

```bash
curl https://pneus-store-backend.onrender.com/api/health
```

Deve retornar: `{"status":"ok",...}`

### Teste 2: Conexão com MongoDB

Verifique os logs no Render. Deve aparecer:
```
MongoDB connected successfully
Server running on port 10000
```

### Teste 3: CORS

Teste do frontend fazendo uma requisição para o backend.

---

## 🐛 Troubleshooting

### Problema: Build falha

**Causa comum:** Dependências não instaladas corretamente

**Solução:**
1. Verifique os logs de build
2. Confirme que `package.json` está correto
3. Tente limpar cache: **Settings** → **Clear build cache & deploy**

### Problema: MongoDB connection timeout

**Causa:** IP do Render não está na whitelist do MongoDB Atlas

**Solução:**
1. MongoDB Atlas → **Network Access**
2. Adicione `0.0.0.0/0` (permite todos os IPs)
3. Ou adicione IPs do Render especificamente

### Problema: "Cannot find module" em produção

**Causa:** Dependência está em `devDependencies` ao invés de `dependencies`

**Solução:**
```bash
npm install <pacote> --save
# Não usar --save-dev para dependências de produção
```

### Problema: Uploads não funcionam

**Causa:** Plano free não tem disco persistente

**Solução:**
- Use serviço externo: AWS S3, Cloudinary, etc.
- Ou faça upgrade para plano pago com disco persistente

### Problema: Serviço demora a responder

**Causa:** Serviço hibernou (plano free)

**Soluções:**
1. Use UptimeRobot para fazer ping a cada 5 minutos
2. Upgrade para plano pago
3. Adicione mensagem de "carregando" no frontend

### Problema: CORS errors

**Verificações:**
1. `CORS_ORIGIN` está configurado com a URL correta do frontend
2. Backend tem middleware CORS configurado:
   ```typescript
   app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
   }));
   ```

---

## 📊 Monitoramento

### Métricas Disponíveis

No dashboard do Render:
- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Request Count
- ✅ Response Time
- ✅ Error Rate

### Configurar Alertas

1. Vá em **Settings** → **Notifications**
2. Configure alertas para:
   - Deploy failures
   - High error rate
   - High memory usage

---

## 🔒 Segurança

### Checklist de Segurança:

- [ ] `NODE_ENV=production` configurado
- [ ] `JWT_SECRET` gerado com valor aleatório forte
- [ ] Senha do MongoDB não está no código
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativado
- [ ] Helmet configurado (headers de segurança)
- [ ] Variáveis sensíveis apenas em Environment Variables

---

## 💰 Custos

### Plano Free
- ✅ 0$/mês
- ⚠️ Hibernação após 15 min
- 750 horas/mês

### Plano Starter ($7/mês)
- ✅ Sem hibernação
- ✅ Mais recursos
- ✅ SSL custom domain

---

## 🎉 Deploy Completo!

Após seguir este guia, seu backend estará:
- ✅ Rodando no Render
- ✅ Conectado ao MongoDB Atlas
- ✅ Configurado com SSL/HTTPS
- ✅ Auto-deploy configurado
- ✅ Pronto para receber requisições do frontend

### URLs Finais

```
Backend: https://pneus-store-backend.onrender.com
API: https://pneus-store-backend.onrender.com/api
Health: https://pneus-store-backend.onrender.com/api/health
```

---

## 📝 Checklist Final

Antes de considerar o deploy completo:

- [ ] Build passa sem erros
- [ ] MongoDB conecta com sucesso
- [ ] Health check retorna status OK
- [ ] Variáveis de ambiente configuradas
- [ ] CORS permite requisições do frontend
- [ ] Frontend atualizado com URL do backend
- [ ] Teste de ponta a ponta funcionando
- [ ] Logs não mostram erros críticos
- [ ] Documentação atualizada

---

## 📚 Recursos Úteis

- 📖 [Documentação do Render](https://render.com/docs)
- 💬 [Comunidade Render](https://community.render.com/)
- 🎓 [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- 🔧 [Node.js em Produção](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

**Seu backend está pronto para produção! 🚀**
