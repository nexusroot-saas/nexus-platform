-- 1. TABELA COMPANIES (TENANTS)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(18) UNIQUE,
  nomefantasia VARCHAR(200) NOT NULL,
  tenanttype VARCHAR(20) NOT NULL CHECK (tenanttype IN ('MED','CLIN','ODONTO')),
  status VARCHAR(20) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL','ACTIVE','BLOCKED')),
  createdat TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyid UUID NOT NULL REFERENCES companies(id),
  email VARCHAR(255) NOT NULL,
  passwordhash VARCHAR(255) NOT NULL,
  fullname VARCHAR(200) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('TENANTADMIN','MEDICO','RECEPCIONISTA')),
  status VARCHAR(20) DEFAULT 'PENDING',
  createdat TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(companyid, email)
);

-- 3. TABELA PATIENTS (COM RLS)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyid UUID NOT NULL REFERENCES companies(id),
  fullname VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  phone VARCHAR(20),
  createdat TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HABILITAR RLS PATIENTS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation patients" ON patients
  FOR ALL USING (companyid::text = current_setting('app.currentcompanyid', true));

-- INDEXES
CREATE INDEX idx_patients_company ON patients(companyid);
