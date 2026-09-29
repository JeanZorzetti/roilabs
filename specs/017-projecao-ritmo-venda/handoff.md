# Handoff — 017 Projeção do ritmo de venda

**Última atualização: 29/09/2026, ~00:30 UTC.** No ar em `app.roilabs.com.br/admin/projecao` (commits `9caa163`,
`24ec0ea`, `a8e5a43`, `65729fb`, `d457d43` em `main`).

## ⚠️ 0. Falta uma coisa para a consulta funcionar: a chave na EasyPanel

`DATAFORSEO_API_KEY` **não está** nas variáveis do app **roilabs-admin** na EasyPanel. Foi provado em produção
pelo comportamento, sem ver valor: `POST /api/projecao/consultar` devolve `503 {"erro":"chave"}` em 0,3 s, sem
chamar a DataForSEO (nada cobrado). Esta máquina não tem acesso à EasyPanel.

**O que fazer (Jean):** EasyPanel → roilabs-admin → Environment → `DATAFORSEO_API_KEY` = o mesmo valor de
`roihub/.env` → Deploy. Depois: abrir `/admin/projecao`, colar 10 termos de moda e consultar (≈ US$ 0,10). O campo
de cidade também depende da chave (a lista de locais é grátis, mas autenticada).

## Feito

- `app/src/lib/projecao.ts`: conta pura com as constantes de research D6–D11, cada uma com fonte e data:
  CTR com e sem IA, fatia de IA por cenário, dificuldade → posição, rampa, os 20 funis. Também limpeza e
  validação da entrada, agrupamento de variantes, `projetar()` (3 cenários, 12 meses, cadeia, taxa do
  parceiro), arredondamento único (`arredondarVendas`), ponte do simulador e tradução dos códigos da DataForSEO.
- `app/src/lib/dataforseo.ts`: cliente mínimo. A chave só é lida no servidor e nunca vai para mensagem nem log.
- `POST /api/projecao/consultar` (dificuldade primeiro; se falhar, o volume não é pago) e
  `GET /api/projecao/cidades` (lista do Brasil em memória por 24 h).
- `/admin/projecao`: entrada, resposta sticky (número, 3 cenários, "Usar no simulador", avisos, procedência),
  curva de 12 meses em SVG, cadeia da busca à venda com a taxa do parceiro, cobertura da demanda, tabela de
  termos, premissas e fontes, e o que a projeção não cobre. Link "Projeção" no menu, ao lado de Preços.
- `/admin/precos`: lê `?nicho&ritmo&cenario`. Com parâmetros válidos, o simulador abre preenchido e mostra
  "Veio da Projeção". Sem eles, ou com qualquer valor inválido, abre exatamente como antes.
- `app/test/projecao.test.mjs` no `npm test`: SC-002 (todo nicho tem funil com fonte), SC-003 (casos de
  referência nos 3 cenários e nos 3 modelos), entrada, erros, ponte e cadeia. A suíte inteira passa.

### Provado

| O quê | Onde | Resultado |
|---|---|---|
| Pipeline real (dificuldade → volume → junção → projeção) | local, com a chave do roihub, 3 termos | US$ 0,01236 + 0,09 = **US$ 0,102** (SC-004). A API devolve o termo em minúsculas e a junção por `normalizar` resolve. "vestido/vestidos de festa longo(s)" (22.200 cada) viraram um grupo só |
| Lista de locais | local, grátis | 5.310 locais; `Goiania,State of Goias,Brazil` = `City`, código 1001552 |
| Sem sessão | produção | `/admin/projecao` → `307 /login`; API → `401` |
| Nenhum POST da projeção ao abrir (FR-003) | produção | 0 (o único POST é o beacon `app.himetrica.com`, que já existia no layout) |
| Erro de entrada | produção | termo de 90 caracteres → erro no campo com `aria-invalid`, nenhuma chamada; o servidor também devolve 400 |
| Erro de chave | produção | bloco "Não deu para consultar" com a causa, sem projeção 0 |
| Tela pronta, trocas, taxa do parceiro, ponte | produção, com a **resposta da API interceptada no navegador** (sem chave, a consulta real não sai de lá) | foco vai para a resposta; troca de cenário e de nicho sem POST novo; taxa de 2,5% recalcula e ganha o selo; "abc" dá aviso e nunca NaN; a projeção mostra 7,8 e o simulador abre com "7,8" e "Veio da Projeção"; `/admin/precos` direto ou com `nicho=xpto` abre com 30 pedidos, como antes |
| Estados | produção (interceptado) | tudo fora do alcance → "0" + o limite do cenário (20); venda rara → "menos de 0,1" + "≈ 0,1 no ano 1"; clínica + Brasil → aviso |
| Larguras | produção | 1440, 768 e 390 sem rolagem lateral; no celular a ordem é entrada → resposta → curva; a tabela vira cartões |
| Teclado e árvore de acessibilidade | produção | Tab: nicho → cidade → termos → consultar → cenários → usar no simulador; rótulos associados; `region` com nome; SVG com `title` e `desc` e a tabela mês a mês em `<details>` |

## Decisões tomadas no implement (fora do plan)

- **`fonte` responde 503, não 502.** A EasyPanel troca qualquer 502 do app pela página HTML "Service is not
  reachable" dela, e a tela perdia a causa (FR-014). O 503 passa. O corpo (`erro`) separa chave de fonte.
  contracts/api.md foi atualizado.
- **`app/tailwind.config.ts` ganhou `projecao`** na lista `content`. O Tailwind do app só gera classes das pastas
  listadas, então sem isso a tela sairia sem estilo.
- **`resultado.tsx` existe desde o início** (curva, cadeia, cobertura, tabela): o total passava de 400 linhas,
  como o T021 previa.
- **Cidade:** o campo vazio vale Brasil. Texto que não bate com uma sugestão bloqueia a consulta ("Escolha uma
  das cidades sugeridas…") em vez de pagar pela região errada. A sugestão prioriza o nome que **começa** com o
  texto: "Goi" casa com toda cidade "…,State of Goias".
- **"menos de 0,1"**: venda rara não aparece como "0", que é o zero real de "tudo fora do alcance". O simulador
  recebe 0 nesse caso.
- **Cliques com 1 decimal abaixo de 10**, para 0,4 clique não virar 0.
- **O cartão mostra o "mês estável (potencial)"** abaixo dos cenários. É referência e não vai ao simulador (FR-010).
- **`GLOSSARIO.md`** na raiz, com os termos da tela (Consultar termos, Usar no simulador, fora do alcance…).

## Próximos passos

1. Configurar a chave na EasyPanel (seção 0) e fazer a 1ª consulta real em produção (quickstart §2, passos 2 e
   6): conferir o custo mostrado (≤ US$ 0,15) e "Goi" → Goiânia.
2. Validar a conta com o Jean usando uma cadeira real (Tapepro/B2B). A 1ª leitura com moda deu **0,3 pedido/mês
   no conservador** contra 13 no otimista para 3 termos. É a conta do CTR de 2026 com IA (a 1ª posição média
   vale 7,1%), mas o número baixo vai assustar na reunião: a cadeia existe para explicar isso.
3. Se o gasto passar de US$ 5/mês: cache por termo e região (research D14).

## Pendências

- **T034 e T036** dependem da chave na EasyPanel (seção 0). O caminho pago só foi provado local, com 3 termos.
  Em produção, os quadros prontos foram feitos com a resposta interceptada no navegador: o código é o do deploy,
  mas o JSON da consulta é fixture.
- O campo de cidade em produção devolve `503 fonte` até a chave entrar. A lista e a ordem foram provadas local.
- Não verificado: leitor de tela de verdade (NVDA/VoiceOver), celular físico (o `datalist` no iOS) e a consulta
  com 200 termos (o custo máximo teórico é US$ 0,126).

## Gotchas

- 🚨 **A dificuldade da DataForSEO veio 0 nos 3 termos testados**, inclusive "vestido de festa longo", com 22.200
  buscas/mês. Se isso se repetir no Brasil, todo termo cai na melhor faixa e a projeção fica otimista demais
  pela posição. Na 1ª consulta real, conferir a coluna Dificuldade. Se vier tudo 0, tratar 0 como "não medida"
  (conta 15) é a correção de uma linha em `posicaoPara`, mas precisa de decisão do Jean.
- 🚨 **Bug anterior à 017, fora do escopo:** `/api/auth/login` e `/api/auth/logout` montam o redirect com
  `req.url`, que atrás da EasyPanel é `https://0.0.0.0:3000`. O clique em "Sair" leva a `ERR_ADDRESS_INVALID`, e o
  login pelo formulário provavelmente também. O cookie é gravado; navegar para `/admin` à mão funciona. A
  correção é usar `Location` relativo.
- **502 do app vira página da EasyPanel.** Vale para qualquer rota de qualquer app lá: erro que a tela precisa
  ler não pode ser 502.
- **Script de verificação:** `button[type=submit]` pega primeiro o **"Sair"** do cabeçalho (é um form de POST).
  Use `getByRole('button', { name: 'Consultar termos' })`.
- O deploy da EasyPanel levou ~2 min nos 3 pushes desta sessão. Depois de cada um, a tela foi conferida em
  produção, sem assumir o deploy.
- Custo desta sessão na DataForSEO: US$ 0,102 (1 consulta local de 3 termos). O saldo era US$ 49,82 antes.
