// Telegram do dono como terceiro canal do sendAlert (roihub, spec 027). O hub é quem fala com o
// Telegram: aqui o alerta em HTML vira título + linhas de texto, e o hub escapa, corta e monta o
// link na base fixa do ROI Labs. Assim o bot fica com uma credencial só, no hub.
import { log } from './log';

export type AvisoEvento = {
  projeto: 'roilabs';
  titulo: string;
  texto: string;
  caminho?: string;
  acao?: string;
};

export const unescapeHtml = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[m]!);

// Só caminho que a rota do hub aceita (^/[A-Za-z0-9/_-]{0,199}$). Um link com query ou de outro
// domínio fica como texto: com ele o hub devolveria 400 e o aviso inteiro se perderia.
const LINK = /<a\s[^>]*href="https:\/\/app\.roilabs\.com\.br(\/[A-Za-z0-9/_-]{0,199})"[^>]*>([\s\S]*?)<\/a>/i;

const semTags = (s: string) => unescapeHtml(s.replace(/<[^>]+>/g, '')).trim();

export function alertaParaAviso(subject: string, html: string): AvisoEvento {
  // O nome e o valor que vêm depois do " — " já estão no corpo; o título curto cabe na notificação.
  const titulo = semTags(subject.split(' — ')[0]);
  const link = html.match(LINK);
  const corpo = link ? html.replace(link[0], '') : html;

  const texto = corpo
    // Quebra do código-fonte é espaço em HTML; só a do <pre> é linha de verdade.
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, t: string) => `<br>${t.replace(/\n/g, '<br>')}<br>`)
    .replace(/\s+/g, ' ')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>|<\/?(p|h\d|ul|ol|li|div)(\s[^>]*)?>/gi, '\n')
    .split('\n')
    .map(semTags)
    .filter(Boolean)
    .join('\n');

  return link
    ? { projeto: 'roilabs', titulo, texto, caminho: link[1], acao: semTags(link[2]) }
    : { projeto: 'roilabs', titulo, texto };
}

type Env = Record<string, string | undefined>;

// Nunca lança: roda solto dentro do sendAlert, que já é fire-and-forget. O log leva só o nome da
// variável ou o status HTTP, nunca o segredo.
export async function avisarRoihub(aviso: AvisoEvento, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<void> {
  const segredo = env.ROIHUB_CRM_SECRET?.trim();
  if (!segredo) {
    log.warn({}, 'telegram: ROIHUB_CRM_SECRET ausente, aviso não enviado');
    return;
  }
  const base = (env.ROIHUB_CRM_URL?.trim() || 'https://hub.roilabs.com.br').replace(/\/+$/, '');

  try {
    const r = await fetchImpl(`${base}/api/avisos/evento`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${segredo}` },
      body: JSON.stringify(aviso),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) log.error({ status: r.status }, 'telegram: hub recusou o aviso');
  } catch {
    log.error({}, 'telegram: hub inacessível');
  }
}
