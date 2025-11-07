#!/bin/bash

# Script de verificação pré-deploy para o Render
# Execute este script antes de fazer commit para produção

echo "🔍 Verificando ambiente para deploy no Render..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de erros
ERRORS=0
WARNINGS=0

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script no diretório backend/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório correto${NC}"

# 2. Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Instalando dependências...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha ao instalar dependências${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ Dependências instaladas${NC}"
    fi
else
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
fi

# 3. Verificar TypeScript e tipos
echo "🔍 Verificando TypeScript..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build do TypeScript falhou. Execute 'npm run build' para ver os erros${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Build TypeScript passou${NC}"
    
    # Verificar se a pasta dist foi criada
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Pasta dist criada com sucesso${NC}"
        
        # Verificar se server.js existe
        if [ -f "dist/server.js" ]; then
            echo -e "${GREEN}✅ dist/server.js encontrado${NC}"
        else
            echo -e "${RED}❌ dist/server.js não encontrado${NC}"
            ERRORS=$((ERRORS+1))
        fi
    else
        echo -e "${RED}❌ Pasta dist não foi criada${NC}"
        ERRORS=$((ERRORS+1))
    fi
fi

# 4. Verificar se .env existe (para desenvolvimento local)
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado (OK para deploy no Render)${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
fi

# 5. Verificar se .env.example existe
if [ ! -f ".env.example" ]; then
    echo -e "${RED}❌ Arquivo .env.example não encontrado${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Arquivo .env.example existe${NC}"
fi

# 6. Verificar se render.yaml existe
if [ ! -f "render.yaml" ]; then
    echo -e "${YELLOW}⚠️  Arquivo render.yaml não encontrado${NC}"
else
    echo -e "${GREEN}✅ Arquivo render.yaml existe${NC}"
fi

# 7. Verificar arquivos críticos
CRITICAL_FILES=(
    "src/server.ts"
    "src/config/config.ts"
    "src/config/database.ts"
    "package.json"
    "tsconfig.json"
)

echo "🔍 Verificando arquivos críticos..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Arquivo crítico não encontrado: $file${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os arquivos críticos presentes${NC}"
fi

# 8. Verificar scripts no package.json
echo "🔍 Verificando scripts do package.json..."
REQUIRED_SCRIPTS=("build" "start")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✅ Script '$script' encontrado${NC}"
    else
        echo -e "${RED}❌ Script '$script' não encontrado no package.json${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

# 9. Listar variáveis de ambiente necessárias
echo ""
echo "📝 Variáveis de ambiente que você precisa configurar no Render:"
echo ""
echo "  🔐 OBRIGATÓRIAS:"
echo "    - NODE_ENV=production"
echo "    - PORT=10000"
echo "    - MONGODB_URI=mongodb+srv://..."
echo "    - JWT_SECRET=<gerar-valor-aleatorio>"
echo "    - FRONTEND_URL=https://seu-site.netlify.app"
echo "    - CORS_ORIGIN=https://seu-site.netlify.app"
echo ""
echo "  📧 EMAIL (opcional):"
echo "    - EMAIL_SERVICE=gmail"
echo "    - EMAIL_USER=seu-email@gmail.com"
echo "    - EMAIL_PASS=sua-app-password"
echo ""
echo "  💳 PAGAMENTOS:"
echo "    - MERCADO_PAGO_ACCESS_TOKEN"
echo "    - MERCADO_PAGO_PUBLIC_KEY"
echo "    - MERCADO_PAGO_WEBHOOK_SECRET"
echo ""

# 10. Resumo final
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICAÇÃO COMPLETA - Pronto para deploy!${NC}"
    echo ""
    echo "📦 Próximos passos:"
    echo "  1. Commit e push das alterações"
    echo "  2. Criar Web Service no Render"
    echo "  3. Configurar variáveis de ambiente"
    echo "  4. Aguardar deploy"
    echo ""
    exit 0
else
    echo -e "${RED}❌ VERIFICAÇÃO FALHOU - $ERRORS erro(s) encontrado(s)${NC}"
    echo ""
    echo "Por favor, corrija os erros acima antes de fazer deploy."
    echo ""
    exit 1
fi
