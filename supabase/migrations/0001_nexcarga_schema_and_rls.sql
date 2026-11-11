-- =============================================================================
-- NEXCARGA — SaaS B2B LogTech | PUPA LABS
-- Migration 0001: Schema Relacional Completo (22 Domínios) + Políticas RLS
-- Timezone Oficial de Negócio: America/Sao_Paulo
-- =============================================================================

SET TIME ZONE 'America/Sao_Paulo';
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USUÁRIOS, PERFIS E RBAC
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'DRIVER', 'COMPANY', 'CARRIER', 'OPERATOR', 'AFFILIATE');
CREATE TYPE verification_status_enum AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REPROVADO', 'CORRECAO_SOLICITADA');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  document_cpf_cnpj TEXT NOT NULL UNIQUE,
  primary_role user_role_enum NOT NULL DEFAULT 'DRIVER',
  verification_status verification_status_enum NOT NULL DEFAULT 'PENDENTE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_enum NOT NULL,
  permission_code TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE (role, permission_code)
);

-- 2. EMPRESAS E MEMBROS
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT 'Manhuaçu',
  state CHAR(2) NOT NULL DEFAULT 'MG',
  verification_status verification_status_enum NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'OPERADOR',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

-- 3. MOTORISTAS, VEÍCULOS E IMPLEMENTOS BRASILEIROS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cnh_number TEXT NOT NULL,
  cnh_category VARCHAR(5) NOT NULL,
  rntrc_antt TEXT NOT NULL,
  base_city TEXT NOT NULL DEFAULT 'Manhuaçu',
  base_state CHAR(2) NOT NULL DEFAULT 'MG',
  verification_status verification_status_enum NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_axles INTEGER NOT NULL,
  max_capacity_kg INTEGER NOT NULL,
  max_volume_m3 NUMERIC(10,2) NOT NULL,
  requires_implement BOOLEAN NOT NULL DEFAULT FALSE,
  compatible_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  restrictions_note TEXT
);

CREATE TABLE implement_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body_type TEXT NOT NULL,
  default_axles INTEGER NOT NULL,
  max_capacity_kg INTEGER NOT NULL,
  max_volume_m3 NUMERIC(10,2) NOT NULL,
  thermal_control BOOLEAN NOT NULL DEFAULT FALSE,
  compatible_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  restrictions_note TEXT
);

CREATE TABLE driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_catalog_id TEXT NOT NULL REFERENCES vehicle_catalog(id),
  implement_catalog_id TEXT REFERENCES implement_catalog(id),
  plate VARCHAR(10) NOT NULL UNIQUE,
  renavam VARCHAR(20) NOT NULL,
  capacity_kg INTEGER NOT NULL,
  volume_m3 NUMERIC(10,2) NOT NULL,
  axles INTEGER NOT NULL,
  crlv_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FRETES, PROPOSTAS, CONVERSAS E CONTRATOS (15 ETAPAS)
CREATE TABLE freights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  origin_city TEXT NOT NULL,
  origin_state CHAR(2) NOT NULL,
  origin_lat NUMERIC(9,6) NOT NULL,
  origin_lng NUMERIC(9,6) NOT NULL,
  destination_city TEXT NOT NULL,
  destination_state CHAR(2) NOT NULL,
  destination_lat NUMERIC(9,6) NOT NULL,
  destination_lng NUMERIC(9,6) NOT NULL,
  distance_km INTEGER NOT NULL,
  cargo_category TEXT NOT NULL,
  required_vehicle_type TEXT NOT NULL,
  required_implement_type TEXT NOT NULL,
  weight_kg INTEGER NOT NULL,
  volume_m3 NUMERIC(10,2) NOT NULL,
  offered_value_brl NUMERIC(12,2) NOT NULL,
  full_pickup_address_protected TEXT NOT NULL,
  full_delivery_address_protected TEXT NOT NULL,
  contact_phone_protected TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLICADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE freight_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  proposed_value_brl NUMERIC(12,2) NOT NULL,
  estimated_eta_hours INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ENVIADA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  agreed_value_brl NUMERIC(12,2) NOT NULL,
  platform_maintenance_fee_brl NUMERIC(12,2) NOT NULL,
  fee_payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  current_stage TEXT NOT NULL DEFAULT '6_CONTRATO_FORMALIZADO',
  pickup_proof_url TEXT,
  delivery_proof_url TEXT,
  rating_score INTEGER CHECK (rating_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CHAT E NEGOCIAÇÃO COM BLOQUEIO PRÉ-PAGAMENTO
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id),
  sanitized_content TEXT NOT NULL,
  was_redacted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. NEXCOLETA, NEXPOINT, NEXIA E NEXVERIFY
CREATE TABLE regional_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id),
  origin_city TEXT NOT NULL DEFAULT 'Manhuaçu - MG',
  destination_city TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_window TEXT NOT NULL DEFAULT 'MANHA',
  cargo_type TEXT NOT NULL,
  weight_kg INTEGER NOT NULL,
  volume_m3 NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE nexpoint_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  sao_paulo_date DATE NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE nexia_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  operation_type TEXT NOT NULL,
  prompt_summary TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  private_storage_key TEXT NOT NULL,
  status verification_status_enum NOT NULL DEFAULT 'EM_ANALISE',
  reviewer_user_id UUID REFERENCES users(id),
  review_justification TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PLANOS, ASSINATURAS, NEXFINANCE (LEDGER IMUTÁVEL) E AFILIADOS
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('MENSAL', 'TRIMESTRAL', 'ANUAL')),
  includes_nexia BOOLEAN NOT NULL DEFAULT FALSE,
  illustrative_price_brl NUMERIC(10,2) NOT NULL,
  trial_days INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'TRIAL',
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('ASSINATURA', 'TAXA_CONTRATO', 'COMISSAO_AFILIADO', 'SAQUE', 'ESTORNO_COMPENSATORIO')),
  direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  amount_brl NUMERIC(12,2) NOT NULL CHECK (amount_brl > 0),
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  compensates_entry_id UUID REFERENCES financial_ledger(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proteção estrita contra exclusão ou edição destrutiva no livro-razão financeiro
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operação proibida: movimentações financeiras do NexFinance não podem ser apagadas ou sobrescritas. Utilize lançamento compensatório.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_financial_ledger_immutable
BEFORE UPDATE OR DELETE ON financial_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  signups_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  available_balance_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ACESSO ADMINISTRATIVO ASSISTIDO E AUDITORIA
CREATE TABLE assisted_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  justification TEXT NOT NULL CHECK (char_length(justification) >= 10),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  assisted_session_id UUID REFERENCES assisted_admin_sessions(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS) ESTRITAS (NÃO PERMISSIVAS)
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assisted_admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuários acessam apenas seu próprio registro ou se forem ADMIN
CREATE POLICY users_self_or_admin ON users
  FOR SELECT USING (auth.uid() = auth_uid OR EXISTS (
    SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.primary_role = 'ADMIN'
  ));

-- Documentos do NexVerify nunca são públicos: visíveis apenas ao titular ou Administrador
CREATE POLICY verification_docs_owner_or_admin ON verification_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = verification_documents.user_id AND u.auth_uid = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid() AND u.primary_role = 'ADMIN')
  );
