-- ═══════════════════════════════════════════════════════════════
-- Seed de Desenvolvimento — 2 Tenants para testes de isolamento
-- NUNCA executar em producao
-- ═══════════════════════════════════════════════════════════════

-- ─── TENANT A — Clinica Saude Total (MED) ────────────────────
INSERT INTO public.companies (id, cnpj, nome_fantasia, tenant_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '11.111.111/0001-11',
  'Clinica Saude Total',
  'MED',
  'ACTIVE'
);

INSERT INTO public.users (id, company_id, email, password_hash, full_name, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'admin@saudetotal.com',
  '$2b$12$placeholderhashadmin1111111111111111111111111111111111',
  'Admin Saude Total',
  'TENANT_ADMIN',
  'ACTIVE'
),
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'medico@saudetotal.com',
  '$2b$12$placeholderhashmedi1111111111111111111111111111111111',
  'Dr. Carlos Silva',
  'MEDICO',
  'ACTIVE'
);

INSERT INTO public.patients (id, company_id, full_name, phone, email, birth_date)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Paciente A1 — Saude Total',
  '(11) 99999-0001',
  'paciente.a1@email.com',
  '1985-03-15'
),
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'Paciente A2 — Saude Total',
  '(11) 99999-0002',
  'paciente.a2@email.com',
  '1990-07-22'
);

-- ─── TENANT B — OdontoVida (ODONTO) ──────────────────────────
INSERT INTO public.companies (id, cnpj, nome_fantasia, tenant_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '22.222.222/0002-22',
  'OdontoVida',
  'ODONTO',
  'ACTIVE'
);

INSERT INTO public.users (id, company_id, email, password_hash, full_name, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000002',
  'admin@odontovida.com',
  '$2b$12$placeholderhashadmin2222222222222222222222222222222222',
  'Admin OdontoVida',
  'TENANT_ADMIN',
  'ACTIVE'
),
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000002',
  'dentista@odontovida.com',
  '$2b$12$placeholderhashmed22222222222222222222222222222222222',
  'Dra. Ana Costa',
  'MEDICO',
  'ACTIVE'
);

INSERT INTO public.patients (id, company_id, full_name, phone, email, birth_date)
VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000002',
  'Paciente B1 — OdontoVida',
  '(21) 99999-0001',
  'paciente.b1@email.com',
  '1978-11-30'
),
(
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000002',
  'Paciente B2 — OdontoVida',
  '(21) 99999-0002',
  'paciente.b2@email.com',
  '1995-04-18'
);
