import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
    firstSubscriptionCommissionRatePercent: 20,
    contractFeeCommissionRatePercent: 10,
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
    contractFeeCommissionRatePercent: 10,
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
