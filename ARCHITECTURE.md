# Arquitetura Técnica — NexCarga (PUPA LABS)

## 1. Visão Geral da Arquitetura

A plataforma utiliza uma arquitetura full-stack modular em TypeScript com separação estrita entre interface (React 19 + Vite + Tailwind CSS v4), regras de negócio puras (`src/domain/rules.ts`) e servidor backend (`server.ts` em Express).

- **Frontend (`src/`)**: Componentes modulares organizados por domínio (`PublicViews`, `DashboardsViews`, `IntelligentModulesViews`, `GovernanceModulesViews`, `NexBrand`) e tokens centralizados (`src/design-system/tokens.ts`).
- **Domínio e Catálogo (`src/domain/`)**: Regras determinísticas desacopladas da UI, cobertas por testes unitários automatizados (`src/domain/rules.test.ts` via `node:test`).
- **Backend (`server.ts`)**: API REST (`/api/*`) que valida transições contratuais, aplica bloqueio de dados sensíveis pré-pagamento, controla o ciclo de 24h do NexPoint pelo relógio do servidor (`America/Sao_Paulo`), executa chamadas `@google/genai` para a NexIA sem expor chaves no navegador e mantém o livro-razão financeiro imutável.
- **Banco de Dados (`supabase/migrations/0001_nexcarga_schema_and_rls.sql`)**: Modelagem PostgreSQL para Supabase com 22 domínios relacionais, triggers de imutabilidade contábil e políticas de Row Level Security (RLS).
