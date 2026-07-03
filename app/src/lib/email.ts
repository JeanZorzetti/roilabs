// Resend via fetch — sem SDK (é um único POST). Fire-and-forget por design:
// e-mail nunca bloqueia nem quebra a rota que o dispara (lead/pedido é gravado antes).
// Sem RESEND_API_KEY vira no-op — a infra é opcional até a chave existir na EasyPanel.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? 'ROI Labs <onboarding@resend.dev>';
const ALERT_TO = process.env.ALERT_EMAIL; // alerta interno (Jean/Duda), separado do cliente

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function sendEmail(to: string, subject: string, html: string): void {
  if (!KEY) return;
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
    .then((r) => {
      if (!r.ok) console.error(`email: Resend ${r.status} (${subject})`);
    })
    .catch((e) => console.error('email:', e));
}

// ntfy.sh: push grátis e sem conta — quem assinar o tópico no app ntfy recebe na hora.
// O tópico É o segredo (nome longo/aleatório). Sem NTFY_TOPIC vira no-op, igual ao Resend.
const NTFY_TOPIC = process.env.NTFY_TOPIC;

const unescapeHtml = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[m]!);

// Alerta interno de lead/pedido novo — em high-ticket local, velocidade de resposta é conversão.
// Canais paralelos: e-mail (Resend) + push (ntfy) — cada um no-op sem a própria env var.
export function sendAlert(subject: string, html: string): void {
  if (ALERT_TO) sendEmail(ALERT_TO, subject, html);
  if (!NTFY_TOPIC) return;
  fetch('https://ntfy.sh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: NTFY_TOPIC,
      title: subject,
      message: unescapeHtml(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
      click: html.match(/href="([^"]+)"/)?.[1], // primeiro link do alerta (abrir no admin)
    }),
  })
    .then((r) => {
      if (!r.ok) console.error(`ntfy: HTTP ${r.status} (${subject})`);
    })
    .catch((e) => console.error('ntfy:', e));
}
