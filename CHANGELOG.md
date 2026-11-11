# Changelog — NexCarga (PUPA LABS)

## [1.0.0] — Fundação Oficial Completa (Fases 0 a 8)
- **Design System Oficial**: Paleta `#FF8A00`, `#E85D04`, `#111111`, `#292929`, `#FFFFFF` e tipografia `Outfit` + `Plus Jakarta Sans` + `JetBrains Mono` (`tabular-nums`).
- **16 Telas Oficiais Implementadas**: Reprodução fiel das referências `01` a `16` em português brasileiro.
- **Regras de Negócio no Backend (`server.ts` & `src/domain/rules.ts`)**:
  - Catálogo com 13 tipos de veículos e 17 implementos brasileiros.
  - Controle do NexPoint (3 usos gratuitos por ciclo de 24h em `America/Sao_Paulo`).
  - Bloqueio pré-pagamento de endereço, telefone e documentos em fretes e no Chat de Negociação.
  - Máquina de estados de Contratos com 15 etapas auditáveis.
  - Motor de validação de agrupamento regional no NexColeta (Manhuaçu-MG e região).
  - Assistente NexIA integrado ao `@google/genai` no backend.
  - Livro-razão contábil imutável no NexFinance com suporte a lançamentos compensatórios.
  - Motor de comissões e antifraude de afiliados + Acesso Administrativo Assistido com banner e auditoria.
