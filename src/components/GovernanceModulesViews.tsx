import React, { useState } from 'react';
import {
  Check,
  Award,
  Eye,
  Upload,
  RotateCcw,
  Smartphone,
  Cpu,
  PlusCircle,
  MapPin,
  FileText,
  Wallet,
  Settings,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  CONTRACT_STAGES_ORDER,
  CONTRACT_STAGE_LABELS,
  type ContractStage,
  type LedgerEntry,
} from '../domain/rules';
import { NexLogo, PWAStatusAndInstall } from './NexBrand';
import { type ScreenId } from './PublicViews';
import heroTruckImg from '../assets/images/nexcarga_hero_truck_1794424523948.jpg';

export interface ContractItem {
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
}

export interface PlanItem {
  id: string;
  name: string;
  cycle: 'MENSAL' | 'TRIMESTRAL' | 'ANUAL';
  includesNexIA: boolean;
  priceBrl: number;
  monthlyEquivalentBrl: number;
  savingsLabel: string;
  features: string[];
}

interface GovernanceModulesViewsProps {
  currentScreen: '12_PLANS' | '13_NEXVERIFY' | '14_CONTRACTS' | '15_FINANCE' | '16_MOBILE_PWA';
  plans: PlanItem[];
  contracts: ContractItem[];
  ledger: LedgerEntry[];
  onActivatePlan: (plan: PlanItem) => void;
  onConfirmContractFee: (contractId: string) => Promise<void>;
  onAdvanceContractStage: (contractId: string, nextStage: ContractStage) => Promise<string | null>;
  onCreateCompensatoryEntry: (entryId: string, reason: string) => Promise<string | null>;
  onNavigate: (screen: ScreenId) => void;
}

export const GovernanceModulesViews: React.FC<GovernanceModulesViewsProps> = ({
  currentScreen,
  plans,
  contracts,
  ledger,
  onActivatePlan,
  onConfirmContractFee,
  onAdvanceContractStage,
  onCreateCompensatoryEntry,
  onNavigate,
}) => {
  // Estados de Planos e Assinaturas (12)
  const [withNexIA, setWithNexIA] = useState(false);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  // Estados de NexVerify (13)
  const [docsList, setDocsList] = useState([
    { id: 'doc-1', title: 'Documento de Identificação (RG ou CNH)', status: 'Enviado', privateKey: 'vault://cnh-carlos-9812.pdf', justification: '' },
    { id: 'doc-2', title: 'Comprovante de Residência', status: 'Enviado', privateKey: 'vault://comp-residencia-manhuacu.pdf', justification: '' },
    { id: 'doc-3', title: 'Documento do Veículo (CRLV)', status: 'Aprovado', privateKey: 'vault://crlv-rma4b89.pdf', justification: 'Validado junto ao SENATRAN.' },
    { id: 'doc-4', title: 'Registro ANTT / RNTRC', status: 'Aprovado', privateKey: 'vault://rntrc-antt-ativo.pdf', justification: 'Registro ativo e regular.' },
  ]);
  const [verifyFeedback, setVerifyFeedback] = useState<string | null>(null);

  // Estados de Contratos (14)
  const [contractFilter, setContractFilter] = useState<'TODOS' | 'ATIVO' | 'CONCLUIDO' | 'CANCELADO'>('TODOS');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);

  // Estados de Financeiro e Comissões (15)
  const [financeTab, setFinanceTab] = useState<'RESUMO' | 'LANCAMENTOS' | 'COMISSOES' | 'SAQUES'>('RESUMO');
  const [compEntryId, setCompEntryId] = useState<string | null>(null);
  const [compReason, setCompReason] = useState('');
  const [financeFeedback, setFinanceFeedback] = useState<string | null>(null);

  // ===========================================================================
  // TELA 12 — PLANOS E ASSINATURAS (12_Planos_Assinaturas.png)
  // ===========================================================================
  if (currentScreen === '12_PLANS') {
    const visiblePlans = plans.filter((p) => p.includesNexIA === withNexIA);

    const handleSubscribe = (plan: PlanItem) => {
      onActivatePlan(plan);
      setPlanNotice(
        `Plano "${plan.name}" selecionado com Teste Gratuito de 15 dias ativado (sem cobrança financeira real nesta etapa).`
      );
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-10 space-y-8">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">12 -</span>Planos e Assinaturas
          </h1>
          <p className="text-sm text-gray-300">Escolha o plano ideal para o seu negócio</p>

          {/* Toggle Sem NexIA / Com NexIA idêntico a 12_Planos_Assinaturas.png */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#1C1F26] border border-white/10 mt-3">
            <button
              type="button"
              onClick={() => setWithNexIA(false)}
              className={`px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                !withNexIA
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sem NexIA
            </button>
            <button
              type="button"
              onClick={() => setWithNexIA(true)}
              className={`px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                withNexIA
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Com NexIA
            </button>
          </div>
        </div>

        {planNotice && (
          <div className="max-w-5xl mx-auto p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs sm:text-sm text-emerald-200 flex items-center justify-between">
            <span>{planNotice}</span>
            <button type="button" onClick={() => setPlanNotice(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3 Cards Mensal, Trimestral e Anual idênticos a 12_Planos_Assinaturas.png */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {visiblePlans.map((plan) => {
            const isAnnual = plan.cycle === 'ANUAL';
            const isQuarterly = plan.cycle === 'TRIMESTRAL';
            const unitSuffix = plan.cycle === 'MENSAL' ? '/mês' : plan.cycle === 'TRIMESTRAL' ? '/trim' : '/ano';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-7 flex flex-col justify-between transition-all ${
                  isAnnual
                    ? 'bg-gradient-to-b from-[#2A190B] to-[#181A1E] border-2 border-[#FF8A00] shadow-2xl shadow-[#FF8A00]/15'
                    : isQuarterly
                    ? 'bg-[#181A1E] border border-[#FF8A00]/45'
                    : 'bg-[#181A1E] border border-white/10'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white font-display">{plan.name}</h2>
                    <span className="text-[11px] px-2.5 py-0.5 rounded bg-white/5 text-[#FF8A00] font-semibold">
                      15 dias grátis
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1 font-mono tabular-nums">
                      <span className="text-lg font-bold text-[#FF8A00]">R$</span>
                      <span className="text-4xl font-extrabold text-white">
                        {plan.priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-gray-300">{unitSuffix}</span>
                    </div>
                    {plan.cycle !== 'MENSAL' && (
                      <div className="text-xs font-semibold text-[#FF8A00] font-mono mt-1">
                        (= R$ {plan.monthlyEquivalentBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês)
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-gray-200">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm shadow-lg mt-8"
                >
                  Assinar (Iniciar 15 Dias Grátis)
                </button>
              </div>
            );
          })}
        </div>

        <p className="max-w-4xl mx-auto text-center text-xs text-gray-400">
          Nota de Governança Comercial (Seção 9): Os valores exibidos acima são parâmetros configuráveis no NexCarga Control e têm caráter ilustrativo até definição comercial definitiva pelo responsável. O teste gratuito de 15 dias não realiza cobrança financeira real.
        </p>
      </div>
    );
  }

  // ===========================================================================
  // TELA 13 — NEXVERIFY: VERIFICAÇÃO DE DOCUMENTOS (13_NexVerify.png)
  // ===========================================================================
  if (currentScreen === '13_NEXVERIFY') {
    const handleApproveDoc = (id: string) => {
      setDocsList((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'Aprovado', justification: 'Aprovado pela análise administrativa NexVerify.' } : d
        )
      );
      setVerifyFeedback('Documento aprovado e registrado no histórico de verificação.');
    };

    const handleRequestCorrection = (id: string) => {
      setDocsList((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'Correção Solicitada', justification: 'Solicitado reenvio com imagem nítida frente e verso.' }
            : d
        )
      );
      setVerifyFeedback('Solicitação de correção com justificativa enviada ao titular.');
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-10 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">13 -</span>Verificação de Documentos (NexVerify)
          </h1>

          {verifyFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span>{verifyFeedback}</span>
              <button type="button" onClick={() => setVerifyFeedback(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Coluna Esquerda: Conta Verificada + Lista de Documentos fiel a 13_NexVerify.png */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <Check className="w-9 h-9 text-white stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Conta Verificada</h2>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                    Seu perfil está verificado e exibe o selo de confiança NexCarga.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#181A1E] border border-white/10 divide-y divide-white/10">
                {docsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-white">{doc.title}</div>
                        <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                          Armazenamento Privado (Sem URL pública): {doc.privateKey}
                        </div>
                        {doc.justification && (
                          <div className="text-xs text-gray-300 mt-1">{doc.justification}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                          doc.status === 'Aprovado'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : doc.status === 'Enviado'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {doc.status}
                      </span>
                      {doc.status !== 'Aprovado' && (
                        <button
                          type="button"
                          onClick={() => handleApproveDoc(doc.id)}
                          className="px-2.5 py-1 rounded bg-[#292929] hover:bg-emerald-600 text-[11px] font-semibold text-white transition-colors"
                        >
                          Aprovar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRequestCorrection(doc.id)}
                        className="px-2.5 py-1 rounded bg-[#292929] hover:bg-amber-600 text-[11px] font-semibold text-gray-200 transition-colors"
                      >
                        Solicitar Correção
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita: Card Selo Verificado fiel a 13_NexVerify.png */}
            <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#0D2818] to-[#0A1910] border border-emerald-500/40 p-7 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/25">
                <Award className="w-16 h-16 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Selo Verificado</h3>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                Este usuário teve seus documentos validados pela equipe NexCarga com proteção criptográfica e armazenamento privado.
              </p>
              <button
                type="button"
                onClick={() =>
                  setVerifyFeedback('Novo documento criptografado enviado para a fila privada do NexVerify.')
                }
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 mt-2"
              >
                <Upload className="w-4 h-4" />
                <span>Enviar Atualização de Documento</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 14 — CONTRATOS E ACOMPANHAMENTO (14_Contratos.png)
  // ===========================================================================
  if (currentScreen === '14_CONTRACTS') {
    const filteredContracts = contracts.filter((c) => {
      if (contractFilter === 'TODOS') return true;
      return c.statusCategory === contractFilter;
    });

    const activeContract = contracts.find((c) => c.id === selectedContractId) || null;

    const handleNextStage = async (contract: ContractItem) => {
      setContractError(null);
      const currentIdx = CONTRACT_STAGES_ORDER.indexOf(contract.currentStage);
      const nextStage = CONTRACT_STAGES_ORDER[currentIdx + 1];
      if (!nextStage) return;
      const err = await onAdvanceContractStage(contract.id, nextStage);
      if (err) {
        setContractError(err);
      }
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-10 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">14 -</span>Contratos e Acompanhamento
          </h1>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Meus Contratos</h2>

            {/* Abas Todos / Ativos / Concluídos / Cancelados idênticas a 14_Contratos.png */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'ATIVO', label: `Ativos (${contracts.filter((c) => c.statusCategory === 'ATIVO').length})` },
                { id: 'CONCLUIDO', label: 'Concluídos' },
                { id: 'CANCELADO', label: 'Cancelados' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setContractFilter(tab.id as any)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    contractFilter === tab.id
                      ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white shadow'
                      : 'bg-[#181A1E] border border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tabela de Contratos fiel a 14_Contratos.png */}
            <div className="rounded-2xl overflow-hidden bg-[#181A1E] border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs sm:text-sm text-gray-300 bg-[#14161B]">
                      <th className="py-4 px-5 font-semibold">Contrato</th>
                      <th className="py-4 px-5 font-semibold">Rota</th>
                      <th className="py-4 px-5 font-semibold">Valor</th>
                      <th className="py-4 px-5 font-semibold">Status</th>
                      <th className="py-4 px-5 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                    {filteredContracts.map((c) => {
                      const isWaiting = c.statusBadgeLabel.toLowerCase().includes('aguardando');
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-5 font-mono font-bold text-gray-200">{c.code}</td>
                          <td className="py-4 px-5 font-bold text-white">{c.routeLabel}</td>
                          <td className="py-4 px-5 font-mono font-bold text-white tabular-nums">
                            R$ {c.valueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold ${
                                isWaiting
                                  ? 'bg-[#422308] text-[#FF8A00] border border-[#FF8A00]/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              }`}
                            >
                              {c.statusBadgeLabel}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContractId(c.id);
                                setContractError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242830] hover:bg-[#FF8A00] text-xs font-semibold text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Fluxo 15 Etapas</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Painel Detalhado das 15 Etapas Operacionais (Seção 7) */}
          {activeContract && (
            <div className="p-6 rounded-2xl bg-[#181A1E] border border-[#FF8A00]/50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono text-[#FF8A00] font-bold">
                    MÁQUINA DE ESTADOS AUDITADA NO SERVIDOR · {activeContract.code}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {activeContract.routeLabel} · Etapa Atual: {CONTRACT_STAGE_LABELS[activeContract.currentStage]}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!activeContract.feePaymentConfirmed && (
                    <button
                      type="button"
                      onClick={() => onConfirmContractFee(activeContract.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
                    >
                      Confirmar Pagamento da Taxa (R$ {activeContract.maintenanceFeeBrl.toFixed(2)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNextStage(activeContract)}
                    className="px-4 py-2 rounded-xl bg-[#292929] hover:bg-[#383838] border border-white/15 text-xs font-bold text-white"
                  >
                    Avançar Próxima Etapa →
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedContractId(null)}
                    className="p-2 rounded-lg bg-[#111111] text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {contractError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200">
                  {contractError}
                </div>
              )}

              {/* Grade das 15 etapas oficiais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                {CONTRACT_STAGES_ORDER.map((st) => {
                  const currentIndex = CONTRACT_STAGES_ORDER.indexOf(activeContract.currentStage);
                  const stIndex = CONTRACT_STAGES_ORDER.indexOf(st);
                  const isDone = stIndex <= currentIndex;
                  return (
                    <div
                      key={st}
                      className={`p-2.5 rounded-lg border ${
                        st === activeContract.currentStage
                          ? 'bg-[#FF8A00]/20 border-[#FF8A00] text-white font-bold'
                          : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-[#111111] border-white/5 text-gray-500'
                      }`}
                    >
                      {CONTRACT_STAGE_LABELS[st]}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 15 — FINANCEIRO E COMISSÕES / NEXFINANCE (15_Financeiro_Comissoes.png)
  // ===========================================================================
  if (currentScreen === '15_FINANCE') {
    const handleCompensateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!compEntryId) return;
      const err = await onCreateCompensatoryEntry(compEntryId, compReason);
      if (err) {
        setFinanceFeedback(`Erro: ${err}`);
      } else {
        setFinanceFeedback('Lançamento compensatório registrado no livro-razão imutável (sem apagar histórico).');
        setCompEntryId(null);
        setCompReason('');
      }
    };

    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-10 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white font-display">
            <span className="text-[#FF8A00] mr-2">15 -</span>Financeiro e Comissões
          </h1>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Financeiro</h2>

            {/* Abas Resumo / Lançamentos / Comissões / Saques idênticas a 15_Financeiro_Comissoes.png */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'RESUMO', label: 'Resumo' },
                { id: 'LANCAMENTOS', label: 'Lançamentos (Ledger Imutável)' },
                { id: 'COMISSOES', label: 'Comissões' },
                { id: 'SAQUES', label: 'Saques' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFinanceTab(tab.id as any)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    financeTab === tab.id
                      ? 'bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white shadow'
                      : 'bg-[#181A1E] border border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {financeFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <span>{financeFeedback}</span>
                <button type="button" onClick={() => setFinanceFeedback(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3 KPIs idênticos a 15_Financeiro_Comissoes.png */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
                <span className="text-xs sm:text-sm text-gray-300 block">Saldo disponível</span>
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                  R$ 4.320,00
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
                <span className="text-xs sm:text-sm text-gray-300 block">Comissões pendentes</span>
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                  R$ 1.260,00
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#181A1E] border border-white/10">
                <span className="text-xs sm:text-sm text-gray-300 block">Total recebido</span>
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2 block">
                  R$ 12.480,00
                </span>
              </div>
            </div>

            {/* Gráficos Receitas (últimos 6 meses) + Origem das Receitas idênticos a 15_Financeiro_Comissoes.png */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#181A1E] border border-white/10">
                <h3 className="text-base font-bold text-white mb-5">Receitas (últimos 6 meses)</h3>
                <div className="h-44 flex items-end gap-5 pt-4 border-b border-white/10 pb-2 px-4">
                  {[38, 56, 44, 68, 82, 95].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-[#E85D04] to-[#FF8A00]"
                        style={{ height: `${val * 1.35}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-mono mt-2 px-4">
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                  <span>Set</span>
                  <span>Out</span>
                  <span>Nov</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#181A1E] border border-white/10 flex flex-col justify-between">
                <h3 className="text-base font-bold text-white mb-4">Origem das receitas</h3>
                <div className="flex items-center justify-around gap-4 my-auto">
                  <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90 shrink-0">
                    <circle cx="60" cy="60" r="44" stroke="#292929" strokeWidth="16" fill="none" />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      stroke="#FF8A00"
                      strokeWidth="16"
                      strokeDasharray="171 276"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      stroke="#FDBA74"
                      strokeWidth="16"
                      strokeDasharray="77 276"
                      strokeDashoffset="-171"
                      fill="none"
                    />
                  </svg>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-gray-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A00]" />
                        Assinaturas
                      </span>
                      <strong className="font-mono text-white">62%</strong>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-gray-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FDBA74]" />
                        Taxas de contratos
                      </span>
                      <strong className="font-mono text-white">28%</strong>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-gray-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        Comissões
                      </span>
                      <strong className="font-mono text-white">10%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Livro-Razão Financeiro Imutável (Seção 8 — Sem exclusão de lançamentos) */}
            <div className="p-6 rounded-2xl bg-[#181A1E] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Livro-Razão Contábil Imutável (NexFinance Ledger)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Movimentações financeiras nunca são apagadas. Eventuais ajustes geram lançamentos compensatórios auditáveis.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[#111111] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#FF8A00] mr-2">[{entry.type}]</span>
                      <strong className="text-white">{entry.description}</strong>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                        ID: {entry.id} · IdempotencyKey: {entry.idempotencyKey}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-mono font-bold ${
                          entry.direction === 'CREDIT' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {entry.direction === 'CREDIT' ? '+' : '-'} R${' '}
                        {entry.amountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {entry.type !== 'ESTORNO_COMPENSATORIO' && (
                        <button
                          type="button"
                          onClick={() => setCompEntryId(entry.id)}
                          className="px-2.5 py-1 rounded bg-[#292929] hover:bg-[#383838] text-[11px] font-semibold text-gray-200 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-[#FF8A00]" />
                          <span>Lançar Estorno Compensatório</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {compEntryId && (
                <form
                  onSubmit={handleCompensateSubmit}
                  className="p-4 rounded-xl bg-[#1D1610] border border-[#FF8A00]/40 space-y-3"
                >
                  <div className="text-xs font-bold text-white">
                    Gerar Lançamento Compensatório Auditável para {compEntryId}
                  </div>
                  <input
                    type="text"
                    value={compReason}
                    onChange={(e) => setCompReason(e.target.value)}
                    placeholder="Informe a justificativa contábil (mín. 5 caracteres)..."
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/15 text-xs text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCompEntryId(null)}
                      className="px-3 py-1.5 rounded bg-[#292929] text-xs text-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
                    >
                      Registrar Estorno Compensatório
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 16 — RESPONSIVIDADE MOBILE E PWA (16_Mobile_PWA.png)
  // ===========================================================================
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-6 lg:p-10 space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              <span className="text-[#FF8A00] mr-2">16 -</span>Responsividade (Mobile - PWA)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Experiência nativa instalável para Android, iPhone, iPad, Tablets e Desktop com adaptação ergonômica real.
            </p>
          </div>
          <PWAStatusAndInstall />
        </div>

        {/* 4 Mockups Mobile Interativos idênticos a 16_Mobile_PWA.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Frame 1: Splash Screen Mobile */}
          <div className="rounded-[32px] bg-[#16181D] border-4 border-[#292929] p-5 flex flex-col justify-between min-h-[470px] shadow-2xl relative overflow-hidden">
            <div className="text-[11px] font-mono text-gray-400 flex justify-between">
              <span>09:41</span>
              <span>5G · 100%</span>
            </div>
            <div className="my-auto text-center space-y-3 z-10">
              <div className="flex justify-center">
                <NexLogo size="lg" />
              </div>
              <p className="text-lg font-bold text-white font-display pt-2">
                Sua carga.
                <br />
                Nossa conexão.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <img
                src={heroTruckImg}
                alt="NexCarga Mobile"
                className="w-full h-32 object-cover object-right"
              />
            </div>
          </div>

          {/* Frame 2: Dashboard Motorista Mobile */}
          <div className="rounded-[32px] bg-[#16181D] border-4 border-[#292929] p-5 flex flex-col justify-between min-h-[470px] shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FF8A00] text-[#111111] font-bold text-xs flex items-center justify-center">
                  CS
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Olá, Carlos!</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Motorista Verificado
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#111111] border border-white/10">
                  <span className="text-[11px] text-gray-400 block">Fretes</span>
                  <span className="text-xl font-extrabold text-[#FF8A00] font-mono">128</span>
                </div>
                <div className="p-3 rounded-xl bg-[#111111] border border-white/10">
                  <span className="text-[11px] text-gray-400 block">Contratos</span>
                  <span className="text-xl font-extrabold text-[#FF8A00] font-mono">4</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111111] border border-white/10">
                <span className="text-[11px] text-gray-400 block">Ganhos</span>
                <span className="text-xl font-extrabold text-[#FF8A00] font-mono">R$ 6.420,00</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111111] border border-white/10 text-xs">
                <div className="font-bold text-white">Manhuaçu - MG → BH</div>
                <div className="text-gray-400 mt-0.5">Carga: Alimentos · 290 km</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('05_DRIVER')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white"
            >
              Ver Detalhes
            </button>
          </div>

          {/* Frame 3: NexRadar Mobile */}
          <div className="rounded-[32px] bg-[#16181D] border-4 border-[#292929] p-5 flex flex-col justify-between min-h-[470px] shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF8A00]" /> NexRadar
              </span>
              <span className="text-[11px] text-[#FF8A00] font-mono">Manhuaçu-MG</span>
            </div>

            <div className="my-3 flex-1 rounded-2xl bg-[#19331A] border border-white/15 relative overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 200 220" className="w-full h-full">
                <path d="M 20 160 Q 95 110 180 70" stroke="#FF8A00" strokeWidth="4" fill="none" />
                <circle cx="55" cy="140" r="10" fill="#FF8A00" />
                <circle cx="110" cy="105" r="10" fill="#FF8A00" />
                <circle cx="155" cy="80" r="10" fill="#FF8A00" />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('08_NEXRADAR')}
              className="w-full py-2.5 rounded-xl bg-[#292929] hover:bg-[#383838] text-xs font-bold text-white"
            >
              Abrir Mapa Completo
            </button>
          </div>

          {/* Frame 4: Menu Rápido 2x3 Mobile idêntico a 16_Mobile_PWA.png */}
          <div className="rounded-[32px] bg-[#16181D] border-4 border-[#292929] p-5 flex flex-col justify-between min-h-[470px] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <NexLogo size="sm" />
              <Smartphone className="w-4 h-4 text-[#FF8A00]" />
            </div>

            <div className="grid grid-cols-2 gap-3 my-auto">
              {[
                { label: 'NexIA', icon: Cpu, screen: '11_NEXIA' as ScreenId },
                { label: 'Publicar Frete', icon: PlusCircle, screen: '06_COMPANY' as ScreenId },
                { label: 'NexColeta', icon: MapPin, screen: '09_NEXCOLETA' as ScreenId },
                { label: 'Contratos', icon: FileText, screen: '14_CONTRACTS' as ScreenId },
                { label: 'Financeiro', icon: Wallet, screen: '15_FINANCE' as ScreenId },
                { label: 'Configurações', icon: Settings, screen: '04_ADMIN' as ScreenId },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.screen)}
                    className="p-4 rounded-2xl bg-[#111111] hover:bg-[#1F2229] border border-white/10 flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    <Icon className="w-6 h-6 text-[#FF8A00]" />
                    <span className="text-xs font-semibold text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-center text-gray-400">
              PWA Instalável · Manifest + Service Worker Ativos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
