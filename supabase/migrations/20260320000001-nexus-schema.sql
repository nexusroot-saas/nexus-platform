-- NEXUS SCHEMA + RLS CRÍTICO
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomefantasia VARCHAR(200) NOT NULL,
  tenanttype VARCHAR(20) NOT NULL CHECK (tenanttype IN ('MED','CLIN','ODONTO')),
  status VARCHAR(20) DEFAULT 'TRIAL',
  createdat TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyid UUID NOT NULL REFERENCES companies(id),
  email VARCHAR(255) NOT NULL,
  fullname VARCHAR(200) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('TENANTADMIN','MEDICO','RECEPCIONISTA')),
  createdat TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(companyid, email)
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyid UUID NOT NULL REFERENCES companies(id),
  fullname VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  createdat TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ATIVAR
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation patients" ON patients;
CREATE POLICY "Tenant isolation patients" ON patients
  FOR ALL USING (companyid::text = current_setting('app.currentcompanyid', true));

CREATE INDEX IF NOT EXISTS idx_patients_company ON patients(companyid);
