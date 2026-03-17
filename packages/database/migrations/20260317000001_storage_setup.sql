-- ============================================================
-- Nexus Platform — Supabase Storage Setup
-- Seção 15 da documentação técnica
--
-- Execute este script no SQL Editor do Supabase
-- ATENÇÃO: requer permissão de service_role
-- ============================================================

-- ── 1. Criar buckets ──────────────────────────────────────────────────────

-- public-assets: logomarcas, avatares, ícones (leitura pública)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,  -- leitura pública
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- clinical-docs: exames, fotos, laudos (privado por tenant)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-docs',
  'clinical-docs',
  false,  -- privado
  52428800, -- 50MB
  ARRAY['application/pdf','image/jpeg','image/png','image/dicom','application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- legal-vault: TCLEs assinados (cold storage imutável — sem DELETE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-vault',
  'legal-vault',
  false,  -- privado
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ── 2. Tabela de metadados de documentos ─────────────────────────────────
-- Armazena hash SHA-256 para verificação de integridade (Seção 15.3)

CREATE TABLE IF NOT EXISTS public.storage_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id),
  bucket        TEXT NOT NULL CHECK (bucket IN ('public-assets','clinical-docs','legal-vault')),
  object_path   TEXT NOT NULL,  -- caminho no bucket: company_id/tipo/arquivo.pdf
  original_name TEXT,
  mime_type     TEXT,
  file_size     INTEGER,
  sha256_hash   TEXT NOT NULL,  -- hash gerado no upload para verificação de integridade
  entity_type   TEXT,           -- 'consent', 'patient', 'exam', 'logo'
  entity_id     UUID,           -- FK para a entidade relacionada
  uploaded_by   UUID REFERENCES public.users(id),
  signed_url_expires_at TIMESTAMPTZ,  -- controle de URLs assinadas
  retention_until TIMESTAMPTZ,  -- data de expiração da retenção (20 anos para legal-vault)
  deleted_at    TIMESTAMPTZ,    -- soft delete — legal-vault nunca pode ter deleted_at preenchido
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_storage_docs_company   ON public.storage_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_storage_docs_entity    ON public.storage_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_storage_docs_bucket    ON public.storage_documents(bucket, company_id);

-- ── 3. RLS na tabela de metadados ────────────────────────────────────────

ALTER TABLE public.storage_documents ENABLE ROW LEVEL SECURITY;

-- Isolamento por tenant
CREATE POLICY "tenant_isolation_storage_documents"
  ON public.storage_documents FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true));

-- ── 4. RLS no Supabase Storage ───────────────────────────────────────────

-- public-assets: qualquer um pode ler; só admin do tenant escreve
CREATE POLICY "public_assets_read_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

CREATE POLICY "public_assets_write_own_company"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

-- clinical-docs: somente usuários do tenant podem ler e escrever
CREATE POLICY "clinical_docs_tenant_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'clinical-docs'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

CREATE POLICY "clinical_docs_tenant_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clinical-docs'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

CREATE POLICY "clinical_docs_tenant_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clinical-docs'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

-- legal-vault: somente leitura e inserção — SEM DELETE (imutável)
CREATE POLICY "legal_vault_tenant_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'legal-vault'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

CREATE POLICY "legal_vault_tenant_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'legal-vault'
    AND (storage.foldername(name))[1] = current_setting('app.current_company_id', true)
  );

-- NENHUMA política de DELETE para legal-vault — imutabilidade garantida

-- ── 5. Trigger: impede DELETE no legal-vault ─────────────────────────────
-- Camada extra de proteção além da RLS

CREATE OR REPLACE FUNCTION prevent_legal_vault_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.bucket_id = 'legal-vault' THEN
    RAISE EXCEPTION 'legal-vault é imutável — documentos jurídicos não podem ser excluídos (Seção 15 - CFM/LGPD)';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_legal_vault_delete ON storage.objects;
CREATE TRIGGER trg_prevent_legal_vault_delete
  BEFORE DELETE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION prevent_legal_vault_delete();

-- ── 6. Trigger: definir retention_until automaticamente ──────────────────
-- legal-vault: 20 anos | clinical-docs: 10 anos | public-assets: sem retenção

CREATE OR REPLACE FUNCTION set_document_retention()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.bucket = 'legal-vault' THEN
    NEW.retention_until := NOW() + INTERVAL '20 years';
  ELSIF NEW.bucket = 'clinical-docs' THEN
    NEW.retention_until := NOW() + INTERVAL '10 years';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_document_retention ON public.storage_documents;
CREATE TRIGGER trg_set_document_retention
  BEFORE INSERT ON public.storage_documents
  FOR EACH ROW EXECUTE FUNCTION set_document_retention();

-- ── 7. View: documentos por tenant com status de integridade ─────────────
CREATE OR REPLACE VIEW public.v_storage_documents AS
SELECT
  sd.id,
  sd.company_id,
  c.nome_fantasia AS company_name,
  sd.bucket,
  sd.object_path,
  sd.original_name,
  sd.mime_type,
  sd.file_size,
  sd.sha256_hash,
  sd.entity_type,
  sd.entity_id,
  sd.retention_until,
  EXTRACT(YEAR FROM AGE(sd.retention_until, NOW()))::INT AS retention_years_remaining,
  sd.created_at,
  u.name AS uploaded_by_name
FROM public.storage_documents sd
LEFT JOIN public.companies c ON c.id = sd.company_id
LEFT JOIN public.users u ON u.id = sd.uploaded_by
WHERE sd.deleted_at IS NULL;

-- ── Verificar resultado ────────────────────────────────────────────────────
SELECT id, name, public FROM storage.buckets WHERE id IN ('public-assets','clinical-docs','legal-vault');
SELECT COUNT(*) AS total_policies FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
