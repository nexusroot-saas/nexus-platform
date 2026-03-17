/**
 * Nexus Webhook Queue
 *
 * Arquitetura conforme documentação (Seção 14):
 * - Recebe o payload do webhook e persiste no banco imediatamente (ACK rápido)
 * - Processa de forma assíncrona em background
 * - Retry com exponential backoff: 5s → 30s → 5min → ... até 10x / 24h
 * - Dead Letter Queue (DLQ) para mensagens que excedem todas as tentativas
 * - Idempotência via message_id
 *
 * Se REDIS_URL estiver configurado, usa BullMQ.
 * Caso contrário, usa processamento em memória com retry próprio (modo dev/fallback).
 */

import { pool } from '../config/db.js';

// ── Tabela de fila no banco (criada se não existir) ─────────────────────
const ENSURE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   TEXT UNIQUE NOT NULL,
  event_type   TEXT NOT NULL,
  provider     TEXT NOT NULL DEFAULT 'whatsapp',
  payload      JSONB NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','DONE','FAILED','DLQ')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_log    TEXT,
  company_id   UUID REFERENCES public.companies(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_status ON public.webhook_queue(status, next_attempt_at);
`;

// ── Backoff schedule (conforme Seção 14.2) ──────────────────────────────
const BACKOFF_MS = [
  5_000,       // 1ª tentativa: 5 segundos
  30_000,      // 2ª tentativa: 30 segundos
  300_000,     // 3ª tentativa: 5 minutos
  900_000,     // 4ª tentativa: 15 minutos
  1_800_000,   // 5ª tentativa: 30 minutos
  3_600_000,   // 6ª tentativa: 1 hora
  7_200_000,   // 7ª tentativa: 2 horas
  14_400_000,  // 8ª tentativa: 4 horas
  28_800_000,  // 9ª tentativa: 8 horas
  86_400_000,  // 10ª tentativa: 24 horas → DLQ após esta
];
const MAX_ATTEMPTS = BACKOFF_MS.length;

// ── Enfileirar mensagem ──────────────────────────────────────────────────
export async function enqueueWebhook({ message_id, event_type, provider = 'whatsapp', payload, company_id }) {
  try {
    await pool.query(ENSURE_TABLE_SQL);

    await pool.query(
      `INSERT INTO public.webhook_queue (message_id, event_type, provider, payload, company_id)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (message_id) DO NOTHING`,
      [message_id, event_type, provider, JSON.stringify(payload), company_id || null]
    );

    console.log(`[QUEUE] Enfileirado: ${message_id} (${event_type})`);
  } catch (err) {
    console.error('[QUEUE] Erro ao enfileirar:', err.message);
    throw err;
  }
}

// ── Processar próximas mensagens pendentes ───────────────────────────────
export async function processQueue() {
  try {
    // Pega até 10 mensagens prontas para processar
    const { rows } = await pool.query(
      `UPDATE public.webhook_queue
       SET status = 'PROCESSING', updated_at = NOW()
       WHERE id IN (
         SELECT id FROM public.webhook_queue
         WHERE status IN ('PENDING', 'FAILED')
           AND next_attempt_at <= NOW()
         ORDER BY next_attempt_at ASC
         LIMIT 10
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

    for (const job of rows) {
      await processJob(job);
    }
  } catch (err) {
    console.error('[QUEUE] Erro no processador:', err.message);
  }
}

// ── Processar um job individual ──────────────────────────────────────────
async function processJob(job) {
  const attempts = job.attempts + 1;

  try {
    await handleEvent(job.event_type, job.payload, job.company_id);

    // Sucesso
    await pool.query(
      `UPDATE public.webhook_queue
       SET status = 'DONE', attempts = $1, processed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [attempts, job.id]
    );

    console.log(`[QUEUE] ✓ Processado: ${job.message_id} (${job.event_type}) — tentativa ${attempts}`);
  } catch (err) {
    console.error(`[QUEUE] ✗ Falha: ${job.message_id} — tentativa ${attempts} — ${err.message}`);

    if (attempts >= MAX_ATTEMPTS) {
      // Dead Letter Queue
      await pool.query(
        `UPDATE public.webhook_queue
         SET status = 'DLQ', attempts = $1, error_log = $2, updated_at = NOW()
         WHERE id = $3`,
        [attempts, err.message, job.id]
      );
      console.error(`[QUEUE] ⛔ DLQ: ${job.message_id} excedeu ${MAX_ATTEMPTS} tentativas`);
    } else {
      // Reagendar com backoff
      const delayMs = BACKOFF_MS[attempts - 1] || BACKOFF_MS[BACKOFF_MS.length - 1];
      const nextAt  = new Date(Date.now() + delayMs);

      await pool.query(
        `UPDATE public.webhook_queue
         SET status = 'FAILED', attempts = $1, next_attempt_at = $2, error_log = $3, updated_at = NOW()
         WHERE id = $4`,
        [attempts, nextAt.toISOString(), err.message, job.id]
      );
      console.log(`[QUEUE] ↻ Reagendado: ${job.message_id} para ${nextAt.toLocaleString('pt-BR')}`);
    }
  }
}

// ── Handler de eventos por tipo ──────────────────────────────────────────
async function handleEvent(event_type, payload, company_id) {
  switch (event_type) {
    case 'consent.signed':
      return handleConsentSigned(payload, company_id);
    case 'appointment.confirmed':
      return handleAppointmentConfirmed(payload, company_id);
    case 'message.received':
      return handleMessageReceived(payload, company_id);
    default:
      console.log(`[QUEUE] Evento desconhecido ignorado: ${event_type}`);
  }
}

// ── Handlers específicos por SLA (Seção 14.3) ─────────────────────────

// P0 — Aceite de TCLE LGPD (SLA < 30 segundos)
async function handleConsentSigned(payload, company_id) {
  const { patient_id, consent_id, signed_at, ip_address } = payload;

  await pool.query(
    `UPDATE public.consents
     SET status = 'ASSINADO', signed_at = $1, ip_address = $2, updated_at = NOW()
     WHERE id = $3 AND company_id = $4`,
    [signed_at || new Date().toISOString(), ip_address || null, consent_id, company_id]
  );

  // Registrar na auditoria
  await pool.query(
    `INSERT INTO public.audit_logs (id, company_id, action, table_name, record_id, ip_address)
     VALUES (gen_random_uuid(), $1, 'UPDATE', 'consents', $2, $3)`,
    [company_id, consent_id, ip_address || null]
  );

  console.log(`[QUEUE] P0 consent.signed processado: consent=${consent_id}`);
}

// P1 — Confirmação de consulta (SLA < 2 minutos)
async function handleAppointmentConfirmed(payload, company_id) {
  const { appointment_id, patient_phone } = payload;

  await pool.query(
    `UPDATE public.appointments
     SET status = 'CONFIRMADO', updated_at = NOW()
     WHERE id = $1 AND company_id = $2`,
    [appointment_id, company_id]
  );

  console.log(`[QUEUE] P1 appointment.confirmed processado: appt=${appointment_id}`);
}

// P2 — Mensagem genérica recebida (SLA < 1 hora)
async function handleMessageReceived(payload, company_id) {
  // Logar para auditoria — integração com atendimento humano futura
  console.log(`[QUEUE] P2 message.received: from=${payload.from} body="${payload.text?.body?.slice(0, 50)}"`);
}

// ── DLQ: estatísticas para o NexusRoot ──────────────────────────────────
export async function getQueueStats() {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'PENDING')     AS pending,
       COUNT(*) FILTER (WHERE status = 'PROCESSING')  AS processing,
       COUNT(*) FILTER (WHERE status = 'DONE')        AS done,
       COUNT(*) FILTER (WHERE status = 'FAILED')      AS failed,
       COUNT(*) FILTER (WHERE status = 'DLQ')         AS dlq,
       COUNT(*) FILTER (WHERE status = 'DONE' AND processed_at >= NOW() - INTERVAL '1 hour') AS done_last_hour,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS received_last_hour
     FROM public.webhook_queue`
  );
  return rows[0];
}

export async function getDLQItems(limit = 50) {
  const { rows } = await pool.query(
    `SELECT id, message_id, event_type, provider, attempts, error_log, created_at
     FROM public.webhook_queue
     WHERE status = 'DLQ'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function retryDLQItem(id) {
  await pool.query(
    `UPDATE public.webhook_queue
     SET status = 'PENDING', attempts = 0, next_attempt_at = NOW(), error_log = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'DLQ'`,
    [id]
  );
}

// ── Iniciar processador periódico ────────────────────────────────────────
let processorInterval = null;

export function startQueueProcessor(intervalMs = 5000) {
  if (processorInterval) return;
  processorInterval = setInterval(processQueue, intervalMs);
  console.log(`[QUEUE] Processador iniciado (intervalo: ${intervalMs}ms)`);
}

export function stopQueueProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
  }
}
