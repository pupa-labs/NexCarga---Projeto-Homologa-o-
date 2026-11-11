import React, { useState } from 'react';
import {
  MapPin,
  Lock,
  Unlock,
  Send,
  Phone,
  Info,
  Cpu,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Layers,
} from 'lucide-react';
import { type FreightItem } from './DashboardsViews';
import { type RegionalPickupRequest, type GroupingValidationResult } from '../domain/rules';
import { BRAZILIAN_VEHICLE_CATALOG } from '../domain/catalog';

export interface ConversationItem {
  id: string;
  partnerName: string;
  subtitle: string;
  freightId: string;
  contractCode: string;
  lastTime: string;
  feePaymentConfirmed: boolean;
  messages: {
    id: string;
    sender: 'PARTNER' | 'ME' | 'SYSTEM';
    text: string;
    time: string;
    wasRedacted?: boolean;
  }[];
}

interface IntelligentModulesViewsProps {
  currentScreen: '08_NEXRADAR' | '09_NEXCOLETA' | '10_CHAT' | '11_NEXIA';
  freights: FreightItem[];
  regionalPickups: RegionalPickupRequest[];
  conversations: ConversationItem[];
  hasActiveSub: boolean;
  onRequestPickup: (payload: Record<string, any>) => Promise<void>;
  onValidateGroup: (pickupIds: string[], maxWeightKg: number, maxVolumeM3: number) => Promise<GroupingValidationResult>;
  onSendMessage: (conversationId: string, text: string) => Promise<{ wasRedacted?: boolean }>;
  onConfirmContractFeeByFreight: (freightId: string) => Promise<void>;
}

export const IntelligentModulesViews: React.FC<IntelligentModulesViewsProps> = ({
  currentScreen,
  freights,
  regionalPickups,
  conversations,
  hasActiveSub,
  onRequestPickup,
  onValidateGroup,
  onSendMessage,
  onConfirmContractFeeByFreight,
}) => {
  // Estados do NexRadar (08)
  const [radarOrigin, setRadarOrigin] = useState('Manhuaçu - MG');
  const [radarRadiusKm, setRadarRadiusKm] = useState(300);
  const [radarVehicle, setRadarVehicle] = useState('Todos');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedFreightId, setSelectedFreightId] = useState<string>(freights[1]?.id || freights[0]?.id || '');

  // Estados do NexColeta (09)
  const [colOrigin, setColOrigin] = useState('Manhuaçu - MG');
  const [colDest, setColDest] = useState('Reduto - MG');
  const [colDate, setColDate] = useState('2026-11-15');
  const [colCargo, setColCargo] = useState<'CAFE_SACARIA' | 'ALIMENTOS_SECOS' | 'REFRIGERADO' | 'QUIMICO_PERIGOSO' | 'GERAL'>('CAFE_SACARIA');
  const [colWeight, setColWeight] = useState('1200');
  const [colVolume, setColVolume] = useState('6.5');
  const [selectedPickupIds, setSelectedPickupIds] = useState<string[]>(['col-101', 'col-102']);
  const [groupResult, setGroupResult] = useState<GroupingValidationResult | null>(null);
  const [colCreatedMsg, setColCreatedMsg] = useState<string | null>(null);

  // Estados do Chat de Negociação (10)
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || 'conv-01');
  const [chatInput, setChatInput] = useState('');
  const [redactionAlert, setRedactionAlert] = useState<string | null>(null);

  // Estados da NexIA (11)
  const [nexIaPrompt, setNexIaPrompt] = useState('');
  const [nexIaLoading, setNexIaLoading] = useState(false);
  const [nexIaHistory, setNexIaHistory] = useState<{ role: 'USER' | 'NEXIA'; text: string }[]>([
    {
      role: 'NEXIA',
      text: 'Olá! Sou a NexIA, sua inteligência logística na NexCarga. Selecione uma das operações abaixo ("Calcular rota", "Descrever carga" ou "Analisar região") ou envie sua pergunta sobre fretes reais em Manhuaçu-MG e região.',
    },
  ]);

  // ===========================================================================
  // TELA 08 — NEXRADAR: MAPA E RADAR DE FRETES (08_NexRadar.png)
  // ===========================================================================
  if (currentScreen === '08_NEXRADAR') {
    const filteredFreights = freights.filter((f) => {
      if (onlyVerified && !f.companyVerified) return false;
      if (f.distanceKm > radarRadiusKm) return false;
      if (radarVehicle !== 'Todos' && !f.requiredVehicleType.toLowerCase().includes(radarVehicle.toLowerCase())) {
        return false;
      }
      return true;
    });

    const activeFreight =
      filteredFreights.find((f) => f.id === selectedFreightId) ||
      filteredFreights[0] ||
      freights[0];

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">08 -</span>NexRadar – Radar de Fretes
          </h1>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF8A00]" />
            <span>
              Nota técnica: o cálculo de rotas não substitui a conferência de restrições físicas de caminhões (altura, peso por eixo, balança e AET).
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Painel Lateral de Filtros idêntico a 08_NexRadar.png */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Origem</label>
                <select
                  value={radarOrigin}
                  onChange={(e) => setRadarOrigin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white"
                >
                  <option value="Manhuaçu - MG">Manhuaçu - MG</option>
                  <option value="Reduto - MG">Reduto - MG</option>
                  <option value="Caratinga - MG">Caratinga - MG</option>
                  <option value="Manhumirim - MG">Manhumirim - MG</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-200 font-medium">Raio de busca</span>
                  <span className="font-mono font-bold text-[#FF8A00]">{radarRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={25}
                  value={radarRadiusKm}
                  onChange={(e) => setRadarRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#FF8A00] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Tipo de veículo</label>
                <select
                  value={radarVehicle}
                  onChange={(e) => setRadarVehicle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white"
                >
                  <option value="Todos">Carreta / Todos os veículos</option>
                  <option value="Cavalo">Carreta / Cavalo Mecânico</option>
                  <option value="Truck">Truck (6x2 / 6x4)</option>
                  <option value="Bitruck">Bitruck (8x2)</option>
                  <option value="Toco">Toco (4x2)</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-white/20 bg-[#1E2127] text-[#FF8A00] focus:ring-[#FF8A00]"
                />
                <span>Apenas fretes verificados</span>
              </label>
            </div>

            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (filteredFreights[0]) setSelectedFreightId(filteredFreights[0].id);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#FF8A00]/25"
              >
                Buscar Fretes ({filteredFreights.length})
              </button>
            </div>
          </div>

          {/* Mapa Interativo Regional fiel a 08_NexRadar.png */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-white/15 bg-[#16261A] min-h-[460px] flex flex-col justify-between p-6">
            {/* Camada Cartográfica Estilizada da Região de Manhuaçu-MG (BR-262 e BR-116) */}
            <svg
              viewBox="0 0 800 460"
              className="absolute inset-0 w-full h-full object-cover"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="55%" r="50%">
                  <stop offset="0%" stopColor="#2E5A27" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#1B3B1A" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0F2011" stopOpacity="1" />
                </radialGradient>
              </defs>
              <rect width="800" height="460" fill="url(#radarGlow)" />
              {/* Malha topográfica e divisas */}
              <path
                d="M 0 120 Q 220 90 420 150 T 800 110 M 140 0 Q 280 220 240 460 M 540 0 Q 510 240 620 460"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Eixo Rodoviário BR-262 (BH ← Manhuaçu → Vitória) em destaque laranja */}
              <path
                d="M 80 290 Q 240 310 375 340 T 680 355"
                stroke="#FF8A00"
                strokeWidth="4.5"
                strokeDasharray="8 4"
                fill="none"
              />
              {/* Eixo BR-116 (Governador Valadares ← Caratinga ← Manhuaçu → RJ) */}
              <path
                d="M 390 80 Q 385 210 375 340 T 490 430"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeOpacity="0.7"
                fill="none"
              />
            </svg>

            {/* Marcadores Interativos de Fretes no Mapa */}
            <div className="relative z-10 flex flex-wrap gap-2">
              {filteredFreights.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFreightId(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                    activeFreight?.id === f.id
                      ? 'bg-[#FF8A00] text-[#111111] scale-105'
                      : 'bg-[#111111]/90 text-white border border-[#FF8A00]/50 hover:bg-[#292929]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {f.originCity} → {f.destinationCity}
                  </span>
                </button>
              ))}
            </div>

            {/* Rótulo de Manhuaçu + Card Flutuante idêntico a 08_NexRadar.png */}
            {activeFreight && (
              <div className="relative z-10 my-auto ml-auto mr-4 w-full max-w-sm rounded-2xl bg-[#14161B]/95 backdrop-blur border border-white/15 p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FF8A00]">
                    {activeFreight.code} · {activeFreight.companyName}
                  </span>
                  {activeFreight.companyVerified && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white">
                  {activeFreight.originCity} - {activeFreight.originState} → {activeFreight.destinationCity} - {activeFreight.destinationState}
                </h3>

                <div className="text-xs text-gray-300 space-y-1">
                  <div>
                    Carga: <strong>{activeFreight.cargoCategory}</strong> | {activeFreight.distanceKm} km
                  </div>
                  <div>
                    Veículo: <strong>{activeFreight.requiredVehicleType}</strong> ({activeFreight.requiredImplementType})
                  </div>
                  <div className="text-base font-extrabold text-white font-mono pt-1">
                    Valor: R$ {activeFreight.offeredValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111111] border border-white/10 text-[11px] text-gray-400">
                  <div>Coleta: {activeFreight.fullPickupAddress}</div>
                  <div>Contato: {activeFreight.contactPhone}</div>
                </div>

                <button
                  type="button"
                  onClick={() => onConfirmContractFeeByFreight(activeFreight.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-bold text-xs shadow-lg"
                >
                  {activeFreight.sensitiveDataLocked
                    ? 'Ver Detalhes / Liberar Dados Pós-Taxa'
                    : 'Dados Completos Liberados para Coleta'}
                </button>
              </div>
            )}

            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-[#111111]/90 border border-white/15 text-xs font-bold text-white">
                Polo Base: Manhuaçu - MG
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 09 — NEXCOLETA: COLETAS REGIONAIS (09_NexColeta.png)
  // ===========================================================================
  if (currentScreen === '09_NEXCOLETA') {
    const handleCreatePickup = async (e: React.FormEvent) => {
      e.preventDefault();
      await onRequestPickup({
        originCity: colOrigin,
        destinationCity: colDest,
        pickupDate: colDate,
        pickupWindow: 'MANHA',
        cargoType: colCargo,
        weightKg: Number(colWeight),
        volumeM3: Number(colVolume),
      });
      setColCreatedMsg(`Coleta regional ${colOrigin} → ${colDest} registrada para ${colDate}!`);
    };

    const handleTogglePickupSelection = (id: string) => {
      setSelectedPickupIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    const handleRunGroupingCheck = async () => {
      const res = await onValidateGroup(selectedPickupIds, 4000, 26);
      setGroupResult(res);
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white font-display">
          <span className="text-[#FF8A00] mr-2">09 -</span>NexColeta (Coletas Regionais — Manhuaçu-MG e Região)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Solicitar Coleta fiel a 09_NexColeta.png */}
          <form
            onSubmit={handleCreatePickup}
            className="lg:col-span-7 p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-5"
          >
            <h2 className="text-lg font-bold text-white">Solicitar Coleta</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Origem</label>
                <select
                  value={colOrigin}
                  onChange={(e) => setColOrigin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white"
                >
                  <option value="Manhuaçu - MG">Manhuaçu - MG</option>
                  <option value="Realeza (Manhuaçu) - MG">Realeza (Manhuaçu) - MG</option>
                  <option value="Reduto - MG">Reduto - MG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Destino (Região / Cidade)</label>
                <select
                  value={colDest}
                  onChange={(e) => setColDest(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white"
                >
                  <option value="Reduto - MG">Reduto - MG</option>
                  <option value="Ipanema - MG">Ipanema - MG</option>
                  <option value="Mutum - MG">Mutum - MG</option>
                  <option value="Caratinga - MG">Caratinga - MG</option>
                  <option value="Matipó - MG">Matipó - MG</option>
                  <option value="Lajinha - MG">Lajinha - MG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Data de coleta</label>
                <input
                  type="date"
                  value={colDate}
                  onChange={(e) => setColDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Tipo de carga</label>
                <select
                  value={colCargo}
                  onChange={(e) => setColCargo(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white"
                >
                  <option value="CAFE_SACARIA">Café em Sacaria / Grãos</option>
                  <option value="ALIMENTOS_SECOS">Alimentos Secos</option>
                  <option value="GERAL">Carga Geral Fracionada</option>
                  <option value="REFRIGERADO">Refrigerado / Perecível</option>
                  <option value="QUIMICO_PERIGOSO">Químico / Insumo Restrito</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Peso Estimado (kg)</label>
                <input
                  type="number"
                  value={colWeight}
                  onChange={(e) => setColWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">Volume Estimado (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  value={colVolume}
                  onChange={(e) => setColVolume(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white font-mono"
                />
              </div>
            </div>

            {colCreatedMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
                {colCreatedMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm shadow-lg"
            >
              Solicitar Coleta
            </button>
          </form>

          {/* Coluna Direita: Coletas na Região (Manhuaçu - MG) e Motor de Agrupamento */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Coletas na Região (Manhuaçu - MG)
              </h2>
              <span className="text-xs text-gray-400">Selecione para agrupar</span>
            </div>

            <div className="space-y-2.5">
              {regionalPickups.map((p) => {
                const isSelected = selectedPickupIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePickupSelection(p.id)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1F2229] border-[#FF8A00]'
                        : 'bg-[#131519] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FF8A00]/15 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-[#FF8A00]" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          {p.originCity} → {p.destinationCity}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {p.cargoType} · {p.weightKg} kg · {p.volumeM3} m³ · {p.pickupWindow}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-white/20 bg-[#111111] text-[#FF8A00]"
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRunGroupingCheck}
              className="w-full py-3 rounded-xl bg-[#292929] hover:bg-[#383838] border border-[#FF8A00]/40 text-xs font-bold text-white flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#FF8A00]" />
              <span>Validar Agrupamento (Veículo 3/4 — 4.000 kg / 26 m³)</span>
            </button>

            {groupResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  groupResult.compatible
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-500/15 border-red-500/40 text-red-200'
                }`}
              >
                <div className="font-bold">
                  {groupResult.compatible
                    ? `Agrupamento Aprovado! Ocupação: ${groupResult.capacityUtilizationPercent}% (${groupResult.totalWeightKg} kg / ${groupResult.totalVolumeM3} m³)`
                    : 'Agrupamento Bloqueado por Incompatibilidade Operacional:'}
                </div>
                {groupResult.reasons.map((r, i) => (
                  <div key={i}>• {r}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 10 — CHAT DE NEGOCIAÇÃO PRÉ E PÓS-PAGAMENTO (10_Chat_Negociacao.png)
  // ===========================================================================
  if (currentScreen === '10_CHAT') {
    const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

    const handleSendChatMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !activeConv) return;
      const result = await onSendMessage(activeConv.id, chatInput);
      setChatInput('');
      if (result.wasRedacted) {
        setRedactionAlert(
          'Proteção Pré-Pagamento Ativa: dados de contato ou endereço digitados na mensagem foram ocultados pelo servidor até a confirmação do pagamento da taxa.'
        );
      } else {
        setRedactionAlert(null);
      }
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white font-display">
          <span className="text-[#FF8A00] mr-2">10 -</span>Chat de Negociação (pré e pós pagamento)
        </h1>

        <div className="rounded-2xl overflow-hidden bg-[#181A1E] border border-white/10 grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* Coluna Esquerda: Lista de Conversas idêntica a 10_Chat_Negociacao.png */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#14161A] p-4 space-y-3">
            <h2 className="text-base font-bold text-white px-2 py-1">Conversas</h2>
            <div className="space-y-1.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                    activeConv?.id === conv.id
                      ? 'bg-[#22262E] border border-white/15'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {conv.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{conv.partnerName}</div>
                      <div className="text-xs text-gray-400">{conv.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">{conv.lastTime}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Janela de Mensagens com Alerta de Bloqueio Pré-Pagamento */}
          {activeConv && (
            <div className="lg:col-span-8 flex flex-col justify-between p-6">
              <div className="space-y-4">
                {/* Cabeçalho da Conversa */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#292929] flex items-center justify-center text-[#FF8A00] font-bold text-sm">
                      {activeConv.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">{activeConv.partnerName}</div>
                      <div className="text-xs text-gray-400">Negociação de frete · {activeConv.contractCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!activeConv.feePaymentConfirmed && (
                      <button
                        type="button"
                        onClick={() => onConfirmContractFeeByFreight(activeConv.freightId)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white shadow"
                      >
                        Confirmar Pagamento da Taxa (Backend)
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-full bg-[#22252C] border border-white/10 flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#22252C] border border-white/10 flex items-center justify-center text-gray-400">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Alerta de Segurança idêntico a 10_Chat_Negociacao.png */}
                {!activeConv.feePaymentConfirmed ? (
                  <div className="p-4 rounded-xl bg-[#331E0C] border border-[#FF8A00]/45 flex items-start gap-3.5">
                    <Lock className="w-6 h-6 text-[#FF8A00] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-white">Dados sensíveis bloqueados</div>
                      <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">
                        O endereço e os dados completos serão liberados após a confirmação do pagamento da taxa de serviço no servidor.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3.5">
                    <Unlock className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-white">
                        Pagamento Confirmado no Servidor — Dados Autorizados Liberados
                      </div>
                      <p className="text-xs text-emerald-200 mt-0.5">
                        Endereço completo de coleta/entrega e telefone operacional estão desbloqueados para esta contratação.
                      </p>
                    </div>
                  </div>
                )}

                {redactionAlert && (
                  <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200">
                    {redactionAlert}
                  </div>
                )}

                {/* Mensagens */}
                <div className="space-y-3 py-2 max-h-72 overflow-y-auto pr-1">
                  {activeConv.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'ME' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm ${
                          m.sender === 'ME'
                            ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-medium'
                            : 'bg-[#262932] text-white border border-white/10'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 mt-1 px-1">{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra de Envio */}
              <form onSubmit={handleSendChatMessage} className="pt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua mensagem... (Ex: tente enviar um telefone antes do pagamento)"
                  className="flex-1 px-4 py-3.5 rounded-full bg-[#131519] border border-white/15 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FF8A00]"
                />
                <button
                  type="submit"
                  aria-label="Enviar mensagem"
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white shadow-lg shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 11 — NEXIA: ASSISTENTE INTELIGENTE (11_NexIA.png)
  // ===========================================================================
  const executeNexIAQuery = async (customPrompt: string, operationType: string) => {
    if (!customPrompt.trim()) return;
    setNexIaHistory((prev) => [...prev, { role: 'USER', text: customPrompt }]);
    setNexIaLoading(true);

    try {
      const res = await fetch('/api/nexia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          userRole: 'DRIVER',
          hasNexIAPlan: hasActiveSub,
          operationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNexIaHistory((prev) => [
          ...prev,
          { role: 'NEXIA', text: `Aviso de Plano: ${data.error}` },
        ]);
      } else {
        setNexIaHistory((prev) => [
          ...prev,
          { role: 'NEXIA', text: data.reply },
        ]);
      }
    } catch {
      setNexIaHistory((prev) => [
        ...prev,
        { role: 'NEXIA', text: 'Não foi possível processar a solicitação no momento.' },
      ]);
    } finally {
      setNexIaLoading(false);
    }
  };

  const handleNexIASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nexIaPrompt.trim()) return;
    const q = nexIaPrompt;
    setNexIaPrompt('');
    await executeNexIAQuery(q, 'CONSULTA_PERSONALIZADA');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">11 -</span>NexIA (Assistente Inteligente)
          </h1>
          <span className="text-xs px-3 py-1 rounded-full bg-[#181A1E] border border-white/10 text-gray-300">
            Processamento exclusivo no Backend (@google/genai)
          </span>
        </div>

        {/* Hero Central da NexIA idêntico a 11_NexIA.png */}
        <div className="p-8 rounded-2xl bg-[#16181D] border border-white/10 space-y-7">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8A00]/25 to-[#E85D04]/10 border-2 border-[#FF8A00] flex items-center justify-center shadow-2xl shadow-[#FF8A00]/20">
              <span className="text-3xl font-extrabold text-[#FF8A00] font-display">AI</span>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-[#FF8A00]" />
                <span className="text-2xl font-extrabold text-white font-display">NexIA</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Seu assistente logístico inteligente</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 font-display">
                Como posso te ajudar hoje?
              </h2>
            </div>
          </div>

          {/* 3 Cards de Ação Rápida idênticos a 11_NexIA.png */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() =>
                executeNexIAQuery(
                  'Calcule a estimativa operacional de rota, distância e custos entre Manhuaçu - MG, Belo Horizonte - MG e Vitória - ES com base nos fretes ativos.',
                  'CALCULAR_ROTA'
                )
              }
              className="text-left p-5 rounded-2xl bg-[#1C1F26] hover:bg-[#242832] border border-[#FF8A00]/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6 text-[#FF8A00]" />
                <span className="text-base font-bold text-white">Calcular rota</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Distâncias, tempo e custos estimados.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                executeNexIAQuery(
                  'Crie uma descrição profissional de frete para embarque de Café Beneficiado saindo de Manhuaçu - MG com sugestão de veículo e implemento.',
                  'DESCREVER_CARGA'
                )
              }
              className="text-left p-5 rounded-2xl bg-[#1C1F26] hover:bg-[#242832] border border-white/10 hover:border-[#FF8A00]/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-[#FF8A00]" />
                <span className="text-base font-bold text-white">Descrever carga</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Crie descrições profissionais para seus fretes.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                executeNexIAQuery(
                  'Analise a região de Manhuaçu - MG e apresente o índice de fretes reais disponíveis e oportunidades de retorno.',
                  'ANALISAR_REGIAO'
                )
              }
              className="text-left p-5 rounded-2xl bg-[#1C1F26] hover:bg-[#242832] border border-white/10 hover:border-[#FF8A00]/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-6 h-6 text-[#FF8A00]" />
                <span className="text-base font-bold text-white">Analisar região</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Veja o índice de fretes e oportunidades.
              </p>
            </button>
          </div>

          {/* Histórico de Respostas da NexIA */}
          <div className="space-y-3 max-h-72 overflow-y-auto p-4 rounded-xl bg-[#111111] border border-white/10">
            {nexIaHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                  item.role === 'USER'
                    ? 'bg-[#292929] text-white ml-auto max-w-xl'
                    : 'bg-[#181A1E] border border-[#FF8A00]/30 text-gray-100'
                }`}
              >
                {item.text}
              </div>
            ))}
            {nexIaLoading && (
              <div className="text-xs text-[#FF8A00] font-medium animate-pulse">
                NexIA analisando dados reais da operação no servidor...
              </div>
            )}
          </div>

          {/* Barra de Pergunta idêntica a 11_NexIA.png */}
          <form onSubmit={handleNexIASubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={nexIaPrompt}
              onChange={(e) => setNexIaPrompt(e.target.value)}
              placeholder="Digite sua pergunta para a NexIA..."
              className="flex-1 px-5 py-4 rounded-full bg-[#111111] border border-white/15 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FF8A00]"
            />
            <button
              type="submit"
              aria-label="Enviar pergunta para a NexIA"
              className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#E85D04] flex items-center justify-center text-white shadow-lg shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
