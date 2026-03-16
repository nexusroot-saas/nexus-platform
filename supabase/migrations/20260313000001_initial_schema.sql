-- ============================================================
-- Nexus Platform — Migration 001
-- Schema inicial com RLS em todas as tabelas transacionais
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM types ───────────────────────────────────────────────────────────
CREATE TYPE company_status AS ENUM ('ATIVA', 'BLOQUEADA', 'TRIAL', 'CANCELADA');
CREATE TYPE user_role AS ENUM ('ROOT', 'TENANT_ADMIN', 'MEDICO', 'RECEPCIONISTA', 'FINANCEIRO', 'DPO_EXTERNO');
CREATE TYPE user_status AS ENUM ('ATIVO', 'BLOQUEADO', 'PENDENTE');
CREATE TYPE tenant_type AS ENUM ('MED', 'CLIN', 'ODONTO', 'LAB', 'IMG', 'ADM');
CREATE TYPE appointment_status AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');
CREATE TYPE consent_status AS ENUM ('PENDENTE', 'ASSINADO', 'RECUSADO', 'EXPIRADO', 'REVOGADO');

-- ── companies ─────────────────────────────────────────────────────────────
-- Entidade pai de toda a operação. Cada empresa = um tenant isolado.
CREATE TABLE public.companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj            VARCHAR(18) UNIQUE,
  nome_fantasia   VARCHAR(255) NOT NULL,
  razao_social    VARCHAR(255),
  tenant_type     tenant_type NOT NULL DEFAULT 'MED',
  active_modules  TEXT[] NOT NULL DEFAULT '{}',
  config_branding JSONB NOT NULL DEFAULT '{}',
  status          company_status NOT NULL DEFAULT 'TRIAL',
  trial_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- companies: ROOT vê todas; TENANT_ADMIN vê só a sua
CREATE POLICY tenant_isolation_companies ON public.companies
  FOR ALL
  USING (
    id::text = current_setting('app.current_company_id', true)
    OR current_setting('app.current_company_id', true) = ''
  );

-- ── users ─────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'RECEPCIONISTA',
  status        user_status NOT NULL DEFAULT 'PENDENTE',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT users_email_company_unique UNIQUE (email, company_id)
);

CREATE INDEX idx_users_company_id ON public.users(company_id);
CREATE INDEX idx_users_email ON public.users(email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON public.users
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── patients ──────────────────────────────────────────────────────────────
CREATE TABLE public.patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(20),
  cpf           VARCHAR(14),
  date_of_birth DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  dynamic_data  JSONB NOT NULL DEFAULT '{}',  -- dados específicos por módulo (odontograma, etc.)
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ  -- soft delete: prontuários nunca são apagados (lei 20 anos)
);

CREATE INDEX idx_patients_company_id ON public.patients(company_id);
CREATE INDEX idx_patients_company_name ON public.patients(company_id, name);
CREATE INDEX idx_patients_cpf ON public.patients(cpf) WHERE cpf IS NOT NULL;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_patients ON public.patients
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── appointments ──────────────────────────────────────────────────────────
CREATE TABLE public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  professional_id  UUID REFERENCES public.users(id),
  scheduled_date   TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status           appointment_status NOT NULL DEFAULT 'AGENDADO',
  notes            TEXT,
  created_by       UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX idx_appointments_company_date ON public.appointments(company_id, scheduled_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_appointments ON public.appointments
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── consents ──────────────────────────────────────────────────────────────
-- Consentimentos LGPD com cadeia de custódia digital
CREATE TABLE public.consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  term_version    VARCHAR(20) NOT NULL,
  term_text_hash  CHAR(64) NOT NULL,  -- SHA-256 do texto lido pelo paciente
  channel         VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',  -- WHATSAPP | TABLET | EMAIL
  status          consent_status NOT NULL DEFAULT 'PENDENTE',
  ip_address      VARCHAR(45),
  geolocation     JSONB,
  signed_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  pdf_url         TEXT,  -- link imutável no cold storage
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- sem updated_at nem deleted_at: registros de consent são append-only
);

CREATE INDEX idx_consents_company_id ON public.consents(company_id);
CREATE INDEX idx_consents_patient ON public.consents(patient_id);
CREATE INDEX idx_consents_status ON public.consents(company_id, status);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_consents ON public.consents
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── refresh_tokens ────────────────────────────────────────────────────────
-- Rotação obrigatória: cada token é de uso único
CREATE TABLE public.refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens(user_id);

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_refresh_tokens ON public.refresh_tokens
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── audit_logs ────────────────────────────────────────────────────────────
-- Append-only: NUNCA UPDATE ou DELETE (exigência LGPD Art. 37)
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  user_id     UUID REFERENCES public.users(id),
  action      VARCHAR(20) NOT NULL,  -- INSERT | UPDATE | DELETE | VIEW
  table_name  VARCHAR(100) NOT NULL,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_company_date ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX idx_audit_logs_record ON public.audit_logs(table_name, record_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── Trigger: updated_at automático ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
