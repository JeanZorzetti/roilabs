---
tipo: plano
status: em revisão
data: 2026-09-23
dono: Jean (dev)
---

# nimblabs.com: plano de implementação da etapa 1

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans` para executar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** colocar no ar, em 06/10/2026, o site institucional novo da nimblabs: home, produtos, sob medida,
contato e privacidade. O site vende pelo WhatsApp e precisa ser encontrado pelo Google e pelas IAs.

**Arquitetura:**
- Astro gera HTML estático. Só `/contato` roda no servidor, porque recebe o formulário e envia o e-mail pelo Brevo.
- O conteúdo mora em arquivos TypeScript tipados. Uma trava de publicação, coberta por teste, impede que uma página vá ao ar sem os dados dela.
- Um único interruptor, `PUBLIC_AMBIENTE`, separa homologação de produção. Em homologação os rascunhos aparecem e toda página leva `noindex`; em produção, só entra o que está publicado.

**Stack:** Astro 5+, `@astrojs/vercel`, `@astrojs/sitemap`, `astro:env`, Vitest, `@astrojs/check`, Brevo (API de e-mail transacional), GA4 só com consentimento, Vercel Hobby, GitHub privado.

**Especificação:** [[nimblabs-site-design-2026-09-22]] (`Docs/Obsidian/80-dev/nimblabs-site-design-2026-09-22.md`). O plano parte dela; leia as duas.

## Restrições globais

Valem para todas as tarefas.

**Conteúdo e URLs**
- Só PT-BR, com `<html lang="pt-BR">`.
- URLs fixas: `/`, `/portal-do-cliente`, `/saneamento-cadastro-fiscal`, `/integracao-de-sistemas`, `/crm-para-agencias`, `/software-sob-medida`, `/contato`, `/privacidade`. O canonical é `https://nimblabs.com/<slug>`, sem barra no final.
- Um único texto de CTA, exatamente "Falar no WhatsApp". Cada página abre o WhatsApp com a mensagem dela (`https://wa.me/55<número>?text=<mensagem>`).
- Preço sempre como "a partir de", junto com o que faz o valor subir.
- Nada inventado: nenhum número, logo ou depoimento. Nenhuma tela mostra A, B ou D como prontos. Protótipo leva o selo "Protótipo" e exemplo leva o selo "Exemplo".
- Toda afirmação fiscal passa pelo contador parceiro e cita a fonte antes de ir ao ar.
- Vagas de piloto só com número real. A faixa da reforma tributária fica no ar só até 31/12/2026.
- Nos dados estruturados, dado ausente fica fora do bloco, nunca como placeholder.

**Desempenho e acessibilidade**
- Limite de peso (faixa "marca"): JS adicionado até 80 kb gzip, LCP até 2,5 s em 4G com CPU 4×, INP até 200 ms, CLS até 0,1.
- No máximo 2 famílias de fonte, servidas pelo próprio site (woff2, `font-display: swap`).
- WCAG 2.2 AA: contraste de 4,5:1, foco visível, tudo operável por teclado, rótulo acima do campo, erro ao lado do campo, `autocomplete`, `prefers-reduced-motion`. Funciona a partir de 360 px, com alvos de toque de pelo menos 44 px.
- O GA4 só carrega depois do aceite e só no host `nimblabs.com`.

**Onde mexer**
- O código fica em `C:\dev\nimblabs`, no repositório privado `JeanZorzetti/nimblabs-site` e no projeto Vercel `nimblabs-site` (time Hobby `jean-zorzettis-projects`).
- Antes da Tarefa 19, não tocar na pasta `ROI Labs\nimblabs`, no repositório `JeanZorzetti/nimblabs` nem no projeto Vercel `nimblabs`.
- Até o lançamento, `main` publica só em `https://nimblabs-site.vercel.app` (homologação). Depois do lançamento, `main` é o site no ar e qualquer mudança vai por branch.
- Mensagens de commit em inglês, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Skills (regra do CLAUDE.md)**
- Antes de escrever código ou texto de interface, anuncie "Usando `X` para Y" e invoque a skill da disciplina: `logo-design`, `art-direction`, `design-systems`, `conversion-copy`, `ux-writing`, `accessibility`, `responsive-design`, `motion-design`, `seo-geo` ou `ui-verification`.

## Foco de revisão

1. **Falha no envio do formulário** (Brevo fora do ar ou rede caída): o texto digitado continua na tela, com a saída pelo WhatsApp. Teste na Tarefa 11: `processarContato` com um envio que falha.
2. **Número de WhatsApp configurado com máscara** ("+55 (11) 9…"): o build falha com mensagem clara, em vez de publicar um link quebrado. Teste na Tarefa 4.
3. **Interruptor errado no lançamento** (site no ar com `noindex` ou com rascunho visível): contrato do build na Tarefa 12 (homologação sempre `noindex` e rascunho sempre com selo) e checagem com `curl` na Tarefa 19.
4. **GA4 onde não deve** (visitante recusou, ou abriu pela homologação ou pelo localhost): o GA4 nunca carrega. Teste na Tarefa 4 (`deveCarregarGa`).
5. **JavaScript bloqueado ou com erro:** o menu continua com todos os links visíveis no HTML. Contrato do build na Tarefa 12.

## Ordem e esperas

1 → 2 (espera o Jean) → 4 → 5 → 6 → 7 (precisa da marca aprovada) → 8 → 9 → 10 → 11 → 12 → 13.

A Tarefa 3 (espera o Jean) roda em paralelo, logo depois da 2. Depois: 14 (precisa da 3 e da 9) → 15 → 16. A 17 anda conforme os dados chegam. Por fim, 18 e 19.

Datas-alvo da especificação: marca em 23/09, direções em 24/09, home em 28/09, demais páginas em 02/10, verificação em 05/10 e lançamento em 06/10.

---

### Tarefa 1: Projeto base, repositório e homologação na Vercel

**Arquivos:**
- Criar: `C:\dev\nimblabs\` (template minimal), `tests/dist/helpers.ts`, `tests/dist/base.test.ts`
- Alterar: `astro.config.mjs`, `package.json`, `src/pages/index.astro`

**Interfaces:**
- Produz: `raizDist`, `lerArquivo(nome)` e `lerHtml(caminho)` em `tests/dist/helpers.ts`; scripts `test`, `test:dist`, `checar-lancamento` e `verificar`.

- [ ] **Passo 1: criar o projeto**

```powershell
cd C:\dev
npm create astro@latest nimblabs -- --template minimal --install --git --skip-houston --yes
cd C:\dev\nimblabs
npx astro add vercel sitemap --yes
npm install -D vitest @astrojs/check typescript
```

- [ ] **Passo 2: `astro.config.mjs` (substituir inteiro)**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nimblabs.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: vercel(),
  integrations: [sitemap()],
});
```

- [ ] **Passo 3: scripts no `package.json`** (manter `dev`, `build` e `preview` do template)

```json
"check": "astro check",
"test": "vitest run tests/unit",
"test:dist": "vitest run tests/dist",
"checar-lancamento": "vitest run tests/lancamento",
"verificar": "astro check && vitest run tests/unit && astro build && vitest run tests/dist"
```

- [ ] **Passo 4: helpers e teste que falha**

`tests/dist/helpers.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The Vercel adapter may write static files to either place; take the first that exists.
const candidatas = ['.vercel/output/static', 'dist/client', 'dist'];
const achada = candidatas.find((p) => existsSync(join(p, 'index.html')));
if (!achada) throw new Error('Rode `npm run build` antes de `npm run test:dist`.');

export const raizDist = achada;
export const lerArquivo = (nome: string) => readFileSync(join(raizDist, nome), 'utf8').replace(/\r\n/g, '\n');
export const lerHtml = (caminho: string) => lerArquivo(caminho === '/' ? 'index.html' : `${caminho.slice(1)}.html`);
```

`tests/dist/base.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lerHtml } from './helpers';

describe('base', () => {
  it('a home sai em português', () => {
    expect(lerHtml('/')).toContain('<html lang="pt-BR"');
  });
});
```

- [ ] **Passo 5: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL, porque o template usa `lang="en"`.

- [ ] **Passo 6: home temporária** (a Tarefa 7 troca pelo layout). `src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>nimblabs</title>
  </head>
  <body><h1>nimblabs</h1></body>
</html>
```

- [ ] **Passo 7: ver passar**

Rode `npm run build; npm run test:dist`. Esperado: PASS.

- [ ] **Passo 8: repositório privado e primeiro push**

Confira que o `.gitignore` do template cobre `.env`, `.vercel` e `dist`.

```powershell
git add -A
git commit -m "chore: astro skeleton with vercel adapter, sitemap and vitest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
gh repo create JeanZorzetti/nimblabs-site --private --source . --remote origin --push
```

- [ ] **Passo 9: projeto Vercel NOVO**

⚠️ Nunca rode `vercel link` sem `--project`. Com o nome da pasta ("nimblabs"), ele liga no projeto do site antigo, e o próximo push publica por cima do nimblabs.com.

```powershell
vercel project add nimblabs-site
vercel link --yes --project nimblabs-site
vercel git connect
vercel project ls
```

Esperado: `nimblabs-site` aparece na lista e existe `.vercel/project.json`.

- [ ] **Passo 10: primeira publicação e conferência**

```powershell
git commit --allow-empty -m "chore: first vercel deployment" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
vercel ls nimblabs-site
curl.exe -sI https://nimblabs-site.vercel.app/
```

Esperado: status 200. Se o endereço de produção for outro, use o que o `vercel ls` mostrar e troque em todo o plano.

---

### Tarefa 2: Marca (`logo-design`), com aprovação do Jean

**Arquivos:**
- Criar: `src/components/Logo.astro`, `src/components/Wordmark.astro`, `src/components/Marca.astro`, `public/icon.svg`, `public/apple-touch-icon.png`, `public/og.png`, `tests/unit/marca.test.ts`

**Interfaces:**
- Produz `<Marca class?: string />`: símbolo e nome juntos, em SVG com `role="img"`, `aria-label="nimblabs"` e `fill="currentColor"`.
- Produz também `<Logo />` (só o símbolo) e `<Wordmark />` (só o nome). As Tarefas 7 e 15 dependem desses nomes.

- [ ] **Passo 1: teste que falha.** `tests/unit/marca.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

function png(caminho: string) {
  const b = readFileSync(caminho);
  expect(b.subarray(1, 4).toString()).toBe('PNG');
  // IHDR: width at byte 16, height at 20, colour type at 25 (2 = RGB without alpha)
  return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20), tipoCor: b[25] };
}

describe('marca', () => {
  it('apple-touch-icon: 180×180 sem transparência', () => {
    expect(png('public/apple-touch-icon.png')).toEqual({ largura: 180, altura: 180, tipoCor: 2 });
  });
  it('imagem de compartilhamento: 1200×630', () => {
    const d = png('public/og.png');
    expect([d.largura, d.altura]).toEqual([1200, 630]);
  });
  it('icon.svg com cor fixa e modo escuro no próprio arquivo', () => {
    const s = readFileSync('public/icon.svg', 'utf8');
    expect(s).toMatch(/prefers-color-scheme:\s*dark/);
    expect(s).not.toContain('currentColor');
  });
  it.each(['Logo', 'Wordmark', 'Marca'])('%s: path com currentColor e nome acessível, sem fonte', (nome) => {
    const s = readFileSync(`src/components/${nome}.astro`, 'utf8');
    expect(s).toContain('fill="currentColor"');
    expect(s).toContain('role="img"');
    expect(s).toContain('aria-label="nimblabs"');
    expect(s).not.toMatch(/font-family/);
  });
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm test`. Esperado: FAIL, porque os arquivos ainda não existem.

- [ ] **Passo 3: gerar a marca.** "Usando `logo-design` para a marca da nimblabs." Invoque a skill e siga os Passos 0 a 6 com os dados da seção 5 da especificação:
  - formato: nome desenhado como marca, com símbolo para favicon e ícone;
  - ideia a testar: a mesma peça repetida, com uma peça sob medida;
  - testes: 16 px, uma cor, fundo claro e escuro, teste "Acme" e print de 32 px;
  - o script gerador fica no scratchpad e nunca vai para o repositório.

- [ ] **Passo 4: gerar os PNGs** a partir dos SVGs aprovados. Script descartável no scratchpad, rodado com `npm i sharp` lá dentro:

```js
// rasterizar.mjs — throwaway, lives in the scratchpad, never committed
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const destino = 'C:/dev/nimblabs/public';
const icone = readFileSync('icone-solido.svg'); // solid, simplified mark from logo-design step 4
const og = readFileSync('og.svg');              // 1200x630 composition, mark >= 25% of the height

await sharp(icone, { density: 1200 })
  .resize(136, 136)
  .extend({ top: 22, bottom: 22, left: 22, right: 22, background: '#ffffff' }) // ~12% margin: iOS crops to a squircle
  .flatten({ background: '#ffffff' })
  .png({ palette: false })
  .toFile(`${destino}/apple-touch-icon.png`);

await sharp(og, { density: 300 }).resize(1200, 630).flatten({ background: '#ffffff' }).png().toFile(`${destino}/og.png`);
```

- [ ] **Passo 5: ver passar**

Rode `npm test`. Esperado: PASS.

- [ ] **Passo 6: mostrar ao Jean e PARAR**

Formato do Passo 6 da skill: a escolhida em 3 tamanhos, aplicada no cabeçalho e no favicon, mais 2 descartadas com o motivo de cada. Se ele recusar, volte ao Passo 1 da skill; mexer em parâmetro não conserta forma.

- [ ] **Passo 7: commit, só depois do ok**

```powershell
git add src/components/Logo.astro src/components/Wordmark.astro src/components/Marca.astro public/icon.svg public/apple-touch-icon.png public/og.png tests/unit/marca.test.ts
git commit -m "feat: nimblabs brand mark, favicon, touch icon and share image" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Tarefa 3: Três direções visuais (`art-direction`, passos 0 a 3), com escolha do Jean

**Arquivos:**
- Criar no vault: `Docs/Obsidian/80-dev/nimblabs-direcao-visual-2026-09-24.md`

**Interfaces:**
- Produz: o nome da direção escolhida e o manifesto dela (as 7 linhas), que a Tarefa 14 usa.

- [ ] **Passo 1: pré-voo.** "Usando `art-direction` para a direção visual da nimblabs." Registre:
  - stack: Astro estático, sem framework de ilha;
  - dependências: o `package.json` da Tarefa 1;
  - `.art/log.json` ainda não existe;
  - `references/gosto.md` lido.

- [ ] **Passo 2: contexto.** Declare a inferência a partir da seção 5 da especificação:
  - quem abre: comprador B2B brasileiro vindo do Google ou de uma IA, e o prospecto que pesquisa a empresa depois de ser abordado;
  - o que é vendido: portal do cliente, cadastro fiscal, integração, CRM e sob medida;
  - tom: as 3 coisas que o site não pode parecer;
  - material próprio: nota fiscal, tabela com NCM e cClassTrib, telas, dado passando entre sistemas.

- [ ] **Passo 3: pesquisa.** Pergunte ao Jean, em uma linha: "Quer referência do próprio setor (software houses) ou só de fora?" Depois abra pelo menos 3 referências de verdade, uma delas de fora da web.

- [ ] **Passo 4: três direções** no formato de 7 linhas da skill:
  - uma delas derivada do material próprio;
  - a linha `Risco:` da derivada precisa dizer como ela evita repetir o formulário e o carimbo do e-NR1;
  - aplique os 5 filtros do Passo 3 da skill.

- [ ] **Passo 5: mostrar ao Jean e PARAR.** Nada é construído antes da escolha.

- [ ] **Passo 6: registrar a escolha.** Crie a nota no vault com as 3 direções na íntegra, a escolhida, o motivo e a data. Faça commit só desse arquivo em `ROI Labs/ROI Labs`, sem push.

---

### Tarefa 4: Núcleo em TypeScript: tipos, funções puras e trava de publicação

**Arquivos:**
- Criar: `src/data/tipos.ts`, `src/lib/whatsapp.ts`, `src/lib/preco.ts`, `src/lib/faixa.ts`, `src/lib/consentimento.ts`, `src/lib/publicacao.ts`
- Testes: `tests/unit/whatsapp.test.ts`, `tests/unit/preco.test.ts`, `tests/unit/faixa.test.ts`, `tests/unit/consentimento.test.ts`, `tests/unit/publicacao.test.ts`

**Interfaces (as tarefas seguintes usam exatamente estes nomes):**
- `linkWhatsApp(numero: string, mensagem: string): string`
- `reais(valor: number, emMil?: boolean): string` e `textoPreco(preco: Preco): string`
- `FIM_FAIXA_REFORMA: Date` e `faixaReformaVisivel(agora?: Date): boolean`
- `type Escolha`, `HOST_PRODUCAO`, `deveCarregarGa(id, host, escolha)` e `deveMostrarAviso(id, host, escolha)`
- `palavras(texto): number`, `pendencias(p: Produto): string[]` e `pendenciasPagina(p: PaginaFixa | SobMedida): string[]`
- Tipos: `Faq`, `Preco`, `LinhaExemplo`, `Prova`, `Seo`, `Produto`, `PaginaFixa`, `SobMedida`, `Socio`, `Empresa`

- [ ] **Passo 1: testes que falham**

`tests/unit/whatsapp.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { linkWhatsApp } from '../../src/lib/whatsapp';

describe('linkWhatsApp', () => {
  it('monta o link com a mensagem codificada', () => {
    expect(linkWhatsApp('5511999998888', 'Olá! Vim pela página de cadastro fiscal.')).toBe(
      'https://wa.me/5511999998888?text=Ol%C3%A1!%20Vim%20pela%20p%C3%A1gina%20de%20cadastro%20fiscal.',
    );
  });
  it('recusa número com máscara ou sem o 55, com mensagem que diz o que fazer', () => {
    expect(() => linkWhatsApp('+55 (11) 99999-8888', 'x')).toThrow(/só dígitos, com 55 e DDD/);
    expect(() => linkWhatsApp('11999998888', 'x')).toThrow(/só dígitos, com 55 e DDD/);
  });
});
```

`tests/unit/preco.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { reais, textoPreco } from '../../src/lib/preco';

describe('preço', () => {
  it('entrada em mil e mensalidade por extenso, com espaço que não quebra', () => {
    expect(textoPreco({ entrada: 25000, mensal: 2500, fatorVariavel: 'do número de itens no cadastro' })).toBe(
      'a partir de R$\u00a025\u00a0mil + R$\u00a02.500/mês',
    );
  });
  it('valor quebrado não vira "mil"', () => {
    expect(reais(12500, true)).toBe('R$\u00a012.500');
    expect(reais(600)).toBe('R$\u00a0600');
  });
});
```

`tests/unit/faixa.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { faixaReformaVisivel } from '../../src/lib/faixa';

describe('faixa da reforma', () => {
  it('aparece até o último segundo de 2026 em Brasília', () => {
    expect(faixaReformaVisivel(new Date('2026-12-31T23:59:59-03:00'))).toBe(true);
    expect(faixaReformaVisivel(new Date('2027-01-01T02:59:59Z'))).toBe(true);
  });
  it('some à meia-noite de 01/01/2027 em Brasília', () => {
    expect(faixaReformaVisivel(new Date('2027-01-01T00:00:00-03:00'))).toBe(false);
  });
});
```

`tests/unit/consentimento.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deveCarregarGa, deveMostrarAviso } from '../../src/lib/consentimento';

const ID = 'G-TESTE123';

describe('consentimento', () => {
  it('GA4 só com aceite, só no domínio e só com ID', () => {
    expect(deveCarregarGa(ID, 'nimblabs.com', 'aceito')).toBe(true);
    expect(deveCarregarGa(ID, 'nimblabs.com', 'recusado')).toBe(false);
    expect(deveCarregarGa(ID, 'nimblabs.com', null)).toBe(false);
    expect(deveCarregarGa(ID, 'nimblabs-site.vercel.app', 'aceito')).toBe(false);
    expect(deveCarregarGa(ID, 'localhost', 'aceito')).toBe(false);
    expect(deveCarregarGa(undefined, 'nimblabs.com', 'aceito')).toBe(false);
  });
  it('aviso só no domínio, com ID e sem escolha feita', () => {
    expect(deveMostrarAviso(ID, 'nimblabs.com', null)).toBe(true);
    expect(deveMostrarAviso(ID, 'nimblabs.com', 'recusado')).toBe(false);
    expect(deveMostrarAviso(ID, 'nimblabs-site.vercel.app', null)).toBe(false);
  });
});
```

`tests/unit/publicacao.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Produto } from '../../src/data/tipos';
import { palavras, pendencias, pendenciasPagina } from '../../src/lib/publicacao';

const texto = (n: number) => Array.from({ length: n }, () => 'palavra').join(' ');
const faq = (n = 5) => Array.from({ length: n }, (_, i) => ({ pergunta: `Pergunta ${i}?`, resposta: texto(45) }));

function produto(extra: Partial<Produto> = {}): Produto {
  return {
    slug: 'integracao-de-sistemas',
    nomeMenu: 'Integrações',
    publicado: false,
    seo: { titulo: 'Integração de sistemas', descricao: texto(12) },
    h1: 'h1',
    promessa: 'promessa',
    mensagemWhatsApp: 'mensagem',
    cardHome: 'card',
    problema: 'problema',
    passos: ['a', 'b', 'c'],
    entregaveis: ['e'],
    faq: faq(),
    aConfirmar: [],
    prazo: 'até 30 dias',
    prova: { tipo: 'antes-depois', antes: 'a', depois: 'd', conta: 'c' },
    preco: { entrada: 6000, mensal: 400, fatorVariavel: 'do número de sistemas' },
    ...extra,
  };
}

describe('trava de publicação', () => {
  it('produto completo não tem pendência', () => expect(pendencias(produto())).toEqual([]));
  it('sem preço, sem prazo e sem prova', () => {
    const p = pendencias(produto({ preco: undefined, prazo: undefined, prova: undefined }));
    expect(p).toEqual(expect.arrayContaining(['preço de entrada (insumo 3)', 'prazo de entrega (insumo 12)', 'prova']));
  });
  it('resposta fora de 40 a 60 palavras', () => {
    const p = pendencias(produto({ faq: [...faq(4), { pergunta: 'Curta?', resposta: texto(30) }] }));
    expect(p).toContain('resposta de "Curta?" tem 30 palavras (precisa de 40 a 60)');
  });
  it('item a confirmar bloqueia', () => {
    expect(pendencias(produto({ aConfirmar: ['preço (insumo 3)'] }))).toContain('preço (insumo 3)');
  });
  it('B sem revisão do contador, A sem piloto, C sem pares', () => {
    expect(pendencias(produto({ exigeRevisaoFiscal: true }))).toContain('revisão do contador parceiro (insumo 6)');
    expect(pendencias(produto({ exigePiloto: true }))).toContain('vagas e desconto do piloto (insumo 7)');
    expect(pendencias(produto({ exigeParesDeSistemas: true }))).toContain('pares de sistemas aceitos (insumo 5)');
  });
  it('resposta que cita preço diferente do bloco de preço', () => {
    const errada = { pergunta: 'Quanto custa?', resposta: `A entrada começa em R$ 9 mil. ${texto(40)}` };
    const certa = { pergunta: 'Quanto custa?', resposta: `A entrada começa em R$ 6 mil. ${texto(40)}` };
    expect(pendencias(produto({ faq: [...faq(4), errada] }))).toContain('resposta de "Quanto custa?" cita preço diferente de R$ 6 mil');
    expect(pendencias(produto({ faq: [...faq(4), certa] }))).toEqual([]);
  });
  it('sob medida sem preço mínimo', () => {
    const pagina = { seo: produto().seo, h1: 'h', promessa: 'p', mensagemWhatsApp: 'm', passos: ['a', 'b', 'c'] as [string, string, string], faq: faq(), aConfirmar: [], tipos: [] };
    expect(pendenciasPagina(pagina)).toContain('preço mínimo do sob medida (insumo 3)');
  });
  it('conta palavras ignorando espaços extras', () => expect(palavras('  a  b ')).toBe(2));
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm test`. Esperado: FAIL, com os módulos ainda inexistentes.

- [ ] **Passo 3: implementar**

`src/data/tipos.ts`:

```ts
import type { ImageMetadata } from 'astro';

export type Faq = {
  pergunta: string;
  /** Self-contained answer, 40 to 60 words: AI engines quote it without the rest of the page. */
  resposta: string;
  /** Source for tax statements, filled after the partner accountant's review. */
  fonte?: { nome: string; url: string };
};

export type Preco = {
  /** One-off entry price, BRL. */
  entrada: number;
  /** Monthly price, BRL. */
  mensal: number;
  /** Completes "O valor depende …", e.g. "do número de itens no cadastro". */
  fatorVariavel: string;
};

export type LinhaExemplo = { item: string; codigoAtual: string; codigoSugerido: string; motivo: string };

export type Prova =
  | { tipo: 'prototipo'; imagem: ImageMetadata; alt: string }
  | { tipo: 'exemplo-relatorio'; linhas: LinhaExemplo[] }
  | { tipo: 'antes-depois'; antes: string; depois: string; conta: string };

export type Seo = { titulo: string; descricao: string };

type Conteudo = {
  seo: Seo;
  h1: string;
  promessa: string;
  mensagemWhatsApp: string;
  passos: [string, string, string];
  faq: Faq[];
  /** What the partners still have to confirm; every item blocks publication. */
  aConfirmar: string[];
};

export type Produto = Conteudo & {
  slug: 'portal-do-cliente' | 'saneamento-cadastro-fiscal' | 'integracao-de-sistemas' | 'crm-para-agencias';
  nomeMenu: string;
  publicado: boolean;
  /** The problem as a question, used on the home card. */
  cardHome: string;
  problema: string;
  prazo?: string;
  entregaveis: string[];
  prova?: Prova;
  preco?: Preco;
  exigeRevisaoFiscal?: true;
  revisaoFiscal?: { contador: string; registro: string; data: string };
  exigePiloto?: true;
  piloto?: { vagas: number; desconto: string };
  exigeParesDeSistemas?: true;
  paresDeSistemas?: string[];
};

export type PaginaFixa = Conteudo;

export type SobMedida = Conteudo & {
  tipos: Array<{ titulo: string; texto: string }>;
  precoMinimo?: number;
};

export type Socio = { nome: string; foto: ImageMetadata; linha: string; linkedin?: string };

export type Empresa = { email?: string; linkedin?: string; cnpj?: string };
```

`src/lib/whatsapp.ts`:

```ts
// wa.me link that opens WhatsApp with the page's message already typed.
export function linkWhatsApp(numero: string, mensagem: string): string {
  if (!/^55\d{10,11}$/.test(numero)) {
    throw new Error(`Número de WhatsApp inválido: "${numero}". Use só dígitos, com 55 e DDD (ex.: 5511999998888).`);
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
```

`src/lib/preco.ts`:

```ts
import type { Preco } from '../data/tipos';

const NBSP = '\u00a0';
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

// "R$ 25 mil" only for round thousands; NBSP keeps "R$" glued to the value.
export function reais(valor: number, emMil = false): string {
  if (emMil && valor % 1000 === 0) return `R$${NBSP}${numero.format(valor / 1000)}${NBSP}mil`;
  return `R$${NBSP}${numero.format(valor)}`;
}

export function textoPreco(preco: Preco): string {
  return `a partir de ${reais(preco.entrada, true)} + ${reais(preco.mensal)}/mês`;
}
```

`src/lib/faixa.ts`:

```ts
// The reform banner is true only until the new rules take effect: 2027-01-01 00:00, Brasília time.
export const FIM_FAIXA_REFORMA = new Date('2027-01-01T00:00:00-03:00');

export function faixaReformaVisivel(agora: Date = new Date()): boolean {
  return agora.getTime() < FIM_FAIXA_REFORMA.getTime();
}
```

`src/lib/consentimento.ts`:

```ts
export type Escolha = 'aceito' | 'recusado' | null;
export const HOST_PRODUCAO = 'nimblabs.com';

/** GA4 loads only on the live host, only with an ID, only after "Aceitar". */
export function deveCarregarGa(id: string | undefined, host: string, escolha: Escolha): boolean {
  return Boolean(id) && host === HOST_PRODUCAO && escolha === 'aceito';
}

/** The banner shows only where GA4 could load and nobody has chosen yet. */
export function deveMostrarAviso(id: string | undefined, host: string, escolha: Escolha): boolean {
  return Boolean(id) && host === HOST_PRODUCAO && escolha === null;
}
```

`src/lib/publicacao.ts`:

```ts
import type { Faq, PaginaFixa, Produto, Seo, SobMedida } from '../data/tipos';
import { reais } from './preco';

export const palavras = (texto: string): number => texto.trim().split(/\s+/).filter(Boolean).length;
const semNbsp = (t: string) => t.replace(/\u00a0/g, ' ');

function pendenciasComuns(p: { seo: Seo; faq: Faq[]; aConfirmar: string[] }): string[] {
  const faltam = [...p.aConfirmar];
  if (p.faq.length < 5) faltam.push(`5 perguntas frequentes (tem ${p.faq.length})`);
  for (const f of p.faq) {
    const n = palavras(f.resposta);
    if (n < 40 || n > 60) faltam.push(`resposta de "${f.pergunta}" tem ${n} palavras (precisa de 40 a 60)`);
  }
  if (p.seo.titulo.length > 60) faltam.push(`título com ${p.seo.titulo.length} caracteres (máximo 60)`);
  const d = p.seo.descricao.length;
  if (d < 70 || d > 160) faltam.push(`descrição com ${d} caracteres (precisa de 70 a 160)`);
  return faltam;
}

// A page goes live only when this list is empty (tests/unit/conteudo.test.ts enforces it).
export function pendencias(p: Produto): string[] {
  const faltam = pendenciasComuns(p);
  if (!p.preco) faltam.push('preço de entrada (insumo 3)');
  if (!p.prazo) faltam.push('prazo de entrega (insumo 12)');
  if (!p.prova) faltam.push('prova');
  if (p.exigeRevisaoFiscal && !p.revisaoFiscal) faltam.push('revisão do contador parceiro (insumo 6)');
  if (p.exigePiloto && !p.piloto) faltam.push('vagas e desconto do piloto (insumo 7)');
  if (p.exigeParesDeSistemas && !p.paresDeSistemas?.length) faltam.push('pares de sistemas aceitos (insumo 5)');
  if (p.preco) {
    const entrada = semNbsp(reais(p.preco.entrada, true));
    for (const f of p.faq) {
      if (/R\$/.test(f.resposta) && !semNbsp(f.resposta).includes(entrada)) {
        faltam.push(`resposta de "${f.pergunta}" cita preço diferente de ${entrada}`);
      }
    }
  }
  return faltam;
}

export function pendenciasPagina(p: PaginaFixa | SobMedida): string[] {
  const faltam = pendenciasComuns(p);
  if ('tipos' in p && p.precoMinimo === undefined) faltam.push('preço mínimo do sob medida (insumo 3)');
  return faltam;
}
```

- [ ] **Passo 4: ver passar**

Rode `npm test`. Esperado: PASS em todos os arquivos de `tests/unit`, exceto `marca.test.ts` se a Tarefa 2 ainda estiver esperando o Jean.

- [ ] **Passo 5: commit**

Mensagem: `feat: typed content model, pure helpers and publication gate`.

---

### Tarefa 5: Conteúdo em rascunho (A, B, C, home e sob medida)

**Arquivos:**
- Criar: `src/data/produtos/portal-do-cliente.ts`, `src/data/produtos/saneamento-cadastro-fiscal.ts`, `src/data/produtos/integracao-de-sistemas.ts`, `src/data/produtos/index.ts`, `src/data/home.ts`, `src/data/sob-medida.ts`, `src/data/socios.ts`, `src/data/empresa.ts`
- Teste: `tests/unit/conteudo.test.ts`

**Interfaces:**
- Produz: `produtos: Produto[]` (na ordem do menu), `produtosNoAr`, `home: PaginaFixa`, `sobMedida: SobMedida`, `socios: Socio[]` (vazio até o insumo 1) e `empresa: Empresa` (vazio até os insumos 8 e 9).

- [ ] **Passo 1: skills.** "Usando `conversion-copy` e `ux-writing` para os rascunhos." Revise os textos do Passo 4 contra as regras das duas antes de gravar. Eles são hipótese: os sócios corrigem as objeções com o que ouvem na prospecção.

- [ ] **Passo 2: buscas-alvo.** "Usando `seo-geo`." Confira o volume das buscas-alvo de cada página com o OpenSEO Keyword Planner (nota da memória `project_openseo_keyword_planner.md`):
  - B: "saneamento de cadastro fiscal", "cClassTrib", "revisão de NCM";
  - A: "portal do cliente";
  - C: "integração de sistemas", "integração ERP e-commerce";
  - sob medida: "software sob medida".

  Se uma variante tiver volume claramente maior, troque `seo.titulo` e `h1` por ela, sem passar de 60 caracteres. Registre os números no commit.

- [ ] **Passo 3: teste que falha.** `tests/unit/conteudo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { produtos } from '../../src/data/produtos';
import { pendencias } from '../../src/lib/publicacao';

describe('conteúdo', () => {
  it('nenhum produto publicado tem pendência', () => {
    const problemas = produtos.filter((p) => p.publicado).flatMap((p) => pendencias(p).map((x) => `${p.slug}: ${x}`));
    expect(problemas).toEqual([]);
  });
  it('rascunhos já respeitam tamanho de resposta, título e descrição', () => {
    const forma = produtos.flatMap((p) =>
      pendencias(p).filter((x) => x.includes('palavras') || x.includes('caracteres')).map((x) => `${p.slug}: ${x}`),
    );
    expect(forma).toEqual([]);
  });
  it('ordem do menu', () => {
    expect(produtos.map((p) => p.slug)).toEqual(['portal-do-cliente', 'saneamento-cadastro-fiscal', 'integracao-de-sistemas']);
  });
});
```

- [ ] **Passo 4: ver falhar**

Rode `npm test`. Esperado: FAIL, porque `src/data/produtos` ainda não existe.

- [ ] **Passo 5: gravar os rascunhos**

`src/data/produtos/portal-do-cliente.ts`:

```ts
import type { Produto } from '../tipos';

export const portalDoCliente: Produto = {
  slug: 'portal-do-cliente',
  nomeMenu: 'Portal do cliente',
  publicado: false,
  seo: {
    titulo: 'Portal do cliente para empresas de serviço | nimblabs',
    descricao:
      'Seu cliente acompanha o serviço, baixa documentos e recebe aviso num portal com a sua marca, e sua equipe para de responder status no WhatsApp.',
  },
  h1: 'Portal do cliente com a marca da sua empresa',
  promessa:
    'Seu cliente acompanha o serviço, baixa documentos e recebe aviso quando algo muda. Sua equipe para de responder "como está meu processo?" no WhatsApp.',
  cardHome: 'Seus clientes perguntam "e aí, como está?" no WhatsApp?',
  problema:
    'Em clínica, contabilidade, advocacia, transportadora e consultoria, o cliente quer saber em que pé está o serviço que contratou. Hoje a resposta sai do WhatsApp de alguém da equipe, um cliente por vez, e o documento vai anexado numa conversa onde ninguém acha depois.',
  passos: [
    'Você mostra o que o cliente precisa acompanhar e quais documentos ele recebe.',
    'O portal ganha a sua marca e os campos do seu serviço.',
    'Seus clientes recebem o acesso e passam a acompanhar tudo por lá.',
  ],
  prazo: 'até 90 dias, para quem entra como cliente piloto',
  entregaveis: [
    'Área logada para cada cliente, com a sua marca',
    'Painel com o andamento de cada serviço contratado',
    'Documentos organizados por cliente, prontos para baixar',
    'Aviso ao cliente quando algo muda no serviço',
    'Acesso da sua equipe para atualizar o andamento',
  ],
  mensagemWhatsApp: 'Olá! Vim pela página do portal do cliente e quero saber se serve para a minha empresa.',
  preco: { entrada: 8000, mensal: 600, fatorVariavel: 'do número de clientes no portal e do quanto ele precisa ser configurado' },
  exigePiloto: true,
  aConfirmar: [
    'preço de entrada e o que faz o valor subir (insumo 3)',
    'resposta sobre proteção de dados, conforme o contrato',
  ],
  faq: [
    {
      pergunta: 'Meus clientes vão usar o portal em vez do WhatsApp?',
      resposta:
        'Usam quando o portal responde mais rápido que a conversa. O cliente entra, vê em que etapa está o serviço e baixa o documento sem esperar ninguém da equipe. Cada aviso de mudança leva direto ao portal, e é assim que o cliente aprende o caminho, sem precisar de treinamento.',
    },
    {
      pergunta: 'Quanto custa um portal do cliente?',
      resposta:
        'A entrada começa em R$ 8 mil e a mensalidade em R$ 600. O valor final depende do número de clientes no portal e do quanto ele precisa ser configurado. Quem entra como cliente piloto paga menos e recebe o portal em até 90 dias.',
    },
    {
      pergunta: 'Quanto tempo leva para o portal entrar no ar?',
      resposta:
        'Para quem entra como cliente piloto, o portal entra no ar em até 90 dias. Nesse prazo, a nimblabs configura o portal com a sua marca e os campos do seu serviço, e sua equipe começa a atualizar o andamento. Depois disso, cada novo cliente seu recebe o acesso no mesmo dia.',
    },
    {
      pergunta: 'Os dados dos meus clientes ficam protegidos?',
      resposta:
        'Cada cliente entra com login próprio e só enxerga os serviços e documentos dele. Sua equipe decide o que cada cliente vê e quando um documento fica disponível. O contrato define como a nimblabs trata esses dados, dentro do que a LGPD exige de quem opera dados de terceiros.',
    },
    {
      pergunta: 'Serve para qualquer tipo de empresa de serviço?',
      resposta:
        'Serve para empresas em que o cliente acompanha um serviço com etapas e recebe documentos: clínica, escritório de contabilidade, advocacia, transportadora e consultoria são os casos mais comuns. O núcleo do portal é o mesmo para todos, e o que muda de uma empresa para outra são a marca e os campos.',
    },
  ],
};
```

`src/data/produtos/saneamento-cadastro-fiscal.ts`:

```ts
import type { Produto } from '../tipos';

// Every tax statement below is the partners' claim until the partner accountant reviews it (insumo 6).
export const saneamentoCadastroFiscal: Produto = {
  slug: 'saneamento-cadastro-fiscal',
  nomeMenu: 'Cadastro fiscal 2027',
  publicado: false,
  seo: {
    titulo: 'Saneamento de cadastro fiscal: NCM, NBS e cClassTrib',
    descricao:
      'Conferimos item a item o NCM, a NBS e o cClassTrib do seu cadastro e devolvemos o cadastro corrigido, pronto para importar no ERP antes de 2027.',
  },
  h1: 'Cadastro fiscal pronto para 2027, item a item',
  promessa:
    'Conferimos o NCM, a NBS e o cClassTrib de cada produto e serviço do seu cadastro e devolvemos o cadastro corrigido, pronto para importar de volta no ERP antes de janeiro de 2027.',
  cardHome: 'Seu cadastro de produtos está pronto para a reforma tributária?',
  problema:
    'O cadastro de produtos e serviços da empresa costuma ter NCM errado, NBS ausente e nenhum cClassTrib, o código novo que diz ao fisco como cada item é tributado. Com milhares de itens, ninguém confere isso na mão, e o ERP não corrige sozinho o que recebeu errado.',
  passos: [
    'Você envia os XMLs de nota fiscal e os arquivos SPED da empresa.',
    'Cruzamos cada item com as tabelas oficiais, e o contador parceiro revisa as regras usadas.',
    'Você recebe o relatório de divergências, com o motivo de cada uma, e o cadastro corrigido para importar no ERP.',
  ],
  entregaveis: [
    'Relatório com cada divergência encontrada e o motivo',
    'Cadastro corrigido, no formato de importação do seu ERP',
    'Sugestão de NCM, NBS e cClassTrib para cada item',
    'Revisão das regras pelo contador parceiro antes da entrega',
  ],
  mensagemWhatsApp: 'Olá! Vim pela página de cadastro fiscal e quero saber se o meu cadastro está pronto para 2027.',
  preco: { entrada: 25000, mensal: 2500, fatorVariavel: 'do número de itens no cadastro' },
  exigeRevisaoFiscal: true,
  aConfirmar: ['preço de entrada (insumo 3)'],
  faq: [
    {
      pergunta: 'O que é o cClassTrib e por que meu cadastro precisa dele?',
      resposta:
        'O cClassTrib é o código de classificação tributária que diz ao fisco como cada item é tributado no IBS e na CBS. Sem ele no cadastro, a nota fiscal do item fica incompleta. A nimblabs sugere o código de cada produto e serviço, e o responsável fiscal da sua empresa valida antes de usar.',
    },
    {
      pergunta: 'O que acontece se o cadastro estiver errado em 2027?',
      resposta:
        'A partir de janeiro de 2027, cadastro errado deixa de ser detalhe contábil. A nota pode ser rejeitada na emissão, o crédito de IBS e CBS pode se perder e a autuação pode chegar a 75% do imposto. Por isso o saneamento precisa terminar antes da virada, não depois dela.',
    },
    {
      pergunta: 'Meu contador ou meu ERP já não fazem isso?',
      resposta:
        'O ERP guarda o código que recebeu e não confere se ele está certo. O contador valida regras, mas conferir milhares de itens um a um não cabe na rotina dele. A nimblabs faz a leitura e o cruzamento em escala e entrega a sugestão para o seu contador validar.',
    },
    {
      pergunta: 'De quem é a responsabilidade pela classificação?',
      resposta:
        'A classificação final é do responsável fiscal da sua empresa. A nimblabs entrega uma sugestão para cada item, com o motivo, e um contador parceiro revisa as regras usadas antes da entrega. Nenhum código entra no seu ERP sem a validação de quem responde pelos tributos da empresa.',
    },
    {
      pergunta: 'Quanto custa o saneamento do cadastro fiscal?',
      resposta:
        'A entrada começa em R$ 25 mil e o acompanhamento mensal em R$ 2.500. O valor final sobe com o número de itens no cadastro. A comparação que importa é com a multa, com o crédito que deixa de ser tomado e com a nota que não sai, que trava faturamento e expedição.',
    },
  ],
};
```

`src/data/produtos/integracao-de-sistemas.ts`:

```ts
import type { Produto } from '../tipos';

export const integracaoDeSistemas: Produto = {
  slug: 'integracao-de-sistemas',
  nomeMenu: 'Integrações',
  publicado: false,
  seo: {
    titulo: 'Integração de sistemas: ERP, e-commerce e CRM | nimblabs',
    descricao:
      'Fazemos o ERP, a loja virtual, o CRM e o emissor de nota conversarem, e o dado que sua equipe copia à mão passa a ir sozinho de um sistema para o outro.',
  },
  h1: 'Integração entre os sistemas que sua empresa já paga',
  promessa:
    'O dado que sua equipe copia à mão entre ERP, loja virtual, CRM, emissor de nota e planilha passa a ir sozinho, e as horas de digitação somem da semana.',
  cardHome: 'Alguém da sua equipe copia dado de um sistema para outro toda semana?',
  problema:
    'A empresa paga ERP, loja virtual, CRM e emissor de nota, e esses sistemas não conversam. Alguém copia pedido, cliente e nota de um lugar para o outro, e toda sexta tem uma planilha preenchida à mão. Cada cópia custa horas e abre espaço para erro.',
  passos: [
    'Você mostra quais sistemas usa e o que hoje é copiado à mão.',
    'Ligamos os sistemas para o dado passar de um para o outro sozinho.',
    'Acompanhamos a integração todo mês e ajustamos quando um dos sistemas muda.',
  ],
  entregaveis: [
    'Integração entre os sistemas combinados, rodando sozinha',
    'Aviso quando alguma transferência falha',
    'Acompanhamento mensal e ajuste quando um sistema muda',
  ],
  mensagemWhatsApp: 'Olá! Vim pela página de integração de sistemas e quero parar de copiar dado à mão.',
  preco: { entrada: 6000, mensal: 400, fatorVariavel: 'do número de sistemas ligados e do volume de dados' },
  prova: {
    tipo: 'antes-depois',
    antes: 'Toda sexta, alguém abre a loja virtual e o ERP lado a lado e copia pedido por pedido.',
    depois: 'O pedido entra no ERP sozinho, minutos depois da venda, e a planilha de sexta deixa de existir.',
    conta:
      'Faça a conta: pedidos por dia × minutos para copiar cada um × 22 dias úteis. Com 20 pedidos de 2 minutos, são quase 15 horas por mês.',
  },
  exigeParesDeSistemas: true,
  aConfirmar: [
    'preço de entrada e o que faz o valor subir (insumo 3)',
    'citar os pares de sistemas na resposta "Quais sistemas vocês integram?" (insumo 5)',
    'pôr o prazo na resposta "Quanto tempo leva para a integração funcionar?" (insumo 12)',
  ],
  faq: [
    {
      pergunta: 'Meu sistema já não tem integração pronta?',
      resposta:
        'Às vezes tem, e aí o trabalho é configurar e acompanhar a integração pronta. Quando não tem, ou quando a pronta não leva o dado do jeito que a sua operação precisa, a nimblabs liga os sistemas diretamente. Nos dois casos, você para de copiar dado à mão.',
    },
    {
      pergunta: 'E se a integração quebrar?',
      resposta:
        'Integração quebra quando um dos sistemas muda, e por isso existe a mensalidade. A nimblabs acompanha as transferências, recebe o aviso quando alguma falha e ajusta a ligação. Você não descobre o problema pelo cliente reclamando de pedido que não chegou ao ERP.',
    },
    {
      pergunta: 'Quanto custa integrar sistemas?',
      resposta:
        'A entrada começa em R$ 6 mil e a mensalidade em R$ 400. O valor sobe com o número de sistemas ligados e com o volume de dados. Para comparar, some as horas que alguém da equipe gasta por mês copiando dado e multiplique pelo custo da hora dessa pessoa.',
    },
    {
      pergunta: 'Quais sistemas vocês integram?',
      resposta:
        'No começo, a nimblabs trabalha com poucos pares de sistemas comuns no mercado, listados nesta página, porque repetir a mesma integração é o que deixa o serviço rápido e barato. Se o seu par não está na lista, chame no WhatsApp: ele pode entrar como projeto sob medida.',
    },
    {
      pergunta: 'Quanto tempo leva para a integração funcionar?',
      resposta:
        'O prazo depende de quais sistemas entram na integração e de como cada um libera o acesso aos dados. Para os pares que a nimblabs já integra, o prazo de entrega está no passo a passo desta página, e o trabalho começa assim que a sua equipe libera o acesso aos sistemas.',
    },
  ],
};
```

`src/data/produtos/index.ts`:

```ts
import type { Produto } from '../tipos';
import { portalDoCliente } from './portal-do-cliente';
import { saneamentoCadastroFiscal } from './saneamento-cadastro-fiscal';
import { integracaoDeSistemas } from './integracao-de-sistemas';

// Order = menu and home order. D (crm-para-agencias) enters when insumo 4 arrives.
export const produtos: Produto[] = [portalDoCliente, saneamentoCadastroFiscal, integracaoDeSistemas];
export const produtosNoAr = produtos.filter((p) => p.publicado);
```

`src/data/home.ts`:

```ts
import type { PaginaFixa } from './tipos';

export const home: PaginaFixa = {
  seo: {
    titulo: 'nimblabs | Fábrica de software: produtos e sob medida',
    descricao:
      'Fábrica de software brasileira com produtos próprios e desenvolvimento sob medida. Preço de entrada na página e conversa direto pelo WhatsApp.',
  },
  h1: 'Tire o trabalho manual da sua empresa.',
  // "Quatro produtos" from the approved draft became "Produtos": the count changes when a page is left out.
  promessa: 'Produtos para problemas comuns e software sob medida para o resto, com o preço de entrada na página.',
  mensagemWhatsApp: 'Olá! Vim pelo site da nimblabs e quero conversar sobre um projeto.',
  passos: [
    'Conversa: você conta o problema pelo WhatsApp ou numa chamada.',
    'Proposta: escopo, preço e prazo por escrito, antes de começar.',
    'Entrega em etapas: você vê funcionando a cada etapa, não só no fim.',
  ],
  faq: [], // insumo 11: code ownership, maintenance, remote work, payment — never invented
  aConfirmar: ['os três passos de "Como trabalhamos", com os sócios'],
};
```

`src/data/sob-medida.ts`:

```ts
import type { SobMedida } from './tipos';

export const sobMedida: SobMedida = {
  seo: {
    titulo: 'Software sob medida para empresas | nimblabs',
    descricao:
      'Sistema, app ou MVP feito para o processo da sua empresa, com escopo, preço e prazo combinados por escrito antes de começar.',
  },
  h1: 'Software sob medida para o processo da sua empresa',
  promessa:
    'Sistema, app ou MVP feito para o jeito que a sua empresa trabalha, com preço e prazo combinados antes de começar.',
  mensagemWhatsApp: 'Olá! Vim pela página de software sob medida e tenho um projeto para conversar.',
  tipos: [
    { titulo: 'Para qualquer empresa', texto: 'Sistema, app ou site feito para o jeito que a sua empresa trabalha, no lugar da planilha e do WhatsApp.' },
    { titulo: 'Para startups', texto: 'Um MVP para colocar a ideia na mão de clientes de verdade, com escopo enxuto.' },
    { titulo: 'Para empresas médias e grandes', texto: 'Sistemas internos e automação com IA para tarefas que hoje dependem de gente copiando e conferindo.' },
  ],
  passos: [
    'Você conta o problema e o que a solução precisa fazer.',
    'Você recebe uma proposta por escrito, com escopo, preço e prazo.',
    'A entrega acontece em etapas, e você usa cada parte assim que fica pronta.',
  ],
  faq: [], // insumos 3 and 11
  aConfirmar: ['os três passos, com os sócios'],
};
```

`src/data/socios.ts`:

```ts
import type { Socio } from './tipos';

// Insumo 1: four entries, photos in src/assets/socios/ taken together (same light and background).
export const socios: Socio[] = [];
```

`src/data/empresa.ts`:

```ts
import type { Empresa } from './tipos';

// Insumos 8 (public e-mail, needed for LGPD requests) and 9 (LinkedIn, CNPJ). Missing = left out of the page and the JSON-LD.
export const empresa: Empresa = {};
```

- [ ] **Passo 6: ver passar**

Rode `npm test`. Esperado: PASS. Se alguma resposta ficar fora de 40 a 60 palavras, reescreva a resposta; não mexa no limite.

- [ ] **Passo 7: commit**

Mensagem: `feat: draft content for products A, B, C, home and custom software`.

---

### Tarefa 6: Dados estruturados (JSON-LD)

**Arquivos:**
- Criar: `src/lib/schema.ts`, `src/components/JsonLd.astro`
- Teste: `tests/unit/schema.test.ts`

**Interfaces:**
- Produz: `SITE`, `urlAbsoluta(caminho)` e `montarGrafo({ pagina, empresa, produto?, servico?, faq?, socios? })`, que devolve `{ '@context', '@graph' }`, mais `<JsonLd grafo={…} />`.
- `pagina` tem o formato `{ caminho: string; titulo: string; descricao: string; tipo?: 'WebPage' | 'ContactPage' }`.

- [ ] **Passo 1: teste que falha.** `tests/unit/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { montarGrafo, urlAbsoluta } from '../../src/lib/schema';
import { saneamentoCadastroFiscal as b } from '../../src/data/produtos/saneamento-cadastro-fiscal';

type No = Record<string, unknown>;
function referencias(v: unknown, acc: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => referencias(x, acc));
  else if (v && typeof v === 'object') {
    const o = v as No;
    if (Object.keys(o).length === 1 && typeof o['@id'] === 'string') acc.push(o['@id']);
    else Object.values(o).forEach((x) => referencias(x, acc));
  }
  return acc;
}

describe('montarGrafo', () => {
  const g = montarGrafo({
    pagina: { caminho: '/saneamento-cadastro-fiscal', titulo: b.seo.titulo, descricao: b.seo.descricao },
    empresa: {},
    produto: b,
    faq: b.faq,
  });
  const nos = g['@graph'] as No[];

  it('toda referência aponta para um nó do mesmo grafo', () => {
    const ids = new Set(nos.map((n) => n['@id']));
    for (const r of referencias(nos)) expect(ids.has(r)).toBe(true);
  });
  it('o preço do serviço é o mesmo preço de entrada da página', () => {
    const servico = nos.find((n) => n['@type'] === 'Service') as { offers: { priceSpecification: { minPrice: number } } };
    expect(servico.offers.priceSpecification.minPrice).toBe(b.preco!.entrada);
  });
  it('FAQPage com as mesmas perguntas da página', () => {
    const faq = nos.find((n) => n['@type'] === 'FAQPage') as { mainEntity: unknown[] };
    expect(faq.mainEntity).toHaveLength(b.faq.length);
  });
  it('sem LinkedIn e sem CNPJ, nada de sameAs nem taxID', () => {
    const org = nos.find((n) => n['@type'] === 'Organization')!;
    expect(org).not.toHaveProperty('sameAs');
    expect(org).not.toHaveProperty('taxID');
  });
  it('sócio sem LinkedIn não vira Person', () => {
    const h = montarGrafo({
      pagina: { caminho: '/', titulo: 't', descricao: 'd' },
      empresa: {},
      socios: [{ nome: 'Ana Souza', foto: {} as never, linha: 'x' }],
    });
    expect((h['@graph'] as No[]).some((n) => n['@type'] === 'Person')).toBe(false);
  });
  it('URL absoluta: raiz com barra, demais sem barra no final', () => {
    expect(urlAbsoluta('/')).toBe('https://nimblabs.com/');
    expect(urlAbsoluta('/contato')).toBe('https://nimblabs.com/contato');
  });
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm test`. Esperado: FAIL, com o módulo ausente.

- [ ] **Passo 3: implementar.** `src/lib/schema.ts`:

```ts
import type { Empresa, Faq, Produto, Socio } from '../data/tipos';

export const SITE = 'https://nimblabs.com';
const ORG = `${SITE}/#organization`;
const WEBSITE = `${SITE}/#website`;

type No = Record<string, unknown>;
export type Pagina = { caminho: string; titulo: string; descricao: string; tipo?: 'WebPage' | 'ContactPage' };

export const urlAbsoluta = (caminho: string) => (caminho === '/' ? `${SITE}/` : `${SITE}${caminho}`);

const slug = (nome: string) =>
  nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function organizacao(empresa: Empresa): No {
  const org: No = { '@type': 'Organization', '@id': ORG, name: 'nimblabs', url: `${SITE}/`, logo: `${SITE}/apple-touch-icon.png` };
  if (empresa.linkedin) org.sameAs = [empresa.linkedin];
  if (empresa.cnpj) org.taxID = empresa.cnpj;
  if (empresa.email) org.email = empresa.email;
  return org;
}

const oferta = (minimo: number): No => ({
  '@type': 'Offer',
  priceCurrency: 'BRL',
  priceSpecification: { '@type': 'PriceSpecification', minPrice: minimo, priceCurrency: 'BRL' },
});

// One @graph per page, entities linked by absolute @id; absent data is left out, never faked.
export function montarGrafo(e: {
  pagina: Pagina;
  empresa: Empresa;
  produto?: Produto;
  servico?: { nome: string; descricao: string; precoMinimo?: number };
  faq?: Faq[];
  socios?: Socio[];
}): { '@context': string; '@graph': No[] } {
  const url = urlAbsoluta(e.pagina.caminho);
  const grafo: No[] = [
    organizacao(e.empresa),
    { '@type': 'WebSite', '@id': WEBSITE, url: `${SITE}/`, name: 'nimblabs', inLanguage: 'pt-BR', publisher: { '@id': ORG } },
    {
      '@type': e.pagina.tipo ?? 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: e.pagina.titulo,
      description: e.pagina.descricao,
      inLanguage: 'pt-BR',
      isPartOf: { '@id': WEBSITE },
    },
  ];
  const servico = e.produto
    ? { nome: e.produto.nomeMenu, descricao: e.produto.promessa, precoMinimo: e.produto.preco?.entrada }
    : e.servico;
  if (servico) {
    const no: No = {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: servico.nome,
      description: servico.descricao,
      provider: { '@id': ORG },
      areaServed: { '@type': 'Country', name: 'Brasil' },
    };
    if (servico.precoMinimo !== undefined) no.offers = oferta(servico.precoMinimo);
    grafo.push(no);
  }
  for (const s of e.socios ?? []) {
    if (!s.linkedin) continue; // Person only with a real external profile
    grafo.push({ '@type': 'Person', '@id': `${SITE}/#pessoa-${slug(s.nome)}`, name: s.nome, worksFor: { '@id': ORG }, sameAs: [s.linkedin] });
  }
  if (e.faq?.length) {
    grafo.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: e.faq.map((f) => ({ '@type': 'Question', name: f.pergunta, acceptedAnswer: { '@type': 'Answer', text: f.resposta } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': grafo };
}
```

`src/components/JsonLd.astro`:

```astro
---
interface Props { grafo: object }
// "<" escaped so a string in the data can never close the script tag.
const json = JSON.stringify(Astro.props.grafo).replace(/</g, '\\u003c');
---
<script is:inline type="application/ld+json" set:html={json} />
```

- [ ] **Passo 4: ver passar**

Rode `npm test`. Esperado: PASS.

- [ ] **Passo 5: commit**

Mensagem: `feat: json-ld graph builder`.

---

### Tarefa 7: Layout base, cabeçalho, rodapé e componentes comuns

Depende da marca aprovada na Tarefa 2.

**Arquivos:**
- Criar: `src/layouts/Base.astro`, `src/components/Cabecalho.astro`, `src/components/Rodape.astro`, `src/components/BotaoWhatsApp.astro`, `src/components/Faq.astro`, `src/components/Socios.astro`, `src/components/Preco.astro`, `src/components/Prova.astro`, `src/styles/global.css`, `src/lib/ambiente.ts`
- Alterar: `astro.config.mjs`, `src/pages/index.astro`, `tests/dist/base.test.ts`, `.env` (local, fora do git)

**Interfaces:**
- `Base`: `{ titulo: string; descricao: string; caminho?: string; grafo?: object; indexavel?: boolean }`.
- `BotaoWhatsApp`: `{ mensagem: string }`. Rende `<a data-evento="whatsapp_clique">Falar no WhatsApp</a>`.
- `Faq`: `{ faq: Faq[]; titulo?: string }`.
- `Socios`: `{ socios: Socio[] }`. Não rende nada quando a lista está vazia.
- `Preco`: `{ preco: Preco }`.
- `Prova`: `{ prova: Prova }`.
- `ambiente.ts`: `emProducao: boolean` e `produtosVisiveis: Produto[]`.

- [ ] **Passo 1: skills.** "Usando `accessibility` e `ux-writing` para o menu e os textos fixos."

- [ ] **Passo 2: variáveis de ambiente.** Em `astro.config.mjs`, troque o import para `import { defineConfig, envField } from 'astro/config';` e acrescente ao `defineConfig`:

```js
  env: {
    schema: {
      PUBLIC_WHATSAPP_NUMERO: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_AMBIENTE: envField.enum({
        context: 'client',
        access: 'public',
        values: ['homologacao', 'producao'],
        default: 'homologacao', // safe default: drafts visible and noindex everywhere
      }),
    },
  },
```

Peça ao Jean o número provisório para a homologação. Pode ser o dele, desde que seja real e só com dígitos. Depois:

```powershell
Set-Content -Encoding utf8 .env "PUBLIC_WHATSAPP_NUMERO=55XXXXXXXXXXX"   # the number Jean gave, digits only
"55XXXXXXXXXXX" | vercel env add PUBLIC_WHATSAPP_NUMERO production
"55XXXXXXXXXXX" | vercel env add PUBLIC_WHATSAPP_NUMERO preview
```

Não defina `PUBLIC_AMBIENTE` na Vercel antes da Tarefa 19. Cuidado: `Set-Content -Encoding utf8` no PowerShell 5.1 grava com BOM, e a memória registra que um BOM no `.env` come a primeira variável. Confira com `Format-Hex .env | Select-Object -First 1`; se os três primeiros bytes forem `EF BB BF`, regrave o arquivo sem BOM.

- [ ] **Passo 3: teste que falha.** Acrescente em `tests/dist/base.test.ts`:

```ts
import { produtos } from '../../src/data/produtos';

describe('layout', () => {
  const home = lerHtml('/');
  it('homologação leva noindex', () => expect(home).toContain('<meta name="robots" content="noindex">'));
  it('canonical da home', () => expect(home).toContain('<link rel="canonical" href="https://nimblabs.com/">'));
  it('sem JavaScript, o menu tem todos os produtos no HTML', () => {
    const cabecalho = home.match(/<header[\s\S]*?<\/header>/)![0];
    for (const p of produtos) expect(cabecalho).toContain(`href="/${p.slug}"`);
  });
  it('a classe js é ligada por script inline no head, antes do CSS esconder algo', () => {
    expect(home).toContain("document.documentElement.classList.add('js')");
  });
});
```

- [ ] **Passo 4: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL, sem canonical e sem cabeçalho.

- [ ] **Passo 5: implementar**

`src/lib/ambiente.ts`:

```ts
import { PUBLIC_AMBIENTE } from 'astro:env/client';
import { produtos, produtosNoAr } from '../data/produtos';

/** One switch for staging vs live: staging shows drafts and is noindex. */
export const emProducao = PUBLIC_AMBIENTE === 'producao';
export const produtosVisiveis = emProducao ? produtosNoAr : produtos;
```

`src/styles/global.css`:

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; }
img, svg { max-width: 100%; height: auto; }
.pular { position: absolute; left: -9999px; }
.pular:focus { left: 1rem; top: 1rem; z-index: 10; }
:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
.visualmente-oculto {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

`src/layouts/Base.astro`:

```astro
---
import Cabecalho from '../components/Cabecalho.astro';
import Rodape from '../components/Rodape.astro';
import JsonLd from '../components/JsonLd.astro';
import { urlAbsoluta } from '../lib/schema';
import { emProducao } from '../lib/ambiente';
import '../styles/global.css';

interface Props {
  titulo: string;
  descricao: string;
  /** Canonical path; omit where there must be no canonical (404). */
  caminho?: string;
  grafo?: object;
  /** false = noindex even in production (404). */
  indexavel?: boolean;
}
const { titulo, descricao, caminho, grafo, indexavel = true } = Astro.props;
const canonical = caminho ? urlAbsoluta(caminho) : undefined;
const noindex = !emProducao || !indexavel;
---
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script is:inline>document.documentElement.classList.add('js');</script>
    <title>{titulo}</title>
    <meta name="description" content={descricao} />
    {noindex && <meta name="robots" content="noindex" />}
    {canonical && <link rel="canonical" href={canonical} />}
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="nimblabs" />
    <meta property="og:title" content={titulo} />
    <meta property="og:description" content={descricao} />
    {canonical && <meta property="og:url" content={canonical} />}
    <meta property="og:image" content="https://nimblabs.com/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    {grafo && <JsonLd grafo={grafo} />}
  </head>
  <body>
    <a class="pular" href="#conteudo">Pular para o conteúdo</a>
    <Cabecalho caminhoAtual={caminho} />
    <main id="conteudo"><slot /></main>
    <Rodape />
  </body>
</html>
```

`src/components/Cabecalho.astro`:

```astro
---
import Marca from './Marca.astro';
import { produtosVisiveis } from '../lib/ambiente';

interface Props { caminhoAtual?: string }
const { caminhoAtual } = Astro.props;
const atual = (href: string) => (href === caminhoAtual ? 'page' : undefined);
---
<header class="cabecalho">
  <a href="/" class="cabecalho__marca" aria-current={atual('/')}><Marca /></a>
  <button type="button" class="cabecalho__menu" data-disclosure aria-expanded="false" aria-controls="navegacao">Menu</button>
  <nav id="navegacao" class="cabecalho__nav" aria-label="Principal">
    <ul>
      <li class="cabecalho__grupo">
        <button type="button" class="so-desktop" data-disclosure aria-expanded="false" aria-controls="menu-produtos">Produtos</button>
        <span class="so-celular">Produtos</span>
        <ul id="menu-produtos">
          {produtosVisiveis.map((p) => <li><a href={`/${p.slug}`} aria-current={atual(`/${p.slug}`)}>{p.nomeMenu}</a></li>)}
        </ul>
      </li>
      <li><a href="/software-sob-medida" aria-current={atual('/software-sob-medida')}>Sob medida</a></li>
      <li><a href="/contato" aria-current={atual('/contato')}>Contato</a></li>
    </ul>
  </nav>
</header>

<script>
  // aria-expanded is the single source of truth; CSS reveals the controlled element when it is "true".
  const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-disclosure]')];
  for (const botao of botoes) {
    botao.addEventListener('click', () => {
      botao.setAttribute('aria-expanded', String(botao.getAttribute('aria-expanded') !== 'true'));
    });
  }
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    for (const botao of botoes) {
      if (botao.getAttribute('aria-expanded') !== 'true') continue;
      botao.setAttribute('aria-expanded', 'false');
      botao.focus();
    }
  });
</script>

<style>
  /* Without JS everything stays visible; the .js class (set in <head>) is what allows collapsing. */
  .so-celular { display: none; }
  @media (min-width: 48rem) {
    .cabecalho__menu { display: none; }
    :global(.js) .cabecalho__grupo > [aria-expanded='false'] ~ #menu-produtos { display: none; }
  }
  @media (max-width: 47.99rem) {
    .so-desktop { display: none; }
    .so-celular { display: block; }
    :global(.js) .cabecalho__menu[aria-expanded='false'] + .cabecalho__nav { display: none; }
  }
</style>
```

`src/components/BotaoWhatsApp.astro`:

```astro
---
import { PUBLIC_WHATSAPP_NUMERO } from 'astro:env/client';
import { linkWhatsApp } from '../lib/whatsapp';

interface Props { mensagem: string }
const href = linkWhatsApp(PUBLIC_WHATSAPP_NUMERO, Astro.props.mensagem);
---
<a class="botao-whatsapp" href={href} target="_blank" rel="noopener" data-evento="whatsapp_clique">Falar no WhatsApp</a>
```

`src/components/Rodape.astro`:

```astro
---
import { PUBLIC_WHATSAPP_NUMERO } from 'astro:env/client';
import { linkWhatsApp } from '../lib/whatsapp';
import { produtosVisiveis } from '../lib/ambiente';
import { empresa } from '../data/empresa';
import { home } from '../data/home';
---
<footer class="rodape">
  <nav aria-label="Rodapé">
    <ul>
      {produtosVisiveis.map((p) => <li><a href={`/${p.slug}`}>{p.nomeMenu}</a></li>)}
      <li><a href="/software-sob-medida">Sob medida</a></li>
      <li><a href="/contato">Contato</a></li>
      <li><a href="/privacidade">Privacidade</a></li>
    </ul>
  </nav>
  <p>
    <a href={linkWhatsApp(PUBLIC_WHATSAPP_NUMERO, home.mensagemWhatsApp)} target="_blank" rel="noopener" data-evento="whatsapp_clique">WhatsApp</a>
    {empresa.email && <> · <a href={`mailto:${empresa.email}`}>{empresa.email}</a></>}
  </p>
  <p>© {new Date().getFullYear()} nimblabs</p>
</footer>
```

`src/components/Faq.astro`:

```astro
---
import type { Faq } from '../data/tipos';

interface Props { faq: Faq[]; titulo?: string }
const { faq, titulo = 'Perguntas frequentes' } = Astro.props;
---
{faq.length > 0 && (
  <section class="faq" aria-labelledby="faq-titulo">
    <h2 id="faq-titulo">{titulo}</h2>
    {faq.map((f) => (
      <div class="faq__item">
        <h3>{f.pergunta}</h3>
        <p>{f.resposta}</p>
        {f.fonte && <p class="faq__fonte">Fonte: <a href={f.fonte.url}>{f.fonte.nome}</a></p>}
      </div>
    ))}
  </section>
)}
```

`src/components/Socios.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { Socio } from '../data/tipos';

interface Props { socios: Socio[] }
const { socios } = Astro.props;
---
{socios.length > 0 && (
  <section class="socios" aria-labelledby="socios-titulo">
    <h2 id="socios-titulo">Quem faz</h2>
    <ul>
      {socios.map((s) => (
        <li>
          <Image src={s.foto} alt="" width={160} height={160} />
          <p class="socios__nome">{s.linkedin ? <a href={s.linkedin}>{s.nome}</a> : s.nome}</p>
          <p>{s.linha}</p>
        </li>
      ))}
    </ul>
  </section>
)}
```

`src/components/Preco.astro`:

```astro
---
import type { Preco } from '../data/tipos';
import { textoPreco } from '../lib/preco';

interface Props { preco: Preco }
const { preco } = Astro.props;
---
<p class="preco">{textoPreco(preco)}</p>
<p>O valor depende {preco.fatorVariavel}.</p>
```

`src/components/Prova.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { Prova } from '../data/tipos';

interface Props { prova: Prova }
const { prova } = Astro.props;
---
<section class="prova" aria-labelledby="prova-titulo">
  {prova.tipo === 'prototipo' && (
    <>
      <h2 id="prova-titulo">Como o seu cliente vai ver</h2>
      <figure>
        <p class="selo">Protótipo</p>
        <Image src={prova.imagem} alt={prova.alt} widths={[640, 1200]} sizes="(min-width: 48rem) 60rem, 100vw" />
      </figure>
    </>
  )}
  {prova.tipo === 'exemplo-relatorio' && (
    <>
      <h2 id="prova-titulo">O que o relatório mostra</h2>
      <table>
        <caption><span class="selo">Exemplo</span> Divergências encontradas no cadastro</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">Código atual</th><th scope="col">Código sugerido</th><th scope="col">Motivo</th></tr></thead>
        <tbody>{prova.linhas.map((l) => <tr><td>{l.item}</td><td>{l.codigoAtual}</td><td>{l.codigoSugerido}</td><td>{l.motivo}</td></tr>)}</tbody>
      </table>
    </>
  )}
  {prova.tipo === 'antes-depois' && (
    <>
      <h2 id="prova-titulo">Antes e depois</h2>
      <div class="antes-depois">
        <div><h3>Antes</h3><p>{prova.antes}</p></div>
        <div><h3>Depois</h3><p>{prova.depois}</p></div>
      </div>
      <p>{prova.conta}</p>
    </>
  )}
</section>
```

`src/pages/index.astro` (a versão completa vem na Tarefa 9):

```astro
---
import Base from '../layouts/Base.astro';
import { home } from '../data/home';
import { empresa } from '../data/empresa';
import { montarGrafo } from '../lib/schema';

const grafo = montarGrafo({ pagina: { caminho: '/', titulo: home.seo.titulo, descricao: home.seo.descricao }, empresa });
---
<Base titulo={home.seo.titulo} descricao={home.seo.descricao} caminho="/" grafo={grafo}>
  <h1>{home.h1}</h1>
</Base>
```

- [ ] **Passo 6: ver passar**

Rode `npm run verificar`. Esperado: `astro check` sem erro e os dois grupos de teste em PASS.

- [ ] **Passo 7: commit e push**

Mensagem: `feat: base layout, header with no-js menu, footer and shared components`. Depois do push, confira o menu em `https://nimblabs-site.vercel.app` com o teclado: Tab chega em "Produtos", Enter abre e Esc fecha.

---

### Tarefa 8: Páginas de produto

**Arquivos:**
- Criar: `src/pages/[produto].astro`
- Teste: `tests/dist/produtos.test.ts`

**Interfaces:**
- Consome `produtosVisiveis`, `montarGrafo` e todos os componentes da Tarefa 7.

- [ ] **Passo 1: teste que falha.** `tests/dist/produtos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lerHtml } from './helpers';
import { produtos } from '../../src/data/produtos';

describe.each(produtos.map((p) => [p.slug, p] as const))('/%s', (slug, p) => {
  const html = lerHtml(`/${slug}`);
  it('um h1 só, com o texto do produto', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain(p.h1);
  });
  it('título e canonical do produto', () => {
    expect(html).toContain(`<title>${p.seo.titulo}</title>`);
    expect(html).toContain(`<link rel="canonical" href="https://nimblabs.com/${slug}">`);
  });
  it('WhatsApp com a mensagem da página no topo, no meio e no fim', () => {
    const daPagina = html.split(`?text=${encodeURIComponent(p.mensagemWhatsApp)}"`).length - 1;
    expect(daPagina).toBeGreaterThanOrEqual(3);
  });
  it('rascunho aparece com selo', () => {
    if (!p.publicado) expect(html).toContain('Rascunho');
  });
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL, porque as páginas ainda não existem.

- [ ] **Passo 3: implementar.** `src/pages/[produto].astro`:

```astro
---
import Base from '../layouts/Base.astro';
import BotaoWhatsApp from '../components/BotaoWhatsApp.astro';
import Faq from '../components/Faq.astro';
import Preco from '../components/Preco.astro';
import Prova from '../components/Prova.astro';
import Socios from '../components/Socios.astro';
import { produtosVisiveis } from '../lib/ambiente';
import { socios } from '../data/socios';
import { empresa } from '../data/empresa';
import { montarGrafo } from '../lib/schema';
import type { Produto } from '../data/tipos';

export function getStaticPaths() {
  return produtosVisiveis.map((produto) => ({ params: { produto: produto.slug }, props: { produto } }));
}

interface Props { produto: Produto }
const { produto: p } = Astro.props;
const caminho = `/${p.slug}`;
const grafo = montarGrafo({ pagina: { caminho, titulo: p.seo.titulo, descricao: p.seo.descricao }, empresa, produto: p, faq: p.faq });
---
<Base titulo={p.seo.titulo} descricao={p.seo.descricao} caminho={caminho} grafo={grafo}>
  {!p.publicado && <p class="rascunho" role="note">Rascunho: esta página ainda não está publicada.</p>}

  <section class="promessa">
    <h1>{p.h1}</h1>
    <p>{p.promessa}</p>
    <BotaoWhatsApp mensagem={p.mensagemWhatsApp} />
  </section>

  <section aria-labelledby="problema">
    <h2 id="problema">O problema</h2>
    <p>{p.problema}</p>
  </section>

  <section aria-labelledby="como">
    <h2 id="como">Como funciona</h2>
    <ol>{p.passos.map((passo) => <li>{passo}</li>)}</ol>
    {p.prazo && <p><strong>Prazo:</strong> {p.prazo}</p>}
  </section>

  <section aria-labelledby="recebe">
    <h2 id="recebe">O que você recebe</h2>
    <ul>{p.entregaveis.map((e) => <li>{e}</li>)}</ul>
    <BotaoWhatsApp mensagem={p.mensagemWhatsApp} />
  </section>

  {p.prova && <Prova prova={p.prova} />}
  {p.revisaoFiscal && (
    <p class="revisao">
      Regras revisadas por {p.revisaoFiscal.contador} ({p.revisaoFiscal.registro}), contador parceiro da nimblabs, em {p.revisaoFiscal.data}.
    </p>
  )}
  {p.paresDeSistemas && (
    <section aria-labelledby="pares">
      <h2 id="pares">Integrações que fazemos</h2>
      <ul>{p.paresDeSistemas.map((par) => <li>{par}</li>)}</ul>
    </section>
  )}

  <Socios socios={socios} />

  {p.preco && (
    <section aria-labelledby="preco">
      <h2 id="preco">Quanto custa</h2>
      <Preco preco={p.preco} />
      {p.piloto && <p>Condição de cliente piloto para os primeiros {p.piloto.vagas} clientes: {p.piloto.desconto}.</p>}
    </section>
  )}

  <Faq faq={p.faq} />

  <section class="fim" aria-labelledby="fim">
    <h2 id="fim">Vamos conversar?</h2>
    <BotaoWhatsApp mensagem={p.mensagemWhatsApp} />
    <p><a href={`/contato?de=${caminho}`}>Prefere escrever? Use o formulário.</a></p>
  </section>
</Base>
```

- [ ] **Passo 4: ver passar**

Rode `npm run verificar`. Esperado: PASS.

- [ ] **Passo 5: commit e push**

Mensagem: `feat: product pages from typed content`.

---

### Tarefa 9: Home, faixa da reforma e publicação agendada para 01/01/2027

**Arquivos:**
- Alterar: `src/pages/index.astro`
- Criar: `.github/workflows/rebuild-fim-faixa.yml`, `tests/dist/home.test.ts`

- [ ] **Passo 1: teste que falha.** `tests/dist/home.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lerHtml } from './helpers';
import { produtos } from '../../src/data/produtos';
import { home } from '../../src/data/home';

describe('home', () => {
  const html = lerHtml('/');
  it('CTA com a mensagem da home pelo menos 3 vezes', () => {
    expect(html.split(`?text=${encodeURIComponent(home.mensagemWhatsApp)}"`).length - 1).toBeGreaterThanOrEqual(3);
  });
  it('um card por produto visível, pelo problema', () => {
    for (const p of produtos) expect(html).toContain(`<a href="/${p.slug}">`);
  });
  it('faixa da reforma antes de 2027', () => {
    if (Date.now() < new Date('2027-01-01T00:00:00-03:00').getTime()) expect(html).toContain('Reforma tributária');
  });
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL.

- [ ] **Passo 3: implementar.** `src/pages/index.astro` (substituir inteiro):

```astro
---
import Base from '../layouts/Base.astro';
import BotaoWhatsApp from '../components/BotaoWhatsApp.astro';
import Faq from '../components/Faq.astro';
import Socios from '../components/Socios.astro';
import { home } from '../data/home';
import { sobMedida } from '../data/sob-medida';
import { socios } from '../data/socios';
import { empresa } from '../data/empresa';
import { produtosVisiveis } from '../lib/ambiente';
import { faixaReformaVisivel } from '../lib/faixa';
import { textoPreco } from '../lib/preco';
import { montarGrafo } from '../lib/schema';

// Evaluated at build time; .github/workflows/rebuild-fim-faixa.yml rebuilds on 2027-01-01 to drop it.
const mostrarFaixa = produtosVisiveis.some((p) => p.slug === 'saneamento-cadastro-fiscal') && faixaReformaVisivel(new Date());
const grafo = montarGrafo({ pagina: { caminho: '/', titulo: home.seo.titulo, descricao: home.seo.descricao }, empresa, socios, faq: home.faq });
---
<Base titulo={home.seo.titulo} descricao={home.seo.descricao} caminho="/" grafo={grafo}>
  <section class="promessa">
    <h1>{home.h1}</h1>
    <p>{home.promessa}</p>
    <BotaoWhatsApp mensagem={home.mensagemWhatsApp} />
  </section>

  {mostrarFaixa && (
    <p class="faixa-reforma"><a href="/saneamento-cadastro-fiscal">Reforma tributária: seu cadastro de produtos está pronto para 2027?</a></p>
  )}

  <section aria-labelledby="produtos">
    <h2 id="produtos">Produtos</h2>
    <ul class="cards">
      {produtosVisiveis.map((p) => (
        <li>
          <h3><a href={`/${p.slug}`}>{p.cardHome}</a></h3>
          <p>{p.promessa}</p>
          {p.preco && <p class="preco">{textoPreco(p.preco)}</p>}
        </li>
      ))}
    </ul>
  </section>

  <section aria-labelledby="sob-medida">
    <h2 id="sob-medida">Software sob medida</h2>
    <ul>{sobMedida.tipos.map((t) => <li><h3>{t.titulo}</h3><p>{t.texto}</p></li>)}</ul>
    <p><a href="/software-sob-medida">Ver como funciona o sob medida</a></p>
    <BotaoWhatsApp mensagem={home.mensagemWhatsApp} />
  </section>

  <section aria-labelledby="como">
    <h2 id="como">Como trabalhamos</h2>
    <ol>{home.passos.map((passo) => <li>{passo}</li>)}</ol>
  </section>

  <Socios socios={socios} />
  <Faq faq={home.faq} />

  <section class="fim" aria-labelledby="fim">
    <h2 id="fim">Vamos conversar?</h2>
    <BotaoWhatsApp mensagem={home.mensagemWhatsApp} />
    <p><a href="/contato?de=/">Prefere escrever? Use o formulário.</a></p>
  </section>
</Base>
```

`.github/workflows/rebuild-fim-faixa.yml`:

```yaml
name: Rebuild ao fim da faixa da reforma
on:
  schedule:
    - cron: '5 3 1 1 *' # 00:05 in Brasília on Jan 1 (03:05 UTC)
  workflow_dispatch:
jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger the Vercel deploy hook
        run: curl -fsS -X POST "$HOOK"
        env:
          HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

- [ ] **Passo 4: gancho de publicação.** Tarefa do Jean, cerca de 2 minutos:
  1. Na Vercel, abra `nimblabs-site` → Settings → Git → Deploy Hooks. Nome: `fim-faixa`; branch: `main`. Copie a URL.
  2. Rode `gh secret set VERCEL_DEPLOY_HOOK --repo JeanZorzetti/nimblabs-site` e cole a URL.
  3. Teste com `gh workflow run rebuild-fim-faixa.yml --repo JeanZorzetti/nimblabs-site`. Esperado: uma publicação nova aparece em `vercel ls nimblabs-site`.

- [ ] **Passo 5: ver passar**

Rode `npm run verificar`. Esperado: PASS.

- [ ] **Passo 6: commit e push**

Mensagem: `feat: home page, reform banner and scheduled rebuild`.

---

### Tarefa 10: Página de sob medida

**Arquivos:**
- Criar: `src/pages/software-sob-medida.astro`
- Teste: `tests/dist/sob-medida.test.ts`

- [ ] **Passo 1: teste que falha.** `tests/dist/sob-medida.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lerHtml } from './helpers';
import { sobMedida } from '../../src/data/sob-medida';

describe('/software-sob-medida', () => {
  const html = lerHtml('/software-sob-medida');
  it('um h1, canonical e CTA 3 vezes', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://nimblabs.com/software-sob-medida">');
    expect(html.split(`?text=${encodeURIComponent(sobMedida.mensagemWhatsApp)}"`).length - 1).toBeGreaterThanOrEqual(3);
  });
  it('integração aponta para a página C, sem repetir o conteúdo', () => {
    expect(html).toContain('href="/integracao-de-sistemas"');
  });
});
```

- [ ] **Passo 2: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL.

- [ ] **Passo 3: implementar.** `src/pages/software-sob-medida.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import BotaoWhatsApp from '../components/BotaoWhatsApp.astro';
import Faq from '../components/Faq.astro';
import Socios from '../components/Socios.astro';
import { sobMedida as s } from '../data/sob-medida';
import { socios } from '../data/socios';
import { empresa } from '../data/empresa';
import { produtosVisiveis } from '../lib/ambiente';
import { reais } from '../lib/preco';
import { montarGrafo } from '../lib/schema';

const caminho = '/software-sob-medida';
const temIntegracao = produtosVisiveis.some((p) => p.slug === 'integracao-de-sistemas');
const grafo = montarGrafo({
  pagina: { caminho, titulo: s.seo.titulo, descricao: s.seo.descricao },
  empresa,
  servico: { nome: 'Software sob medida', descricao: s.promessa, precoMinimo: s.precoMinimo },
  faq: s.faq,
});
---
<Base titulo={s.seo.titulo} descricao={s.seo.descricao} caminho={caminho} grafo={grafo}>
  <section class="promessa">
    <h1>{s.h1}</h1>
    <p>{s.promessa}</p>
    <BotaoWhatsApp mensagem={s.mensagemWhatsApp} />
  </section>

  <section aria-labelledby="para-quem">
    <h2 id="para-quem">Para quem</h2>
    <ul>{s.tipos.map((t) => <li><h3>{t.titulo}</h3><p>{t.texto}</p></li>)}</ul>
    {temIntegracao && (
      <p>Precisa ligar sistemas que a empresa já tem? Veja <a href="/integracao-de-sistemas">integração de sistemas</a>.</p>
    )}
  </section>

  <section aria-labelledby="como">
    <h2 id="como">Como funciona</h2>
    <ol>{s.passos.map((passo) => <li>{passo}</li>)}</ol>
    <BotaoWhatsApp mensagem={s.mensagemWhatsApp} />
  </section>

  {s.precoMinimo !== undefined && (
    <section aria-labelledby="preco">
      <h2 id="preco">Quanto custa</h2>
      <p class="preco">Projetos a partir de {reais(s.precoMinimo, true)}.</p>
    </section>
  )}

  <Socios socios={socios} />
  <Faq faq={s.faq} />

  <section class="fim" aria-labelledby="fim">
    <h2 id="fim">Vamos conversar?</h2>
    <BotaoWhatsApp mensagem={s.mensagemWhatsApp} />
    <p><a href={`/contato?de=${caminho}`}>Prefere escrever? Use o formulário.</a></p>
  </section>
</Base>
```

- [ ] **Passo 4: ver passar**

Rode `npm run verificar`. Esperado: PASS.

- [ ] **Passo 5: commit e push**

Mensagem: `feat: custom software page`.

---

### Tarefa 11: Contato (formulário no servidor + Brevo), privacidade e 404

**Arquivos:**
- Criar: `src/lib/contato.ts`, `src/pages/contato.astro`, `src/pages/privacidade.astro`, `src/data/privacidade.ts`, `src/pages/404.astro`
- Teste: `tests/unit/contato.test.ts`
- Alterar: `astro.config.mjs`

**Interfaces:**
- Produz: `origemSegura`, `formularioVazio`, `lerFormulario`, `emailDeContato`, `envioBrevo(apiKey, fetch?)`, `processarContato(form, enviar, cfg)`, `MENSAGENS`, `LIMITE_MENSAGEM` e os tipos `EstadoContato`, `DadosContato`, `Erros` e `Envio`.
- Produz: `privacidade: { atualizadaEm: string; aConfirmar: string[] }`.

- [ ] **Passo 1: skills.** "Usando `ux-writing` e `accessibility` para o formulário e as mensagens."

- [ ] **Passo 2: teste que falha.** `tests/unit/contato.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { emailDeContato, envioBrevo, MENSAGENS, origemSegura, processarContato } from '../../src/lib/contato';

const cfg = { para: 'leads@exemplo.com', remetente: 'site@exemplo.com' };
const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};
const valido = { nome: 'Ana Souza', email: 'ana@empresa.com.br', mensagem: 'Quero integrar o ERP.', origem: '/integracao-de-sistemas' };

describe('processarContato', () => {
  it('envia e devolve enviado com a página de origem', async () => {
    const enviar = vi.fn(async () => true);
    expect(await processarContato(form(valido), enviar, cfg)).toEqual({ estado: 'enviado', origem: '/integracao-de-sistemas' });
    expect(enviar).toHaveBeenCalledOnce();
  });
  it('robô que preenche o campo escondido vê sucesso e nada é enviado', async () => {
    const enviar = vi.fn(async () => true);
    const r = await processarContato(form({ ...valido, site: 'http://spam.example' }), enviar, cfg);
    expect(r.estado).toBe('enviado');
    expect(enviar).not.toHaveBeenCalled();
  });
  it('campos vazios voltam com erro e com o texto digitado', async () => {
    const r = await processarContato(form({ nome: '   ', email: '', mensagem: 'texto que não pode sumir' }), vi.fn(), cfg);
    expect(r).toMatchObject({
      estado: 'formulario',
      erros: { nome: MENSAGENS.nomeVazio, email: MENSAGENS.emailVazio },
      valores: { mensagem: 'texto que não pode sumir' },
    });
  });
  it('e-mail sem domínio', async () => {
    const r = await processarContato(form({ ...valido, email: 'ana@empresa' }), vi.fn(), cfg);
    expect(r).toMatchObject({ estado: 'formulario', erros: { email: MENSAGENS.emailInvalido } });
  });
  it('mensagem acima de 2.000 caracteres', async () => {
    const r = await processarContato(form({ ...valido, mensagem: 'x'.repeat(2001) }), vi.fn(), cfg);
    expect(r).toMatchObject({ estado: 'formulario', erros: { mensagem: MENSAGENS.mensagemLonga } });
  });
  it('falha no envio mantém o texto na tela', async () => {
    expect(await processarContato(form(valido), async () => false, cfg)).toEqual({ estado: 'falhou', valores: valido });
  });
});

describe('envioBrevo', () => {
  it('rede caída vira false, não exceção', async () => {
    const enviar = envioBrevo('chave', async () => { throw new TypeError('fetch failed'); });
    expect(await enviar(emailDeContato(valido, cfg))).toBe(false);
  });
  it('manda a chave no cabeçalho e devolve false em erro 500', async () => {
    const f = vi.fn(async () => new Response('erro', { status: 500 }));
    expect(await envioBrevo('chave-x', f)(emailDeContato(valido, cfg))).toBe(false);
    expect((f.mock.calls[0] as unknown[])[1]).toMatchObject({ headers: { 'api-key': 'chave-x' } });
  });
  it('resposta para o lead e origem no assunto', () => {
    const e = emailDeContato(valido, cfg);
    expect(e.replyTo).toEqual({ email: 'ana@empresa.com.br', name: 'Ana Souza' });
    expect(e.subject).toContain('/integracao-de-sistemas');
  });
});

describe('origemSegura', () => {
  it('aceita caminho do site e recusa endereço externo', () => {
    expect(origemSegura('/portal-do-cliente')).toBe('/portal-do-cliente');
    expect(origemSegura('https://evil.example')).toBe('/contato');
    expect(origemSegura(null)).toBe('/contato');
  });
});
```

- [ ] **Passo 3: ver falhar**

Rode `npm test`. Esperado: FAIL.

- [ ] **Passo 4: implementar.** `src/lib/contato.ts`:

```ts
export type Campo = 'nome' | 'email' | 'mensagem';
export type Erros = Partial<Record<Campo, string>>;
export type DadosContato = { nome: string; email: string; mensagem: string; origem: string };
export type EstadoContato =
  | { estado: 'formulario'; valores: DadosContato; erros: Erros }
  | { estado: 'enviado'; origem: string }
  | { estado: 'falhou'; valores: DadosContato };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LIMITE_MENSAGEM = 2000;

export const MENSAGENS = {
  nomeVazio: 'Escreva seu nome.',
  emailVazio: 'Escreva seu e-mail.',
  emailInvalido: 'Confira o e-mail: ele precisa ter @ e domínio, como nome@empresa.com.br.',
  mensagemLonga: 'A mensagem passou de 2.000 caracteres. Resuma aqui ou mande o resto pelo WhatsApp.',
} as const;

/** Only same-site paths are accepted as the origin page; anything else becomes /contato. */
export function origemSegura(origem: string | null | undefined): string {
  return origem && /^\/[a-z0-9\-/]{0,100}$/.test(origem) ? origem : '/contato';
}

export function formularioVazio(origem?: string | null): EstadoContato {
  return { estado: 'formulario', valores: { nome: '', email: '', mensagem: '', origem: origemSegura(origem) }, erros: {} };
}

export function lerFormulario(form: FormData): { robo: boolean; valores: DadosContato; erros: Erros } {
  const texto = (campo: string) => String(form.get(campo) ?? '');
  const valores: DadosContato = {
    nome: texto('nome').replace(/\s+/g, ' ').trim().slice(0, 120),
    email: texto('email').trim().slice(0, 254),
    mensagem: texto('mensagem').trim(),
    origem: origemSegura(texto('origem')),
  };
  const erros: Erros = {};
  if (!valores.nome) erros.nome = MENSAGENS.nomeVazio;
  if (!valores.email) erros.email = MENSAGENS.emailVazio;
  else if (!EMAIL.test(valores.email)) erros.email = MENSAGENS.emailInvalido;
  if (valores.mensagem.length > LIMITE_MENSAGEM) erros.mensagem = MENSAGENS.mensagemLonga;
  return { robo: texto('site').trim() !== '', valores, erros };
}

export function emailDeContato(d: DadosContato, cfg: { para: string; remetente: string }) {
  return {
    sender: { name: 'Site nimblabs', email: cfg.remetente },
    to: [{ email: cfg.para }],
    replyTo: { email: d.email, name: d.nome },
    subject: `Contato pelo site: ${d.nome} (${d.origem})`,
    textContent: [
      `Nome: ${d.nome}`,
      `E-mail: ${d.email}`,
      `Página de origem: https://nimblabs.com${d.origem}`,
      '',
      d.mensagem || '(sem mensagem)',
    ].join('\n'),
  };
}

export type Envio = (payload: ReturnType<typeof emailDeContato>) => Promise<boolean>;

/** Brevo transactional e-mail; any HTTP or network failure is false, so the page can keep the typed text. */
export function envioBrevo(apiKey: string, f: typeof fetch = fetch): Envio {
  return async (payload) => {
    try {
      const r = await f('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      return r.ok;
    } catch {
      return false;
    }
  };
}

export async function processarContato(form: FormData, enviar: Envio, cfg: { para: string; remetente: string }): Promise<EstadoContato> {
  const { robo, valores, erros } = lerFormulario(form);
  if (robo) return { estado: 'enviado', origem: valores.origem }; // bots see success; nothing is sent
  if (Object.keys(erros).length) return { estado: 'formulario', valores, erros };
  const ok = await enviar(emailDeContato(valores, cfg));
  return ok ? { estado: 'enviado', origem: valores.origem } : { estado: 'falhou', valores };
}
```

Em `astro.config.mjs`, acrescente ao `env.schema`:

```js
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CONTATO_EMAIL_PARA: envField.string({ context: 'server', access: 'secret' }),
      CONTATO_EMAIL_REMETENTE: envField.string({ context: 'server', access: 'secret' }),
```

Troque também `integrations: [sitemap()]` por:

```js
  integrations: [
    sitemap({
      // /contato renders on demand, so the integration cannot discover it.
      customPages: ['https://nimblabs.com/contato'],
    }),
  ],
```

`src/pages/contato.astro`:

```astro
---
export const prerender = false;
import Base from '../layouts/Base.astro';
import BotaoWhatsApp from '../components/BotaoWhatsApp.astro';
import { BREVO_API_KEY, CONTATO_EMAIL_PARA, CONTATO_EMAIL_REMETENTE } from 'astro:env/server';
import { envioBrevo, formularioVazio, LIMITE_MENSAGEM, processarContato, type EstadoContato, type Erros } from '../lib/contato';
import { empresa } from '../data/empresa';
import { montarGrafo } from '../lib/schema';

const titulo = 'Contato | nimblabs';
const descricao =
  'Fale com a nimblabs pelo WhatsApp ou pelo formulário: conte o problema da sua empresa e receba o retorno de quem vai construir a solução.';

let resultado: EstadoContato = formularioVazio(Astro.url.searchParams.get('de'));
if (Astro.request.method === 'POST') {
  resultado = await processarContato(await Astro.request.formData(), envioBrevo(BREVO_API_KEY), {
    para: CONTATO_EMAIL_PARA,
    remetente: CONTATO_EMAIL_REMETENTE,
  });
}
const valores = resultado.estado === 'enviado' ? undefined : resultado.valores;
const erros: Erros = resultado.estado === 'formulario' ? resultado.erros : {};
const qtdErros = Object.keys(erros).length;
const grafo = montarGrafo({ pagina: { caminho: '/contato', titulo, descricao, tipo: 'ContactPage' }, empresa });
---
<Base titulo={titulo} descricao={descricao} caminho="/contato" grafo={grafo}>
  <h1>Fale com a nimblabs</h1>
  <p>O caminho mais rápido é o WhatsApp.</p>
  <BotaoWhatsApp mensagem="Olá! Vim pela página de contato da nimblabs." />

  {resultado.estado === 'enviado' ? (
    <p class="aviso aviso--ok" role="status" data-evento-ao-carregar="formulario_enviado" data-pagina={resultado.origem}>
      Recebemos sua mensagem. Vamos responder no e-mail que você informou.
    </p>
  ) : (
    <form method="post" action="/contato">
      <h2>Prefere escrever?</h2>
      {resultado.estado === 'falhou' && (
        <p class="aviso aviso--erro" role="alert">
          Não conseguimos enviar agora. Seu texto continua aqui: tente de novo ou fale no WhatsApp.
        </p>
      )}
      {qtdErros > 1 && (
        <div class="aviso aviso--erro" role="alert">
          <p>Corrija {qtdErros} campos antes de enviar:</p>
          <ul>{Object.entries(erros).map(([campo, msg]) => <li><a href={`#${campo}`}>{msg}</a></li>)}</ul>
        </div>
      )}

      <label for="nome">Nome</label>
      <input id="nome" name="nome" type="text" autocomplete="name" required maxlength="120" value={valores?.nome}
        aria-invalid={erros.nome ? 'true' : undefined} aria-describedby={erros.nome ? 'erro-nome' : undefined} />
      {erros.nome && <p id="erro-nome" class="erro">{erros.nome}</p>}

      <label for="email">E-mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required maxlength="254" value={valores?.email}
        aria-invalid={erros.email ? 'true' : undefined} aria-describedby={erros.email ? 'erro-email' : undefined} />
      {erros.email && <p id="erro-email" class="erro">{erros.email}</p>}

      <label for="mensagem">Mensagem <span class="opcional">(opcional)</span></label>
      <textarea id="mensagem" name="mensagem" rows="6" maxlength={LIMITE_MENSAGEM}
        aria-invalid={erros.mensagem ? 'true' : undefined} aria-describedby={erros.mensagem ? 'erro-mensagem' : undefined}>{valores?.mensagem}</textarea>
      {erros.mensagem && <p id="erro-mensagem" class="erro">{erros.mensagem}</p>}

      <input type="hidden" name="origem" value={valores?.origem} />
      <div class="visualmente-oculto" aria-hidden="true">
        <label for="site">Deixe este campo em branco</label>
        <input id="site" name="site" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <button type="submit">Enviar mensagem</button>
      <p class="nota">Usamos seus dados só para responder este contato. <a href="/privacidade">Política de privacidade</a></p>
    </form>
  )}
</Base>
```

`src/data/privacidade.ts`:

```ts
export const privacidade = {
  atualizadaEm: '25/09/2026',
  /** Policy points only Jean can confirm; each one blocks the launch check. */
  aConfirmar: [
    'por quanto tempo as mensagens do formulário ficam guardadas',
    'razão social que aparece como controladora dos dados (insumo 9)',
  ],
};
```

`src/pages/privacidade.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import { empresa } from '../data/empresa';
import { privacidade } from '../data/privacidade';
import { montarGrafo } from '../lib/schema';

const titulo = 'Política de privacidade | nimblabs';
const descricao = 'Quais dados o site da nimblabs coleta, para que usa, com quem compartilha e como você pede acesso, correção ou exclusão.';
const grafo = montarGrafo({ pagina: { caminho: '/privacidade', titulo, descricao }, empresa });
---
<Base titulo={titulo} descricao={descricao} caminho="/privacidade" grafo={grafo}>
  <h1>Política de privacidade</h1>
  <p>Última atualização: {privacidade.atualizadaEm}.</p>
  <p>Esta política explica quais dados a nimblabs coleta neste site, para que usa e o que você pode pedir sobre eles.</p>

  <h2>Quais dados coletamos</h2>
  <ul>
    <li><strong>Formulário de contato:</strong> nome, e-mail, a mensagem que você escrever e a página do site de onde você veio.</li>
    <li><strong>Cookies de medição:</strong> só se você aceitar no aviso de cookies. Com eles, o Google Analytics registra as páginas visitadas e os cliques no botão do WhatsApp, sem o seu nome.</li>
    <li><strong>WhatsApp:</strong> a conversa acontece no WhatsApp, sob as regras dele. O site só abre o aplicativo com uma mensagem pronta.</li>
  </ul>

  <h2>Para que usamos</h2>
  <p>Para responder o seu contato e para saber quais páginas ajudam as empresas a encontrar a nimblabs. Não vendemos seus dados nem os usamos para publicidade.</p>

  <h2>Quem mais trata esses dados</h2>
  <ul>
    <li><strong>Vercel:</strong> hospeda o site.</li>
    <li><strong>Brevo:</strong> entrega o e-mail do formulário para a equipe da nimblabs.</li>
    <li><strong>Google:</strong> mede as visitas, se você aceitar os cookies.</li>
  </ul>

  <h2>Por quanto tempo</h2>
  <p>Guardamos a mensagem do formulário pelo tempo necessário para responder e acompanhar a conversa, e apagamos quando você pedir.</p>

  <h2>Seus direitos</h2>
  <p>
    Pela LGPD, você pode pedir acesso, correção ou exclusão dos seus dados. Você também pode mudar a escolha sobre cookies a
    qualquer momento, pelo botão "Preferências de cookies" no rodapé.
    {empresa.email && <> Para qualquer pedido, escreva para <a href={`mailto:${empresa.email}`}>{empresa.email}</a>.</>}
  </p>

  <h2>Quem é responsável</h2>
  <p>A nimblabs é a controladora dos dados coletados neste site.{empresa.cnpj && <> CNPJ {empresa.cnpj}.</>}</p>
</Base>
```

`src/pages/404.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base
  titulo="Página não encontrada | nimblabs"
  descricao="Esta página não existe mais. Veja os produtos da nimblabs, o software sob medida ou fale com a gente pelo WhatsApp."
  indexavel={false}
>
  <h1>Esta página não existe mais</h1>
  <p>Ela pode ter mudado de endereço quando o site foi refeito. Estes caminhos continuam aqui:</p>
  <ul>
    <li><a href="/">Página inicial</a></li>
    <li><a href="/software-sob-medida">Software sob medida</a></li>
    <li><a href="/contato">Contato</a></li>
  </ul>
</Base>
```

- [ ] **Passo 5: ver passar**

Rode `npm run verificar`. Esperado: PASS.

- [ ] **Passo 6: segredos na Vercel.** Tarefa do Jean, com os valores dele:

```powershell
vercel env add BREVO_API_KEY production
vercel env add CONTATO_EMAIL_PARA production        # insumo 8
vercel env add CONTATO_EMAIL_REMETENTE production   # a sender already verified in Brevo
```

- [ ] **Passo 7: commit, push e prova no ar**

Mensagem: `feat: server-rendered contact form via brevo, privacy page and 404`. Depois do push:

```powershell
$u = "https://nimblabs-site.vercel.app/contato"
curl.exe -s $u | Select-String "<h1"
curl.exe -s -X POST $u -H "Origin: https://nimblabs-site.vercel.app" --data-urlencode "nome=Teste do plano" --data-urlencode "email=teste@exemplo.com" --data-urlencode "mensagem=teste da tarefa 11" --data-urlencode "origem=/contato" | Select-String "Recebemos"
curl.exe -s -X POST $u -H "Origin: https://nimblabs-site.vercel.app" --data-urlencode "nome=" --data-urlencode "email=" --data-urlencode "mensagem=não some" | Select-String "não some"
```

Esperado: o `<h1>` aparece; o segundo comando mostra "Recebemos" e o e-mail chega ao endereço do insumo 8; o terceiro devolve o texto "não some" de volta no formulário.

---

### Tarefa 12: `robots.txt`, `llms.txt`, sitemap e contrato do build

**Arquivos:**
- Criar: `public/robots.txt`, `src/pages/llms.txt.ts`
- Teste: `tests/dist/contrato.test.ts`

- [ ] **Passo 1: skill.** "Usando `seo-geo` para o acesso de robô e o contrato do build."

- [ ] **Passo 2: teste que falha.** `tests/dist/contrato.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { raizDist, lerArquivo } from './helpers';
import { produtos } from '../../src/data/produtos';

const paginas = readdirSync(raizDist).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(paginas.map((f) => [f, lerArquivo(f)]));
const indexaveis = paginas.filter((f) => f !== '404.html');

type No = Record<string, unknown>;
function referencias(v: unknown, acc: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => referencias(x, acc));
  else if (v && typeof v === 'object') {
    const o = v as No;
    if (Object.keys(o).length === 1 && typeof o['@id'] === 'string') acc.push(o['@id']);
    else Object.values(o).forEach((x) => referencias(x, acc));
  }
  return acc;
}

describe('contrato do build (homologação)', () => {
  it.each(paginas)('%s: pt-BR, um h1 e noindex', (f) => {
    expect(html[f]).toContain('<html lang="pt-BR"');
    expect(html[f].match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html[f]).toContain('<meta name="robots" content="noindex">');
  });
  it.each(indexaveis)('%s: canonical absoluto, sem barra no final e sem .html', (f) => {
    const esperado = f === 'index.html' ? 'https://nimblabs.com/' : `https://nimblabs.com/${f.replace(/\.html$/, '')}`;
    expect(html[f]).toContain(`<link rel="canonical" href="${esperado}">`);
  });
  it('títulos e descrições não se repetem', () => {
    const titulos = indexaveis.map((f) => html[f].match(/<title>(.*?)<\/title>/)![1]);
    const descricoes = indexaveis.map((f) => html[f].match(/<meta name="description" content="(.*?)">/)![1]);
    expect(new Set(titulos).size).toBe(titulos.length);
    expect(new Set(descricoes).size).toBe(descricoes.length);
  });
  it.each(indexaveis)('%s: JSON-LD válido e referências resolvem', (f) => {
    const m = html[f].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    const nos = JSON.parse(m![1])['@graph'] as No[];
    const ids = new Set(nos.map((n) => n['@id']));
    for (const r of referencias(nos)) expect(ids.has(r)).toBe(true);
  });
  it.each(paginas)('%s: todo link de WhatsApp tem número e mensagem', (f) => {
    for (const [, href] of html[f].matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)) {
      expect(href).toMatch(/^https:\/\/wa\.me\/55\d{10,11}\?text=.+/);
    }
  });
  it('sem JavaScript, o menu tem todos os produtos no HTML', () => {
    const cabecalho = html['index.html'].match(/<header[\s\S]*?<\/header>/)![0];
    for (const p of produtos) expect(cabecalho).toContain(`href="/${p.slug}"`);
  });
  it('rascunho sempre com selo', () => {
    for (const p of produtos.filter((x) => !x.publicado)) expect(html[`${p.slug}.html`]).toContain('Rascunho');
  });
  it('robots.txt libera os robôs de busca e de IA e aponta o sitemap', () => {
    const r = lerArquivo('robots.txt');
    for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'GoogleOther']) {
      expect(r).toContain(`User-agent: ${bot}\nAllow: /`);
    }
    expect(r).toContain('Sitemap: https://nimblabs.com/sitemap-index.xml');
  });
  it('llms.txt lista só produtos publicados', () => {
    const l = lerArquivo('llms.txt');
    for (const p of produtos) expect(l.includes(`https://nimblabs.com/${p.slug}`)).toBe(p.publicado);
  });
  it('sitemap tem /contato e nenhuma URL com .html ou barra no final', () => {
    const locs = [...lerArquivo('sitemap-0.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toContain('https://nimblabs.com/contato');
    for (const loc of locs.filter((l) => l !== 'https://nimblabs.com' && l !== 'https://nimblabs.com/')) {
      expect(loc.endsWith('/')).toBe(false);
      expect(loc.endsWith('.html')).toBe(false);
    }
  });
});
```

- [ ] **Passo 3: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL, sem `robots.txt` e sem `llms.txt`.

- [ ] **Passo 4: implementar**

`public/robots.txt`:

```
User-agent: *
Allow: /

# Answer engines: the explicit allow keeps a future global disallow
# from removing the site from ChatGPT, Perplexity, Claude and Gemini answers.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

Sitemap: https://nimblabs.com/sitemap-index.xml
```

`src/pages/llms.txt.ts`:

```ts
import type { APIRoute } from 'astro';
import { produtosNoAr } from '../data/produtos';

export const prerender = true;

// Published pages only, each with one factual line about what it answers.
export const GET: APIRoute = () => {
  const linhas = [
    '# nimblabs',
    '',
    '> Fábrica de software brasileira: produtos próprios para problemas comuns de empresas e desenvolvimento de software sob medida, com preço de entrada publicado.',
    '',
    '## Produtos',
    ...produtosNoAr.map((p) => `- [${p.nomeMenu}](https://nimblabs.com/${p.slug}): ${p.promessa}`),
    '',
    '## Sob medida',
    '- [Software sob medida](https://nimblabs.com/software-sob-medida): sistemas, apps e MVPs feitos para o processo da empresa.',
    '',
    '## Contato',
    '- [Contato](https://nimblabs.com/contato): WhatsApp e formulário.',
  ];
  return new Response(`${linhas.join('\n')}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
```

- [ ] **Passo 5: ver passar**

Rode `npm run verificar`. Esperado: PASS.

- [ ] **Passo 6: commit e push**

Mensagem: `feat: robots, llms.txt and build contract tests`.

---

### Tarefa 13: GA4 com aviso de consentimento

**Arquivos:**
- Criar: `src/components/AvisoCookies.astro`
- Alterar: `src/layouts/Base.astro` (inclui o aviso antes de `</body>`), `src/components/Rodape.astro` (botão "Preferências de cookies"), `astro.config.mjs`, `tests/dist/contrato.test.ts`

- [ ] **Passo 1: skills.** "Usando `accessibility` e `ux-writing` para o aviso de cookies."

- [ ] **Passo 2: teste que falha.** Acrescente em `tests/dist/contrato.test.ts`:

```ts
  it.each(paginas)('%s: nenhum script do Google no HTML (só carrega depois do aceite)', (f) => {
    expect(html[f]).not.toMatch(/<script[^>]+src="https:\/\/www\.googletagmanager\.com/);
  });
  it('aviso de cookies nasce escondido', () => {
    expect(html['index.html']).toMatch(/data-aviso-cookies[^>]*hidden/);
  });
```

- [ ] **Passo 3: ver falhar**

Rode `npm run build; npm run test:dist`. Esperado: FAIL no segundo teste.

- [ ] **Passo 4: implementar.** Em `astro.config.mjs`, acrescente ao `env.schema`:

```js
      PUBLIC_GA4_ID: envField.string({ context: 'client', access: 'public', optional: true }),
```

`src/components/AvisoCookies.astro`:

```astro
---
---
<div class="aviso-cookies" data-aviso-cookies hidden role="region" aria-label="Aviso de cookies">
  <p>
    Usamos cookies do Google Analytics para saber quais páginas trazem contatos. Nada é coletado sem o seu ok.
    <a href="/privacidade">Política de privacidade</a>
  </p>
  <div class="aviso-cookies__botoes">
    <button type="button" data-escolha="aceito">Aceitar</button>
    <button type="button" data-escolha="recusado">Recusar</button>
  </div>
</div>

<script>
  import { PUBLIC_GA4_ID } from 'astro:env/client';
  import { deveCarregarGa, deveMostrarAviso, type Escolha } from '../lib/consentimento';

  const CHAVE = 'nimblabs-consentimento';
  const ler = (): Escolha => {
    try {
      const v = localStorage.getItem(CHAVE);
      return v === 'aceito' || v === 'recusado' ? v : null;
    } catch {
      return null;
    }
  };
  const gravar = (v: Escolha) => {
    try {
      if (v) localStorage.setItem(CHAVE, v);
      else localStorage.removeItem(CHAVE);
    } catch {
      /* private mode: the choice lasts only for this page */
    }
  };
  const apagarCookiesGa = () => {
    for (const nome of document.cookie.split(';').map((c) => c.trim().split('=')[0])) {
      if (nome.startsWith('_ga')) document.cookie = `${nome}=; Max-Age=0; path=/; domain=.nimblabs.com`;
    }
  };

  type Gtag = (...args: unknown[]) => void;
  let gtag: Gtag | undefined;

  function carregarGa(id: string) {
    if (gtag) return;
    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    // gtag.js expects the `arguments` object itself, not an array
    gtag = function () { w.dataLayer.push(arguments); } as Gtag;
    gtag('js', new Date());
    gtag('config', id);
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(s);
    document.addEventListener('click', (evento) => {
      const link = (evento.target as Element | null)?.closest('a[data-evento="whatsapp_clique"]');
      if (link) gtag?.('event', 'whatsapp_clique', { pagina: location.pathname });
    });
    const aoCarregar = document.querySelector<HTMLElement>('[data-evento-ao-carregar]');
    if (aoCarregar?.dataset.eventoAoCarregar) {
      gtag('event', aoCarregar.dataset.eventoAoCarregar, { pagina: aoCarregar.dataset.pagina ?? location.pathname });
    }
  }

  const aviso = document.querySelector<HTMLElement>('[data-aviso-cookies]');
  function aplicar() {
    const escolha = ler();
    if (aviso) aviso.hidden = !deveMostrarAviso(PUBLIC_GA4_ID, location.hostname, escolha);
    if (escolha === 'recusado') apagarCookiesGa();
    if (PUBLIC_GA4_ID && deveCarregarGa(PUBLIC_GA4_ID, location.hostname, escolha)) carregarGa(PUBLIC_GA4_ID);
  }

  for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-escolha]')) {
    botao.addEventListener('click', () => {
      gravar(botao.dataset.escolha as Escolha);
      aplicar();
    });
  }
  for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-reabrir-cookies]')) {
    botao.addEventListener('click', () => {
      gravar(null);
      aplicar();
      aviso?.querySelector('button')?.focus();
    });
  }
  aplicar();
</script>
```

Em `src/layouts/Base.astro`: importe `AvisoCookies` e coloque `<AvisoCookies />` logo depois de `<Rodape />`.

Em `src/components/Rodape.astro`: importe `PUBLIC_GA4_ID` de `astro:env/client` e acrescente, depois do parágrafo do WhatsApp:

```astro
  {PUBLIC_GA4_ID && <p><button type="button" data-reabrir-cookies>Preferências de cookies</button></p>}
```

- [ ] **Passo 5: ver passar**

Rode `npm run verificar`. Esperado: PASS. O teste do aviso passa porque o componente está no layout, com ou sem ID.

- [ ] **Passo 6: commit e push**

Mensagem: `feat: ga4 behind consent, only on nimblabs.com`. O aceite e a coleta de verdade só são conferidos na Tarefa 19, porque dependem do host `nimblabs.com`.

---

### Tarefa 14: Home na direção escolhida (`art-direction`, passos 4 a 8), com aprovação do Jean

**Arquivos:**
- Criar: `src/styles/tokens.css`, `.art/log.json`
- Alterar: `src/pages/index.astro` (só classes e `data-art`), `package.json` (fontes via `@fontsource-variable/*`)

**Interfaces:**
- Consome: a direção da Tarefa 3 e a marca da Tarefa 2.
- Produz: tokens com escopo `[data-art="<direção>"]`, que a Tarefa 15 promove para o site todo.

- [ ] **Passo 1:** "Usando `art-direction`, passos 4 a 8, na home." Carregue só o que o Passo 4 da skill manda para a direção escolhida, incluindo `references/orcamento.md`.

- [ ] **Passo 2: tokens com escopo.** Crie `src/styles/tokens.css` com toda cor em OKLCH, fonte, curva e duração como custom property, dentro de `[data-art="<direção>"]`. A primeira linha é o carimbo da skill. Ponha `data-art` na raiz do conteúdo da home e em nenhuma outra página.

- [ ] **Passo 3: fontes.** No máximo 2 famílias, por pacote `@fontsource-variable/<família>` (servido pelo próprio site, woff2), com `font-display: swap` e pré-carregamento só da fonte do topo.

- [ ] **Passo 4: construir.**
  - a coreografia nas 4 camadas, ou as que a direção marcou;
  - fallback estático;
  - `prefers-reduced-motion` no mesmo commit.

  Não mexa na ordem das seções da home: ela vem da especificação.

- [ ] **Passo 5: gates.** Carregue `references/gates.md` só agora e rode os 35 contra o código. Corrija o que falhar e rode de novo.

- [ ] **Passo 6: prova.** "Usando `ui-verification`." Em `https://nimblabs-site.vercel.app`:
  - 3 larguras × 4 posições de rolagem;
  - 1 quadro com o cursor sobre o elemento que responde a ele;
  - 1 quadro com movimento reduzido;
  - console limpo;
  - LCP medido contra o orçamento assinado.

  Abra cada PNG com `Read` e rode G34 e G35.

- [ ] **Passo 7: mostrar ao Jean e PARAR.** Se ele recusar, volte ao Passo 3 da skill e registre a recusa em `references/gosto.md`.

- [ ] **Passo 8: registro e commit.** Grave `.art/log.json` com a direção, os eixos, o orçamento medido, as dependências e as direções recusadas. Mensagem: `feat: home in the approved art direction`.

---

### Tarefa 15: Visual nas demais páginas, com aprovação do Jean

**Arquivos:**
- Alterar: `src/styles/tokens.css` (escopo vira `:root`), todos os componentes e páginas, `public/og.png`

- [ ] **Passo 1:** "Usando `design-systems` para promover os tokens da home." Tire o escopo `[data-art]`, passe os tokens para `:root` e aplique-os em Base, cabeçalho, rodapé, páginas de produto, sob medida, contato, privacidade, 404 e aviso de cookies.

- [ ] **Passo 2:** "Usando `accessibility`." Confira:
  - o menu como botão de abrir e fechar, que fecha no Esc e devolve o foco;
  - o formulário: rótulo acima do campo, erro ligado por `aria-describedby`, resumo de erros com links;
  - o aviso de cookies alcançável por teclado, sem cobrir o botão "Falar no WhatsApp";
  - contraste de 4,5:1.

- [ ] **Passo 3:** "Usando `responsive-design`." Confira:
  - a partir de 360 px, sem rolagem lateral;
  - alvos de toque de pelo menos 44 px;
  - a tabela do exemplo de relatório legível no celular;
  - o aviso de cookies sem cobrir texto na primeira tela do celular.

- [ ] **Passo 4:** "Usando `motion-design`" para afinar as transições de hover, foco e menu, respeitando o orçamento.

- [ ] **Passo 5:** regere `public/og.png` com as cores da marca. Regra da `logo-design`: a marca ocupa pelo menos 25% da altura e fica longe da borda. Rode `npm test`; o teste de 1200×630 continua valendo.

- [ ] **Passo 6: prova.** "Usando `ui-verification`" em cada página de `nimblabs-site.vercel.app`: 360, 768 e 1440 px, passagem de teclado e console limpo. Mostre ao Jean e PARE.

- [ ] **Passo 7:** rode `npm run verificar`. Commit e push com a mensagem `feat: propagate the approved visual system to every page`.

---

### Tarefa 16: Protótipo do Portal do cliente (prova do A)

**Arquivos:**
- Criar: `src/assets/prova/portal-do-cliente.png`
- Alterar: `src/data/produtos/portal-do-cliente.ts` (campo `prova`)

- [ ] **Passo 1: montar o protótipo.** No scratchpad, monte uma página HTML estática do portal no visual aprovado: um painel com 3 serviços e a etapa de cada um, uma lista de documentos para baixar e um aviso de mudança. Use dados de exemplo evidentemente fictícios: nada de nome ou marca real de empresa.

- [ ] **Passo 2: capturar.** Tire um screenshot em 1200×800 com Playwright (via `playwright-core` e Chrome headless; a memória registra que o MCP pode ficar preso) e salve em `src/assets/prova/portal-do-cliente.png`.

- [ ] **Passo 3: ligar a prova.** Em `portal-do-cliente.ts`:

```ts
import prototipoPortal from '../../assets/prova/portal-do-cliente.png';
// …
  prova: {
    tipo: 'prototipo',
    imagem: prototipoPortal,
    alt: 'Protótipo do portal: painel com a etapa de três serviços e lista de documentos para baixar',
  },
```

- [ ] **Passo 4: conferir e commit.** Rode `npm run verificar`. Esperado: PASS, com a página A mostrando o selo "Protótipo". Mensagem: `feat: portal prototype as proof for product A`.

---

### Tarefa 17: Dados dos sócios e publicação

Anda conforme cada dado chega. A cada dado, altere o arquivo indicado, remova o item correspondente de `aConfirmar` e rode `npm run verificar`. Quando `pendencias(p)` ficar vazia, mude para `publicado: true`; o teste de conteúdo impede publicar antes disso. Mostre a página na homologação e faça commit e push. Mensagem por dado: `content: <insumo> for <página>`.

- [ ] **Passo 1: teste da trava de lançamento.** `tests/lancamento/lancamento.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { socios } from '../../src/data/socios';
import { home } from '../../src/data/home';
import { sobMedida } from '../../src/data/sob-medida';
import { empresa } from '../../src/data/empresa';
import { privacidade } from '../../src/data/privacidade';
import { produtos } from '../../src/data/produtos';
import { pendencias, pendenciasPagina } from '../../src/lib/publicacao';

describe('pronto para lançar', () => {
  it('quatro sócios com foto e linha', () => {
    expect(socios).toHaveLength(4);
    for (const s of socios) expect(s.linha.trim()).not.toBe('');
  });
  it('home sem pendências', () => expect(pendenciasPagina(home)).toEqual([]));
  it('sob medida sem pendências', () => expect(pendenciasPagina(sobMedida)).toEqual([]));
  it('e-mail público para pedidos da LGPD', () => expect(empresa.email).toMatch(/@/));
  it('política de privacidade confirmada pelo Jean', () => expect(privacidade.aConfirmar).toEqual([]));
  it('pelo menos um produto publicado', () => expect(produtos.some((p) => p.publicado)).toBe(true));
  it('relatório: produtos fora do lançamento', () => {
    for (const p of produtos.filter((x) => !x.publicado)) console.info(`${p.slug}: ${pendencias(p).join('; ')}`);
  });
});
```

Rode `npm run checar-lancamento`. Esperado agora: FAIL, com a lista do que falta. Esse é o painel desta tarefa.

- [ ] **Passo 2: onde entra cada dado**

| # | Dado | Onde entra |
|---|---|---|
| 1 | Sócios | Fotos em `src/assets/socios/<nome>.jpg` e as 4 entradas em `src/data/socios.ts` (`import foto from '../assets/socios/<nome>.jpg'`) |
| 2 | WhatsApp | `"<número>" \| vercel env add PUBLIC_WHATSAPP_NUMERO production`, depois de `vercel env rm` do provisório, e no `.env` local |
| 3 | Preços | `preco` e `fatorVariavel` de A, B e C; `precoMinimo` em `sob-medida.ts`; respostas de preço (a trava confere o valor) |
| 4 | D | `src/data/produtos/crm-para-agencias.ts`, com `conversion-copy` e `ux-writing`, no mesmo formato de arquivo de A, B e C; a prova é um protótipo, feito como o da Tarefa 16; entra no fim de `produtos` em `index.ts`; o teste de ordem do menu passa a incluir `'crm-para-agencias'` |
| 5 | Pares de sistemas (C) | `paresDeSistemas` e a resposta "Quais sistemas vocês integram?" com os nomes |
| 6 | Contador (B) | `revisaoFiscal`, `prova: { tipo: 'exemplo-relatorio', linhas }` com as linhas que ele mandar, e `fonte` em toda resposta com afirmação fiscal |
| 7 | Piloto (A) | `piloto: { vagas, desconto }` |
| 8 | E-mail | `vercel env add CONTATO_EMAIL_PARA production`; `empresa.email` com o e-mail público, se o Jean autorizar mostrar |
| 9 | LinkedIn e CNPJ | `empresa.linkedin`, `empresa.cnpj`, `linkedin` de cada sócio; tirar o item de `privacidade.aConfirmar` |
| 10 | GA4 | Propriedade nova só para `nimblabs.com`; `vercel env add PUBLIC_GA4_ID production` (nunca em preview) |
| 11 | Políticas | 5 perguntas em `home.faq` e 5 em `sobMedida.faq`, de 40 a 60 palavras cada, com a resposta do Jean, sem inventar |
| 12 | Prazos (B e C) | `prazo` de B e C; resposta "Quanto tempo leva…" de C com o número |
| — | Objeções dos sócios | Troca das perguntas-hipótese pelas que eles ouvem; não trava nada |

- [ ] **Passo 3: fechar.** Rode `npm run checar-lancamento` até passar. Produto com pendência fica fora do lançamento, e o relatório do teste mostra qual e por quê.

---

### Tarefa 18: Verificação completa (a regra de "pronto" da especificação)

**Arquivos:**
- Criar no vault: `Docs/Obsidian/90-medicao/nimblabs-verificacao-2026-10-05.md`

- [ ] **Passo 1:** rode `npm run verificar` e `npm run checar-lancamento`. Esperado: PASS nos dois.

- [ ] **Passo 2:** "Usando `ui-verification`" em cada página de `https://nimblabs-site.vercel.app`: 360, 768 e 1440 px, passagem só com teclado, console sem erro e requisições sem 404.

- [ ] **Passo 3: LCP no celular.** PageSpeed, mediana de 3, por página:

```powershell
$pagina = "https://nimblabs-site.vercel.app/saneamento-cadastro-fiscal"
1..3 | ForEach-Object {
  $r = Invoke-RestMethod "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$pagina&strategy=mobile&category=performance"
  $r.lighthouseResult.audits.'largest-contentful-paint'.numericValue
}
```

Esperado: mediana até 2.500 ms. Acima disso, a correção volta para a `art-direction` (regra do orçamento).

- [ ] **Passo 4: robô de IA lê o conteúdo.**

```powershell
curl.exe -s -A "PerplexityBot" https://nimblabs-site.vercel.app/integracao-de-sistemas | Select-String "Integração entre os sistemas"
curl.exe -s -A "OAI-SearchBot" https://nimblabs-site.vercel.app/ | Select-String "trabalho manual"
```

- [ ] **Passo 5: dados estruturados.** Cole a home e uma página de produto em https://validator.schema.org e no teste de resultados avançados do Google. Esperado: zero erros.

- [ ] **Passo 6: WhatsApp e formulário.** Em cada página, o botão abre o WhatsApp com a mensagem certa. Refaça os 3 comandos `curl` da Tarefa 11.

- [ ] **Passo 7:** grave os resultados na nota do vault, com números e prints, e faça commit só dela.

---

### Tarefa 19: Lançamento (06/10/2026)

Cada passo externo só acontece com o ok do Jean no dia.

- [ ] **Passo 1: mapa das URLs antigas.** Antes de trocar o domínio, colete:
  - o sitemap antigo: `curl.exe -s https://nimblabs.com/sitemap.xml -o $env:TEMP\sitemap-antigo.xml` (e os sitemaps filhos, se houver);
  - as páginas com impressão nos últimos 16 meses: exportação do Search Console, feita pelo Jean ou pela ferramenta de GSC do roihub, se as credenciais estiverem à mão.

  Para cada URL antiga que tiver página equivalente no site novo, acrescente em `astro.config.mjs`:

```js
  redirects: {
    '/caminho-antigo': { status: 301, destination: '/caminho-novo' },
  },
```

As URLs sem equivalente ficam de fora e passam a dar 404, porque o 410 foi descartado na especificação. Commit, push e confira na homologação: `curl.exe -sI https://nimblabs-site.vercel.app/caminho-antigo` deve devolver 301 com `location` apontando para o destino final.

- [ ] **Passo 2: produção.** Na Vercel, em Production:
  - `"producao" | vercel env add PUBLIC_AMBIENTE production`;
  - confira `PUBLIC_GA4_ID`, `PUBLIC_WHATSAPP_NUMERO` e os segredos do Brevo (`vercel env ls`).

- [ ] **Passo 3: trocar o domínio.** No painel da Vercel, com o Jean:
  1. No projeto antigo `nimblabs`, em Settings → Domains, remova `nimblabs.com` e `www.nimblabs.com`.
  2. No projeto novo `nimblabs-site`, em Settings → Domains, adicione `nimblabs.com` como principal e `www.nimblabs.com` com "Redirect to nimblabs.com" (308).
  3. Faça um redeploy de `main` para pegar o `PUBLIC_AMBIENTE=producao`: `vercel redeploy <url-da-última-publicação>` ou um commit vazio.

  O DNS já aponta para a Vercel (`216.198.79.65`, conferido em 22/09), então não há mudança na Hostinger.

- [ ] **Passo 4: conferência no ar.**

```powershell
curl.exe -sI https://nimblabs.com/ | Select-String "HTTP/|x-vercel"
curl.exe -sIL https://www.nimblabs.com/ | Select-String "HTTP/|location"
curl.exe -s https://nimblabs.com/ | Select-String 'content="noindex"'
curl.exe -s https://nimblabs.com/robots.txt | Select-String "Sitemap"
curl.exe -s https://nimblabs.com/llms.txt
curl.exe -sI https://nimblabs.com/crm-para-agencias | Select-String "HTTP/"
```

Esperado:
- a home responde 200;
- o www chega à home num salto só (308);
- a busca por `noindex` não encontra nada: se aparecer, o `PUBLIC_AMBIENTE` não pegou; pare e corrija;
- `robots.txt` e `llms.txt` estão publicados;
- cada produto não publicado dá 404;
- cada URL antiga chega ao destino num salto só.

- [ ] **Passo 5: GA4 de verdade.** Abra `https://nimblabs.com` numa janela anônima e confira:
  - o aviso de cookies aparece;
  - com "Recusar", nenhuma requisição vai para `googletagmanager.com`;
  - depois, com "Aceitar", a requisição de coleta sai e o clique no WhatsApp aparece no relatório em tempo real do GA4.

- [ ] **Passo 6: Search Console.** Envie `https://nimblabs.com/sitemap-index.xml`. Peça a indexação da página B primeiro e depois das outras (Inspeção de URL, que o Jean faz no navegador; a memória registra cerca de 6,4 s por URL pela API).

- [ ] **Passo 7: crons antigos.** No cron-job.org, o Jean desliga os jobs que chamam o site antigo. Nenhum deles tem destino no site novo.

- [ ] **Passo 8: base de comparação das IAs.** As 5 perguntas abaixo, feitas no ChatGPT, no Perplexity e no Gemini, com data e resposta, vão para `Docs/Obsidian/90-medicao/nimblabs-baseline-ia-2026-10-06.md`. O Jean ou um sócio faz no navegador; a memória registra que o Google recusa login automatizado.
  1. Quem faz saneamento de cadastro fiscal para a reforma tributária?
  2. Como preencher o cClassTrib no cadastro de produtos?
  3. Empresa que faz portal do cliente para escritório de contabilidade.
  4. Quem integra ERP com loja virtual no Brasil? (Troque pelos pares do insumo 5.)
  5. Fábrica de software sob medida que mostra o preço no site.

- [ ] **Passo 9: registro.** A partir de agora, `main` é o site no ar e qualquer mudança vai por branch. Atualize:
  - a memória `project_nimblabs_reinicio.md`, com a data do lançamento e o que ficou de fora;
  - o `handoff.md`;
  - o status da especificação e deste plano para `concluído`.
