-- documenttemplates: templates personalizáveis por tenant
-- Isolamento por company_id + RLS. Templates padrão: company_id NULL

-- Enum dos tipos de documento
CREATE TYPE doctype_enum AS ENUM (
  'CONFIDENCIALIDADE', 'TCLE', 'ATESTADOMEDICO', 'RELATORIOMEDICO',
  'RECEITASIMPLES', 'RECEITAANTIMICROBIANO', 'RECEITACONTROLEESPECIAL',
  'SOLICITACAOEXAMES', 'LAUDO', 'PARECERTECNICO'
);

CREATE TABLE documenttemplates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE, -- NULL = template padrão do sistema, read-only
  doctype doctype_enum NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false, -- is_system=true = template padrão Nexus, nunca editável
  content_html text NOT NULL, -- HTML com sees protegidas marcadas com data-locked="true"
  locked_sections_hash text DEFAULT NULL, -- SHA-256 das sees com data-locked para validação no PATCH
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_doctemplates_company_type ON documenttemplates(company_id, doctype) WHERE is_active = true;

-- Constraint: apenas 1 template ativo por company_id, doctype
CREATE UNIQUE INDEX uq_active_template_per_tenant ON documenttemplates(company_id, doctype) 
WHERE is_active = true AND company_id IS NOT NULL;

-- Apenas 1 template padrão ativo por doctype
CREATE UNIQUE INDEX uq_system_template_per_type ON documenttemplates(doctype) 
WHERE is_system = true AND is_active = true;

-- RLS
ALTER TABLE documenttemplates ENABLE ROW LEVEL SECURITY;

-- Tenants leem seus próprios templates + os templates do sistema
CREATE POLICY "dt_select" ON documenttemplates FOR SELECT 
USING (company_id::text = current_setting('app.current_company_id') OR is_system = true);

-- Tenants só escrevem nos seus próprios (nunca is_system)
CREATE POLICY "dt_insert" ON documenttemplates FOR INSERT 
WITH CHECK (company_id::text = current_setting('app.current_company_id') AND is_system = false);

CREATE POLICY "dt_update" ON documenttemplates FOR UPDATE 
USING (company_id::text = current_setting('app.current_company_id') AND is_system = false);
