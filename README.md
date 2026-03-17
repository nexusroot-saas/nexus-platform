# Nexus Platform

Plataforma SaaS de Gestão em Saúde & Compliance — Monorepo

## Stack

| Camada    | Tecnologia                                |
| --------- | ----------------------------------------- |
| Backend   | Node.js 20 + Express 4                    |
| Banco     | PostgreSQL 16 via Supabase (RLS nativo)   |
| Auth      | JWT (15min) + Refresh Token rotativo (7d) |
| Segurança | JWT → RBAC → RLS (3 camadas)              |
| Frontend  | React 18 + Vite _(em breve)_              |
| Infra     | Render (API) + Vercel (Web)               |

## Estrutura

```
nexus-platform/
├── apps/
│   ├── api-server/          # Express — API REST
│   └── web-portal/          # React + Vite (em breve)
├── packages/
│   ├── database/            # Migrations, seeds e testes de RLS
│   ├── legal-core/          # Motor LGPD (em breve)
│   ├── ui-kit/              # Design system (em breve)
│   └── shared-types/        # TypeScript types (em breve)
├── supabase/
│   └── migrations/          # SQL versionado
├── docker-compose.yml       # PostgreSQL + Redis local
└── .github/workflows/ci.yml # CI: lint + test + RLS
```

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Subir banco local

```bash
docker compose up -d
# PostgreSQL estará disponível em localhost:5432
# migrations e seed são aplicados automaticamente
```

### 4. Rodar o servidor

```bash
npm run dev:api
# http://localhost:3001
```

## Rotas disponíveis

| Método | Rota                   | Auth                      | Descrição                   |
| ------ | ---------------------- | ------------------------- | --------------------------- |
| GET    | `/health/live`         | Pública                   | Liveness check              |
| GET    | `/health/ready`        | Pública                   | Readiness check             |
| POST   | `/api/v1/auth/login`   | Pública                   | Login → JWT + refresh token |
| POST   | `/api/v1/auth/refresh` | Pública                   | Renova access token         |
| POST   | `/api/v1/auth/logout`  | Pública                   | Invalida refresh token      |
| GET    | `/api/v1/patients`     | JWT + patients:read       | Lista pacientes do tenant   |
| POST   | `/api/v1/patients`     | JWT + patients:create     | Cria paciente               |
| GET    | `/api/v1/appointments` | JWT + appointments:read   | Lista agendamentos          |
| POST   | `/api/v1/appointments` | JWT + appointments:create | Cria agendamento            |

## Segurança — 3 camadas

```
Requisição
    │
    ▼
[1] authenticate    → valida JWT, injeta req.user
    │
    ▼
[2] authorize       → verifica role na matriz RBAC
    │
    ▼
[3] RLS (PostgreSQL) → SET app.current_company_id → filtra por tenant
```

> **Regra crítica:** Nunca conectar como `nexus` (owner) nas queries da
> aplicação. Sempre usar `nexus_app` (não-owner, sujeito ao RLS).

## Testes

```bash
# Todos os testes
npm run test

# Apenas middlewares (sem banco)
npm run test --workspace=apps/api-server

# Apenas RLS (requer PostgreSQL rodando)
npm run test --workspace=packages/database
```

## Próximas rotas (P1)

- `GET /api/v1/consents`
- `POST /api/v1/consents/send`
- `GET /api/v1/audit-logs`

## Credenciais de teste (seed)

| Tenant              | Email                | Senha    | Role         |
| ------------------- | -------------------- | -------- | ------------ |
| Clínica Saúde Total | admin@saudetotal.com | senha123 | TENANT_ADMIN |
| OdontoVita          | admin@odontovita.com | senha123 | TENANT_ADMIN |
