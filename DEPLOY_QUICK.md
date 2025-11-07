# 🚀 Deploy Rápido no Render

## Problema Resolvido

O erro `Cannot find module '/opt/render/project/src/dist/server.js'` foi corrigido!

### O que foi alterado:

1. **package.json** - Script de build atualizado:
   ```json
   "build": "npm install && tsc && ls -la dist"
   ```

2. **server.ts** - Health check endpoints adicionados:
   - `/health` 
   - `/api/health`

3. **render.yaml** - Arquivo de configuração criado

## 📋 Passos para Deploy

### 1. Faça commit das alterações:
```bash
git add .
git commit -m "fix: configuração para deploy no Render"
git push origin master
```

### 2. Configure no Render Dashboard:

**Build Command:**
```
npm run build
```

**Start Command:**
```
npm start
```

### 3. Variáveis de Ambiente Obrigatórias:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=sua_connection_string
JWT_SECRET=sua_chave_secreta_segura
FRONTEND_URL=https://seu-frontend.com
```

### 4. Teste após deploy:

```
https://sua-api.onrender.com/health
https://sua-api.onrender.com/api/health
```

## ✅ Verificação

Antes de fazer o deploy, execute localmente:

```bash
npm run build
npm start
```

Se funcionar localmente, funcionará no Render!

## 📚 Documentação Completa

Consulte `DEPLOY_RENDER.md` para instruções detalhadas.

## 🔧 Troubleshooting

- **Build falha**: Verifique os logs no Render Dashboard
- **MODULE_NOT_FOUND**: Confirme que o build command está correto
- **Conexão com DB falha**: Verifique MONGODB_URI e whitelist de IPs

---

**Próximos passos**: Configure as variáveis de ambiente no Render e faça o deploy!
