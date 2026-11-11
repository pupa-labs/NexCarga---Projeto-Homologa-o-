# Plano de Implementação por Fases — NexCarga (PUPA LABS)

- **FASE 0 — Arquitetura e Planejamento**: Concluída e aprovada.
- **FASE 1 — Fundação**: React 19, TypeScript, Vite, Tailwind CSS v4, Design System oficial (`#FF8A00`, `#E85D04`, `#111111`, `#292929`, `#FFFFFF`), servidor Express (`server.ts`) e catálogo de veículos/implementos.
- **FASE 2 — Identidade e Interfaces**: Telas 01 (Landing), 02 (Login), 03 (Cadastro/Perfis), 04 (Admin Control), 05 (Motorista), 06 (Empresa), 07 (Afiliado) e 16 (Mobile PWA).
- **FASE 3 — Banco e Segurança**: Schema SQL (`supabase/migrations/0001_nexcarga_schema_and_rls.sql`), políticas RLS, Acesso Assistido auditado e proteção de dados sensíveis.
- **FASE 4 — Operação Logística**: Publicação de fretes, propostas, Chat de Negociação pré e pós-pagamento (`10`) e Contratos de 15 etapas (`14`).
- **FASE 5 — Inteligência e Diferenciais**: NexRadar (`08`), NexColeta (`09`), NexIA (`11`), NexPoint e NexVerify (`13`).
- **FASE 6 — Gestão e Monetização**: Planos e Assinaturas (`12`), NexFinance imutável (`15`) e Programa de Afiliados com antifraude.
- **FASE 7 — Qualidade e Validação**: Testes unitários (`node:test`) e verificação em navegador real.
- **FASE 8 — Preparação para Hospedagem**: Documentação e checklist de deploy preparados sem execução de deploy não autorizado.
