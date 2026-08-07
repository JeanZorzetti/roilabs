// Gera o skeleton estático da carteira que a home do institucional renderiza sem JS.
//
// Por que GERAR e não escrever à mão: espelho escrito à mão foi exatamente o defeito que
// deixou o conserto da API invisível na home (a tela ficava byte-idêntica com a API em 200
// ou em 500). Gerado da MESMA fonte que o seed usa, o espelho só diverge do banco se
// alguém esquecer de rodar o seed — que é uma divergência de dado, não de código.
//
// Por que um script em `app/` e não um import direto no Astro: o Dockerfile do `site` copia
// SÓ a pasta `site/` (`COPY . .` com contexto em site/), então `../app` não existe no build.
// O arquivo gerado é COMMITADO; o Docker nunca precisa deste script.
//
// ⚠️ Build-time fetch continua PROIBIDO no site (o layer do Docker cacheia o `dist`). Este
// script não faz rede: lê `seats.ts` do próprio repositório.
//
//   cd app && npm run gen:carteira
//
// Rodar sempre que `PROJETOS_CADEIRA` mudar — junto com o seed, que aplica o mesmo dado no
// banco. A verdade ao vivo continua vindo de /api/cadeiras no navegador.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SEATS, PROJETOS_CADEIRA } from '../src/lib/seats';
import { rotuloPublico } from '../src/lib/carteira/produto';

// A MESMA regra do seed: projeto cujo `niche` já é cadeira de nicho (a `atma`) não vira card
// próprio — ele ocupa a linha do mapa de Goiânia. Derivar isso daqui evita o card duplicado
// que uma lista escrita à mão produziria na primeira distração.
const nichos = new Set<string>(DEFAULT_SEATS.map((s) => s.niche));
const carteira = PROJETOS_CADEIRA.filter((p) => !nichos.has(p.niche)).map((p, i) => ({
  niche: p.niche,
  estado: p.estado,
  // FR-010a: `rotulo` resolvido, NUNCA `daCasa` — a mesma projeção que /api/cadeiras aplica.
  // Vazar `daCasa` aqui exporia para o HTML a curadoria que a API existe para esconder.
  rotulo: rotuloPublico(p),
  siteUrl: p.siteUrl,
  // `ordem` é o que alinha este card com o índice do array de /api/cadeiras no navegador.
  ordem: DEFAULT_SEATS.length + i,
}));

const destino = fileURLToPath(new URL('../../site/src/data/carteira.ts', import.meta.url));

writeFileSync(
  destino,
  `// ⚠️ ARQUIVO GERADO — não editar à mão. Fonte: app/src/lib/seats.ts (PROJETOS_CADEIRA).
// Regerar com \`cd app && npm run gen:carteira\` e commitar junto.
//
// É o skeleton no-JS das cadeiras de projeto na home. A verdade ao vivo vem de
// /api/cadeiras no navegador, que sobrescreve estes valores a cada carregamento.
export const carteira: {
  niche: string;
  estado: string;
  rotulo: 'casa' | 'parceiro';
  siteUrl: string;
  ordem: number;
}[] = ${JSON.stringify(carteira, null, 2)};
`,
  'utf8'
);

console.log(`gerado ${destino} — ${carteira.length} cadeiras de projeto`);
