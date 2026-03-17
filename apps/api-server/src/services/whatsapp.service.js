/**
 * Nexus WhatsApp Service
 *
 * Responsável pelo ENVIO de mensagens WhatsApp para os pacientes.
 * Suporta dois provedores (BSP) conforme Seção 14.4:
 *   - Meta Cloud API (padrão)
 *   - Twilio WhatsApp
 *
 * Tipos de mensagem suportados:
 *   - Termo de consentimento LGPD (TCLE) — botões Aceitar/Recusar
 *   - Lembrete de consulta — com botão Confirmar
 *   - Mensagem de texto simples
 */

const PROVIDER = process.env.WHATSAPP_BSP_PROVIDER || 'meta';
const META_TOKEN = process.env.WHATSAPP_API_KEY;
const META_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const META_API_URL = `https://graph.facebook.com/v19.0/${META_PHONE_ID}/messages`;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM;

// ── Utilitários ──────────────────────────────────────────────────────────

function sanitizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

async function metaSend(payload) {
  if (!META_TOKEN || !META_PHONE_ID) {
    console.log(
      '[WHATSAPP] Meta não configurado — simulando envio:',
      JSON.stringify(payload).slice(0, 120)
    );
    return { messageId: `sim-${Date.now()}`, provider: 'meta-simulated' };
  }

  const res = await fetch(META_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${META_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Meta API error ${res.status}: ${JSON.stringify(data.error)}`);
  }

  return { messageId: data.messages?.[0]?.id, provider: 'meta' };
}

async function twilioSend(to, body) {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.log('[WHATSAPP] Twilio não configurado — simulando envio para:', to);
    return { messageId: `sim-${Date.now()}`, provider: 'twilio-simulated' };
  }

  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;

  const form = new URLSearchParams({
    From: `whatsapp:${TWILIO_FROM}`,
    To: `whatsapp:+${sanitizePhone(to)}`,
    Body: body,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${data.message}`);

  return { messageId: data.sid, provider: 'twilio' };
}

// ── API Pública ──────────────────────────────────────────────────────────

/**
 * Enviar termo de consentimento LGPD (TCLE)
 * Cria mensagem interativa com botões Aceitar / Recusar
 */
export async function sendConsentTerm({ to, patientName, consentId, termVersion, clinicName }) {
  const phone = sanitizePhone(to);
  if (!phone) throw new Error('Número de telefone inválido.');

  if (PROVIDER === 'twilio') {
    const body = [
      `Olá, *${patientName}*! 👋`,
      ``,
      `A *${clinicName}* solicita seu consentimento para o uso dos seus dados de saúde conforme a LGPD (Lei 13.709/2018).`,
      ``,
      `📄 Versão do termo: ${termVersion}`,
      ``,
      `Responda:`,
      `*1* - Aceito o termo`,
      `*2* - Recuso o termo`,
      ``,
      `ID do consentimento: ${consentId}`,
    ].join('\n');

    return twilioSend(phone, body);
  }

  // Meta Cloud API — mensagem interativa com botões
  return metaSend({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      header: {
        type: 'text',
        text: `Termo de Consentimento — ${clinicName}`,
      },
      body: {
        text: `Olá, *${patientName}*! A ${clinicName} solicita seu consentimento para uso dos seus dados de saúde conforme a LGPD.\n\nVersão do termo: *${termVersion}*\n\nAo aceitar, você autoriza o uso dos seus dados para fins de atendimento médico.`,
      },
      footer: {
        text: 'Nexus Platform • Compliance LGPD',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: { id: `consent_sign_${consentId}`, title: '✅ Aceito' },
          },
          {
            type: 'reply',
            reply: { id: `consent_refuse_${consentId}`, title: '❌ Recuso' },
          },
        ],
      },
    },
  });
}

/**
 * Enviar lembrete de consulta
 * SLA P1 — confirmação de agendamento (< 2 minutos)
 */
export async function sendAppointmentReminder({
  to,
  patientName,
  appointmentId,
  dateTime,
  professionalName,
  clinicName,
}) {
  const phone = sanitizePhone(to);
  if (!phone) throw new Error('Número de telefone inválido.');

  const dateFormatted = new Date(dateTime).toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (PROVIDER === 'twilio') {
    const body = [
      `Olá, *${patientName}*! 📅`,
      ``,
      `Lembramos que você tem uma consulta agendada:`,
      ``,
      `📍 *${clinicName}*`,
      `👨‍⚕️ *${professionalName || 'Profissional a definir'}*`,
      `🕐 *${dateFormatted}*`,
      ``,
      `Responda *SIM* para confirmar ou *NÃO* para cancelar.`,
    ].join('\n');

    return twilioSend(phone, body);
  }

  return metaSend({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `Olá, *${patientName}*! 📅\n\nSua consulta está confirmada:\n\n📍 ${clinicName}\n👨‍⚕️ ${professionalName || 'A definir'}\n🕐 ${dateFormatted}\n\nDeseja confirmar sua presença?`,
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: `appt_confirm_${appointmentId}`, title: '✅ Confirmar' } },
          { type: 'reply', reply: { id: `appt_cancel_${appointmentId}`, title: '❌ Cancelar' } },
        ],
      },
    },
  });
}

/**
 * Enviar mensagem de texto simples
 */
export async function sendTextMessage({ to, message }) {
  const phone = sanitizePhone(to);
  if (!phone) throw new Error('Número de telefone inválido.');

  if (PROVIDER === 'twilio') {
    return twilioSend(phone, message);
  }

  return metaSend({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message },
  });
}
