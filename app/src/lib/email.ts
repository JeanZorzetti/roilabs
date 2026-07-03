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

// Alerta interno de lead/pedido novo — em high-ticket local, velocidade de resposta é conversão.
export function sendAlert(subject: string, html: string): void {
  if (ALERT_TO) sendEmail(ALERT_TO, subject, html);
}
