# Checklist de Preparação para Hospedagem / Deploy — NexCarga (`DEPLOY_CHECKLIST.md`)

> **Importante**: Nenhum deploy em produção ou cobrança financeira real foi executado, respeitando as regras de governança do projeto.

## Passos para Publicação Futura Autorizada (Hostinger / Cloud / VPS Node.js)

1. **Banco de Dados Supabase**:
   - Executar a migration `supabase/migrations/0001_nexcarga_schema_and_rls.sql` no SQL Editor do projeto Supabase.
   - Configurar bucket privado no Supabase Storage (`verification-documents`) sem URL pública permanente.
2. **Variáveis de Ambiente de Produção**:
   - Configurar `NODE_ENV=production`, `TZ=America/Sao_Paulo`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Quando autorizado pelo responsável, inserir `VITE_GOOGLE_MAPS_API_KEY` (com restrição de HTTP Referrer) e `MERCADO_PAGO_ACCESS_TOKEN`.
3. **Build e Inicialização**:
   - Executar `npm run build` para compilar os ativos estáticos em `dist/` com Manifesto PWA e Service Worker.
   - Iniciar o servidor Node/Express com `npm run start` (`node server.ts`).
