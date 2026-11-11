# Variáveis de Ambiente — NexCarga (`ENVIRONMENT.md`)

Consulte `.env.example` na raiz do projeto:

- `GEMINI_API_KEY`: Chave do Google Gemini utilizada exclusivamente pelo servidor (`server.ts`) no módulo **NexIA**.
- `APP_URL`: URL base da plataforma para geração de links de afiliados e callbacks.
- `TZ`: Timezone oficial de negócio (`America/Sao_Paulo`).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Credenciais para conexão com Supabase PostgreSQL, Auth e Storage privado.
- `VITE_GOOGLE_MAPS_API_KEY`: Chave opcional para renderização Google Maps Platform no NexRadar.
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`: Credenciais de backend para futura ativação de cobranças reais.
