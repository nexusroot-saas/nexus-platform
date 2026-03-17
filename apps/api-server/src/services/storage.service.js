/**
 * Nexus Storage Service
 *
 * Gerencia uploads e downloads no Supabase Storage conforme Seção 15:
 * - Três buckets: public-assets, clinical-docs, legal-vault
 * - Hash SHA-256 gerado no upload e armazenado para verificação de integridade
 * - URLs assinadas com expiração de 5 minutos (nunca URLs diretas)
 * - legal-vault imutável — sem operações de delete
 * - Retenção automática: 20 anos (legal-vault), 10 anos (clinical-docs)
 */

import { createHash } from 'crypto';
import { pool } from '../config/db.js';

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SIGNED_URL_EXPIRES_IN = 300; // 5 minutos conforme Seção 15.4

const BUCKETS = {
  PUBLIC_ASSETS:  'public-assets',
  CLINICAL_DOCS:  'clinical-docs',
  LEGAL_VAULT:    'legal-vault',
};

// ── Helpers ──────────────────────────────────────────────────────────────

function storageHeaders() {
  return {
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'apikey':        SUPABASE_SERVICE_KEY,
  };
}

function buildObjectPath(companyId, entityType, fileName) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${companyId}/${entityType}/${date}/${safeName}`;
}

function computeHash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function isConfigured() {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

// ── Upload ────────────────────────────────────────────────────────────────

/**
 * Faz upload de um arquivo para o bucket correto
 * Gera hash SHA-256 e registra metadados na tabela storage_documents
 *
 * @param {Object} opts
 * @param {string}  opts.bucket      — 'public-assets' | 'clinical-docs' | 'legal-vault'
 * @param {string}  opts.companyId   — UUID do tenant
 * @param {string}  opts.entityType  — 'consent' | 'patient' | 'exam' | 'logo'
 * @param {string}  opts.entityId    — UUID da entidade relacionada
 * @param {string}  opts.fileName    — nome original do arquivo
 * @param {string}  opts.mimeType    — tipo MIME
 * @param {Buffer}  opts.fileBuffer  — conteúdo do arquivo em buffer
 * @param {string}  opts.uploadedBy  — UUID do usuário que fez upload
 */
export async function uploadFile({
  bucket,
  companyId,
  entityType,
  entityId,
  fileName,
  mimeType,
  fileBuffer,
  uploadedBy,
}) {
  if (!Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Bucket inválido. Use: ${Object.values(BUCKETS).join(', ')}`);
  }

  const objectPath = buildObjectPath(companyId, entityType, fileName);
  const sha256Hash = computeHash(fileBuffer);

  // Modo simulação quando Supabase não está configurado
  if (!isConfigured()) {
    console.log(`[STORAGE] Simulando upload: ${bucket}/${objectPath} (${fileBuffer.length} bytes)`);
    return await saveDocumentMetadata({
      companyId, bucket, objectPath, originalName: fileName,
      mimeType, fileSize: fileBuffer.length, sha256Hash,
      entityType, entityId, uploadedBy,
    });
  }

  // Upload para o Supabase Storage
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...storageHeaders(),
      'Content-Type': mimeType,
      'x-upsert': 'false', // nunca sobrescrever no legal-vault
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Storage upload error ${res.status}: ${err.message || err.error}`);
  }

  // Persistir metadados e hash no banco
  return await saveDocumentMetadata({
    companyId, bucket, objectPath, originalName: fileName,
    mimeType, fileSize: fileBuffer.length, sha256Hash,
    entityType, entityId, uploadedBy,
  });
}

async function saveDocumentMetadata({
  companyId, bucket, objectPath, originalName,
  mimeType, fileSize, sha256Hash, entityType, entityId, uploadedBy,
}) {
  const { rows } = await pool.query(
    `INSERT INTO public.storage_documents
       (id, company_id, bucket, object_path, original_name, mime_type,
        file_size, sha256_hash, entity_type, entity_id, uploaded_by)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [companyId, bucket, objectPath, originalName, mimeType,
     fileSize, sha256Hash, entityType || null, entityId || null, uploadedBy || null]
  );
  return rows[0];
}

// ── Download — Signed URL ─────────────────────────────────────────────────

/**
 * Gera URL assinada com expiração de 5 minutos (Seção 15.4)
 * Nunca expõe URLs diretas e permanentes
 */
export async function getSignedUrl(bucket, objectPath) {
  if (!isConfigured()) {
    return { signedUrl: `http://localhost:3001/storage-sim/${bucket}/${objectPath}`, expiresIn: SIGNED_URL_EXPIRES_IN };
  }

  const url = `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${objectPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...storageHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: SIGNED_URL_EXPIRES_IN }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao gerar signed URL: ${err.message || res.statusText}`);
  }

  const data = await res.json();
  return {
    signedUrl: `${SUPABASE_URL}/storage/v1${data.signedURL}`,
    expiresIn: SIGNED_URL_EXPIRES_IN,
  };
}

/**
 * Busca metadados do documento e gera signed URL
 */
export async function getDocumentWithUrl(documentId, companyId) {
  const { rows } = await pool.query(
    `SELECT * FROM public.storage_documents WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
    [documentId, companyId]
  );

  if (rows.length === 0) throw new Error('Documento não encontrado.');

  const doc = rows[0];
  const { signedUrl, expiresIn } = await getSignedUrl(doc.bucket, doc.object_path);

  return { ...doc, signed_url: signedUrl, signed_url_expires_in: expiresIn };
}

// ── Verificação de integridade (Seção 15.3) ───────────────────────────────

/**
 * Verifica integridade de um documento comparando o hash SHA-256
 * armazenado com o hash do arquivo atual no storage
 */
export async function verifyDocumentIntegrity(documentId, companyId) {
  const { rows } = await pool.query(
    `SELECT * FROM public.storage_documents WHERE id = $1 AND company_id = $2`,
    [documentId, companyId]
  );

  if (rows.length === 0) throw new Error('Documento não encontrado.');

  const doc = rows[0];

  if (!isConfigured()) {
    return { valid: true, simulated: true, document: doc };
  }

  // Baixar arquivo do storage para verificar hash
  const url = `${SUPABASE_URL}/storage/v1/object/${doc.bucket}/${doc.object_path}`;
  const res = await fetch(url, { headers: storageHeaders() });

  if (!res.ok) throw new Error(`Arquivo não encontrado no storage: ${doc.object_path}`);

  const buffer    = Buffer.from(await res.arrayBuffer());
  const currentHash = computeHash(buffer);
  const valid     = currentHash === doc.sha256_hash;

  if (!valid) {
    // Alerta de violação de integridade — registrar no audit_log
    await pool.query(
      `INSERT INTO public.audit_logs (id, company_id, action, table_name, record_id, ip_address)
       VALUES (gen_random_uuid(), $1, 'INTEGRITY_VIOLATION', 'storage_documents', $2, 'system')`,
      [companyId, documentId]
    );
    console.error(`[STORAGE] ⛔ VIOLAÇÃO DE INTEGRIDADE: documento ${documentId} — hash divergente!`);
  }

  return {
    valid,
    stored_hash:  doc.sha256_hash,
    current_hash: currentHash,
    document:     doc,
  };
}

// ── Listagem de documentos ────────────────────────────────────────────────

export async function listDocuments({ companyId, bucket, entityType, entityId, page = 1, limit = 20 }) {
  const filters = ['sd.company_id = $1', 'sd.deleted_at IS NULL'];
  const params  = [companyId];

  if (bucket)     { params.push(bucket);     filters.push(`sd.bucket = $${params.length}`); }
  if (entityType) { params.push(entityType); filters.push(`sd.entity_type = $${params.length}`); }
  if (entityId)   { params.push(entityId);   filters.push(`sd.entity_id = $${params.length}`); }

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT sd.id, sd.bucket, sd.object_path, sd.original_name, sd.mime_type,
            sd.file_size, sd.entity_type, sd.entity_id, sd.retention_until,
            sd.created_at, u.name AS uploaded_by_name
     FROM public.storage_documents sd
     LEFT JOIN public.users u ON u.id = sd.uploaded_by
     WHERE ${filters.join(' AND ')}
     ORDER BY sd.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return rows;
}

// ── Soft delete (apenas public-assets e clinical-docs) ───────────────────

export async function deleteDocument(documentId, companyId) {
  // Verificar se é legal-vault (imutável)
  const { rows } = await pool.query(
    `SELECT bucket FROM public.storage_documents WHERE id = $1 AND company_id = $2`,
    [documentId, companyId]
  );

  if (rows.length === 0) throw new Error('Documento não encontrado.');
  if (rows[0].bucket === 'legal-vault') {
    throw new Error('Documentos do legal-vault são imutáveis e não podem ser excluídos (CFM/LGPD).');
  }

  await pool.query(
    `UPDATE public.storage_documents SET deleted_at = NOW() WHERE id = $1 AND company_id = $2`,
    [documentId, companyId]
  );

  return { deleted: true };
}

export { BUCKETS };
