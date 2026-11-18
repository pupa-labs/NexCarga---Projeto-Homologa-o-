import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COMMERCIAL_RATES,
  roundCurrencyBrl,
  validatePercentageParam,
  calculateContractMaintenanceFee,
  updateCommercialRatesConfig,
  evaluateNexPointQuota,
  sanitizeSensitiveFreightData,
  sanitizeChatMessageText,
  validateContractTransition,
  validateNexColetaGrouping,
  evaluateAffiliateCommission,
  createCompensatoryLedgerEntry,
} from './rules';
import { BRAZILIAN_VEHICLE_CATALOG, BRAZILIAN_IMPLEMENT_CATALOG } from './catalog';

test('Catálogo oficial contém os 13 tipos de veículos e 17 implementos brasileiros', () => {
  assert.equal(BRAZILIAN_VEHICLE_CATALOG.length, 13);
  assert.equal(BRAZILIAN_IMPLEMENT_CATALOG.length, 17);
});

test('NexPoint: limita usuários gratuitos a 3 usos por ciclo de 24h em America/Sao_Paulo e isenta assinantes', () => {
  const now = new Date('2026-11-11T14:00:00-03:00').getTime();
  const usages = [
    new Date('2026-11-11T09:00:00-03:00').getTime(),
    new Date('2026-11-11T10:30:00-03:00').getTime(),
  ];

  const eval2Uses = evaluateNexPointQuota({
    hasActiveSubscription: false,
    usageTimestampsMs: usages,
    serverNowMs: now,
    dailyFreeLimit: 3,
  });
  assert.equal(eval2Uses.allowed, true);
  assert.equal(eval2Uses.remainingFreeUses, 1);

  const eval3Uses = evaluateNexPointQuota({
    hasActiveSubscription: false,
    usageTimestampsMs: [...usages, new Date('2026-11-11T11:45:00-03:00').getTime()],
    serverNowMs: now,
    dailyFreeLimit: 3,
  });
  assert.equal(eval3Uses.allowed, false);
  assert.equal(eval3Uses.remainingFreeUses, 0);

  // Assinante ativo não fica sujeito ao bloqueio gratuito
  const evalSubscriber = evaluateNexPointQuota({
    hasActiveSubscription: true,
    usageTimestampsMs: [...usages, new Date('2026-11-11T11:45:00-03:00').getTime()],
    serverNowMs: now,
    dailyFreeLimit: 3,
  });
  assert.equal(evalSubscriber.allowed, true);
  assert.equal(evalSubscriber.isSubscriberExempt, true);
});

test('Chat e Negociação: oculta endereço completo, telefone e documentos antes do pagamento da taxa no servidor', () => {
  const rawFreight = {
    originCity: 'Manhuaçu',
    originState: 'MG',
    destinationCity: 'Vitória',
    destinationState: 'ES',
    fullPickupAddress: 'Rodovia BR-262, Km 38, Armazém Café Real, Manhuaçu - MG',
    fullDeliveryAddress: 'Av. Portuária, 1400, Galpão 4, Vitória - ES',
    contactPhone: '(33) 99812-3456',
    contactEmail: 'logistica@cafereal.com.br',
    companyCnpj: '12.345.678/0001-90',
    fiscalDocumentUrl: '/api/documents/nf-9912',
  };

  const locked = sanitizeSensitiveFreightData(rawFreight, false);
  assert.equal(locked.sensitiveDataLocked, true);
  assert.ok(!locked.fullPickupAddress.includes('Armazém Café Real'));
  assert.ok(!locked.contactPhone.includes('99812'));
  assert.equal(locked.fiscalDocumentUrl, null);

  const unlocked = sanitizeSensitiveFreightData(rawFreight, true);
  assert.equal(unlocked.sensitiveDataLocked, false);
  assert.equal(unlocked.contactPhone, '(33) 99812-3456');
  assert.equal(unlocked.fiscalDocumentUrl, '/api/documents/nf-9912');

  const chatPrePay = sanitizeChatMessageText('Me chama no (33) 99888-7766 na Rua das Flores 120', false);
  assert.equal(chatPrePay.wasRedacted, true);
  assert.ok(!chatPrePay.sanitizedText.includes('99888-7766'));
});

test('Contratos: bloqueia avanço para coleta sem confirmação de pagamento da taxa de serviço', () => {
  const invalidSkip = validateContractTransition({
    currentStage: '6_CONTRATO_FORMALIZADO',
    targetStage: '9_DADOS_LIBERADOS',
    feePaymentConfirmed: false,
    actorRole: 'COMPANY',
  });
  assert.equal(invalidSkip.valid, false);

  const blockedUnpaid = validateContractTransition({
    currentStage: '8_PAGAMENTO_CONFIRMADO',
    targetStage: '9_DADOS_LIBERADOS',
    feePaymentConfirmed: false,
    actorRole: 'ADMIN',
  });
  assert.equal(blockedUnpaid.valid, false);

  const allowedPaid = validateContractTransition({
    currentStage: '8_PAGAMENTO_CONFIRMADO',
    targetStage: '9_DADOS_LIBERADOS',
    feePaymentConfirmed: true,
    actorRole: 'ADMIN',
  });
  assert.equal(allowedPaid.valid, true);
});

test('NexColeta: valida capacidade, janela e compatibilidade sanitária no agrupamento regional', () => {
  const compatibleGroup = validateNexColetaGrouping(
    [
      {
        id: 'col-1',
        originCity: 'Manhuaçu - MG',
        destinationCity: 'Reduto - MG',
        pickupDate: '2026-11-15',
        pickupWindow: 'MANHA',
        weightKg: 1800,
        volumeM3: 8,
        cargoType: 'CAFE_SACARIA',
      },
      {
        id: 'col-2',
        originCity: 'Manhuaçu - MG',
        destinationCity: 'Ipanema - MG',
        pickupDate: '2026-11-15',
        pickupWindow: 'MANHA',
        weightKg: 1200,
        volumeM3: 6,
        cargoType: 'ALIMENTOS_SECOS',
      },
    ],
    4000,
    26
  );
  assert.equal(compatibleGroup.compatible, true);
  assert.equal(compatibleGroup.totalWeightKg, 3000);

  const incompatibleChemical = validateNexColetaGrouping(
    [
      {
        id: 'col-1',
        originCity: 'Manhuaçu - MG',
        destinationCity: 'Mutum - MG',
        pickupDate: '2026-11-15',
        pickupWindow: 'MANHA',
        weightKg: 1000,
        volumeM3: 5,
        cargoType: 'CAFE_SACARIA',
      },
      {
        id: 'col-3',
        originCity: 'Manhuaçu - MG',
        destinationCity: 'Mutum - MG',
        pickupDate: '2026-11-15',
        pickupWindow: 'MANHA',
        weightKg: 500,
        volumeM3: 3,
        cargoType: 'QUIMICO_PERIGOSO',
      },
    ],
    4000,
    26
  );
  assert.equal(incompatibleChemical.compatible, false);
});

test('Regras comerciais oficiais: frete de R$ 10.000,00 com taxa de 3,5% resulta em R$ 350,00 e comissão de 1,75% sobre R$ 350,00 resulta em R$ 6,13', () => {
  assert.equal(DEFAULT_COMMERCIAL_RATES.contractMaintenanceFeePercent, 3.5);
  assert.equal(DEFAULT_COMMERCIAL_RATES.affiliateContractFeeCommissionPercent, 1.75);
  assert.equal(DEFAULT_COMMERCIAL_RATES.affiliateFirstSubscriptionCommissionPercent, 25);
  assert.equal(DEFAULT_COMMERCIAL_RATES.affiliateNexIASubscriptionCommissionPercent, 25);

  // 1. Frete de R$ 10.000,00 com taxa de 3,5% resulta em R$ 350,00
  const feeCalc = calculateContractMaintenanceFee(10000.0, 3.5);
  assert.equal(feeCalc.freightPrincipalValueBrl, 10000.0);
  assert.equal(feeCalc.feePercent, 3.5);
  assert.equal(feeCalc.maintenanceFeeBrl, 350.0);

  // 2. Comissão de 1,75% sobre R$ 350,00 (R$ 6,125) arredondada monetariamente para R$ 6,13
  assert.equal((350 * 1.75) / 100, 6.125);
  assert.equal(roundCurrencyBrl((350 * 1.75) / 100), 6.13);

  const contractFeeCommission = evaluateAffiliateCommission({
    affiliateUserId: 'usr-1',
    affiliateDocumentCpfCnpj: '111.222.333-44',
    affiliateEmail: 'joao@afiliado.com.br',
    referredUserId: 'usr-9',
    referredDocumentCpfCnpj: '99.888.777/0001-66',
    referredEmail: 'contato@transportexyz.com.br',
    referralCreatedAtMs: 1000,
    eventTimestampMs: 2000,
    attributionWindowDays: 30,
    eventType: 'COMPLETED_PAID_CONTRACT_FEE',
    baseAmountBrl: feeCalc.maintenanceFeeBrl, // R$ 350,00 (taxa recebida pela NexCarga, nunca o frete principal)
    firstSubscriptionCommissionRatePercent: 25,
    contractFeeCommissionRatePercent: 1.75,
  });
  assert.equal(contractFeeCommission.eligible, true);
  assert.equal(contractFeeCommission.appliedRatePercent, 1.75);
  assert.equal(contractFeeCommission.commissionAmountBrl, 6.13);
});

test('Regras comerciais oficiais: assinatura de R$ 79,90 com comissão de 25% resulta em R$ 19,98 (sem erro de ponto flutuante)', () => {
  const subCommission = evaluateAffiliateCommission({
    affiliateUserId: 'usr-1',
    affiliateDocumentCpfCnpj: '111.222.333-44',
    affiliateEmail: 'joao@afiliado.com.br',
    referredUserId: 'usr-9',
    referredDocumentCpfCnpj: '99.888.777/0001-66',
    referredEmail: 'contato@transportexyz.com.br',
    referralCreatedAtMs: 1000,
    eventTimestampMs: 2000,
    attributionWindowDays: 30,
    eventType: 'FIRST_PAID_SUBSCRIPTION',
    subscriptionPlanType: 'STANDARD',
    baseAmountBrl: 79.9,
    firstSubscriptionCommissionRatePercent: 25,
    nexiaSubscriptionCommissionRatePercent: 25,
    contractFeeCommissionRatePercent: 1.75,
  });
  assert.equal(subCommission.eligible, true);
  assert.equal(subCommission.appliedRatePercent, 25);
  assert.equal(subCommission.commissionAmountBrl, 19.98);
});

test('Validação e isolamento de parâmetros comerciais: rejeita percentuais inválidos e preserva independência entre taxas e valor do frete', () => {
  // 1. Valores percentuais inválidos são rejeitados (< 0, > 100, NaN, Infinity, tipos inválidos)
  for (const invalidVal of [-0.01, -10, 100.01, 250, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '3.5' as any, null as any]) {
    const check = validatePercentageParam(invalidVal, 'taxaTeste');
    assert.equal(check.valid, false);

    assert.throws(() => {
      calculateContractMaintenanceFee(10000, invalidVal);
    });

    assert.throws(() => {
      updateCommercialRatesConfig(DEFAULT_COMMERCIAL_RATES, {
        contractMaintenanceFeePercent: invalidVal,
      });
    });

    const invalidCommissionEval = evaluateAffiliateCommission({
      affiliateUserId: 'usr-1',
      affiliateDocumentCpfCnpj: '111.222.333-44',
      affiliateEmail: 'joao@afiliado.com.br',
      referredUserId: 'usr-9',
      referredDocumentCpfCnpj: '99.888.777/0001-66',
      referredEmail: 'contato@transportexyz.com.br',
      referralCreatedAtMs: 1000,
      eventTimestampMs: 2000,
      attributionWindowDays: 30,
      eventType: 'COMPLETED_PAID_CONTRACT_FEE',
      baseAmountBrl: 350,
      firstSubscriptionCommissionRatePercent: 25,
      contractFeeCommissionRatePercent: invalidVal,
    });
    assert.equal(invalidCommissionEval.eligible, false);
    assert.equal(invalidCommissionEval.commissionAmountBrl, 0);
  }

  // 2. Alterar a comissão sobre a taxa de frete NÃO altera a comissão de assinatura (Standard ou NexIA)
  const updatedAfterContractCommChange = updateCommercialRatesConfig(DEFAULT_COMMERCIAL_RATES, {
    affiliateContractFeeCommissionPercent: 2.5,
  });
  assert.equal(updatedAfterContractCommChange.affiliateContractFeeCommissionPercent, 2.5);
  assert.equal(
    updatedAfterContractCommChange.affiliateFirstSubscriptionCommissionPercent,
    DEFAULT_COMMERCIAL_RATES.affiliateFirstSubscriptionCommissionPercent
  );
  assert.equal(
    updatedAfterContractCommChange.affiliateNexIASubscriptionCommissionPercent,
    DEFAULT_COMMERCIAL_RATES.affiliateNexIASubscriptionCommissionPercent
  );
  assert.equal(
    updatedAfterContractCommChange.contractMaintenanceFeePercent,
    DEFAULT_COMMERCIAL_RATES.contractMaintenanceFeePercent
  );

  // 3. Alterar a taxa de contrato NÃO altera o valor principal do frete
  const originalFreightPrincipal = 10000.0;
  const calcAt35 = calculateContractMaintenanceFee(originalFreightPrincipal, 3.5);
  const calcAt50 = calculateContractMaintenanceFee(originalFreightPrincipal, 5.0);
  assert.equal(calcAt35.freightPrincipalValueBrl, originalFreightPrincipal);
  assert.equal(calcAt50.freightPrincipalValueBrl, originalFreightPrincipal);
  assert.equal(calcAt35.maintenanceFeeBrl, 350.0);
  assert.equal(calcAt50.maintenanceFeeBrl, 500.0);
});

test('Afiliados e NexFinance: bloqueia autoindicação, não paga por cadastro simples e gera estorno compensatório', () => {
  const selfReferral = evaluateAffiliateCommission({
    affiliateUserId: 'usr-1',
    affiliateDocumentCpfCnpj: '111.222.333-44',
    affiliateEmail: 'joao@afiliado.com.br',
    referredUserId: 'usr-2',
    referredDocumentCpfCnpj: '11122233344',
    referredEmail: 'outro@empresa.com.br',
    referralCreatedAtMs: 1000,
    eventTimestampMs: 2000,
    attributionWindowDays: 30,
    eventType: 'FIRST_PAID_SUBSCRIPTION',
    baseAmountBrl: 164.7,
    firstSubscriptionCommissionRatePercent: 25,
    contractFeeCommissionRatePercent: 1.75,
  });
  assert.equal(selfReferral.eligible, false);
  assert.equal(selfReferral.fraudBlocked, true);

  const validFirstSub = evaluateAffiliateCommission({
    affiliateUserId: 'usr-1',
    affiliateDocumentCpfCnpj: '111.222.333-44',
    affiliateEmail: 'joao@afiliado.com.br',
    referredUserId: 'usr-9',
    referredDocumentCpfCnpj: '99.888.777/0001-66',
    referredEmail: 'contato@transportexyz.com.br',
    referralCreatedAtMs: 1000,
    eventTimestampMs: 2000,
    attributionWindowDays: 30,
    eventType: 'FIRST_PAID_SUBSCRIPTION',
    baseAmountBrl: 200,
    firstSubscriptionCommissionRatePercent: 25,
    contractFeeCommissionRatePercent: 1.75,
  });
  assert.equal(validFirstSub.eligible, true);
  assert.equal(validFirstSub.commissionAmountBrl, 50);

  const compEntry = createCompensatoryLedgerEntry(
    {
      id: 'led-101',
      idempotencyKey: 'pay:101',
      type: 'TAXA_CONTRATO',
      direction: 'CREDIT',
      amountBrl: 185,
      referenceId: 'NC-04581',
      description: 'Taxa de serviço contrato #NC-04581',
      createdAtIso: '2026-11-11T10:00:00Z',
    },
    'Ajuste contábil auditado por duplicidade de webhook',
    '2026-11-11T12:00:00Z'
  );
  assert.equal(compEntry.type, 'ESTORNO_COMPENSATORIO');
  assert.equal(compEntry.direction, 'DEBIT');
  assert.equal(compEntry.compensatesEntryId, 'led-101');
});

