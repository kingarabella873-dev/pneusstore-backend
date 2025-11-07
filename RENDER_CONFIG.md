# 🔧 Configurações do Render - Passo a Passo

## ⚠️ IMPORTANTE: Configuração Correta

Quando você cria o Web Service no Render, use EXATAMENTE estas configurações:

---

## 📋 Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `pneus-store-backend` (ou o nome que você quiser) |
| **Region** | `Oregon` (ou mais próxima de você) |
| **Branch** | `master` |
| **Root Directory** | `backend` ⚠️ IMPORTANTE! |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## 🔍 Por que "Root Directory: backend"?

O Render precisa saber onde está o `package.json` do seu backend. Como seu projeto tem esta estrutura:

```
pneusstore-frontend/
├── src/                    ← Frontend
├── public/                 ← Frontend
├── package.json            ← Frontend
└── backend/                ← AQUI!
    ├── package.json        ← Backend package.json
    ├── tsconfig.json
    └── src/
        └── server.ts
```

Ao definir `Root Directory: backend`, o Render executa os comandos dentro da pasta `backend/`, onde está o `package.json` correto.

---

## 🚨 Erro Comum

**SE VOCÊ VIU ESTE ERRO:**
```
Error: Cannot find module '/opt/render/project/src/dist/server.js'
```

**CAUSA:** O Render não está usando `Root Directory: backend`

**SOLUÇÃO:**
1. Delete o Web Service atual
2. Crie um novo
3. **DEFINA `Root Directory: backend`** antes de criar

---

## ⚙️ Variáveis de Ambiente (OBRIGATÓRIAS)

Adicione estas variáveis no Render:

```bash
# Essenciais
NODE_ENV=production
PORT=10000

# MongoDB Atlas (USE SUA CONNECTION STRING REAL!)
MONGODB_URI=mongodb+srv://kingarabella873_db_user:NRPbIphfulNVgGIv@pneu-store.og6vpor.mongodb.net/pneus-store?retryWrites=true&w=majority

# JWT Secret (GERE UM NOVO!)
JWT_SECRET=<cole-aqui-o-valor-gerado>
JWT_EXPIRES_IN=7d

# Frontend (Temporário - atualizar depois do deploy do frontend)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Outros
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/tmp/uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
LOG_LEVEL=info
ENABLE_SEED_DATA=false
MOCK_PAYMENTS=false
```

### 🔐 Como Gerar JWT_SECRET

No seu terminal local:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e cole como valor de `JWT_SECRET`.

---

## 📸 Prints de Referência

### 1. Ao criar o Web Service:
```
Root Directory: backend     ← Digite isto!
```

### 2. Build Command:
```
npm install && npm run build
```

### 3. Start Command:
```
npm start
```

---

## ✅ Verificação Pós-Deploy

Após o deploy concluir, verifique:

### 1. Logs de Build
No Render, vá em **Logs** e procure por:
```
✓ Compiled successfully
> pneus-store-backend@1.0.0 postbuild
> ls -la dist
```

Deve mostrar os arquivos compilados em `dist/`

### 2. Logs de Runtime
Procure por:
```
MongoDB connected successfully
Server running on port 10000
```

### 3. Health Check
Teste a URL:
```bash
curl https://seu-backend.onrender.com/api/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","uptime":123}
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module dist/server.js"

**Solução 1: Verificar Root Directory**
- Vá em **Settings**
- Confirme que `Root Directory` está definido como `backend`
- Se não estiver, você precisa recriar o serviço

**Solução 2: Verificar Build**
- Vá em **Logs**
- Procure pela seção de build
- Confirme que o TypeScript compilou com sucesso
- Deve haver arquivos `.js` em `dist/`

**Solução 3: Limpar Cache**
- Dashboard → **Manual Deploy**
- Marque **Clear build cache**
- Click em **Deploy latest commit**

### Problema: "MODULE_NOT_FOUND" para dependências

**Causa:** Dependência está em `devDependencies` mas é necessária em produção

**Solução:**
```bash
# No diretório backend/, mover dependência
npm install <nome-do-pacote> --save
```

### Problema: MongoDB connection timeout

**Causa:** IP do Render não está autorizado no MongoDB Atlas

**Solução:**
1. Acesse https://cloud.mongodb.com/
2. **Security** → **Network Access**
3. **Add IP Address**
4. Digite: `0.0.0.0/0`
5. **Confirm**

---

## 🔄 Atualizar Deployment

Após corrigir qualquer problema:

```bash
# No seu computador
cd backend
git add .
git commit -m "Corrigir configuração"
git push origin master
```

O Render fará deploy automático!

---

## 📝 Checklist de Deploy

- [ ] Root Directory definido como `backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] JWT_SECRET gerado com valor aleatório
- [ ] MONGODB_URI configurado corretamente
- [ ] MongoDB Atlas: Network Access com 0.0.0.0/0
- [ ] Build concluiu sem erros
- [ ] Logs mostram "MongoDB connected"
- [ ] Health check retorna status OK

---

## 🎯 Se ainda tiver problemas

1. **Delete o Web Service atual no Render**
2. **Crie um novo seguindo EXATAMENTE este guia**
3. **NÃO ESQUEÇA: Root Directory = backend**

Boa sorte! 🚀
