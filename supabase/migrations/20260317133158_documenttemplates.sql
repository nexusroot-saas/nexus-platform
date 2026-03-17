-- documenttemplates: templates personalizáveis por tenant
CREATE TYPE doctype_enum AS ENUM (
  'CONFIDENCIALIDADE', 'TCLE', 'ATESTADOMEDICO', 'RELATORIOMEDICO',
  'RECEITASIMPLES', 'RECEITAANTIMICROBIANO', 'RECEITACONTROLEESPECIAL',
  'SOLICITACAOEXAMES', 'LAUDO', 'PARECERTECNICO'
);

CREATE TABLE documenttemplates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  doctype doctype_enum NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  content_html text NOT NULL,
  locked_sections_hash text DEFAULT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctemplates_company_type ON documenttemplates(company_id, doctype) WHERE is_active = true;
CREATE UNIQUE INDEX uq_active_template_per_tenant ON documenttemplates(company_id, doctype) WHERE is_active = true AND company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_system_template_per_type ON documenttemplates(doctype) WHERE is_system = true AND is_active = true;

ALTER TABLE documenttemplates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dt_select" ON documenttemplates FOR SELECT USING (company_id::text = current_setting('app.current_company_id') OR is_system = true);
CREATE POLICY "dt_insert" ON documenttemplates FOR INSERT WITH CHECK (company_id::text = current_setting('app.current_company_id') AND is_system = false);
CREATE POLICY "dt_update" ON documenttemplates FOR UPDATE USING (company_id::text = current_setting('app.current_company_id') AND is_system = false);
