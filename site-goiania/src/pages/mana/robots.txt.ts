import type { APIRoute } from 'astro';

// robots.txt PRÓPRIO da Maná (015 T019) — o root do nginx é compartilhado com o
// goiania, então `mana.roilabs.com.br/robots.txt` precisa da sua própria versão
// (senão serviria o robots do porcelanato, com o Sitemap: do host errado).
// Mesma allowlist de crawlers de IA que o goiania já usa (playbook GEO/AEO).
const body = `User-agent: *
Allow: /

Sitemap: https://mana.roilabs.com.br/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Gemini-Bot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: meta-externalagent
Allow: /
`;

export const GET: APIRoute = () => {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
