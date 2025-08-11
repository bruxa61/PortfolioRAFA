# Railway Deployment Guide

## Arquivos necessários criados:
- ✅ `Procfile` - Comando de inicialização
- ✅ `railway.json` - Configuração do Railway
- ✅ `nixpacks.toml` - Configuração do buildpack
- ✅ `/health` - Endpoint de health check

## Passos para deployment no Railway:

### 1. Preparação do Repositório
- Faça commit de todos os arquivos atuais
- Certifique-se que o `pyproject.toml` está atualizado

### 2. No Railway Dashboard
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Selecione este repositório

### 3. Configuração de Variáveis de Ambiente
No Railway, adicione estas variáveis:

**Obrigatórias:**
- `SESSION_SECRET` - Uma string secreta aleatória para sessões Flask
- `DATABASE_URL` - Será preenchida automaticamente pelo PostgreSQL do Railway

**Para Replit Auth (se usar):**
- `REPL_ID` - ID do seu Repl (se aplicável)
- `ISSUER_URL` - https://replit.com/oidc

### 4. Database Setup
1. No Railway, clique em "Add Service" → "Database" → "PostgreSQL"
2. O `DATABASE_URL` será configurado automaticamente
3. A aplicação criará as tabelas automaticamente na primeira execução

### 5. Deployment
1. O Railway detectará automaticamente os arquivos de configuração
2. O build será executado usando nixpacks
3. A aplicação será iniciada na porta $PORT

### 6. Configuração de Domínio
1. No Railway, vá em "Settings" → "Networking"
2. Configure um domínio personalizado ou use o domínio gerado
3. Aguarde a propagação DNS (pode levar alguns minutos)

### 7. Verificação
- Acesse `/health` para verificar se a aplicação está funcionando
- Teste o login e funcionalidades básicas

## Troubleshooting
- Se aparecer "Not Found", verifique se o domínio propagou
- Use os logs do Railway para debug
- Verifique se todas as variáveis de ambiente estão configuradas

## Arquivos de Configuração

### Procfile
```
web: gunicorn --bind 0.0.0.0:$PORT main:app
```

### railway.json
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT main:app",
    "healthcheckPath": "/health"
  }
}
```