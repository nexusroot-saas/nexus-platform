-- ============================================================
-- Nexus Platform — Dev Seed
-- 2 tenants isolados, 1 admin + 2 pacientes cada
-- Usado nos testes de RLS do CI
-- ============================================================

-- ── Tenant A: Clínica Saúde Total (NexusMed) ─────────────────────────────
INSERT INTO public.companies (id, cnpj, nome_fantasia, tenant_type, active_modules, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '11.111.111/0001-11',
  'Clínica Saúde Total',
  'MED',
  ARRAY['NEXUSMED', 'NEXUSLEGAL'],
  'ATIVA'
);

-- Admin do Tenant A (senha: senha123)
INSERT INTO public.users (id, company_id, name, email, password_hash, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Admin Saúde Total',
  'admin@saudetotal.com',
  '$2b$10$XFVnlLkXtFOq2PkRJyAiyeQ8Cb9dbbgLH7.T7p0UQD7vc4nEHBpXe', -- senha123
  'TENANT_ADMIN',
  'ATIVO'
);

-- Pacientes do Tenant A
INSERT INTO public.patients (id, company_id, name, email, cpf, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000001',
   'João Silva', 'joao@email.com', '111.111.111-11',
   '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000102',
   '00000000-0000-0000-0000-000000000001',
   'Maria Souza', 'maria@email.com', '222.222.222-22',
   '00000000-0000-0000-0000-000000000010');

-- ── Tenant B: OdontoVita (NexusOdonto) ───────────────────────────────────
INSERT INTO public.companies (id, cnpj, nome_fantasia, tenant_type, active_modules, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '22.222.222/0002-22',
  'OdontoVita',
  'ODONTO',
  ARRAY['NEXUSODONTO'],
  'ATIVA'
);

-- Admin do Tenant B (senha: senha456)
INSERT INTO public.users (id, company_id, name, email, password_hash, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000002',
  'Admin OdontoVita',
  'admin@odontovita.com',
  '$2b$10$XFVnlLkXtFOq2PkRJyAiyeQ8Cb9dbbgLH7.T7p0UQD7vc4nEHBpXe', -- senha123
  'TENANT_ADMIN',
  'ATIVO'
);

-- Pacientes do Tenant B
INSERT INTO public.patients (id, company_id, name, email, cpf, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000002',
   'Carlos Lima', 'carlos@email.com', '333.333.333-33',
   '00000000-0000-0000-0000-000000000020'),
  ('00000000-0000-0000-0000-000000000202',
   '00000000-0000-0000-0000-000000000002',
   'Ana Costa', 'ana@email.com', '444.444.444-44',
   '00000000-0000-0000-0000-000000000020');
