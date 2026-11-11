# Modelagem de Banco de Dados e RLS — NexCarga

Arquivo de migration oficial: `supabase/migrations/0001_nexcarga_schema_and_rls.sql`.

## Domínios Relacionais Modelados
1. **Identidade e RBAC**: `users`, `roles_permissions` (`ADMIN`, `DRIVER`, `COMPANY`, `CARRIER`, `OPERATOR`, `AFFILIATE`).
2. **Empresas e Equipes**: `companies`, `company_members`.
3. **Motoristas e Catálogo Brasileiro**: `drivers`, `vehicle_catalog` (13 categorias), `implement_catalog` (17 categorias), `driver_vehicles`.
4. **Fretes, Propostas e Contratos (15 Etapas)**: `freights`, `freight_proposals`, `contracts`, `contract_events`.
5. **Comunicação e Privacidade**: `conversations`, `messages` (com sanitização pré-pagamento).
6. **Módulos Inteligentes**: `regional_pickups` (NexColeta), `nexpoint_usages` (NexPoint 24h), `nexia_usage_logs` (NexIA), `verification_documents` (NexVerify).
7. **Monetização e Afiliados**: `subscription_plans`, `subscriptions`, `financial_ledger` (protegida por trigger `trg_financial_ledger_immutable` contra `UPDATE` e `DELETE`), `affiliates`.
8. **Governança e Auditoria**: `assisted_admin_sessions`, `audit_logs`.
