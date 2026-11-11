import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  BRAZILIAN_VEHICLE_CATALOG,
  BRAZILIAN_IMPLEMENT_CATALOG,
} from './src/domain/catalog.ts';
import {
  evaluateNexPointQuota,
  sanitizeSensitiveFreightData,
  sanitizeChatMessageText,
  validateContractTransition,
  validateNexColetaGrouping,
  evaluateAffiliateCommission,
  createCompensatoryLedgerEntry,
  CONTRACT_STAGE_LABELS,
  type ContractStage,
  type RegionalPickupRequest,
  type LedgerEntry,
} from './src/domain/rules.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

// =============================================================================
// ESTADO DO SERVIDOR (FONTE DE VERDADE AUTORITATIVA NO BACKEND)
// Dados iniciais de operação em Manhuaçu-MG e região (claramente identificados)
// =============================================================================

export interface PlatformSettings {
  dailyFreeNexPointLimit: number;
  trialDays: number;
  contractMaintenanceFeePercent: number;
  affiliateFirstSubscriptionCommissionPercent: number;
  affiliateContractFeeCommissionPercent: number;
  affiliateAttributionWindowDays: number;
  minWithdrawalAmountBrl: number;
  plans: {
    id: string;
    name: string;
    cycle: 'MENSAL' | 'TRIMESTRAL' | 'ANUAL';
    includesNexIA: boolean;
    priceBrl: number;
    monthlyEquivalentBrl: number;
    savingsLabel: string;
    features: string[];
  }[];
}

const platformSettings: PlatformSettings = {
  dailyFreeNexPointLimit: 3,
  trialDays: 15,
  contractMaintenanceFeePercent: 6.5,
  affiliateFirstSubscriptionCommissionPercent: 25,
  affiliateContractFeeCommissionPercent: 10,
  affiliateAttributionWindowDays: 30,
  minWithdrawalAmountBrl: 150,
  plans: [
    {
      id: 'sem-nexia-mensal',
      name: 'Mensal',
      cycle: 'MENSAL',
      includesNexIA: false,
      priceBrl: 79.9,
      monthlyEquivalentBrl: 79.9,
      savingsLabel: 'Valor de referência configurável',
      features: ['Acesso completo à plataforma', 'Publicar e contratar fretes', 'NexRadar e NexColeta regional', 'Suporte padrão'],
    },
    {
      id: 'sem-nexia-trimestral',
      name: 'Trimestral',
      cycle: 'TRIMESTRAL',
      includesNexIA: false,
      priceBrl: 164.7,
      monthlyEquivalentBrl: 54.9,
      savingsLabel: 'Economia de 31%',
      features: ['Todos os recursos do plano Mensal', 'Prioridade nas buscas regionais', 'Economia de 31% no ciclo', 'Suporte prioritário'],
    },
    {
      id: 'sem-nexia-anual',
      name: 'Anual',
      cycle: 'ANUAL',
      includesNexIA: false,
      priceBrl: 540.0,
      monthlyEquivalentBrl: 45.0,
      savingsLabel: 'Maior economia (43%)',
      features: ['Todos os recursos operacionais', 'Destaque no selo NexVerify', 'Maior economia (43%)', 'Atendimento executivo'],
    },
    {
      id: 'com-nexia-mensal',
      name: 'Mensal + NexIA',
      cycle: 'MENSAL',
      includesNexIA: true,
      priceBrl: 119.9,
      monthlyEquivalentBrl: 119.9,
      savingsLabel: 'Inclui Inteligência Logística NexIA',
      features: ['Acesso total à plataforma + NexIA', 'Cálculo inteligente de custos e retorno', 'Descrições e análises logísticas com IA', 'Suporte prioritário'],
    },
    {
      id: 'com-nexia-trimestral',
      name: 'Trimestral + NexIA',
      cycle: 'TRIMESTRAL',
      includesNexIA: true,
      priceBrl: 269.7,
      monthlyEquivalentBrl: 89.9,
      savingsLabel: 'Economia de 25% + NexIA',
      features: ['Todos os recursos + Assistente NexIA', 'Análise preditiva de rotas e praças', 'Economia de 25% no trimestre', 'Suporte prioritário'],
    },
    {
      id: 'com-nexia-anual',
      name: 'Anual + NexIA',
      cycle: 'ANUAL',
      includesNexIA: true,
      priceBrl: 828.0,
      monthlyEquivalentBrl: 69.0,
      savingsLabel: 'Maior economia (42%) + NexIA',
      features: ['Acesso ilimitado à plataforma + NexIA', 'Relatórios executivos assistidos por IA', 'Maior economia anual (42%)', 'Gerente de conta dedicado'],
    },
  ],
};

// Fretes operacionais com proteção de dados sensíveis no servidor
const serverFreights = [
  {
    id: 'fr-01',
    code: '#FR-9041',
    companyName: 'Café Real Exportadora S.A.',
    companyVerified: true,
    originCity: 'Manhuaçu',
    originState: 'MG',
    originLat: -20.2572,
    originLng: -42.0336,
    destinationCity: 'Belo Horizonte',
    destinationState: 'MG',
    destinationLat: -19.9167,
    destinationLng: -43.9345,
    distanceKm: 290,
    cargoCategory: 'Alimentos / Café Beneficiado',
    requiredVehicleType: 'Truck (Pesado 6x2 / 6x4)',
    requiredImplementType: 'Baú (Furgão Alumínio)',
    weightKg: 13500,
    volumeM3: 48,
    offeredValueBrl: 2850.0,
    fullPickupAddress: 'Rodovia BR-262, Km 39,5 — Condomínio Logístico Café Real, Doca 03, Manhuaçu - MG',
    fullDeliveryAddress: 'Av. Amazonas, 6200 — Centro de Distribuição BH, Belo Horizonte - MG',
    contactPhone: '(33) 99841-2200',
    contactEmail: 'embarque@cafereal.com.br',
    companyCnpj: '18.420.110/0001-54',
    fiscalDocumentUrl: '/api/documents/nfe-9041-protegida',
    feePaymentConfirmed: false,
    status: 'PUBLICADO',
    createdAtIso: '2026-11-11T08:15:00-03:00',
  },
  {
    id: 'fr-02',
    code: '#FR-9042',
    companyName: 'Transporte XYZ & Logística',
    companyVerified: true,
    originCity: 'Manhuaçu',
    originState: 'MG',
    originLat: -20.2572,
    originLng: -42.0336,
    destinationCity: 'Vitória',
    destinationState: 'ES',
    destinationLat: -20.3155,
    destinationLng: -40.3128,
    distanceKm: 245,
    cargoCategory: 'Carga Geral / Café Exportação',
    requiredVehicleType: 'Cavalo Mecânico 6x2 (Trucado)',
    requiredImplementType: 'Porta-Contêiner (Bug)',
    weightKg: 27000,
    volumeM3: 68,
    offeredValueBrl: 3250.0,
    fullPickupAddress: 'Distrito Industrial de Realeza, Galpão 12 — Manhuaçu - MG',
    fullDeliveryAddress: 'Terminal Portuário de Vila Velha / Porto de Vitória - ES, Gate 4',
    contactPhone: '(33) 99915-8830',
    contactEmail: 'operacoes@transportexyz.com.br',
    companyCnpj: '24.890.512/0001-19',
    fiscalDocumentUrl: '/api/documents/nfe-9042-protegida',
    feePaymentConfirmed: false,
    status: 'EM_NEGOCIACAO',
    createdAtIso: '2026-11-11T09:00:00-03:00',
  },
  {
    id: 'fr-03',
    code: '#FR-9043',
    companyName: 'Distribuidora Zona da Mata Ltda',
    companyVerified: true,
    originCity: 'Reduto',
    originState: 'MG',
    originLat: -20.2389,
    originLng: -41.9086,
    destinationCity: 'Ipatinga',
    destinationState: 'MG',
    destinationLat: -19.4683,
    destinationLng: -42.5367,
    distanceKm: 165,
    cargoCategory: 'Alimentos Secos',
    requiredVehicleType: 'Toco (Semipesado 4x2)',
    requiredImplementType: 'Sider (Lonado Lateral)',
    weightKg: 5800,
    volumeM3: 32,
    offeredValueBrl: 1480.0,
    fullPickupAddress: 'Margens BR-262, Km 24 — Armazém Reduto Sul, Reduto - MG',
    fullDeliveryAddress: 'Av. Pedro Linhares Gomes, 1900 — Distrito Industrial, Ipatinga - MG',
    contactPhone: '(33) 98802-4411',
    contactEmail: 'expedicao@zonadamata.com.br',
    companyCnpj: '31.110.900/0001-82',
    fiscalDocumentUrl: '/api/documents/nfe-9043-protegida',
    feePaymentConfirmed: true,
    status: 'CONCLUIDO',
    createdAtIso: '2026-11-10T14:20:00-03:00',
  },
  {
    id: 'fr-04',
    code: '#FR-9044',
    companyName: 'AgroMinas Insumos e Grãos',
    companyVerified: true,
    originCity: 'Caratinga',
    originState: 'MG',
    originLat: -19.7897,
    originLng: -42.1392,
    destinationCity: 'Governador Valadares',
    destinationState: 'MG',
    destinationLat: -18.8511,
    destinationLng: -41.9494,
    distanceKm: 130,
    cargoCategory: 'Grãos / Insumos Agrícolas',
    requiredVehicleType: 'Bitruck (8x2 / 8x4)',
    requiredImplementType: 'Graneleiro (Grade Alta)',
    weightKg: 19500,
    volumeM3: 58,
    offeredValueBrl: 2190.0,
    fullPickupAddress: 'Rodovia BR-116, Km 522 — Silo Central AgroMinas, Caratinga - MG',
    fullDeliveryAddress: 'Distrito Agroindustrial GV, Lote 08 — Governador Valadares - MG',
    contactPhone: '(33) 99740-1122',
    contactEmail: 'logistica@agrominas.com.br',
    companyCnpj: '45.221.300/0001-09',
    fiscalDocumentUrl: '/api/documents/nfe-9044-protegida',
    feePaymentConfirmed: false,
    status: 'PUBLICADO',
    createdAtIso: '2026-11-11T09:40:00-03:00',
  },
  {
    id: 'fr-05',
    code: '#FR-9045',
    companyName: 'Cooperativa Cafeeira Caparaó',
    companyVerified: false,
    originCity: 'Manhumirim',
    originState: 'MG',
    originLat: -20.3622,
    originLng: -41.9547,
    destinationCity: 'Rio de Janeiro',
    destinationState: 'RJ',
    destinationLat: -22.9068,
    destinationLng: -43.1729,
    distanceKm: 395,
    cargoCategory: 'Alimentos / Café Especial',
    requiredVehicleType: 'Cavalo Mecânico 4x2',
    requiredImplementType: 'Baú (Furgão Alumínio)',
    weightKg: 24000,
    volumeM3: 80,
    offeredValueBrl: 4100.0,
    fullPickupAddress: 'Estrada Parque Caparaó, Km 04 — Armazém 2, Manhumirim - MG',
    fullDeliveryAddress: 'Av. Brasil, 14500 — Caju, Zona Portuária, Rio de Janeiro - RJ',
    contactPhone: '(33) 99610-9090',
    contactEmail: 'frete@coopcaparao.com.br',
    companyCnpj: '51.908.400/0001-41',
    fiscalDocumentUrl: '/api/documents/nfe-9045-protegida',
    feePaymentConfirmed: false,
    status: 'PUBLICADO',
    createdAtIso: '2026-11-11T10:05:00-03:00',
  },
];

// Contratos com máquina de estados de 15 etapas
const serverContracts: {
  id: string;
  code: string;
  freightId: string;
  routeLabel: string;
  companyName: string;
  driverName: string;
  valueBrl: number;
  maintenanceFeeBrl: number;
  feePaymentConfirmed: boolean;
  currentStage: ContractStage;
  statusCategory: 'ATIVO' | 'CONCLUIDO' | 'CANCELADO';
  statusBadgeLabel: string;
  events: { stage: ContractStage; label: string; timestampIso: string; actor: string }[];
}[] = [
  {
    id: 'ct-01',
    code: '#NC-04581',
    freightId: 'fr-01',
    routeLabel: 'Manhuaçu - MG → BH - MG',
    companyName: 'Café Real Exportadora S.A.',
    driverName: 'Carlos Eduardo Silva',
    valueBrl: 2850.0,
    maintenanceFeeBrl: 185.25,
    feePaymentConfirmed: true,
    currentStage: '11_EM_TRANSPORTE',
    statusCategory: 'ATIVO',
    statusBadgeLabel: 'Em andamento',
    events: [
      { stage: '6_CONTRATO_FORMALIZADO', label: '06. Contrato Formalizado', timestampIso: '2026-11-11T08:30:00-03:00', actor: 'Sistema NexCarga' },
      { stage: '7_TAXA_COBRADA', label: '07. Taxa de Serviço Emitida (R$ 185,25)', timestampIso: '2026-11-11T08:31:00-03:00', actor: 'NexFinance' },
      { stage: '8_PAGAMENTO_CONFIRMADO', label: '08. Pagamento Confirmado no Servidor', timestampIso: '2026-11-11T08:35:00-03:00', actor: 'Webhook Idempotente' },
      { stage: '9_DADOS_LIBERADOS', label: '09. Endereço Exato e Contato Liberados', timestampIso: '2026-11-11T08:35:05-03:00', actor: 'Guard de Privacidade' },
      { stage: '10_EM_COLETA', label: '10. Coleta Iniciada em Manhuaçu - MG', timestampIso: '2026-11-11T09:10:00-03:00', actor: 'Carlos Eduardo Silva (Motorista)' },
      { stage: '11_EM_TRANSPORTE', label: '11. Em Transporte pela BR-262', timestampIso: '2026-11-11T09:50:00-03:00', actor: 'Carlos Eduardo Silva (Motorista)' },
    ],
  },
  {
    id: 'ct-02',
    code: '#NC-04567',
    freightId: 'fr-02',
    routeLabel: 'Manhuaçu - MG → Vitória - ES',
    companyName: 'Transporte XYZ & Logística',
    driverName: 'Carlos Eduardo Silva',
    valueBrl: 3250.0,
    maintenanceFeeBrl: 211.25,
    feePaymentConfirmed: false,
    currentStage: '7_TAXA_COBRADA',
    statusCategory: 'ATIVO',
    statusBadgeLabel: 'Aguardando coleta',
    events: [
      { stage: '6_CONTRATO_FORMALIZADO', label: '06. Contrato Formalizado', timestampIso: '2026-11-11T09:15:00-03:00', actor: 'Sistema NexCarga' },
      { stage: '7_TAXA_COBRADA', label: '07. Taxa de Serviço Emitida (R$ 211,25) — Aguardando Confirmação', timestampIso: '2026-11-11T09:16:00-03:00', actor: 'NexFinance' },
    ],
  },
  {
    id: 'ct-03',
    code: '#NC-04521',
    freightId: 'fr-03',
    routeLabel: 'Reduto - MG → Ipatinga - MG',
    companyName: 'Distribuidora Zona da Mata Ltda',
    driverName: 'Carlos Eduardo Silva',
    valueBrl: 1480.0,
    maintenanceFeeBrl: 96.2,
    feePaymentConfirmed: true,
    currentStage: '14_CONCLUIDO',
    statusCategory: 'CONCLUIDO',
    statusBadgeLabel: 'Concluído',
    events: [
      { stage: '8_PAGAMENTO_CONFIRMADO', label: '08. Pagamento Confirmado', timestampIso: '2026-11-10T10:00:00-03:00', actor: 'NexFinance' },
      { stage: '12_ENTREGUE', label: '12. Carga Entregue em Ipatinga - MG', timestampIso: '2026-11-10T16:20:00-03:00', actor: 'Carlos Eduardo Silva' },
      { stage: '13_COMPROVANTE_ENVIADO', label: '13. Canhoto Digital Validado', timestampIso: '2026-11-10T16:25:00-03:00', actor: 'Carlos Eduardo Silva' },
      { stage: '14_CONCLUIDO', label: '14. Contrato Concluído', timestampIso: '2026-11-10T17:00:00-03:00', actor: 'Distribuidora Zona da Mata Ltda' },
    ],
  },
];

// Conversas de negociação com proteção pré-pagamento
const serverConversations: {
  id: string;
  partnerName: string;
  subtitle: string;
  freightId: string;
  contractCode: string;
  lastTime: string;
  feePaymentConfirmed: boolean;
  messages: { id: string; sender: 'PARTNER' | 'ME' | 'SYSTEM'; text: string; time: string; wasRedacted?: boolean }[];
}[] = [
  {
    id: 'conv-01',
    partnerName: 'Transportes Alfa / XYZ',
    subtitle: 'Negociação em andamento (#NC-04567)',
    freightId: 'fr-02',
    contractCode: '#NC-04567',
    lastTime: '10:24',
    feePaymentConfirmed: false,
    messages: [
      {
        id: 'm-1',
        sender: 'PARTNER',
        text: 'Olá! Ainda há disponibilidade para este frete Manhuaçu → Vitória?',
        time: '10:18',
      },
      {
        id: 'm-2',
        sender: 'ME',
        text: 'Sim, o frete está disponível. Posso enviar os detalhes e condições?',
        time: '10:24',
      },
    ],
  },
  {
    id: 'conv-02',
    partnerName: 'Construtora Minas',
    subtitle: 'Aguardando pagamento',
    freightId: 'fr-04',
    contractCode: '#NC-04590',
    lastTime: '09:47',
    feePaymentConfirmed: false,
    messages: [
      {
        id: 'm-3',
        sender: 'PARTNER',
        text: 'Proposta de R$ 2.190,00 aceita! Aguardando confirmação da taxa para liberar o endereço do silo.',
        time: '09:47',
      },
    ],
  },
  {
    id: 'conv-03',
    partnerName: 'Café Real Exportadora',
    subtitle: 'Contrato ativo (#NC-04581)',
    freightId: 'fr-01',
    contractCode: '#NC-04581',
    lastTime: 'Ontem',
    feePaymentConfirmed: true,
    messages: [
      {
        id: 'm-4',
        sender: 'PARTNER',
        text: 'Taxa confirmada! Coleta liberada na Rodovia BR-262, Km 39,5, Doca 03. Telefone da portaria: (33) 99841-2200.',
        time: '08:36',
      },
    ],
  },
];

// Coletas Regionais NexColeta (Manhuaçu-MG e cidades próximas)
const serverRegionalPickups: RegionalPickupRequest[] = [
  {
    id: 'col-101',
    originCity: 'Manhuaçu - MG',
    destinationCity: 'Reduto - MG',
    pickupDate: '2026-11-15',
    pickupWindow: 'MANHA',
    weightKg: 1400,
    volumeM3: 7.5,
    cargoType: 'CAFE_SACARIA',
  },
  {
    id: 'col-102',
    originCity: 'Manhuaçu - MG',
    destinationCity: 'Ipanema - MG',
    pickupDate: '2026-11-15',
    pickupWindow: 'MANHA',
    weightKg: 1100,
    volumeM3: 6.0,
    cargoType: 'ALIMENTOS_SECOS',
  },
  {
    id: 'col-103',
    originCity: 'Manhuaçu - MG',
    destinationCity: 'Mutum - MG',
    pickupDate: '2026-11-15',
    pickupWindow: 'MANHA',
    weightKg: 950,
    volumeM3: 5.2,
    cargoType: 'GERAL',
  },
  {
    id: 'col-104',
    originCity: 'Manhuaçu - MG',
    destinationCity: 'Caratinga - MG',
    pickupDate: '2026-11-15',
    pickupWindow: 'TARDE',
    weightKg: 600,
    volumeM3: 4.0,
    cargoType: 'QUIMICO_PERIGOSO',
  },
];

// Controle do NexPoint no Servidor (por usuário)
const serverNexPointUsages: Record<string, number[]> = {
  'driver-carlos': [
    Date.now() - 2 * 60 * 60 * 1000, // 2h atrás
  ],
};

// Livro-Razão Financeiro Imutável (NexFinance)
const serverFinancialLedger: LedgerEntry[] = [
  {
    id: 'led-001',
    idempotencyKey: 'sub:xyz:2026-11',
    type: 'ASSINATURA',
    direction: 'CREDIT',
    amountBrl: 540.0,
    referenceId: 'SUB-9910',
    description: 'Assinatura Anual — Transporte XYZ & Logística',
    createdAtIso: '2026-11-05T11:20:00-03:00',
  },
  {
    id: 'led-002',
    idempotencyKey: 'fee:NC-04581',
    type: 'TAXA_CONTRATO',
    direction: 'CREDIT',
    amountBrl: 185.25,
    referenceId: '#NC-04581',
    description: 'Taxa de manutenção recebida — Contrato #NC-04581 (Manhuaçu → BH)',
    createdAtIso: '2026-11-11T08:35:00-03:00',
  },
  {
    id: 'led-003',
    idempotencyKey: 'fee:NC-04521',
    type: 'TAXA_CONTRATO',
    direction: 'CREDIT',
    amountBrl: 96.2,
    referenceId: '#NC-04521',
    description: 'Taxa de manutenção recebida — Contrato #NC-04521 (Reduto → Ipatinga)',
    createdAtIso: '2026-11-10T10:00:00-03:00',
  },
  {
    id: 'led-004',
    idempotencyKey: 'aff:comm:01',
    type: 'COMISSAO_AFILIADO',
    direction: 'DEBIT',
    amountBrl: 135.0,
    referenceId: 'AFF-JOAO',
    description: 'Comissão Afiliado (25% 1ª Assinatura Paga) — João Silva',
    createdAtIso: '2026-11-05T11:21:00-03:00',
  },
];

// Sessões de Acesso Administrativo Assistido e Logs de Auditoria
interface AssistedSession {
  id: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  targetRole: 'DRIVER' | 'COMPANY' | 'AFFILIATE';
  justification: string;
  startedAtIso: string;
  expiresAtIso: string;
  active: boolean;
}

let activeAssistedSession: AssistedSession | null = null;

const serverAuditLogs: {
  id: string;
  timestampIso: string;
  actor: string;
  action: string;
  target: string;
  assistedSessionId?: string;
  details: string;
}[] = [
  {
    id: 'aud-01',
    timestampIso: '2026-11-11T08:35:00-03:00',
    actor: 'Sistema NexFinance',
    action: 'CONFIRMACAO_TAXA_SERVICO',
    target: 'Contrato #NC-04581',
    details: 'Pagamento confirmado via webhook idempotente (R$ 185,25). Dados sensíveis liberados para as partes.',
  },
  {
    id: 'aud-02',
    timestampIso: '2026-11-11T09:12:00-03:00',
    actor: 'Administrador NexCarga',
    action: 'APROVACAO_NEXVERIFY',
    target: 'Motorista Carlos Eduardo Silva',
    details: 'CRLV e CNH validados sem URL pública permanente. Selo Verificado emitido.',
  },
];

// =============================================================================
// ROTAS DA API REST (/api/*)
// =============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'NexCarga SaaS B2B LogTech',
    developer: 'PUPA LABS',
    timezone: 'America/Sao_Paulo',
    serverTimeIso: new Date().toISOString(),
  });
});

// 1. Catálogo de Veículos e Implementos Brasileiros
app.get('/api/catalog', (_req, res) => {
  res.json({
    vehicles: BRAZILIAN_VEHICLE_CATALOG,
    implements: BRAZILIAN_IMPLEMENT_CATALOG,
  });
});

// 2. Estado Consolidado da Operação (Sanitizado no Servidor conforme status de pagamento)
app.get('/api/bootstrap', (req, res) => {
  const hasActiveSub = req.query.subscriber === 'true';
  const nexPointStatus = evaluateNexPointQuota({
    hasActiveSubscription: hasActiveSub,
    usageTimestampsMs: serverNexPointUsages['driver-carlos'] || [],
    serverNowMs: Date.now(),
    dailyFreeLimit: platformSettings.dailyFreeNexPointLimit,
  });

  const sanitizedFreights = serverFreights.map((f) => {
    const clean = sanitizeSensitiveFreightData(
      {
        originCity: f.originCity,
        originState: f.originState,
        destinationCity: f.destinationCity,
        destinationState: f.destinationState,
        fullPickupAddress: f.fullPickupAddress,
        fullDeliveryAddress: f.fullDeliveryAddress,
        contactPhone: f.contactPhone,
        contactEmail: f.contactEmail,
        companyCnpj: f.companyCnpj,
        fiscalDocumentUrl: f.fiscalDocumentUrl,
      },
      f.feePaymentConfirmed
    );

    return {
      id: f.id,
      code: f.code,
      companyName: f.companyName,
      companyVerified: f.companyVerified,
      originCity: clean.originCity,
      originState: clean.originState,
      originLat: f.originLat,
      originLng: f.originLng,
      destinationCity: clean.destinationCity,
      destinationState: clean.destinationState,
      destinationLat: f.destinationLat,
      destinationLng: f.destinationLng,
      distanceKm: f.distanceKm,
      cargoCategory: f.cargoCategory,
      requiredVehicleType: f.requiredVehicleType,
      requiredImplementType: f.requiredImplementType,
      weightKg: f.weightKg,
      volumeM3: f.volumeM3,
      offeredValueBrl: f.offeredValueBrl,
      fullPickupAddress: clean.fullPickupAddress,
      fullDeliveryAddress: clean.fullDeliveryAddress,
      contactPhone: clean.contactPhone,
      contactEmail: clean.contactEmail,
      companyCnpj: clean.companyCnpj,
      fiscalDocumentUrl: clean.fiscalDocumentUrl,
      sensitiveDataLocked: clean.sensitiveDataLocked,
      status: f.status,
      createdAtIso: f.createdAtIso,
    };
  });

  res.json({
    settings: platformSettings,
    nexPoint: nexPointStatus,
    freights: sanitizedFreights,
    contracts: serverContracts,
    conversations: serverConversations,
    regionalPickups: serverRegionalPickups,
    ledger: serverFinancialLedger,
    assistedSession: activeAssistedSession,
    auditLogs: serverAuditLogs,
  });
});

// 3. Publicar novo frete (Painel Empresa)
app.post('/api/freights', (req, res) => {
  const {
    companyName,
    originCity,
    originState,
    destinationCity,
    destinationState,
    distanceKm,
    cargoCategory,
    requiredVehicleType,
    requiredImplementType,
    weightKg,
    volumeM3,
    offeredValueBrl,
    fullPickupAddress,
    fullDeliveryAddress,
    contactPhone,
  } = req.body;

  if (!originCity || !destinationCity || !cargoCategory || !offeredValueBrl || Number(offeredValueBrl) <= 0) {
    return res.status(400).json({ error: 'Preencha origem, destino, categoria da carga e valor ofertado válido.' });
  }

  const newFreight = {
    id: `fr-${Date.now()}`,
    code: `#FR-${Math.floor(9050 + Math.random() * 900)}`,
    companyName: companyName || 'Transporte XYZ & Logística',
    companyVerified: true,
    originCity: String(originCity).trim(),
    originState: String(originState || 'MG').trim().toUpperCase(),
    originLat: -20.2572 + (Math.random() - 0.5) * 0.4,
    originLng: -42.0336 + (Math.random() - 0.5) * 0.4,
    destinationCity: String(destinationCity).trim(),
    destinationState: String(destinationState || 'MG').trim().toUpperCase(),
    destinationLat: -19.9167 + (Math.random() - 0.5) * 0.6,
    destinationLng: -43.9345 + (Math.random() - 0.5) * 0.6,
    distanceKm: Number(distanceKm) || 260,
    cargoCategory: String(cargoCategory),
    requiredVehicleType: String(requiredVehicleType || 'Truck (Pesado 6x2 / 6x4)'),
    requiredImplementType: String(requiredImplementType || 'Baú (Furgão Alumínio)'),
    weightKg: Number(weightKg) || 12000,
    volumeM3: Number(volumeM3) || 45,
    offeredValueBrl: Number(offeredValueBrl),
    fullPickupAddress: String(fullPickupAddress || `Distrito Logístico, ${originCity} - ${originState || 'MG'}`),
    fullDeliveryAddress: String(fullDeliveryAddress || `Centro de Distribuição, ${destinationCity} - ${destinationState || 'MG'}`),
    contactPhone: String(contactPhone || '(33) 99915-8830'),
    contactEmail: 'operacoes@transportexyz.com.br',
    companyCnpj: '24.890.512/0001-19',
    fiscalDocumentUrl: '/api/documents/nfe-nova-protegida',
    feePaymentConfirmed: false,
    status: 'PUBLICADO',
    createdAtIso: new Date().toISOString(),
  };

  serverFreights.unshift(newFreight);
  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    actor: newFreight.companyName,
    action: 'PUBLICACAO_FRETE',
    target: newFreight.code,
    assistedSessionId: activeAssistedSession?.id,
    details: `Frete publicado: ${newFreight.originCity}-${newFreight.originState} → ${newFreight.destinationCity}-${newFreight.destinationState} (R$ ${newFreight.offeredValueBrl.toFixed(2)})`,
  });

  res.status(201).json({ success: true, freightCode: newFreight.code });
});

// 4. Consumir 1 utilização gratuita do NexPoint no Servidor (Enviar Proposta / Desbloquear Ação)
app.post('/api/nexpoint/consume', (req, res) => {
  const { hasActiveSubscription, actionDescription } = req.body;
  const userId = 'driver-carlos';
  const currentUsages = serverNexPointUsages[userId] || [];

  const evalResult = evaluateNexPointQuota({
    hasActiveSubscription: Boolean(hasActiveSubscription),
    usageTimestampsMs: currentUsages,
    serverNowMs: Date.now(),
    dailyFreeLimit: platformSettings.dailyFreeNexPointLimit,
  });

  if (!evalResult.allowed) {
    return res.status(403).json({
      allowed: false,
      nexPoint: evalResult,
      error: evalResult.reason,
    });
  }

  if (!hasActiveSubscription) {
    currentUsages.push(Date.now());
    serverNexPointUsages[userId] = currentUsages;
  }

  const updatedStatus = evaluateNexPointQuota({
    hasActiveSubscription: Boolean(hasActiveSubscription),
    usageTimestampsMs: serverNexPointUsages[userId],
    serverNowMs: Date.now(),
    dailyFreeLimit: platformSettings.dailyFreeNexPointLimit,
  });

  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    actor: 'Carlos Eduardo Silva (Motorista)',
    action: 'USO_NEXPOINT',
    target: actionDescription || 'Envio de Proposta de Frete',
    details: `Uso contabilizado no servidor (America/Sao_Paulo). Restantes no ciclo de 24h: ${updatedStatus.remainingFreeUses}/${updatedStatus.dailyLimit}.`,
  });

  res.json({
    allowed: true,
    nexPoint: updatedStatus,
  });
});

// 5. Chat de Negociação (com bloqueio automático de dados sensíveis pré-pagamento)
app.post('/api/chat/messages', (req, res) => {
  const { conversationId, text } = req.body;
  const conv = serverConversations.find((c) => c.id === conversationId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Digite uma mensagem válida.' });
  }

  const { sanitizedText, wasRedacted } = sanitizeChatMessageText(
    String(text),
    conv.feePaymentConfirmed
  );

  const msg = {
    id: `m-${Date.now()}`,
    sender: 'ME' as const,
    text: sanitizedText,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
    wasRedacted,
  };

  conv.messages.push(msg);
  conv.lastTime = msg.time;

  res.json({
    message: msg,
    wasRedacted,
    feePaymentConfirmed: conv.feePaymentConfirmed,
  });
});

// 6. Confirmação de Pagamento da Taxa de Serviço no Servidor e Transição de Contrato
app.post('/api/contracts/:id/confirm-fee', (req, res) => {
  const contract = serverContracts.find((c) => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contrato não encontrado.' });
  }

  if (contract.feePaymentConfirmed) {
    return res.json({ message: 'Pagamento da taxa já estava confirmado (idempotente).', contract });
  }

  contract.feePaymentConfirmed = true;
  contract.currentStage = '9_DADOS_LIBERADOS';
  contract.statusBadgeLabel = 'Em andamento';
  contract.events.push(
    {
      stage: '8_PAGAMENTO_CONFIRMADO',
      label: `08. Pagamento da Taxa Confirmado no Servidor (R$ ${contract.maintenanceFeeBrl.toFixed(2)})`,
      timestampIso: new Date().toISOString(),
      actor: 'NexFinance Server',
    },
    {
      stage: '9_DADOS_LIBERADOS',
      label: '09. Dados Sensíveis Autorizados e Liberados para Coleta',
      timestampIso: new Date().toISOString(),
      actor: 'Guard de Privacidade NexCarga',
    }
  );

  // Atualiza o frete e a conversa vinculada
  const freight = serverFreights.find((f) => f.id === contract.freightId);
  if (freight) {
    freight.feePaymentConfirmed = true;
    freight.status = 'CONTRATADO';
  }

  const conv = serverConversations.find((c) => c.freightId === contract.freightId);
  if (conv) {
    conv.feePaymentConfirmed = true;
    conv.subtitle = `Contrato ativo (${contract.code})`;
    conv.messages.push({
      id: `m-sys-${Date.now()}`,
      sender: 'PARTNER',
      text: `Pagamento da taxa confirmado no backend! Dados liberados: ${freight?.fullPickupAddress} | Contato: ${freight?.contactPhone}.`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
    });
  }

  // Registra no livro-razão imutável
  const idempotencyKey = `fee:${contract.code}`;
  if (!serverFinancialLedger.some((l) => l.idempotencyKey === idempotencyKey)) {
    serverFinancialLedger.unshift({
      id: `led-${Date.now()}`,
      idempotencyKey,
      type: 'TAXA_CONTRATO',
      direction: 'CREDIT',
      amountBrl: contract.maintenanceFeeBrl,
      referenceId: contract.code,
      description: `Taxa de manutenção confirmada — Contrato ${contract.code} (${contract.routeLabel})`,
      createdAtIso: new Date().toISOString(),
    });
  }

  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    actor: 'NexFinance Backend',
    action: 'LIBERACAO_POS_PAGAMENTO',
    target: contract.code,
    details: `Taxa de R$ ${contract.maintenanceFeeBrl.toFixed(2)} confirmada. Endereço completo e telefone liberados.`,
  });

  res.json({ success: true, contract });
});

// Avançar etapa operacional do contrato (15 etapas)
app.post('/api/contracts/:id/advance', (req, res) => {
  const contract = serverContracts.find((c) => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contrato não encontrado.' });
  }

  const { targetStage } = req.body as { targetStage: ContractStage };
  const check = validateContractTransition({
    currentStage: contract.currentStage,
    targetStage,
    feePaymentConfirmed: contract.feePaymentConfirmed,
    actorRole: 'COMPANY',
  });

  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  contract.currentStage = targetStage;
  if (targetStage === '14_CONCLUIDO' || targetStage === '15_AVALIADO') {
    contract.statusCategory = 'CONCLUIDO';
    contract.statusBadgeLabel = 'Concluído';
  }

  contract.events.push({
    stage: targetStage,
    label: CONTRACT_STAGE_LABELS[targetStage],
    timestampIso: new Date().toISOString(),
    actor: 'Operação Validada no Servidor',
  });

  res.json({ success: true, contract });
});

// 7. NexColeta — Solicitar coleta regional e Validar Agrupamento
app.post('/api/nexcoleta/request', (req, res) => {
  const { originCity, destinationCity, pickupDate, pickupWindow, weightKg, volumeM3, cargoType } = req.body;
  if (!destinationCity || !pickupDate) {
    return res.status(400).json({ error: 'Informe a cidade de destino regional e a data da coleta.' });
  }

  const newPickup: RegionalPickupRequest = {
    id: `col-${Date.now()}`,
    originCity: originCity || 'Manhuaçu - MG',
    destinationCity: String(destinationCity).trim(),
    pickupDate: String(pickupDate),
    pickupWindow: pickupWindow || 'MANHA',
    weightKg: Number(weightKg) || 850,
    volumeM3: Number(volumeM3) || 4.5,
    cargoType: cargoType || 'CAFE_SACARIA',
  };

  serverRegionalPickups.unshift(newPickup);
  res.status(201).json({ success: true, pickup: newPickup });
});

app.post('/api/nexcoleta/validate-group', (req, res) => {
  const { pickupIds, vehicleMaxWeightKg, vehicleMaxVolumeM3 } = req.body;
  const selected = serverRegionalPickups.filter((p) => Array.isArray(pickupIds) && pickupIds.includes(p.id));
  const result = validateNexColetaGrouping(
    selected,
    Number(vehicleMaxWeightKg) || 4000,
    Number(vehicleMaxVolumeM3) || 26
  );
  res.json(result);
});

// 8. NexFinance — Lançamento Compensatório Auditável (Sem apagar movimentações)
app.post('/api/finance/compensate', (req, res) => {
  const { entryId, reason } = req.body;
  const original = serverFinancialLedger.find((e) => e.id === entryId);
  if (!original) {
    return res.status(404).json({ error: 'Lançamento original não encontrado no livro-razão.' });
  }

  try {
    const compensatory = createCompensatoryLedgerEntry(original, String(reason || ''), new Date().toISOString());
    serverFinancialLedger.unshift(compensatory);
    serverAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      actor: 'Administrador NexCarga',
      action: 'LANCAMENTO_COMPENSATORIO',
      target: original.id,
      details: compensatory.description,
    });
    res.status(201).json({ success: true, entry: compensatory });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Programa de Afiliados — Simulador Oficial de Elegibilidade e Antifraude no Servidor
app.post('/api/affiliates/evaluate-commission', (req, res) => {
  const result = evaluateAffiliateCommission({
    affiliateUserId: 'aff-joao',
    affiliateDocumentCpfCnpj: req.body.affiliateDocument || '111.222.333-44',
    affiliateEmail: req.body.affiliateEmail || 'joao@afiliado.com.br',
    referredUserId: req.body.referredUserId || 'usr-novo',
    referredDocumentCpfCnpj: req.body.referredDocument || '24.890.512/0001-19',
    referredEmail: req.body.referredEmail || 'cliente@empresa.com.br',
    referralCreatedAtMs: Date.now() - 3 * 24 * 60 * 60 * 1000,
    eventTimestampMs: Date.now(),
    attributionWindowDays: platformSettings.affiliateAttributionWindowDays,
    eventType: req.body.eventType || 'FIRST_PAID_SUBSCRIPTION',
    baseAmountBrl: Number(req.body.baseAmountBrl) || 164.7,
    firstSubscriptionCommissionRatePercent: platformSettings.affiliateFirstSubscriptionCommissionPercent,
    contractFeeCommissionRatePercent: platformSettings.affiliateContractFeeCommissionPercent,
  });
  res.json(result);
});

// 10. Acesso Administrativo Assistido (NexCarga Control)
app.post('/api/admin/assisted-session/start', (req, res) => {
  const { targetUserId, targetUserName, targetRole, justification } = req.body;
  if (!justification || String(justification).trim().length < 10) {
    return res.status(400).json({
      error: 'Justificativa obrigatória (mínimo de 10 caracteres) para iniciar sessão de Acesso Assistido auditado.',
    });
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000); // Expira automaticamente em 30 min

  activeAssistedSession = {
    id: `ASS-${Math.floor(10000 + Math.random() * 90000)}`,
    adminName: 'Administrador NexCarga Control',
    targetUserId: targetUserId || 'usr-carlos',
    targetUserName: targetUserName || 'Carlos Eduardo Silva (Motorista)',
    targetRole: targetRole || 'DRIVER',
    justification: String(justification).trim(),
    startedAtIso: now.toISOString(),
    expiresAtIso: expires.toISOString(),
    active: true,
  };

  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: now.toISOString(),
    actor: activeAssistedSession.adminName,
    action: 'INICIO_ACESSO_ASSISTIDO',
    target: activeAssistedSession.targetUserName,
    assistedSessionId: activeAssistedSession.id,
    details: `Sessão ${activeAssistedSession.id} iniciada. Justificativa: "${activeAssistedSession.justification}". Expiração: 30 min.`,
  });

  res.json({ success: true, session: activeAssistedSession });
});

app.post('/api/admin/assisted-session/end', (_req, res) => {
  if (activeAssistedSession) {
    serverAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      actor: activeAssistedSession.adminName,
      action: 'ENCERRAMENTO_ACESSO_ASSISTIDO',
      target: activeAssistedSession.targetUserName,
      assistedSessionId: activeAssistedSession.id,
      details: `Sessão ${activeAssistedSession.id} encerrada explicitamente pelo administrador.`,
    });
  }
  activeAssistedSession = null;
  res.json({ success: true });
});

// Atualizar Parâmetros Comerciais Centralizados (NexCarga Control)
app.put('/api/admin/settings', (req, res) => {
  const {
    dailyFreeNexPointLimit,
    contractMaintenanceFeePercent,
    affiliateFirstSubscriptionCommissionPercent,
    affiliateContractFeeCommissionPercent,
  } = req.body;

  if (dailyFreeNexPointLimit !== undefined) {
    platformSettings.dailyFreeNexPointLimit = Math.max(1, Number(dailyFreeNexPointLimit));
  }
  if (contractMaintenanceFeePercent !== undefined) {
    platformSettings.contractMaintenanceFeePercent = Math.max(0, Number(contractMaintenanceFeePercent));
  }
  if (affiliateFirstSubscriptionCommissionPercent !== undefined) {
    platformSettings.affiliateFirstSubscriptionCommissionPercent = Math.max(0, Number(affiliateFirstSubscriptionCommissionPercent));
  }
  if (affiliateContractFeeCommissionPercent !== undefined) {
    platformSettings.affiliateContractFeeCommissionPercent = Math.max(0, Number(affiliateContractFeeCommissionPercent));
  }

  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    actor: 'Administrador NexCarga Control',
    action: 'ATUALIZACAO_PARAMETROS_COMERCIAIS',
    target: 'Configurações Globais',
    details: `NexPoint=${platformSettings.dailyFreeNexPointLimit}/24h | Taxa Contrato=${platformSettings.contractMaintenanceFeePercent}% | Afiliado 1ª Assinatura=${platformSettings.affiliateFirstSubscriptionCommissionPercent}%`,
  });

  res.json({ success: true, settings: platformSettings });
});

// 11. NexIA — Inteligência Logística Baseada em Gemini API (Exclusivamente no Servidor)
app.post('/api/nexia/chat', async (req, res) => {
  const { prompt, userRole, hasNexIAPlan, operationType } = req.body;

  if (!hasNexIAPlan) {
    return res.status(403).json({
      error: 'O assistente inteligente NexIA está disponível apenas para assinantes de planos "Com NexIA". Altere a modalidade em Planos e Assinaturas.',
    });
  }

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'Envie uma solicitação válida para a NexIA.' });
  }

  const sanitizedPrompt = String(prompt).trim();

  // Contexto real dos fretes publicados na plataforma (sem dados privados protegidos)
  const publicFreightSummary = serverFreights
    .map(
      (f) =>
        `- ${f.code}: ${f.originCity}/${f.originState} → ${f.destinationCity}/${f.destinationState} (${f.distanceKm} km) | Carga: ${f.cargoCategory} | Veículo: ${f.requiredVehicleType} (${f.requiredImplementType}) | Peso: ${f.weightKg} kg | Valor Ofertado: R$ ${f.offeredValueBrl.toFixed(2)}`
    )
    .join('\n');

  const systemInstruction = `Você é a NexIA, a Inteligência Logística oficial da plataforma NexCarga (desenvolvida pela PUPA LABS), operando em português brasileiro.
Regras obrigatórias de governança e segurança:
1. NÃO invente fretes que não estejam na lista real abaixo.
2. NÃO invente preços de mercado irreais como se fossem tabelas oficiais garantidas; apresente sempre como estimativas operacionais transparentes.
3. NÃO afirme que uma rota considera automaticamente todas as restrições físicas de caminhões (altura de pontes, balança, eixos, AET) sem verificação em órgãos oficiais (DNIT/DER).
4. NÃO revele endereços exatos protegidos, telefones privados ou CNPJs bloqueados antes da confirmação da taxa.
5. Perfil atual do usuário: ${userRole || 'MOTORISTA'}. Operação solicitada: ${operationType || 'CONSULTA_LOGISTICA'}.

Fretes reais ativos neste momento na NexCarga (região de Manhuaçu-MG e corredores BR-262 / BR-116):
${publicFreightSummary}

Responda de forma objetiva, estruturada em tópicos claros e orientada à tomada de decisão logística.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: sanitizedPrompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const replyText = response.text || 'Análise concluída pela NexIA.';

      serverAuditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestampIso: new Date().toISOString(),
        actor: `Usuário (${userRole || 'DRIVER'})`,
        action: 'CONSUMO_NEXIA_GEMINI',
        target: operationType || 'CHAT_LOGISTICO',
        details: `Consulta processada via Gemini Server-Side. Prompt: "${sanitizedPrompt.slice(0, 60)}..."`,
      });

      return res.json({
        reply: replyText,
        source: 'GEMINI_SERVER_API',
        loggedAtIso: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Erro na chamada Gemini NexIA:', error?.message || error);
      // Continua para resposta analítica determinística baseada nos dados reais do servidor caso a chave do ambiente não esteja ativa
    }
  }

  // Motor analítico determinístico baseado estritamente nos fretes reais do servidor quando GEMINI_API_KEY ainda não foi configurada no painel Secrets
  let deterministicReply = '';
  if (operationType === 'CALCULAR_ROTA' || sanitizedPrompt.toLowerCase().includes('rota') || sanitizedPrompt.toLowerCase().includes('custo')) {
    deterministicReply = `### Análise Operacional de Rota e Estimativa de Custos (NexIA)

- **Corredor Analisado**: Eixo Manhuaçu - MG ↔ Belo Horizonte - MG (BR-262) / Vitória - ES (BR-262)
- **Oportunidades Reais Disponíveis no Radar**:
  1. **#FR-9041 (Manhuaçu/MG → BH/MG — 290 km)**: Truck Baú | 13.500 kg | Oferta: **R$ 2.850,00** (~R$ 9,82/km bruto).
  2. **#FR-9042 (Manhuaçu/MG → Vitória/ES — 245 km)**: Cavalo 6x2 Porta-Contêiner | 27.000 kg | Oferta: **R$ 3.250,00** (~R$ 13,26/km bruto).
- **Estimativa Operacional Referencial (Diesel + Arla + Pedágio/Manutenção)**:
  - Consumo médio estimado em trecho serrano (BR-262): **2,4 a 3,1 km/l** conforme tonelagem.
  - Margem operacional estimada antes da taxa NexCarga (${platformSettings.contractMaintenanceFeePercent}%): **62% a 68%** sobre o frete bruto.
- **Aviso Técnico de Restrição Viária**: Este cálculo não substitui a verificação de restrições específicas de altura, peso por eixo (balança DNIT/DER) e janelas urbanas no destino.`;
  } else if (operationType === 'DESCREVER_CARGA' || sanitizedPrompt.toLowerCase().includes('descrever') || sanitizedPrompt.toLowerCase().includes('carga')) {
    deterministicReply = `### Estrutura Recomendada para Publicação de Frete (NexIA)

- **Título / Categoria Sugerida**: Alimentos / Café Beneficiado em Sacaria ou Big Bag
- **Veículo e Implemento Recomendados**:
  - Até 14t: **Truck (6x2)** com implemento **Baú** ou **Sider** (proteção contra umidade na serra de Manhuaçu/Caparaó).
  - De 25t a 35t: **Cavalo Mecânico 6x2** com **Graneleiro Enlonado** ou **Porta-Contêiner**.
- **Checklist Operacional para Publicação**:
  - Informar peso bruto total (kg) e cubagem (m³).
  - Especificar janela de carregamento (Manhã/Tarde) e necessidade de EPI/paleteira.
  - *Nota de Privacidade*: O endereço exato do armazém e telefone permanecerão protegidos até a confirmação do pagamento da taxa de serviço.`;
  } else {
    deterministicReply = `### Diagnóstico Regional da Praça Logística — Manhuaçu/MG e Região (NexIA)

- **Fretes Ativos Verificados no Sistema**: **${serverFreights.length} oportunidades** registradas na base atual.
- **Destaques de Maior Rentabilidade por Quilômetro**:
  - **#FR-9042**: Manhuaçu/MG → Vitória/ES (245 km) — **R$ 3.250,00** (Café Exportação / Porta-Contêiner).
  - **#FR-9045**: Manhumirim/MG → Rio de Janeiro/RJ (395 km) — **R$ 4.100,00** (Café Especial / Baú).
- **Coletas Regionais (NexColeta)**: Existem **${serverRegionalPickups.length} coletas regionais** cadastradas para Reduto, Ipanema, Mutum e Caratinga passíveis de validação de agrupamento por capacidade e compatibilidade.`;
  }

  serverAuditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    actor: `Usuário (${userRole || 'DRIVER'})`,
    action: 'CONSUMO_NEXIA_MOTOR_LOCAL',
    target: operationType || 'ANALISE_LOGISTICA',
    details: `Análise executada no backend sobre dados reais da operação. Prompt: "${sanitizedPrompt.slice(0, 60)}..."`,
  });

  res.json({
    reply: deterministicReply,
    source: 'NEXIA_BACKEND_ENGINE',
    loggedAtIso: new Date().toISOString(),
  });
});

// =============================================================================
// INTEGRAÇÃO VITE (DEV) / ARQUIVOS ESTÁTICOS (PROD) NA PORTA 3000
// =============================================================================
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NexCarga Backend] Servidor rodando em http://0.0.0.0:${PORT} (TZ: America/Sao_Paulo)`);
  });
}

startServer();
