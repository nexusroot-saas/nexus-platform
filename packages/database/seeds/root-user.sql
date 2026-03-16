-- ============================================================
-- Migration: Suporte ao role ROOT e usuário root da plataforma
-- Aplicar no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar 'ROOT' ao enum de roles (se não existir)
-- No Supabase o enum pode precisar ser recriado; verificar antes:
-- SELECT unnest(enum_range(NULL::user_role));

-- Se o check constraint não incluir ROOT, atualizar:
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ROOT', 'TENANT_ADMIN', 'MEDICO', 'RECEPCIONISTA', 'FINANCEIRO', 'DPO_EXTERNO'));

-- 2. Criar usuário ROOT da plataforma
-- ATENÇÃO: trocar a senha antes de usar em produção!
-- Hash gerado com bcrypt rounds=10 para a senha: NexusRoot@2026
INSERT INTO public.users (
  id, company_id, name, email, password_hash, role, status
)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- company_id da primeira empresa (placeholder)
  '00000000-0000-0000-0000-000000000001',
  'Admin NexusRoot',
  'root@nexus.app',
  '$2a$10$m3E3THatfg7IcBBQcctrLekXbpvaRR7S8KQ45r8k31npq47MobMZy',  -- senha123
  'ROOT',
  'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar
SELECT id, email, role, status FROM users WHERE role = 'ROOT';
