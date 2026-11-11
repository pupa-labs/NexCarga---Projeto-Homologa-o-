# Documentação da API REST — NexCarga Backend (`server.ts`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status do servidor e timezone `America/Sao_Paulo`. |
| `GET` | `/api/catalog` | Retorna os 13 veículos e 17 implementos brasileiros oficiais. |
| `GET` | `/api/bootstrap` | Estado consolidado da operação com fretes sanitizados conforme status de pagamento da taxa. |
| `POST` | `/api/freights` | Publicação de novo frete com proteção de endereço/telefone no servidor. |
| `POST` | `/api/nexpoint/consume` | Valida e contabiliza 1 uso no ciclo de 24h do NexPoint (`America/Sao_Paulo`). |
| `POST` | `/api/chat/messages` | Envia mensagem na negociação com filtro automático anti-vazamento pré-pagamento. |
| `POST` | `/api/contracts/:id/confirm-fee` | Confirma pagamento da taxa no servidor, lança no livro-razão e libera dados autorizados. |
| `POST` | `/api/contracts/:id/advance` | Avança o contrato na máquina de estados de 15 etapas com validação. |
| `POST` | `/api/nexcoleta/request` | Registra nova solicitação de coleta regional em Manhuaçu-MG e região. |
| `POST` | `/api/nexcoleta/validate-group` | Valida compatibilidade de agrupamento (peso, volume, data, janela e tipo de carga). |
| `POST` | `/api/finance/compensate` | Cria lançamento compensatório auditável no livro-razão sem apagar histórico. |
| `POST` | `/api/affiliates/evaluate-commission` | Calcula elegibilidade de comissão (1ª assinatura ou taxa de contrato) e bloqueia autoindicação. |
| `POST` | `/api/admin/assisted-session/start` | Inicia sessão de Acesso Assistido com justificativa obrigatória e expiração de 30 min. |
| `POST` | `/api/admin/assisted-session/end` | Encerra explicitamente a sessão de Acesso Assistido. |
| `PUT` | `/api/admin/settings` | Atualiza parâmetros operacionais e comerciais no NexCarga Control. |
| `POST` | `/api/nexia/chat` | Assistente inteligente NexIA via `@google/genai` (`gemini-3.8-flash`) no servidor. |
