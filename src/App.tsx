/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  AssistedSessionBanner,
  DemoModeNotice,
  ReferencePreviewModal,
  type AssistedSessionInfo,
} from './components/NexBrand';
import { PublicViews, type ScreenId } from './components/PublicViews';
import {
  DashboardsViews,
  type FreightItem,
  type NexPointState,
  type AuditLogItem,
} from './components/DashboardsViews';
import {
  IntelligentModulesViews,
  type ConversationItem,
} from './components/IntelligentModulesViews';
import {
  GovernanceModulesViews,
  type ContractItem,
  type PlanItem,
} from './components/GovernanceModulesViews';
import { NEXCARGA_TOKENS } from './design-system/tokens';
import { type RegionalPickupRequest, type LedgerEntry, type ContractStage } from './domain/rules';

const SCREEN_META: {
  id: ScreenId;
  shortLabel: string;
  fullTitle: string;
  refImage: string;
}[] = [
  { id: '01_LANDING', shortLabel: '01 Landing', fullTitle: '01 — Landing Page Institucional', refImage: NEXCARGA_TOKENS.referenceImages.landingPage },
  { id: '02_LOGIN', shortLabel: '02 Login', fullTitle: '02 — Login e Acesso', refImage: NEXCARGA_TOKENS.referenceImages.loginAccess },
  { id: '03_REGISTER', shortLabel: '03 Cadastro', fullTitle: '03 — Seleção de Perfil e Cadastro', refImage: NEXCARGA_TOKENS.referenceImages.registerProfile },
  { id: '04_ADMIN', shortLabel: '04 Admin Control', fullTitle: '04 — NexCarga Control (Administrador)', refImage: NEXCARGA_TOKENS.referenceImages.adminControl },
  { id: '05_DRIVER', shortLabel: '05 Motorista', fullTitle: '05 — Painel do Motorista', refImage: NEXCARGA_TOKENS.referenceImages.driverDashboard },
  { id: '06_COMPANY', shortLabel: '06 Empresa', fullTitle: '06 — Painel da Empresa', refImage: NEXCARGA_TOKENS.referenceImages.companyDashboard },
  { id: '07_AFFILIATE', shortLabel: '07 Afiliado', fullTitle: '07 — Painel do Afiliado', refImage: NEXCARGA_TOKENS.referenceImages.affiliateDashboard },
  { id: '08_NEXRADAR', shortLabel: '08 NexRadar', fullTitle: '08 — NexRadar (Mapa de Fretes)', refImage: NEXCARGA_TOKENS.referenceImages.nexRadar },
  { id: '09_NEXCOLETA', shortLabel: '09 NexColeta', fullTitle: '09 — NexColeta (Coletas Regionais)', refImage: NEXCARGA_TOKENS.referenceImages.nexColeta },
  { id: '10_CHAT', shortLabel: '10 Chat', fullTitle: '10 — Chat de Negociação (Pré e Pós-Pagamento)', refImage: NEXCARGA_TOKENS.referenceImages.chatNegotiation },
  { id: '11_NEXIA', shortLabel: '11 NexIA', fullTitle: '11 — NexIA (Assistente Inteligente)', refImage: NEXCARGA_TOKENS.referenceImages.nexIA },
  { id: '12_PLANS', shortLabel: '12 Planos', fullTitle: '12 — Planos e Assinaturas', refImage: NEXCARGA_TOKENS.referenceImages.plansSubscriptions },
  { id: '13_NEXVERIFY', shortLabel: '13 NexVerify', fullTitle: '13 — NexVerify (Verificação de Documentos)', refImage: NEXCARGA_TOKENS.referenceImages.nexVerify },
  { id: '14_CONTRACTS', shortLabel: '14 Contratos', fullTitle: '14 — Contratos e Acompanhamento', refImage: NEXCARGA_TOKENS.referenceImages.contracts },
  { id: '15_FINANCE', shortLabel: '15 Financeiro', fullTitle: '15 — NexFinance e Comissões', refImage: NEXCARGA_TOKENS.referenceImages.financeCommissions },
  { id: '16_MOBILE_PWA', shortLabel: '16 Mobile PWA', fullTitle: '16 — Experiência Mobile e PWA', refImage: NEXCARGA_TOKENS.referenceImages.mobilePwa },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('01_LANDING');
  const [activeRole, setActiveRole] = useState<'ADMIN' | 'DRIVER' | 'COMPANY' | 'AFFILIATE'>('DRIVER');
  const [hasActiveSub, setHasActiveSub] = useState<boolean>(true);
  const [showRefModal, setShowRefModal] = useState<boolean>(false);

  // Estado sincronizado com o Servidor Backend (/api/bootstrap)
  const [freights, setFreights] = useState<FreightItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [regionalPickups, setRegionalPickups] = useState<RegionalPickupRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [assistedSession, setAssistedSession] = useState<AssistedSessionInfo | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [settings, setSettings] = useState({
    dailyFreeNexPointLimit: 3,
    contractMaintenanceFeePercent: 6.5,
    affiliateFirstSubscriptionCommissionPercent: 25,
    affiliateContractFeeCommissionPercent: 10,
  });
  const [nexPoint, setNexPoint] = useState<NexPointState>({
    allowed: true,
    isSubscriberExempt: true,
    usedInCurrentCycle: 1,
    remainingFreeUses: 2,
    dailyLimit: 3,
    cycleResetIsoSp: '2026-11-11T23:59:59-03:00',
  });

  const refreshBootstrap = useCallback(async (subscriberFlag = hasActiveSub) => {
    try {
      const res = await fetch(`/api/bootstrap?subscriber=${subscriberFlag}`);
      if (!res.ok) return;
      const data = await res.json();
      setFreights(data.freights || []);
      setContracts(data.contracts || []);
      setConversations(data.conversations || []);
      setRegionalPickups(data.regionalPickups || []);
      setLedger(data.ledger || []);
      setAuditLogs(data.auditLogs || []);
      setAssistedSession(data.assistedSession || null);
      if (data.settings) {
        setSettings({
          dailyFreeNexPointLimit: data.settings.dailyFreeNexPointLimit,
          contractMaintenanceFeePercent: data.settings.contractMaintenanceFeePercent,
          affiliateFirstSubscriptionCommissionPercent: data.settings.affiliateFirstSubscriptionCommissionPercent,
          affiliateContractFeeCommissionPercent: data.settings.affiliateContractFeeCommissionPercent,
        });
        setPlans(data.settings.plans || []);
      }
      if (data.nexPoint) {
        setNexPoint(data.nexPoint);
      }
    } catch (e) {
      console.error('Falha ao carregar estado inicial:', e);
    }
  }, [hasActiveSub]);

  useEffect(() => {
    refreshBootstrap(hasActiveSub);
  }, [hasActiveSub, refreshBootstrap]);

  const handleLoginAsRole = (role: 'ADMIN' | 'DRIVER' | 'COMPANY' | 'AFFILIATE') => {
    setActiveRole(role);
    if (role === 'ADMIN') setCurrentScreen('04_ADMIN');
    else if (role === 'DRIVER') setCurrentScreen('05_DRIVER');
    else if (role === 'COMPANY') setCurrentScreen('06_COMPANY');
    else setCurrentScreen('07_AFFILIATE');
  };

  const handlePublishFreight = async (payload: Record<string, any>) => {
    await fetch('/api/freights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshBootstrap();
  };

  const handleConsumeNexPoint = async (actionDescription: string): Promise<boolean> => {
    const res = await fetch('/api/nexpoint/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hasActiveSubscription: hasActiveSub,
        actionDescription,
      }),
    });
    const data = await res.json();
    if (data.nexPoint) setNexPoint(data.nexPoint);
    await refreshBootstrap();
    return Boolean(res.ok && data.allowed);
  };

  const handleStartAssistedSession = async (payload: {
    targetUserName: string;
    targetRole: 'DRIVER' | 'COMPANY' | 'AFFILIATE';
    justification: string;
  }): Promise<string | null> => {
    const res = await fetch('/api/admin/assisted-session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Erro ao iniciar sessão assistida.';
    await refreshBootstrap();
    return null;
  };

  const handleEndAssistedSession = async () => {
    await fetch('/api/admin/assisted-session/end', { method: 'POST' });
    await refreshBootstrap();
  };

  const handleUpdateSettings = async (payload: Record<string, any>) => {
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshBootstrap();
  };

  const handleRequestPickup = async (payload: Record<string, any>) => {
    await fetch('/api/nexcoleta/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshBootstrap();
  };

  const handleValidateGroup = async (
    pickupIds: string[],
    vehicleMaxWeightKg: number,
    vehicleMaxVolumeM3: number
  ) => {
    const res = await fetch('/api/nexcoleta/validate-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupIds, vehicleMaxWeightKg, vehicleMaxVolumeM3 }),
    });
    return await res.json();
  };

  const handleSendMessage = async (conversationId: string, text: string) => {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, text }),
    });
    const data = await res.json();
    await refreshBootstrap();
    return { wasRedacted: data.wasRedacted };
  };

  const handleConfirmContractFee = async (contractId: string) => {
    await fetch(`/api/contracts/${contractId}/confirm-fee`, { method: 'POST' });
    await refreshBootstrap();
  };

  const handleConfirmContractFeeByFreight = async (freightId: string) => {
    const contract = contracts.find((c) => c.freightId === freightId) || contracts[1] || contracts[0];
    if (contract) {
      await handleConfirmContractFee(contract.id);
    }
  };

  const handleAdvanceContractStage = async (
    contractId: string,
    targetStage: ContractStage
  ): Promise<string | null> => {
    const res = await fetch(`/api/contracts/${contractId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStage }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Transição não autorizada.';
    await refreshBootstrap();
    return null;
  };

  const handleCreateCompensatoryEntry = async (
    entryId: string,
    reason: string
  ): Promise<string | null> => {
    const res = await fetch('/api/finance/compensate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, reason }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Erro ao lançar estorno compensatório.';
    await refreshBootstrap();
    return null;
  };

  const currentMeta = SCREEN_META.find((m) => m.id === currentScreen) || SCREEN_META[0];

  const roleLabels: Record<typeof activeRole, string> = {
    ADMIN: 'Administrador (NexCarga Control)',
    DRIVER: 'Motorista Verificado (Carlos Silva)',
    COMPANY: 'Empresa Verificada (Transporte XYZ)',
    AFFILIATE: 'Afiliado Parceiro (João Silva)',
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col">
      {/* Banner Obrigatório de Acesso Administrativo Assistido quando ativo */}
      <AssistedSessionBanner
        session={assistedSession}
        onEndSession={handleEndAssistedSession}
      />

      {/* Barra de Navegação Global entre as 16 Telas Oficiais de Referência */}
      <div className="bg-[#0D0E12] border-b border-white/10 px-4 py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mr-2">
            16 Telas Oficiais:
          </span>
          {SCREEN_META.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                currentScreen === item.id
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white shadow'
                  : 'bg-[#181A1E] text-gray-300 hover:bg-[#292929] hover:text-white border border-white/5'
              }`}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Contexto e Inspeção da Referência Oficial */}
      <DemoModeNotice
        activeRoleLabel={roleLabels[activeRole]}
        hasActiveSub={hasActiveSub}
        onToggleSub={() => setHasActiveSub((prev) => !prev)}
        onOpenReference={() => setShowRefModal(true)}
      />

      {/* Renderização da Tela Ativa */}
      {(currentScreen === '01_LANDING' ||
        currentScreen === '02_LOGIN' ||
        currentScreen === '03_REGISTER') && (
        <PublicViews
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onLoginAsRole={handleLoginAsRole}
        />
      )}

      {(currentScreen === '04_ADMIN' ||
        currentScreen === '05_DRIVER' ||
        currentScreen === '06_COMPANY' ||
        currentScreen === '07_AFFILIATE') && (
        <DashboardsViews
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          freights={freights}
          nexPoint={nexPoint}
          auditLogs={auditLogs}
          assistedSession={assistedSession}
          onPublishFreight={handlePublishFreight}
          onConsumeNexPoint={handleConsumeNexPoint}
          onStartAssistedSession={handleStartAssistedSession}
          onUpdateSettings={handleUpdateSettings}
          settings={settings}
        />
      )}

      {(currentScreen === '08_NEXRADAR' ||
        currentScreen === '09_NEXCOLETA' ||
        currentScreen === '10_CHAT' ||
        currentScreen === '11_NEXIA') && (
        <IntelligentModulesViews
          currentScreen={currentScreen}
          freights={freights}
          regionalPickups={regionalPickups}
          conversations={conversations}
          hasActiveSub={hasActiveSub}
          onRequestPickup={handleRequestPickup}
          onValidateGroup={handleValidateGroup}
          onSendMessage={handleSendMessage}
          onConfirmContractFeeByFreight={handleConfirmContractFeeByFreight}
        />
      )}

      {(currentScreen === '12_PLANS' ||
        currentScreen === '13_NEXVERIFY' ||
        currentScreen === '14_CONTRACTS' ||
        currentScreen === '15_FINANCE' ||
        currentScreen === '16_MOBILE_PWA') && (
        <GovernanceModulesViews
          currentScreen={currentScreen}
          plans={plans}
          contracts={contracts}
          ledger={ledger}
          onActivatePlan={(plan) => {
            setHasActiveSub(plan.includesNexIA);
          }}
          onConfirmContractFee={handleConfirmContractFee}
          onAdvanceContractStage={handleAdvanceContractStage}
          onCreateCompensatoryEntry={handleCreateCompensatoryEntry}
          onNavigate={setCurrentScreen}
        />
      )}

      {/* Modal de Comparação Direta com a Arte Oficial Anexada */}
      {showRefModal && (
        <ReferencePreviewModal
          title={currentMeta.fullTitle}
          imageUrl={currentMeta.refImage}
          onClose={() => setShowRefModal(false)}
        />
      )}
    </div>
  );
}
