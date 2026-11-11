import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Truck,
  Megaphone,
  Package,
  FileText,
  Wallet,
  Radar,
  Search,
  MapPin,
  Cpu,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldAlert,
  Bell,
  Plus,
  Zap,
  Settings,
  X,
} from 'lucide-react';
import { NexLogo, type AssistedSessionInfo } from './NexBrand';
import { type ScreenId } from './PublicViews';
import { BRAZILIAN_VEHICLE_CATALOG, BRAZILIAN_IMPLEMENT_CATALOG } from '../domain/catalog';

export interface FreightItem {
  id: string;
  code: string;
  companyName: string;
  companyVerified: boolean;
  originCity: string;
  originState: string;
  originLat: number;
  originLng: number;
  destinationCity: string;
  destinationState: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  cargoCategory: string;
  requiredVehicleType: string;
  requiredImplementType: string;
  weightKg: number;
  volumeM3: number;
  offeredValueBrl: number;
  fullPickupAddress: string;
  fullDeliveryAddress: string;
  contactPhone: string;
  contactEmail: string;
  companyCnpj: string;
  fiscalDocumentUrl: string | null;
  sensitiveDataLocked: boolean;
  status: string;
  createdAtIso: string;
}

export interface NexPointState {
  allowed: boolean;
  isSubscriberExempt: boolean;
  usedInCurrentCycle: number;
  remainingFreeUses: number;
  dailyLimit: number;
  cycleResetIsoSp: string;
  reason?: string;
}

export interface AuditLogItem {
  id: string;
  timestampIso: string;
  actor: string;
  action: string;
  target: string;
  assistedSessionId?: string;
  details: string;
}

interface DashboardsViewsProps {
  currentScreen: '04_ADMIN' | '05_DRIVER' | '06_COMPANY' | '07_AFFILIATE';
  onNavigate: (screen: ScreenId) => void;
  freights: FreightItem[];
  nexPoint: NexPointState;
  auditLogs: AuditLogItem[];
  assistedSession: AssistedSessionInfo | null;
  onPublishFreight: (payload: Record<string, any>) => Promise<void>;
  onConsumeNexPoint: (actionDescription: string) => Promise<boolean>;
  onStartAssistedSession: (payload: {
    targetUserName: string;
    targetRole: 'DRIVER' | 'COMPANY' | 'AFFILIATE';
    justification: string;
  }) => Promise<string | null>;
  onUpdateSettings: (payload: Record<string, any>) => Promise<void>;
  settings: {
    dailyFreeNexPointLimit: number;
    contractMaintenanceFeePercent: number;
    affiliateFirstSubscriptionCommissionPercent: number;
    affiliateContractFeeCommissionPercent: number;
  };
}

export const DashboardsViews: React.FC<DashboardsViewsProps> = ({
  currentScreen,
  onNavigate,
  freights,
  nexPoint,
  auditLogs,
  onPublishFreight,
  onConsumeNexPoint,
  onStartAssistedSession,
  onUpdateSettings,
  settings,
}) => {
  // Estados do Administrador (04)
  const [assistedTargetName, setAssistedTargetName] = useState('Carlos Eduardo Silva (Motorista)');
  const [assistedTargetRole, setAssistedTargetRole] = useState<'DRIVER' | 'COMPANY' | 'AFFILIATE'>('DRIVER');
  const [assistedJustification, setAssistedJustification] = useState('');
  const [assistedFeedback, setAssistedFeedback] = useState<string | null>(null);
  const [cfgNexPoint, setCfgNexPoint] = useState(String(settings.dailyFreeNexPointLimit));
  const [cfgFeePercent, setCfgFeePercent] = useState(String(settings.contractMaintenanceFeePercent));
  const [cfgAffFirst, setCfgAffFirst] = useState(String(settings.affiliateFirstSubscriptionCommissionPercent));
  const [cfgSaved, setCfgSaved] = useState(false);

  // Estados do Motorista (05)
  const [driverNotice, setDriverNotice] = useState<string | null>(null);
  const [myVehicles, setMyVehicles] = useState([
    {
      id: 'v-1',
      plate: 'RMA-4B89',
      vehicleType: 'Truck (Pesado 6x2 / 6x4)',
      implementType: 'Baú (Furgão Alumínio)',
      capacityKg: 14000,
      volumeM3: 55,
      verified: true,
    },
  ]);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleId, setNewVehicleId] = useState(BRAZILIAN_VEHICLE_CATALOG[6].id);
  const [newImplementId, setNewImplementId] = useState(BRAZILIAN_IMPLEMENT_CATALOG[0].id);

  // Estados da Empresa (06)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pubOrigin, setPubOrigin] = useState('Manhuaçu');
  const [pubDest, setPubDest] = useState('Belo Horizonte');
  const [pubCargo, setPubCargo] = useState('Alimentos / Café Beneficiado');
  const [pubVehicle, setPubVehicle] = useState(BRAZILIAN_VEHICLE_CATALOG[6].name);
  const [pubImplement, setPubImplement] = useState(BRAZILIAN_IMPLEMENT_CATALOG[0].name);
  const [pubWeight, setPubWeight] = useState('14000');
  const [pubValue, setPubValue] = useState('2950');
  const [pubAddress, setPubAddress] = useState('Rodovia BR-262, Km 41 — Galpão Central, Manhuaçu - MG');
  const [pubStatusMsg, setPubStatusMsg] = useState<string | null>(null);

  // Estados do Afiliado (07)
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [simDoc, setSimDoc] = useState('24.890.512/0001-19');
  const [simType, setSimType] = useState<'FIRST_PAID_SUBSCRIPTION' | 'COMPLETED_PAID_CONTRACT_FEE' | 'SIGNUP_ONLY'>('FIRST_PAID_SUBSCRIPTION');
  const [simAmount, setSimAmount] = useState('164.70');
  const [simResult, setSimResult] = useState<any | null>(null);

  const affiliateUrl = 'https://nexcarga.com.br/indicacao/joaosilva';

  // ===========================================================================
  // TELA 04 — PAINEL ADMINISTRADOR / NEXCARGA CONTROL (04_Painel_Administrador.png)
  // ===========================================================================
  if (currentScreen === '04_ADMIN') {
    const handleStartAssisted = async (e: React.FormEvent) => {
      e.preventDefault();
      const err = await onStartAssistedSession({
        targetUserName: assistedTargetName,
        targetRole: assistedTargetRole,
        justification: assistedJustification,
      });
      if (err) {
        setAssistedFeedback(`Erro: ${err}`);
      } else {
        setAssistedFeedback('Sessão de Acesso Assistido iniciada e registrada na auditoria.');
        setAssistedJustification('');
      }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      await onUpdateSettings({
        dailyFreeNexPointLimit: Number(cfgNexPoint),
        contractMaintenanceFeePercent: Number(cfgFeePercent),
        affiliateFirstSubscriptionCommissionPercent: Number(cfgAffFirst),
      });
      setCfgSaved(true);
      setTimeout(() => setCfgSaved(false), 2500);
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white flex flex-col lg:flex-row">
        {/* Sidebar NexCarga Control */}
        <aside className="w-full lg:w-64 bg-[#14161A] border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col shrink-0">
          <div className="pb-5 mb-5 border-b border-white/10">
            <NexLogo subtitle="Control" onClick={() => onNavigate('01_LANDING')} />
          </div>

          <nav className="space-y-1.5 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('04_ADMIN')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-semibold shadow-md"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('13_NEXVERIFY')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Users className="w-4 h-4 text-gray-400" />
              <span>Usuários & NexVerify</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('06_COMPANY')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>Empresas</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('05_DRIVER')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Truck className="w-4 h-4 text-gray-400" />
              <span>Motoristas</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('07_AFFILIATE')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Megaphone className="w-4 h-4 text-gray-400" />
              <span>Afiliados</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('08_NEXRADAR')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Package className="w-4 h-4 text-gray-400" />
              <span>Fretes & NexRadar</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('14_CONTRACTS')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Contratos</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('15_FINANCE')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>Financeiro</span>
            </button>
          </nav>
        </aside>

        {/* Conteúdo Principal do Painel Administrativo */}
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header idêntico a 04_Painel_Administrador.png */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white font-display">Painel Administrativo</h1>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1C1F24] border border-white/10 flex items-center justify-center relative">
                <Bell className="w-4 h-4 text-gray-300" />
                <span className="w-2 h-2 rounded-full bg-[#FF8A00] absolute top-1.5 right-1.5" />
              </div>
              <div className="flex items-center gap-2.5 bg-[#181A1E] border border-white/10 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-[#FF8A00] text-[#111111] font-bold text-xs flex items-center justify-center">
                  AD
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-bold text-white">Administrador</div>
                  <div className="text-gray-400">NexCarga Control</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Cards de KPI idênticos a 04_Painel_Administrador.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Usuários', value: '8.420', growth: '+12%' },
              { label: 'Empresas', value: '1.260', growth: '+8%' },
              { label: 'Motoristas', value: '6.480', growth: '+14%' },
              { label: 'Afiliados', value: '680', growth: '+9%' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="p-5 rounded-2xl bg-[#181A1E] border border-white/10 flex flex-col justify-between"
              >
                <span className="text-sm text-gray-300">{kpi.label}</span>
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums my-2">
                  {kpi.value}
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  ↑ {kpi.growth}
                </span>
              </div>
            ))}
          </div>

          {/* Card Receita (Mês) com Gráfico de Área Laranja idêntico à referência */}
          <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-2">
              <span className="text-sm text-gray-300">Receita (Mês) — Indicador Demonstrativo</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                R$ 219.480,00
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">↑ +18%</div>
              <p className="text-xs text-gray-400 pt-1">
                Consolidado de assinaturas + taxas de manutenção de contratos liquidados.
              </p>
            </div>
            <div className="lg:col-span-7">
              <svg viewBox="0 0 500 150" className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="adminRevArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF8A00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.06)" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.06)" />
                <path
                  d="M 10 135 L 70 105 L 130 112 L 190 78 L 245 80 L 300 45 L 355 62 L 410 70 L 455 48 L 490 22 L 490 140 L 10 140 Z"
                  fill="url(#adminRevArea)"
                />
                <path
                  d="M 10 135 L 70 105 L 130 112 L 190 78 L 245 80 L 300 45 L 355 62 L 410 70 L 455 48 L 490 22"
                  fill="none"
                  stroke="#FF8A00"
                  strokeWidth="3.5"
                />
                {[
                  [70, 105],
                  [190, 78],
                  [300, 45],
                  [410, 70],
                  [490, 22],
                ].map(([cx, cy], idx) => (
                  <circle key={idx} cx={cx} cy={cy} r="5" fill="#FF8A00" stroke="#111111" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>

          {/* Acesso Administrativo Assistido + Parâmetros Comerciais Centralizados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Módulo de Acesso Assistido Auditado (Seção 5.1) */}
            <form
              onSubmit={handleStartAssisted}
              className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#FF8A00]" />
                <h2 className="text-base font-bold text-white">
                  Acesso Administrativo Assistido (Auditado)
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                Permite suporte técnico assistido sem revelar ou solicitar senhas, com justificativa obrigatória, banner visível e expiração automática.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Conta Assistida</label>
                  <input
                    type="text"
                    value={assistedTargetName}
                    onChange={(e) => setAssistedTargetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Ambiente Alvo</label>
                  <select
                    value={assistedTargetRole}
                    onChange={(e) => setAssistedTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                  >
                    <option value="DRIVER">Painel do Motorista</option>
                    <option value="COMPANY">Painel da Empresa</option>
                    <option value="AFFILIATE">Painel do Afiliado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Justificativa Obrigatória (mínimo de 10 caracteres)
                </label>
                <input
                  type="text"
                  value={assistedJustification}
                  onChange={(e) => setAssistedJustification(e.target.value)}
                  placeholder="Ex: Chamado #4092 — Verificação de documento CRLV do motorista"
                  className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                />
              </div>

              {assistedFeedback && (
                <div className="p-2.5 rounded-lg bg-[#FF8A00]/15 border border-[#FF8A00]/30 text-xs text-[#FF8A00]">
                  {assistedFeedback}
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
              >
                Iniciar Sessão de Acesso Assistido
              </button>
            </form>

            {/* Configurações Comerciais e Operacionais Centralizadas */}
            <form
              onSubmit={handleSaveSettings}
              className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FF8A00]" />
                <h2 className="text-base font-bold text-white">
                  Parâmetros Operacionais e Comerciais Centralizados
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                Controle no backend dos limites do NexPoint, taxa de manutenção de contratos e comissões do programa de afiliados.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">NexPoint (Usos / 24h)</label>
                  <input
                    type="number"
                    value={cfgNexPoint}
                    onChange={(e) => setCfgNexPoint(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Taxa Contrato (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={cfgFeePercent}
                    onChange={(e) => setCfgFeePercent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Comissão 1ª Assin. (%)</label>
                  <input
                    type="number"
                    value={cfgAffFirst}
                    onChange={(e) => setCfgAffFirst(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {cfgSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
                  Parâmetros atualizados no servidor e registrados no log de auditoria.
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#292929] hover:bg-[#383838] border border-white/15 text-xs font-bold text-white"
              >
                Salvar Parâmetros no Servidor
              </button>
            </form>
          </div>

          {/* Trilha de Auditoria e Logs Administrativos */}
          <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10">
            <h2 className="text-base font-bold text-white mb-3">
              Auditoria e Logs de Segurança (Tempo Real)
            </h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#111111] border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#FF8A00] mr-2">[{log.action}]</span>
                    <strong className="text-white">{log.actor}</strong> →{' '}
                    <span className="text-gray-300">{log.target}</span>
                    <p className="text-gray-400 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    {new Date(log.timestampIso).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ===========================================================================
  // TELA 05 — PAINEL DO MOTORISTA (05_Painel_Motorista.png)
  // ===========================================================================
  if (currentScreen === '05_DRIVER') {
    const handleAddVehicle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newVehiclePlate.trim()) return;
      const veh = BRAZILIAN_VEHICLE_CATALOG.find((v) => v.id === newVehicleId) || BRAZILIAN_VEHICLE_CATALOG[0];
      const imp = BRAZILIAN_IMPLEMENT_CATALOG.find((i) => i.id === newImplementId) || BRAZILIAN_IMPLEMENT_CATALOG[0];
      setMyVehicles([
        ...myVehicles,
        {
          id: `v-${Date.now()}`,
          plate: newVehiclePlate.toUpperCase(),
          vehicleType: veh.name,
          implementType: imp.name,
          capacityKg: veh.maxCapacityKg,
          volumeM3: veh.maxVolumeM3,
          verified: true,
        },
      ]);
      setNewVehiclePlate('');
      setDriverNotice(`Veículo placa ${newVehiclePlate.toUpperCase()} (${veh.name} + ${imp.name}) cadastrado na sua frota.`);
    };

    const handleSendProposalWithNexPoint = async (freight: FreightItem) => {
      const ok = await onConsumeNexPoint(`Proposta para ${freight.code} (${freight.originCity} → ${freight.destinationCity})`);
      if (ok) {
        setDriverNotice(
          `Proposta enviada com sucesso para ${freight.code} (${freight.originCity} → ${freight.destinationCity})! Uso validado pelo NexPoint no servidor.`
        );
      } else {
        setDriverNotice(
          'Limite gratuito de 3 utilizações do NexPoint no ciclo de 24h atingido. Assine um plano para enviar propostas ilimitadas.'
        );
      }
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white flex flex-col lg:flex-row">
        {/* Sidebar Motorista fiel a 05_Painel_Motorista.png */}
        <aside className="w-full lg:w-64 bg-[#14161A] border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col shrink-0">
          <div className="pb-4 mb-4 border-b border-white/10">
            <NexLogo onClick={() => onNavigate('01_LANDING')} />
          </div>

          {/* Perfil Olá, Carlos! Motorista Verificado */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white font-bold text-sm shrink-0">
              CS
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Olá, Carlos!</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-0.5">Motorista Verificado</div>
            </div>
          </div>

          <nav className="space-y-1.5 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('05_DRIVER')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-semibold shadow-md"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('08_NEXRADAR')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Radar className="w-4 h-4 text-gray-400" />
              <span>NexRadar</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('08_NEXRADAR')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span>Buscar Fretes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('10_CHAT')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Package className="w-4 h-4 text-gray-400" />
              <span>Minhas Propostas & Chat</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('14_CONTRACTS')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Meus Contratos</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('13_NEXVERIFY')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Truck className="w-4 h-4 text-gray-400" />
              <span>Meus Veículos & NexVerify</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('09_NEXCOLETA')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>NexColeta</span>
            </button>
          </nav>
        </aside>

        {/* Conteúdo Principal do Motorista */}
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white font-display">
              <span className="text-[#FF8A00] mr-2">05 -</span>Dashboard Motorista
            </h1>

            {/* Indicador Oficial NexPoint (3 utilizações gratuitas / 24h) */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#181A1E] border border-[#FF8A00]/30 text-xs">
              <Zap className="w-4 h-4 text-[#FF8A00]" />
              <div>
                <span className="font-bold text-white">NexPoint (Ciclo 24h SP): </span>
                {nexPoint.isSubscriberExempt ? (
                  <span className="text-emerald-400 font-semibold">Assinante Ilimitado</span>
                ) : (
                  <span className="font-mono text-[#FF8A00] font-bold">
                    {nexPoint.remainingFreeUses}/{nexPoint.dailyLimit} utilizações gratuitas disponíveis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 KPIs idênticos a 05_Painel_Motorista.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Fretes disponíveis</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                128
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Propostas enviadas</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                12
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Contratos ativos</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                4
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Meus ganhos</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                R$ 6.420,00
              </span>
            </div>
          </div>

          {/* Card Banner NexIA fiel a 05_Painel_Motorista.png */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1D1610] via-[#181A1E] to-[#1D1610] border border-[#FF8A00]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#FF8A00]/15 border border-[#FF8A00]/40 flex items-center justify-center shrink-0">
                <Cpu className="w-7 h-7 text-[#FF8A00]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-display">NexIA</h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  Assistente inteligente para motoristas · Consultar rotas, custos e oportunidades.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('11_NEXIA')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#FF8A00]/25 whitespace-nowrap shrink-0"
            >
              Abrir NexIA
            </button>
          </div>

          {driverNotice && (
            <div className="p-3.5 rounded-xl bg-[#FF8A00]/15 border border-[#FF8A00]/40 text-xs text-white flex items-center justify-between">
              <span>{driverNotice}</span>
              <button
                type="button"
                onClick={() => setDriverNotice(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Lista Oportunidades perto de você fiel a 05_Painel_Motorista.png */}
          <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white">Oportunidades perto de você</h2>
            <div className="space-y-3">
              {freights.slice(0, 3).map((freight) => (
                <div
                  key={freight.id}
                  className="p-4 rounded-xl bg-[#131519] border border-white/10 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FF8A00]/15 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-[#FF8A00]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {freight.originCity} - {freight.originState} → {freight.destinationCity} - {freight.destinationState}
                      </div>
                      <div className="text-xs text-gray-400">
                        Carga: {freight.cargoCategory} | {freight.distanceKm} km | {freight.requiredVehicleType}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                      R$ {freight.offeredValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendProposalWithNexPoint(freight)}
                      className="px-3.5 py-2 rounded-lg bg-[#292929] hover:bg-[#FF8A00] text-xs font-semibold text-white transition-colors"
                    >
                      Enviar Proposta (NexPoint)
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('08_NEXRADAR')}
                      className="px-3.5 py-2 rounded-lg bg-[#1C1F26] hover:bg-[#292929] border border-white/15 text-xs font-semibold text-white transition-colors"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gestão Rápida de Veículos e Implementos Brasileiros do Motorista */}
          <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white">
              Meus Veículos e Implementos Cadastrados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myVehicles.map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white font-mono">{v.plate} · {v.vehicleType}</div>
                    <div className="text-gray-400 mt-0.5">
                      Implemento: {v.implementType} · {(v.capacityKg / 1000).toFixed(1)}t · {v.volumeM3}m³
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                    CRLV Aprovado
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <input
                type="text"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value)}
                placeholder="Placa Mercosul (Ex: QWE-9A12)"
                className="px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
              />
              <select
                value={newVehicleId}
                onChange={(e) => setNewVehicleId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
              >
                {BRAZILIAN_VEHICLE_CATALOG.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <select
                value={newImplementId}
                onChange={(e) => setNewImplementId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
              >
                {BRAZILIAN_IMPLEMENT_CATALOG.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
              >
                + Cadastrar Veículo
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ===========================================================================
  // TELA 06 — PAINEL DA EMPRESA (06_Painel_Empresa.png)
  // ===========================================================================
  if (currentScreen === '06_COMPANY') {
    const handleCreateFreightSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onPublishFreight({
        companyName: 'Transporte XYZ & Logística',
        originCity: pubOrigin,
        originState: 'MG',
        destinationCity: pubDest,
        destinationState: pubDest.toLowerCase().includes('vitória') ? 'ES' : 'MG',
        cargoCategory: pubCargo,
        requiredVehicleType: pubVehicle,
        requiredImplementType: pubImplement,
        weightKg: Number(pubWeight),
        offeredValueBrl: Number(pubValue),
        fullPickupAddress: pubAddress,
      });
      setPubStatusMsg('Frete publicado no servidor com sucesso! O endereço sensível permanece protegido até a confirmação da taxa.');
      setShowPublishModal(false);
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white flex flex-col lg:flex-row">
        {/* Sidebar Empresa fiel a 06_Painel_Empresa.png */}
        <aside className="w-full lg:w-64 bg-[#14161A] border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col shrink-0">
          <div className="pb-4 mb-4 border-b border-white/10">
            <NexLogo onClick={() => onNavigate('01_LANDING')} />
          </div>

          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white font-bold text-sm shrink-0">
              XY
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-white">Olá, Transporte XYZ!</div>
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <span>Empresa Verificada</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 text-sm">
            <button
              type="button"
              onClick={() => onNavigate('06_COMPANY')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-semibold shadow-md"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4 text-[#FF8A00]" />
              <span>Publicar Frete</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('08_NEXRADAR')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Truck className="w-4 h-4 text-gray-400" />
              <span>Meus Fretes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('10_CHAT')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Package className="w-4 h-4 text-gray-400" />
              <span>Propostas Recebidas</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('14_CONTRACTS')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Contratos</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('09_NEXCOLETA')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>NexColeta</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('15_FINANCE')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>Financeiro</span>
            </button>
          </nav>
        </aside>

        {/* Conteúdo Principal do Painel Empresa */}
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white font-display">
              <span className="text-[#FF8A00] mr-2">06 -</span>Dashboard Empresa
            </h1>
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs sm:text-sm font-bold text-white shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Frete</span>
            </button>
          </div>

          {pubStatusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span>{pubStatusMsg}</span>
              <button type="button" onClick={() => setPubStatusMsg(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4 KPIs idênticos a 06_Painel_Empresa.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Fretes publicados</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                {37 + freights.length}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Propostas recebidas</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                96
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Contratos ativos</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                18
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
              <span className="text-xs sm:text-sm text-gray-300 block">Coletas pendentes</span>
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                6
              </span>
            </div>
          </div>

          {/* Gráficos Operações do Mês + Taxas e Despesas idênticos a 06_Painel_Empresa.png */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#181A1E] border border-white/10">
              <h2 className="text-base font-bold text-white mb-5">Operações do mês</h2>
              <div className="h-48 flex items-end gap-3 pt-4 border-b border-white/10 pb-2">
                {[30, 52, 38, 68, 45, 78, 56, 72, 64, 84, 76, 95].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#E85D04] to-[#FF8A00] transition-all"
                      style={{ height: `${val * 1.4}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-mono mt-2">
                <span>Sem 1</span>
                <span>Sem 2</span>
                <span>Sem 3</span>
                <span>Sem 4</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#181A1E] border border-white/10 flex flex-col items-center justify-center">
              <h2 className="text-base font-bold text-white self-start mb-4">Taxas e Despesas</h2>
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="48" stroke="#292929" strokeWidth="12" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#FF8A00"
                    strokeWidth="12"
                    strokeDasharray="235 301"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-white font-mono">R$ 4.320,00</span>
                  <span className="text-xs font-semibold text-amber-400 font-mono mt-0.5">-12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal / Formulário de Publicação de Frete */}
          {showPublishModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-2xl rounded-2xl bg-[#181A1E] border border-white/15 p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">Publicar Nova Carga na NexCarga</h3>
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateFreightSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Cidade de Origem</label>
                      <input
                        type="text"
                        value={pubOrigin}
                        onChange={(e) => setPubOrigin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Cidade de Destino</label>
                      <input
                        type="text"
                        value={pubDest}
                        onChange={(e) => setPubDest(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Tipo de Veículo Exigido</label>
                      <select
                        value={pubVehicle}
                        onChange={(e) => setPubVehicle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                      >
                        {BRAZILIAN_VEHICLE_CATALOG.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Implemento Exigido</label>
                      <select
                        value={pubImplement}
                        onChange={(e) => setPubImplement(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                      >
                        {BRAZILIAN_IMPLEMENT_CATALOG.map((i) => (
                          <option key={i.id} value={i.name}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Categoria da Carga</label>
                      <input
                        type="text"
                        value={pubCargo}
                        onChange={(e) => setPubCargo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Valor Ofertado (R$)</label>
                      <input
                        type="number"
                        value={pubValue}
                        onChange={(e) => setPubValue(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">
                      Endereço Completo de Coleta (Protegido no Backend até pagamento da taxa)
                    </label>
                    <input
                      type="text"
                      value={pubAddress}
                      onChange={(e) => setPubAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPublishModal(false)}
                      className="px-4 py-2 rounded-lg bg-[#292929] text-xs font-semibold text-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
                    >
                      Confirmar Publicação
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ===========================================================================
  // TELA 07 — PAINEL DO AFILIADO (07_Painel_Afiliado.png)
  // ===========================================================================
  const handleCopyAffiliateLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(affiliateUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/affiliates/evaluate-commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affiliateDocument: '111.222.333-44',
        affiliateEmail: 'joao@afiliado.com.br',
        referredDocument: simDoc,
        referredEmail: simDoc === '111.222.333-44' ? 'joao@afiliado.com.br' : 'cliente@indicado.com.br',
        eventType: simType,
        baseAmountBrl: Number(simAmount),
      }),
    });
    const data = await res.json();
    setSimResult(data);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white flex flex-col lg:flex-row">
      {/* Sidebar Afiliado fiel a 07_Painel_Afiliado.png */}
      <aside className="w-full lg:w-64 bg-[#14161A] border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col shrink-0">
        <div className="pb-4 mb-4 border-b border-white/10">
          <NexLogo onClick={() => onNavigate('01_LANDING')} />
        </div>

        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white font-bold text-sm shrink-0">
            JS
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm text-white">Olá, João!</div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <span>Afiliado</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <nav className="space-y-1.5 text-sm">
          <button
            type="button"
            onClick={() => onNavigate('07_AFFILIATE')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-semibold shadow-md"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>
          <button
            type="button"
            onClick={handleCopyAffiliateLink}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4 text-gray-400" />
            <span>Meu Link</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('15_FINANCE')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Wallet className="w-4 h-4 text-gray-400" />
            <span>Comissões & Saques</span>
          </button>
        </nav>
      </aside>

      {/* Conteúdo Principal do Painel Afiliado */}
      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white font-display">
          <span className="text-[#FF8A00] mr-2">07 -</span>Dashboard Afiliado
        </h1>

        {/* 4 KPIs idênticos a 07_Painel_Afiliado.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
            <span className="text-xs sm:text-sm text-gray-300 block">Cliques</span>
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
              1.842
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
            <span className="text-xs sm:text-sm text-gray-300 block">Cadastros</span>
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
              326
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
            <span className="text-xs sm:text-sm text-gray-300 block">Conversões</span>
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
              48
            </span>
          </div>
          <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
            <span className="text-xs sm:text-sm text-gray-300 block">Comissões</span>
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
              R$ 2.640,00
            </span>
          </div>
        </div>

        {/* Card Seu Link Exclusivo idêntico a 07_Painel_Afiliado.png */}
        <div className="p-7 rounded-2xl bg-[#181A1E] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 flex-1 w-full">
            <h2 className="text-lg font-bold text-white">Seu link exclusivo</h2>
            <div className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-white/10 font-mono text-xs sm:text-sm text-gray-200 select-all">
              {affiliateUrl}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyAffiliateLink}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-6 py-3 rounded-xl bg-[#22252C] hover:bg-[#292929] border border-white/15 text-white font-semibold text-xs sm:text-sm flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-[#FF8A00]" />
                <span>QR Code</span>
              </button>
            </div>
          </div>

          <div className="w-28 h-28 rounded-full bg-[#FF8A00]/15 border border-[#FF8A00]/30 flex items-center justify-center shrink-0">
            <Megaphone className="w-14 h-14 text-[#FF8A00] -rotate-12" />
          </div>
        </div>

        {/* Validador de Regras de Comissão e Antifraude no Servidor (Seção 10) */}
        <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white">
            Motor de Cálculo de Comissões e Antifraude no Backend
          </h2>
          <p className="text-xs text-gray-400">
            Regras oficiais: (1) Comissão sobre a 1ª assinatura paga de indicado; (2) Comissão sobre a taxa de manutenção efetivamente recebida em contratos concluídos e pagos. Cliques, cadastros sem pagamento ou autoindicações (mesmo CPF/CNPJ) são bloqueados no servidor.
          </p>

          <form onSubmit={handleSimulateCommission} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Evento do Indicado</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white"
              >
                <option value="FIRST_PAID_SUBSCRIPTION">1ª Assinatura Paga ({settings.affiliateFirstSubscriptionCommissionPercent}%)</option>
                <option value="COMPLETED_PAID_CONTRACT_FEE">Taxa de Contrato Concluído e Pago ({settings.affiliateContractFeeCommissionPercent}%)</option>
                <option value="SIGNUP_ONLY">Apenas Cadastro / Clique (Sem pagamento)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">CPF/CNPJ do Indicado (Teste Antifraude)</label>
              <input
                type="text"
                value={simDoc}
                onChange={(e) => setSimDoc(e.target.value)}
                placeholder="Digite 111.222.333-44 para testar autoindicação"
                className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Valor Base Recebido (R$)</label>
              <input
                type="number"
                step="0.1"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
            >
              Validar Comissão no Backend
            </button>
          </form>

          {simResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                simResult.eligible
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="font-bold text-sm mb-1">
                {simResult.eligible
                  ? `Elegível! Comissão Calculada: R$ ${Number(simResult.commissionAmountBrl).toFixed(2)} (${simResult.appliedRatePercent}%)`
                  : 'Comissão Não Liberada pelo Servidor'}
              </div>
              <div>{simResult.reason}</div>
            </div>
          )}
        </div>

        {/* Modal QR Code Exclusivo do Afiliado */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#181A1E] border border-white/15 p-6 text-center space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">QR Code de Indicação — João Silva</h3>
                <button type="button" onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 bg-white rounded-xl inline-block mx-auto">
                <svg viewBox="0 0 120 120" className="w-44 h-44">
                  <rect width="120" height="120" fill="#FFFFFF" />
                  <rect x="10" y="10" width="30" height="30" fill="#111111" />
                  <rect x="15" y="15" width="20" height="20" fill="#FFFFFF" />
                  <rect x="20" y="20" width="10" height="10" fill="#FF8A00" />
                  <rect x="80" y="10" width="30" height="30" fill="#111111" />
                  <rect x="85" y="15" width="20" height="20" fill="#FFFFFF" />
                  <rect x="90" y="20" width="10" height="10" fill="#111111" />
                  <rect x="10" y="80" width="30" height="30" fill="#111111" />
                  <rect x="15" y="85" width="20" height="20" fill="#FFFFFF" />
                  <rect x="20" y="90" width="10" height="10" fill="#111111" />
                  <path d="M50 15h10v10H50zM65 25h10v15H65zM45 45h30v30H45zM85 50h20v10H85zM50 85h25v20H50zM85 85h25v25H85z" fill="#111111" />
                  <rect x="53" y="53" width="14" height="14" fill="#FF8A00" />
                </svg>
              </div>
              <p className="text-xs text-gray-300 font-mono break-all">{affiliateUrl}</p>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
              >
                Fechar QR Code
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
