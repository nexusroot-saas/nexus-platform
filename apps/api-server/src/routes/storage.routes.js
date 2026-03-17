/**
 * Nexus Storage Routes
 *
 * GET    /api/v1/storage                     — listar documentos do tenant
 * POST   /api/v1/storage/upload              — upload de arquivo
 * GET    /api/v1/storage/:id/url             — gerar signed URL (5 min)
 * GET    /api/v1/storage/:id/verify          — verificar integridade (SHA-256)
 * DELETE /api/v1/storage/:id                 — soft delete (não permitido em legal-vault)
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import {
  uploadFile,
  getDocumentWithUrl,
  verifyDocumentIntegrity,
  listDocuments,
  deleteDocument,
  BUCKETS,
} from '../services/storage.service.js';

const router = Router();

// ── Listar documentos ─────────────────────────────────────────────────────
router.get('/', authenticate, authorize('storage', 'read'), async (req, res) => {
  const { bucket, entity_type, entity_id, page = 1, limit = 20 } = req.query;

  try {
    const docs = await listDocuments({
      companyId: req.user.company_id,
      bucket: bucket || null,
      entityType: entity_type || null,
      entityId: entity_id || null,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    });
    return res.status(200).json({ data: docs, total: docs.length });
  } catch (err) {
    console.error('[storage] GET error:', err.message);
    return res.status(500).json({ error: 'Erro ao listar documentos.' });
  }
});

// ── Upload de arquivo ─────────────────────────────────────────────────────
// Aceita multipart/form-data via raw buffer no body
// O cliente deve enviar:
//   - bucket: string
//   - entity_type: string
//   - entity_id: uuid (opcional)
//   - file: base64 string
//   - file_name: string
//   - mime_type: string
router.post('/upload', authenticate, authorize('storage', 'create'), async (req, res) => {
  const { bucket, entity_type, entity_id, file, file_name, mime_type } = req.body;

  if (!bucket || !file || !file_name || !mime_type) {
    return res
      .status(400)
      .json({ error: 'bucket, file (base64), file_name e mime_type são obrigatórios.' });
  }

  if (!Object.values(BUCKETS).includes(bucket)) {
    return res
      .status(400)
      .json({ error: `Bucket inválido. Use: ${Object.values(BUCKETS).join(', ')}` });
  }

  // Apenas TENANT_ADMIN pode fazer upload no legal-vault
  if (bucket === BUCKETS.LEGAL_VAULT && !['TENANT_ADMIN', 'ROOT'].includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: 'Apenas administradores podem enviar para o legal-vault.' });
  }

  try {
    const fileBuffer = Buffer.from(file, 'base64');

    // Limite de tamanho por bucket
    const limits = {
      'public-assets': 5_242_880,
      'clinical-docs': 52_428_800,
      'legal-vault': 10_485_760,
    };
    if (fileBuffer.length > limits[bucket]) {
      return res.status(413).json({
        error: `Arquivo excede o limite de ${limits[bucket] / 1_048_576}MB para o bucket ${bucket}.`,
      });
    }

    const doc = await uploadFile({
      bucket,
      companyId: req.user.company_id,
      entityType: entity_type || null,
      entityId: entity_id || null,
      fileName: file_name,
      mimeType: mime_type,
      fileBuffer,
      uploadedBy: req.user.sub,
    });

    return res.status(201).json({ data: doc });
  } catch (err) {
    console.error('[storage] POST upload error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Gerar signed URL ─────────────────────────────────────────────────────
// Nunca expõe URLs diretas — apenas URLs assinadas com expiração de 5 minutos
router.get('/:id/url', authenticate, authorize('storage', 'read'), async (req, res) => {
  try {
    const doc = await getDocumentWithUrl(req.params.id, req.user.company_id);
    return res.status(200).json({
      data: {
        id: doc.id,
        signed_url: doc.signed_url,
        expires_in: doc.signed_url_expires_in,
        expires_at: new Date(Date.now() + doc.signed_url_expires_in * 1000).toISOString(),
        original_name: doc.original_name,
        mime_type: doc.mime_type,
        bucket: doc.bucket,
      },
    });
  } catch (err) {
    console.error('[storage] GET url error:', err.message);
    const status = err.message.includes('não encontrado') ? 404 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// ── Verificar integridade (SHA-256) ──────────────────────────────────────
router.get('/:id/verify', authenticate, authorize('storage', 'read'), async (req, res) => {
  try {
    const result = await verifyDocumentIntegrity(req.params.id, req.user.company_id);
    return res.status(200).json({
      data: {
        valid: result.valid,
        stored_hash: result.stored_hash,
        current_hash: result.current_hash,
        document: result.document,
        message: result.valid
          ? '✓ Integridade verificada — documento íntegro.'
          : '⛔ ALERTA: hash divergente — possível violação de integridade!',
      },
    });
  } catch (err) {
    console.error('[storage] GET verify error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Soft delete (legal-vault é imutável) ─────────────────────────────────
router.delete('/:id', authenticate, authorize('storage', 'delete'), async (req, res) => {
  try {
    await deleteDocument(req.params.id, req.user.company_id);
    return res.status(200).json({ message: 'Documento removido com sucesso.' });
  } catch (err) {
    const status = err.message.includes('imutável')
      ? 403
      : err.message.includes('não encontrado')
        ? 404
        : 500;
    return res.status(status).json({ error: err.message });
  }
});

export default router;
