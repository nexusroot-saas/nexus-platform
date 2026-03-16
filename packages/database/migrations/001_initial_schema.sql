-- ═══════════════════════════════════════════════════════════════
-- Migration 001 — Schema inicial do Nexus Platform
-- Data: 2026-03-13
-- ═══════════════════════════════════════════════════════════════

-- ─── EXTENSOES ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── EMPRESAS (Tenants) ───────────────────────────────────────
CREATE TABLE public.companies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj            VARCHAR(18) NOT NULL UNIQUE,
  nome_fantasia   VARCHAR(200) NOT NULL,
  tenant_type     VARCHAR(20) NOT NULL CHECK (tenant_type IN ('MED','CLIN','ODONTO','LAB','IMG','LEGAL','ADM')),
  status          VARCHAR(20) NOT NULL DEFAULT 'TRIAL' CHECK (status IN ('TRIAL','ACTIVE','BLOCKED','CANCELLED')),
  config_branding JSONB       DEFAULT '{}'::jsonb,
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── USUARIOS ─────────────────────────────────────────────────
CREATE TABLE public.users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id),
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  role            VARCHAR(30) NOT NULL CHECK (role IN ('TENANT_ADMIN','MEDICO','RECEPCIONISTA','FINANCEIRO','DPO_EXTERNO')),
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','BLOCKED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (company_id, email)
);
CREATE INDEX idx_users_company ON users (company_id) WHERE deleted_at IS NULL;

-- ─── PACIENTES ────────────────────────────────────────────────
CREATE TABLE public.patients (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id),
  full_name       VARCHAR(200) NOT NULL,
  cpf             VARCHAR(14),
  phone           VARCHAR(20),
  email           VARCHAR(255),
  birth_date      DATE,
  dynamic_data    JSONB        DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_patients_tenant ON patients (company_id, id) WHERE deleted_at IS NULL;

-- ─── AGENDAMENTOS ─────────────────────────────────────────────
CREATE TABLE public.appointments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id),
  patient_id      UUID        NOT NULL REFERENCES patients(id),
  professional_id UUID        NOT NULL REFERENCES users(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER      DEFAULT 30,
  status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_appointments_tenant_date ON appointments (company_id, scheduled_at) WHERE deleted_at IS NULL;

-- ─── CONSENTIMENTOS (NexusLegal) ──────────────────────────────
CREATE TABLE public.consents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        NOT NULL REFERENCES companies(id),
  patient_id       UUID        NOT NULL REFERENCES patients(id),
  term_version     VARCHAR(20) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SIGNED','REFUSED','EXPIRED','REVOKED')),
  signed_at        TIMESTAMPTZ,
  signed_ip        INET,
  signed_geoloc    VARCHAR(100),
  document_hash    VARCHAR(64),
  pdf_storage_path VARCHAR(500),
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consents_patient ON consents (company_id, patient_id, status);

-- ─── REFRESH TOKENS ───────────────────────────────────────────
CREATE TABLE public.refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  revoked     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked = false;

-- ─── LOGS DE AUDITORIA (append-only) ─────────────────────────
CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL,
  user_id     UUID        NOT NULL,
  action      VARCHAR(50) NOT NULL,
  table_name  VARCHAR(100) NOT NULL,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_logs (company_id, created_at DESC);

-- ─── RLS — HABILITAR ──────────────────────────────────────────
ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs   ENABLE ROW LEVEL SECURITY;

-- ─── RLS — POLITICAS ──────────────────────────────────────────
CREATE POLICY tenant_isolation_users ON public.users
  FOR ALL USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY tenant_isolation_patients ON public.patients
  FOR ALL USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY tenant_isolation_appointments ON public.appointments
  FOR ALL USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY tenant_isolation_consents ON public.consents
  FOR ALL USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY tenant_isolation_audit ON public.audit_logs
  FOR ALL USING (company_id::text = current_setting('app.current_company_id', true));
