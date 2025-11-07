#!/bin/bash

# Script de verificação final antes do deploy
# Execute: bash check-deploy.sh

echo "🔍 Verificação Rápida para Deploy no Render"
echo ""

# 1. Verificar build
echo "1️⃣  Testando build..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build OK"
else
    echo "❌ Build FALHOU"
    echo "Execute: npm run build (para ver os erros)"
    exit 1
fi

# 2. Verificar se dist/server.js existe
if [ -f "dist/server.js" ]; then
    echo "✅ dist/server.js existe"
else
    echo "❌ dist/server.js NÃO encontrado"
    exit 1
fi

# 3. Verificar package.json
BUILD_CMD=$(node -pe "require('./package.json').scripts.build")
START_CMD=$(node -pe "require('./package.json').scripts.start")

echo "✅ Build command: $BUILD_CMD"
echo "✅ Start command: $START_CMD"

echo ""
echo "🎉 Tudo pronto para deploy!"
echo ""
echo "📋 Próximos passos:"
echo "1. git add ."
echo "2. git commit -m 'fix: configuração para deploy no Render'"
echo "3. git push origin master"
echo "4. Configure as variáveis de ambiente no Render"
echo "5. Deploy automático iniciará"
echo ""
echo "📖 Consulte DEPLOY_QUICK.md para mais detalhes"
