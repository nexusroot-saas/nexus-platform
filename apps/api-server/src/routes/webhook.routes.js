/**
 * Nexus Webhook Routes — WhatsApp Business API
 *
 * Arquitetura conforme Seção 14.1 da documentação:
 * 1. Validação da assinatura X-Hub-Signature-256 (HMAC-SHA256)
 * 2. ACK imediato HTTP 200 (< 200ms) para evitar reenvios
 * 3. Persistência na fila assíncrona (webhook_queue)
 * 4. Processamento em background via webhook-queue.js
 *
 * Endpoints:
 *   GET  /api/v1/webhooks/whatsapp        — verificação do webhook (Meta/Twilio)
 *   POST /api/v1/webhooks/whatsapp        — recepção de eventos
 *   GET  /api/v1/webhooks/stats           — métricas da fila (NexusRoot)
 *   GET  /api/v1/webhooks/dlq             — Dead Letter Queue (NexusRoot)
 *   POST /api/v1/webhooks/dlq/:id/retry   — reprocessar item da DLQ
 */

import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { pool } from '../config/db.js';
import {
  enqueueWebhook,
  getQueueStats,
  getDLQItems,
  retryDLQItem,
} from '../queues/webhook-queue.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────
function validateHubSignature(secret, rawBody, signature) {
  if (!signature || !signature.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = signature.slice('sha256='.length);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

async function resolveCompanyByPhone(phone) {
  if (!phone) return null;
  try {
    const { rows } = await pool.query(
      `SELECT id FROM public.companies
       WHERE config_branding->>'whatsapp_phone' = $1
         AND status = 'ACTIVE' AND deleted_at IS NULL
       LIMIT 1`,
      [phone]
    );
    return rows[0]?.id || null;
  } catch (error) {
    console.error('[WEBHOOK] resolveCompanyByPhone error:', error.message);
    return null;
  }
}

function classifyMessage(msg) {
  if (msg.interactive) {
    const reply = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || '';
    if (reply.includes('consent_sign') || reply.includes('tcle_aceitar')) return 'consent.signed';
    if (reply.includes('appt_confirm') || reply.includes('consulta_confirmar'))
      return 'appointment.confirmed';
  }
  if (msg.text?.body) {
    const text = msg.text.body.toLowerCase().trim();
    if (['sim', '1', 'confirmar', 'confirmo'].includes(text)) return 'appointment.confirmed';
    if (['aceito', 'aceitar', 'concordo'].includes(text)) return 'consent.signed';
  }
  return 'message.received';
}

function normalizeWhatsAppEvent(body, provider) {
  const events = [];
  if (provider === 'meta') {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const msg of value.messages || []) {
          events.push({
            message_id: msg.id,
            event_type: classifyMessage(msg),
            from: msg.from,
            to: value.metadata?.phone_number_id,
            timestamp: msg.timestamp,
            text: msg.text,
            interactive: msg.interactive,
            raw: msg,
          });
        }
        for (const status of value.statuses || []) {
          events.push({
            message_id: `status-${status.id}-${status.status}`,
            event_type: `message.status.${status.status}`,
            from: status.recipient_id,
            to: value.metadata?.phone_number_id,
            timestamp: status.timestamp,
            raw: status,
          });
        }
      }
    }
  } else if (provider === 'twilio') {
    events.push({
      message_id: body.MessageSid || `twilio-${Date.now()}`,
      event_type: 'message.received',
      from: body.From?.replace('whatsapp:', ''),
      to: body.To?.replace('whatsapp:', ''),
      text: { body: body.Body },
      raw: body,
    });
  }
  return events;
}

// ── Rotas ────────────────────────────────────────────────────────────────
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_WEBHOOK_SECRET || 'nexus-webhook-dev';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WEBHOOK] Webhook WhatsApp verificado com sucesso');
    return res.status(200).send(challenge);
  }
  console.warn('[WEBHOOK] Verificação falhou — token inválido');
  return res.status(403).json({ error: 'Verificação falhou.' });
});

router.post('/whatsapp', async (req, res) => {
  const startTime = Date.now();
  const signature = req.headers['x-hub-signature-256'] || req.headers['x-twilio-signature'];
  const rawBody = JSON.stringify(req.body);
  const provider = req.headers['x-twilio-signature'] ? 'twilio' : 'meta';
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET || 'nexus-webhook-dev';

  if (process.env.NODE_ENV === 'production') {
    const valid = validateHubSignature(secret, rawBody, signature);
    if (!valid) {
      console.warn('[WEBHOOK] Assinatura inválida — rejeitado');
      return res.status(401).json({ error: 'Assinatura inválida.' });
    }
  }

  res.status(200).json({ status: 'received' });

  setImmediate(async () => {
    try {
      const events = normalizeWhatsAppEvent(req.body, provider);
      for (const event of events) {
        const company_id = await resolveCompanyByPhone(event.to);
        await enqueueWebhook({
          message_id: event.message_id,
          event_type: event.event_type,
          provider,
          payload: event,
          company_id,
        });
      }
      const elapsed = Date.now() - startTime;
      console.log(`[WEBHOOK] ${events.length} evento(s) enfileirado(s) em ${elapsed}ms`);
    } catch (error) {
      console.error('[WEBHOOK] Erro ao enfileirar:', error.message);
    }
  });
});

router.get('/stats', authenticate, authorize('tenants', 'read'), async (_req, res) => {
  try {
    const stats = await getQueueStats();
    const total = Number(stats.received_last_hour) || 0;
    const success = Number(stats.done_last_hour) || 0;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '100.0';

    return res.status(200).json({
      data: {
        queue: {
          pending: Number(stats.pending),
          processing: Number(stats.processing),
          done: Number(stats.done),
          failed: Number(stats.failed),
          dlq: Number(stats.dlq),
        },
        last_hour: {
          received: total,
          processed: success,
          success_rate: `${successRate}%`,
        },
        sla: {
          consent_signed: '< 30 segundos (P0)',
          appointment_confirmed: '< 2 minutos (P1)',
          message_received: '< 1 hora (P2)',
        },
        dlq_alert: Number(stats.dlq) > 10,
      },
    });
  } catch (error) {
    console.error('[WEBHOOK] stats error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
});

router.get('/dlq', authenticate, authorize('tenants', 'read'), async (_req, res) => {
  try {
    const items = await getDLQItems(50);
    return res.status(200).json({ data: items, total: items.length });
  } catch (error) {
    console.error('[WEBHOOK] dlq error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar DLQ.' });
  }
});

router.post('/dlq/:id/retry', authenticate, authorize('tenants', 'update'), async (req, res) => {
  try {
    await retryDLQItem(req.params.id);
    return res.status(200).json({ message: 'Item reinserido na fila com sucesso.' });
  } catch (error) {
    console.error('[WEBHOOK] retry error:', error.message);
    return res.status(500).json({ error: 'Erro ao reprocessar item.' });
  }
});

export default router;
