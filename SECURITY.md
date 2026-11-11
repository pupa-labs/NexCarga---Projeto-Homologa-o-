# Segurança, Privacidade e Confiabilidade — NexCarga

## Diretrizes Implementadas

1. **Segredo de Chaves no Servidor**: A `GEMINI_API_KEY` e credenciais administrativas (`SUPABASE_SERVICE_ROLE_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`) permanecem exclusivamente no servidor (`server.ts`). O SDK `@google/genai` não é importado no frontend.
2. **Proteção de Dados Sensíveis Pré-Pagamento (Seção 6.6)**:
   - Enquanto `feePaymentConfirmed === false` no servidor, a função `sanitizeSensitiveFreightData` omite o endereço completo de coleta/entrega, telefone privado, e-mail, CNPJ e URL de documento fiscal.
   - A função `sanitizeChatMessageText` intercepta e mascara números de telefone, e-mails, links externos e endereços explícitos enviados no chat antes da confirmação da taxa.
3. **Controle Autoritativo do NexPoint (Seção 6.4)**:
   - O limite de 3 utilizações gratuitas por ciclo de 24h utiliza exclusivamente o relógio do servidor no timezone `America/Sao_Paulo`, sem confiar em flags do cliente.
4. **Imutabilidade Contábil do NexFinance (Seção 8)**:
   - Movimentações financeiras em `financial_ledger` são append-only e possuem chave de idempotência (`idempotency_key`). Estornos são realizados por lançamentos compensatórios (`ESTORNO_COMPENSATORIO`) com justificativa obrigatória.
5. **Acesso Administrativo Assistido Auditado (Seção 5.1)**:
   - Exige justificativa obrigatória ($\ge 10$ caracteres), expiração automática, registro de auditoria e exibe banner fixo em destaque no topo da tela com encerramento explícito.
