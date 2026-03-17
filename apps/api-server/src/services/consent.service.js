import crypto from 'crypto';
import { sendConsentTerm } from './whatsapp.service.js';
import { pool, withTenantContext } from '../config/db.js';

// Texto canônico do termo por versão — em produção viria do banco
const TERM_TEXTS = {
  '1.0': `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE) — Versão 1.0

Eu, paciente identificado abaixo, autorizo o tratamento dos meus dados
pessoais e de saúde pela clínica contratante da plataforma Nexus, para
fins de prestação de serviços médicos, gestão de prontuário eletrônico
e comunicações relacionadas ao meu atendimento, conforme a Lei Geral de
Proteção de Dados (LGPD — Lei 13.709/2018).

Dados tratados: nome, CPF, data de nascimento, telefone, e-mail,
histórico de consultas e procedimentos realizados.

Prazo de guarda: mínimo de 20 anos, conforme exigência do CFM.

Direitos garantidos: acesso, correção, portabilidade e revogação deste
consentimento a qualquer momento, mediante solicitação.`,
};

/**
 * Gera o hash SHA-256 do texto do termo
 * Garante não-repúdio: o paciente assinou exatamente este texto
 */
function hashTermText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * createConsent — cria registro de consentimento no banco
 * Retorna { consent } ou { error, status }
 */
export async function createConsent({
  company_id,
  patient_id,
  channel,
  term_version,
  created_by,
  ip_address,
}) {
  const termText = TERM_TEXTS[term_version];

  if (!termText) {
    return { error: `Versão de termo '${term_version}' não encontrada.`, status: 400 };
  }

  const termTextHash = hashTermText(termText);

  // Calcula expiração: 30 dias para assinar
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const client = await pool.connect();

  try {
    // Verifica se já existe consentimento pendente ou assinado para esta versão
    const existing = await withTenantContext(client, company_id, (c) =>
      c.query(
        `SELECT id, status FROM consents
         WHERE patient_id = $1
           AND term_version = $2
           AND status IN ('PENDENTE', 'ASSINADO')
         LIMIT 1`,
        [patient_id, term_version]
      )
    );

    if (existing.rowCount > 0) {
      const c = existing.rows[0];
      if (c.status === 'ASSINADO') {
        return {
          error: 'Paciente já possui consentimento assinado para esta versão.',
          status: 409,
        };
      }
      // Se PENDENTE, retorna o existente sem criar duplicata
      return { consent: c };
    }

    const result = await withTenantContext(client, company_id, (c) =>
      c.query(
        `INSERT INTO consents
           (id, company_id, patient_id, term_version, term_text_hash,
            channel, status, ip_address, expires_at, created_by)
         VALUES
           (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDENTE', $6, $7, $8)
         RETURNING id, patient_id, term_version, channel, status, expires_at, created_at`,
        [
          company_id,
          patient_id,
          term_version,
          termTextHash,
          channel,
          ip_address,
          expiresAt,
          created_by,
        ]
      )
    );

    return { consent: result.rows[0] };
  } finally {
    client.release();
  }
}

/**
 * sendConsent — despacha o termo via canal configurado
 * Em produção: integra WhatsApp Business API (Twilio) ou serviço de e-mail
 * Aqui: stub que loga o envio e simula sucesso
 */
export async function sendConsent(consent) {
  console.log(
    `[consent] Enviando termo ${consent.id} via ${consent.channel} para patient ${consent.patient_id}`
  );

  // TODO: integrar WhatsApp Business API
  // if (consent.channel === 'WHATSAPP') {
  //   await whatsappClient.sendTemplate({
  //     to: patient.phone,
  //     template: 'nexus_consent_v1',
  //     params: [consentLink],
  //   });
  // }

  return { sent: true };
}

/**
 * signConsent — registra a assinatura do paciente (chamado pelo webhook ou portal)
 * Salva: IP, geolocalização, timestamp NTP e gera PDF snapshot
 */
export async function signConsent({ consent_id, company_id, ip_address, geolocation }) {
  const client = await pool.connect();

  try {
    const result = await withTenantContext(client, company_id, (c) =>
      c.query(
        `UPDATE consents
         SET status = 'ASSINADO',
             signed_at = NOW(),
             ip_address = $2,
             geolocation = $3
         WHERE id = $1
           AND status = 'PENDENTE'
           AND expires_at > NOW()
         RETURNING id, patient_id, term_version, status, signed_at`,
        [consent_id, ip_address, geolocation ? JSON.stringify(geolocation) : null]
      )
    );

    if (result.rowCount === 0) {
      return { error: 'Consentimento não encontrado, já assinado ou expirado.', status: 400 };
    }

    // TODO: gerar PDF snapshot via @nexus/legal-core e salvar no cold storage

    return { consent: result.rows[0] };
  } finally {
    client.release();
  }
}
