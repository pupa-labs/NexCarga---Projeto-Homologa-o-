/**
 * Regras de Negócio Puras e Determinísticas da Plataforma NexCarga (PUPA LABS)
 * - NexPoint (3 utilizações gratuitas por ciclo de 24h em America/Sao_Paulo)
 * - Proteção de Dados Sensíveis no Chat/Frete (Pré vs. Pós-Pagamento da Taxa)
 * - Máquina de Estados de Contratos (15 etapas auditáveis)
 * - Agrupamento Inteligente de Coletas Regionais (NexColeta)
 * - Cálculo de Comissões e Antifraude do Programa de Afiliados
 * - Livro-Razão Financeiro Imutável (NexFinance)
 */

export type UserRole = 'ADMIN' | 'DRIVER' | 'COMPANY' | 'CARRIER' | 'OPERATOR' | 'AFFILIATE';

export type ContractStage =
  | '1_PUBLICADO'
  | '2_DESCOBERTO'
  | '3_PROPOSTA_ENVIADA'
  | '4_EM_NEGOCIACAO'
  | '5_ACEITO'
  | '6_CONTRATO_FORMALIZADO'
  | '7_TAXA_COBRADA'
  | '8_PAGAMENTO_CONFIRMADO'
  | '9_DADOS_LIBERADOS'
  | '10_EM_COLETA'
  | '11_EM_TRANSPORTE'
  | '12_ENTREGUE'
  | '13_COMPROVANTE_ENVIADO'
  | '14_CONCLUIDO'
  | '15_AVALIADO'
  | 'CANCELADO';

export const CONTRACT_STAGES_ORDER: ContractStage[] = [
  '1_PUBLICADO',
  '2_DESCOBERTO',
  '3_PROPOSTA_ENVIADA',
  '4_EM_NEGOCIACAO',
  '5_ACEITO',
  '6_CONTRATO_FORMALIZADO',
  '7_TAXA_COBRADA',
  '8_PAGAMENTO_CONFIRMADO',
  '9_DADOS_LIBERADOS',
  '10_EM_COLETA',
  '11_EM_TRANSPORTE',
  '12_ENTREGUE',
  '13_COMPROVANTE_ENVIADO',
  '14_CONCLUIDO',
  '15_AVALIADO',
];

export const CONTRACT_STAGE_LABELS: Record<ContractStage, string> = {
  '1_PUBLICADO': '01. Frete Publicado',
  '2_DESCOBERTO': '02. Descoberta da Oportunidade',
  '3_PROPOSTA_ENVIADA': '03. Proposta Enviada',
  '4_EM_NEGOCIACAO': '04. Em Negociação',
  '5_ACEITO': '05. Proposta Aceita',
  '6_CONTRATO_FORMALIZADO': '06. Contrato Formalizado',
  '7_TAXA_COBRADA': '07. Taxa de Serviço Emitida',
  '8_PAGAMENTO_CONFIRMADO': '08. Pagamento Confirmado',
  '9_DADOS_LIBERADOS': '09. Dados Autorizados Liberados',
  '10_EM_COLETA': '10. Em Coleta',
  '11_EM_TRANSPORTE': '11. Em Transporte',
  '12_ENTREGUE': '12. Carga Entregue',
  '13_COMPROVANTE_ENVIADO': '13. Comprovante Anexado',
  '14_CONCLUIDO': '14. Contrato Concluído',
  '15_AVALIADO': '15. Operação Avaliada',
  CANCELADO: 'Cancelado',
};

/**
 * 1. NEXPOINT — Controle de 3 utilizações gratuitas por ciclo de 24h (America/Sao_Paulo)
 */
export interface NexPointInput {
  hasActiveSubscription: boolean;
  usageTimestampsMs: number[];
  serverNowMs: number;
  dailyFreeLimit?: number;
}

export interface NexPointEvaluation {
  allowed: boolean;
  isSubscriberExempt: boolean;
  usedInCurrentCycle: number;
  remainingFreeUses: number;
  dailyLimit: number;
  cycleResetIsoSp: string;
  reason?: string;
}

export function getSaoPauloDateKey(timestampMs: number): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(timestampMs));
}

export function evaluateNexPointQuota(input: NexPointInput): NexPointEvaluation {
  const limit = input.dailyFreeLimit ?? 3;
  const currentCycleWindowMs = 24 * 60 * 60 * 1000;
  const windowStartMs = input.serverNowMs - currentCycleWindowMs;
  const currentSpDay = getSaoPauloDateKey(input.serverNowMs);

  // Filtra utilizações nas últimas 24h dentro do ciclo diário de São Paulo
  const validUsages = input.usageTimestampsMs.filter(
    (ts) => ts >= windowStartMs && ts <= input.serverNowMs && getSaoPauloDateKey(ts) === currentSpDay
  );

  const usedCount = validUsages.length;

  if (input.hasActiveSubscription) {
    return {
      allowed: true,
      isSubscriberExempt: true,
      usedInCurrentCycle: usedCount,
      remainingFreeUses: limit,
      dailyLimit: limit,
      cycleResetIsoSp: `${currentSpDay}T23:59:59-03:00`,
    };
  }

  const remaining = Math.max(0, limit - usedCount);
  const allowed = remaining > 0;

  return {
    allowed,
    isSubscriberExempt: false,
    usedInCurrentCycle: usedCount,
    remainingFreeUses: remaining,
    dailyLimit: limit,
    cycleResetIsoSp: `${currentSpDay}T23:59:59-03:00`,
    reason: allowed
      ? undefined
      : `Limite gratuito do NexPoint atingido (${limit}/${limit} utilizações no ciclo de 24h em America/Sao_Paulo). Assine um plano para acesso contínuo.`,
  };
}

/**
 * 2. CHAT & NEGOCIAÇÃO — Proteção de Dados Sensíveis Pré-Pagamento no Servidor
 */
export interface SensitiveFreightDetails {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  fullPickupAddress: string;
  fullDeliveryAddress: string;
  contactPhone: string;
  contactEmail: string;
  companyCnpj: string;
  fiscalDocumentUrl: string;
}

export interface SanitizedFreightDetails {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  fullPickupAddress: string;
  fullDeliveryAddress: string;
  contactPhone: string;
  contactEmail: string;
  companyCnpj: string;
  fiscalDocumentUrl: string | null;
  sensitiveDataLocked: boolean;
}

export function sanitizeSensitiveFreightData(
  data: SensitiveFreightDetails,
  feePaymentConfirmedOnServer: boolean
): SanitizedFreightDetails {
  if (feePaymentConfirmedOnServer) {
    return {
      ...data,
      sensitiveDataLocked: false,
    };
  }

  return {
    originCity: data.originCity,
    originState: data.originState,
    destinationCity: data.destinationCity,
    destinationState: data.destinationState,
    fullPickupAddress: `${data.originCity} - ${data.originState} (Endereço exato liberado após confirmação da taxa)`,
    fullDeliveryAddress: `${data.destinationCity} - ${data.destinationState} (Endereço exato liberado após confirmação da taxa)`,
    contactPhone: '••• Bloqueado até confirmação da taxa •••',
    contactEmail: '••• Bloqueado até confirmação da taxa •••',
    companyCnpj: '••.•••.•••/••••-•• (Protegido)',
    fiscalDocumentUrl: null,
    sensitiveDataLocked: true,
  };
}

export function sanitizeChatMessageText(
  message: string,
  feePaymentConfirmedOnServer: boolean
): { sanitizedText: string; wasRedacted: boolean } {
  if (feePaymentConfirmedOnServer) {
    return { sanitizedText: message.trim(), wasRedacted: false };
  }

  let redacted = false;
  let text = message.trim();

  // Bloqueia telefones brasileiros, sequências longas de dígitos, e-mails, chaves PIX/links e endereços explícitos
  const phoneRegex = /(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s.]?\d{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[^\s]+)/gi;
  const addressHintRegex = /\b(rua|avenida|av\.|rodovia\s+km|cep\s*\d{5}-?\d{3}|n[º°]\s*\d+)\b/gi;

  if (phoneRegex.test(text)) {
    redacted = true;
    text = text.replace(phoneRegex, '[TELEFONE PROTEGIDO PRÉ-TAXA]');
  }
  if (emailRegex.test(text)) {
    redacted = true;
    text = text.replace(emailRegex, '[E-MAIL PROTEGIDO PRÉ-TAXA]');
  }
  if (urlRegex.test(text)) {
    redacted = true;
    text = text.replace(urlRegex, '[LINK EXTERNO PROTEGIDO]');
  }
  if (addressHintRegex.test(text)) {
    redacted = true;
    text = text.replace(addressHintRegex, '[ENDEREÇO PROTEGIDO PRÉ-TAXA]');
  }

  return { sanitizedText: text, wasRedacted: redacted };
}

/**
 * 3. CONTRATOS — Máquina de Estados de 15 Etapas com Validação de Pagamento
 */
export function validateContractTransition(params: {
  currentStage: ContractStage;
  targetStage: ContractStage;
  feePaymentConfirmed: boolean;
  actorRole: UserRole;
}): { valid: boolean; error?: string } {
  const { currentStage, targetStage, feePaymentConfirmed } = params;

  if (currentStage === 'CANCELADO') {
    return { valid: false, error: 'Contratos cancelados não podem sofrer novas transições operacionais.' };
  }

  if (currentStage === '15_AVALIADO') {
    return { valid: false, error: 'O contrato já foi concluído e avaliado em definitivo.' };
  }

  if (targetStage === 'CANCELADO') {
    const currentIndex = CONTRACT_STAGES_ORDER.indexOf(currentStage);
    const transportIndex = CONTRACT_STAGES_ORDER.indexOf('11_EM_TRANSPORTE');
    if (currentIndex >= transportIndex) {
      return {
        valid: false,
        error: 'Não é permitido cancelar diretamente um contrato com carga já em transporte sem mediação administrativa.',
      };
    }
    return { valid: true };
  }

  const currentIdx = CONTRACT_STAGES_ORDER.indexOf(currentStage);
  const targetIdx = CONTRACT_STAGES_ORDER.indexOf(targetStage);

  if (currentIdx === -1 || targetIdx === -1) {
    return { valid: false, error: 'Estado contratual inválido.' };
  }

  if (targetIdx !== currentIdx + 1) {
    return {
      valid: false,
      error: `Transição inválida: não é permitido pular de "${CONTRACT_STAGE_LABELS[currentStage]}" diretamente para "${CONTRACT_STAGE_LABELS[targetStage]}".`,
    };
  }

  // Etapas >= 9 (Liberação de dados, Coleta, Transporte, Entrega, Conclusão) exigem confirmação da taxa no backend
  const unlockedIdx = CONTRACT_STAGES_ORDER.indexOf('9_DADOS_LIBERADOS');
  if (targetIdx >= unlockedIdx && !feePaymentConfirmed) {
    return {
      valid: false,
      error: 'A liberação de dados e o início da coleta exigem a confirmação prévia do pagamento da taxa de serviço no backend.',
    };
  }

  return { valid: true };
}

/**
 * 4. NEXCOLETA — Validação de Agrupamento Regional de Cargas (Manhuaçu-MG e Região)
 */
export interface RegionalPickupRequest {
  id: string;
  originCity: string;
  destinationCity: string;
  pickupDate: string; // YYYY-MM-DD
  pickupWindow: 'MANHA' | 'TARDE' | 'INTEGRAL';
  weightKg: number;
  volumeM3: number;
  cargoType: 'CAFE_SACARIA' | 'ALIMENTOS_SECOS' | 'REFRIGERADO' | 'QUIMICO_PERIGOSO' | 'GERAL';
}

export interface GroupingValidationResult {
  compatible: boolean;
  totalWeightKg: number;
  totalVolumeM3: number;
  capacityUtilizationPercent: number;
  reasons: string[];
}

export function validateNexColetaGrouping(
  requests: RegionalPickupRequest[],
  vehicleMaxWeightKg: number,
  vehicleMaxVolumeM3: number
): GroupingValidationResult {
  const reasons: string[] = [];

  if (requests.length < 2) {
    return {
      compatible: false,
      totalWeightKg: requests[0]?.weightKg ?? 0,
      totalVolumeM3: requests[0]?.volumeM3 ?? 0,
      capacityUtilizationPercent: 0,
      reasons: ['Selecione ao menos 2 solicitações de coleta para formar um agrupamento.'],
    };
  }

  const totalWeightKg = requests.reduce((acc, r) => acc + r.weightKg, 0);
  const totalVolumeM3 = requests.reduce((acc, r) => acc + r.volumeM3, 0);

  if (totalWeightKg > vehicleMaxWeightKg) {
    reasons.push(
      `Peso total (${totalWeightKg} kg) excede a capacidade máxima do veículo selecionado (${vehicleMaxWeightKg} kg).`
    );
  }

  if (totalVolumeM3 > vehicleMaxVolumeM3) {
    reasons.push(
      `Volume total (${totalVolumeM3} m³) excede a cubagem máxima do veículo selecionado (${vehicleMaxVolumeM3} m³).`
    );
  }

  // Verificar mesma data de coleta
  const dates = new Set(requests.map((r) => r.pickupDate));
  if (dates.size > 1) {
    reasons.push('As coletas possuem datas incompatíveis para o mesmo roteiro regional.');
  }

  // Verificar janela de horário (MANHA e TARDE só agrupam se houver janela INTEGRAL ou mesmo turno)
  const hasMorning = requests.some((r) => r.pickupWindow === 'MANHA');
  const hasAfternoon = requests.some((r) => r.pickupWindow === 'TARDE');
  if (hasMorning && hasAfternoon) {
    reasons.push('Conflito de janela operacional: coletas exclusivas da manhã e exclusivas da tarde não podem ser agrupadas no mesmo embarque imediato.');
  }

  // Verificar compatibilidade sanitária/química de carga
  const cargoTypes = new Set(requests.map((r) => r.cargoType));
  if (cargoTypes.has('QUIMICO_PERIGOSO') && cargoTypes.size > 1) {
    reasons.push('Incompatibilidade ANTT: cargas químicas/perigosas não podem ser agrupadas com alimentos, café ou carga geral.');
  }
  if (cargoTypes.has('REFRIGERADO') && cargoTypes.size > 1) {
    reasons.push('Incompatibilidade térmica: cargas refrigeradas exigem controle de temperatura exclusivo.');
  }

  const weightRatio = vehicleMaxWeightKg > 0 ? (totalWeightKg / vehicleMaxWeightKg) * 100 : 100;
  const volumeRatio = vehicleMaxVolumeM3 > 0 ? (totalVolumeM3 / vehicleMaxVolumeM3) * 100 : 100;
  const capacityUtilizationPercent = Math.round(Math.max(weightRatio, volumeRatio));

  return {
    compatible: reasons.length === 0,
    totalWeightKg,
    totalVolumeM3,
    capacityUtilizationPercent,
    reasons,
  };
}

/**
 * 5. PROGRAMA DE AFILIADOS — Cálculo de Comissões e Antifraude no Servidor
 */
export interface AffiliateCommissionEvaluationInput {
  affiliateUserId: string;
  affiliateDocumentCpfCnpj: string;
  affiliateEmail: string;
  referredUserId: string;
  referredDocumentCpfCnpj: string;
  referredEmail: string;
  referralCreatedAtMs: number;
  eventTimestampMs: number;
  attributionWindowDays: number;
  eventType: 'SIGNUP_ONLY' | 'FIRST_PAID_SUBSCRIPTION' | 'COMPLETED_PAID_CONTRACT_FEE';
  baseAmountBrl: number; // Valor da 1ª assinatura paga OU valor da taxa de manutenção recebida pela NexCarga
  firstSubscriptionCommissionRatePercent: number;
  contractFeeCommissionRatePercent: number;
  alreadyPaidFirstSubscriptionCommission?: boolean;
}

export interface AffiliateCommissionResult {
  eligible: boolean;
  fraudBlocked: boolean;
  commissionAmountBrl: number;
  appliedRatePercent: number;
  reason: string;
}

export function evaluateAffiliateCommission(
  input: AffiliateCommissionEvaluationInput
): AffiliateCommissionResult {
  // 1. Prevenção de autoindicação e fraude
  const cleanAffDoc = input.affiliateDocumentCpfCnpj.replace(/\D/g, '');
  const cleanRefDoc = input.referredDocumentCpfCnpj.replace(/\D/g, '');

  if (
    input.affiliateUserId === input.referredUserId ||
    (cleanAffDoc && cleanAffDoc === cleanRefDoc) ||
    input.affiliateEmail.trim().toLowerCase() === input.referredEmail.trim().toLowerCase()
  ) {
    return {
      eligible: false,
      fraudBlocked: true,
      commissionAmountBrl: 0,
      appliedRatePercent: 0,
      reason: 'Bloqueio antifraude: autoindicação detectada (mesmo titular, CPF/CNPJ ou e-mail).',
    };
  }

  // 2. Validação do prazo de atribuição
  const maxWindowMs = input.attributionWindowDays * 24 * 60 * 60 * 1000;
  if (input.eventTimestampMs - input.referralCreatedAtMs > maxWindowMs) {
    return {
      eligible: false,
      fraudBlocked: false,
      commissionAmountBrl: 0,
      appliedRatePercent: 0,
      reason: `Prazo de atribuição da indicação expirado (${input.attributionWindowDays} dias).`,
    };
  }

  // 3. Nunca liberar comissão apenas pelo cadastro ou clique
  if (input.eventType === 'SIGNUP_ONLY' || input.baseAmountBrl <= 0) {
    return {
      eligible: false,
      fraudBlocked: false,
      commissionAmountBrl: 0,
      appliedRatePercent: 0,
      reason: 'Cadastros, cliques ou testes gratuitos sem pagamento confirmado não geram comissão.',
    };
  }

  // 4. Modalidade 1: Primeira assinatura paga
  if (input.eventType === 'FIRST_PAID_SUBSCRIPTION') {
    if (input.alreadyPaidFirstSubscriptionCommission) {
      return {
        eligible: false,
        fraudBlocked: true,
        commissionAmountBrl: 0,
        appliedRatePercent: 0,
        reason: 'Bloqueio de duplicidade: a comissão de primeira assinatura para este indicado já foi creditada.',
      };
    }

    const amount = Number(
      ((input.baseAmountBrl * input.firstSubscriptionCommissionRatePercent) / 100).toFixed(2)
    );
    return {
      eligible: true,
      fraudBlocked: false,
      commissionAmountBrl: amount,
      appliedRatePercent: input.firstSubscriptionCommissionRatePercent,
      reason: 'Comissão aprovada sobre a primeira assinatura paga do cliente indicado.',
    };
  }

  // 5. Modalidade 2: Taxa de manutenção efetivamente recebida em contrato elegível, concluído e pago
  const amount = Number(
    ((input.baseAmountBrl * input.contractFeeCommissionRatePercent) / 100).toFixed(2)
  );
  return {
    eligible: true,
    fraudBlocked: false,
    commissionAmountBrl: amount,
    appliedRatePercent: input.contractFeeCommissionRatePercent,
    reason: 'Comissão aprovada sobre a taxa de manutenção efetivamente recebida em contrato concluído e pago.',
  };
}

/**
 * 6. NEXFINANCE — Livro-Razão Imutável e Lançamentos Compensatórios
 */
export interface LedgerEntry {
  id: string;
  idempotencyKey: string;
  type: 'ASSINATURA' | 'TAXA_CONTRATO' | 'COMISSAO_AFILIADO' | 'SAQUE' | 'ESTORNO_COMPENSATORIO';
  direction: 'CREDIT' | 'DEBIT';
  amountBrl: number;
  referenceId: string;
  description: string;
  createdAtIso: string;
  compensatesEntryId?: string;
}

export function createCompensatoryLedgerEntry(
  originalEntry: LedgerEntry,
  reason: string,
  nowIso: string
): LedgerEntry {
  if (!reason || reason.trim().length < 5) {
    throw new Error('Justificativa obrigatória para lançamento compensatório no NexFinance.');
  }

  return {
    id: `led-comp-${originalEntry.id}-${Date.now()}`,
    idempotencyKey: `comp:${originalEntry.idempotencyKey}`,
    type: 'ESTORNO_COMPENSATORIO',
    direction: originalEntry.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
    amountBrl: originalEntry.amountBrl,
    referenceId: originalEntry.referenceId,
    description: `Estorno compensatório ref. ${originalEntry.id}: ${reason.trim()}`,
    createdAtIso: nowIso,
    compensatesEntryId: originalEntry.id,
  };
}
