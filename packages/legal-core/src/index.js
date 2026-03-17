/**
 * @nexus/legal-core
 * Motor LGPD compartilhado entre api-server e web-portal
 *
 * Exporta:
 *   - hashTermText    — SHA-256 do texto do termo (garante não-repúdio)
 *   - isConsentValid  — verifica se um consentimento está ativo e não expirado
 *   - TERM_VERSIONS   — catálogo de versões de termos disponíveis
 */

import crypto from 'crypto';

export * from './pdf.service.js';
export * from './template-tags.js';

export const TERM_VERSIONS = {
  '1.0': {
    label: 'TCLE Padrão v1.0',
    effective_from: '2026-01-01',
  },
};

/**
 * Gera SHA-256 do texto do termo
 * Usado para garantir que o paciente assinou exatamente este texto
 */
export function hashTermText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Verifica se um registro de consentimento está válido para liberar atendimento
 */
export function isConsentValid(consent) {
  if (!consent) return false;
  if (consent.status !== 'ASSINADO') return false;
  if (consent.expires_at && new Date(consent.expires_at) < new Date()) return false;
  if (consent.revoked_at) return false;
  return true;
}

/**
 * Retorna o prazo legal de resposta a solicitações do titular (15 dias — LGPD Art. 18)
 */
export function getHolderRequestDeadline(from = new Date()) {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + 15);
  return deadline;
}
