---
tipo: spec
status: em revisão
data: 2026-09-22
dono: Jean (dev)
---

# nimblabs.com: site novo (especificação de design)

**Resumo:** a nimblabs recomeça do zero como **site institucional de uma fábrica de software**. Ela vende
quatro produtos próprios e faz software sob medida para empresas brasileiras, e as visitas vêm só pelo Google
e pelas respostas de IA. A etapa 1 tem sete páginas e vai ao ar em **06/10/2026**. O prazo vem do
produto de cadastro fiscal, que só vende em novembro e dezembro: a página dele leva semanas para
aparecer no Google. Sucesso é contato qualificado pedindo orçamento pelo WhatsApp.

Decidido em brainstorming com o Jean em 22/09/2026, em quatro partes aprovadas uma a uma. Tudo o que
existia antes (a tese de portfólio de micro-SaaS, os produtos e o site antigos) foi desconsiderado de
propósito. A oferta vem do documento de pacotes que o Jean colou na conversa (A, B e C); o D foi
informado por ele só pelo nome.

## 1. O que é a nimblabs

- **Fábrica de software de quatro sócios.** O Jean desenvolve; os outros três já estão prospectando.
- **Vende quatro produtos próprios** (seção 2) e **faz software sob medida** para três tipos de cliente:
  - qualquer empresa que precise de sistema, app ou site sob medida;
  - startups e fundadores que precisam tirar um MVP do papel;
  - empresas médias e grandes que precisam de sistemas internos e automação com IA. Integração entre sistemas fica no produto C.
- **Público:** empresas no Brasil. O site é só em português.
- **Como os clientes chegam:** só pelo Google e pelas respostas de IA, sem anúncio.
- **Sucesso:** contato qualificado pedindo orçamento. Número de visitas não é meta.
- **Marca separada da ROI Labs.**

## 2. A oferta

| | Produto | Para quem | Preço no documento (a confirmar) | Situação |
|---|---|---|---|---|
| A | Portal do cliente | empresas de serviço que hoje mandam tudo por WhatsApp: clínica, contabilidade, advocacia, transportadora, consultoria | entrada R$ 8–15 mil + R$ 600–1.500/mês | não construído; vendido como cliente piloto, com entrega em 90 dias |
| B | Saneamento do cadastro fiscal para 2027 | empresas médias com cadastro de produtos e serviços no ERP | entrada R$ 25–60 mil + R$ 2.500–6.000/mês | não construído; temporada de venda em novembro e dezembro de 2026 |
| C | Integração entre sistemas | empresas que copiam dado à mão entre ERP, loja virtual, CRM, emissor de nota e planilha | entrada R$ 6–12 mil + R$ 400–1.200/mês | vende sem nada construído; aceita só 2 ou 3 pares de sistemas no começo |
| D | CRM para agências de marketing | agências de marketing | a definir (insumo 3) | não construído; oferta a definir (insumo 4) |

**Condições do B que o site respeita:**
- A nimblabs entrega uma **sugestão de classificação**, que o responsável fiscal do cliente valida. A responsabilidade tributária nunca é da nimblabs.
- Um **contador ou tributarista parceiro** revisa as regras antes de qualquer entrega.

## 3. Mapa de páginas

```
nimblabs.com
├── Home                       /
├── Produtos ▾                 (só menu, sem página própria)
│   ├── Portal do cliente      /portal-do-cliente
│   ├── Cadastro fiscal 2027   /saneamento-cadastro-fiscal
│   ├── Integrações            /integracao-de-sistemas
│   └── CRM para agências      /crm-para-agencias
├── Sob medida                 /software-sob-medida
│   ├── MVP para startups      /software-sob-medida/…   ← etapa 2
│   └── Sistemas internos e IA /software-sob-medida/…   ← etapa 2
├── Contato                    /contato
├── Privacidade                /privacidade   (só no rodapé)
└── Blog                       /blog/…        ← etapa 2
```

**Menu.**
- **Topo:** três itens, Produtos (abre os quatro), Sob medida e Contato.
- **Celular:** o menu abre com tudo à vista, sem submenu escondido.
- **Rodapé:** repete os links e acrescenta WhatsApp, e-mail e Privacidade.

**Decisões.**
- **"Sob medida" em vez de "sob demanda".** É o termo que o cliente digita no Google ("software sob medida").
- **Produtos e Sob medida lado a lado no menu** explicam o negócio: o que já tem escopo e preço definidos, e o que é construído do zero.
- **Integração aparece só na página C.** A página de sistemas internos e IA, da etapa 2, manda para ela em vez de repetir o conteúdo.
- **A URL não leva o ano.** O "2027" fica no nome do menu e no título da página, que são fáceis de trocar; trocar a URL faz a página perder posição no Google.
- **`/privacidade` é obrigatória.** O formulário coleta dado pessoal, e a LGPD exige dizer o que é feito com ele.
- **Fora da etapa 1:** página "Sobre" (a equipe entra como seção da home) e busca interna.

## 4. Conteúdo e conversão

### O que o site precisa provocar

O visitante manda uma mensagem no WhatsApp. O formulário serve para quem não usa WhatsApp no trabalho.

### Caminho até o contato

- **Um único botão no site inteiro, "Falar no WhatsApp".** Ele aparece no topo, no meio e no fim de cada página.
- **Cada página abre o WhatsApp com uma mensagem já escrita**, que diz de onde a pessoa veio. O link segue o formato `https://wa.me/55<número>?text=<mensagem codificada>`.

  Rascunhos das mensagens (o texto final passa pela `ux-writing`):

  | Página | Mensagem |
  |---|---|
  | Home | Olá! Vim pelo site da nimblabs e quero conversar sobre um projeto. |
  | A | Olá! Vim pela página do portal do cliente e quero saber se serve para a minha empresa. |
  | B | Olá! Vim pela página de cadastro fiscal e quero saber se o meu cadastro está pronto para 2027. |
  | C | Olá! Vim pela página de integração de sistemas e quero parar de copiar dado à mão. |
  | D | Olá! Vim pela página do CRM para agências e quero saber mais. |
  | Sob medida | Olá! Vim pela página de software sob medida e tenho um projeto para conversar. |
  | Contato | Olá! Vim pela página de contato da nimblabs. |

- **O formulário fica em `/contato` e pede nome, e-mail e uma mensagem opcional.** A página de origem vai num campo oculto, sem a pessoa digitar. A qualificação acontece na conversa, não no formulário.

### Preço na página

Cada produto mostra o preço de entrada ("a partir de") e o que faz o valor subir:
- **B:** o número de itens no cadastro. Exemplo: "a partir de R$ 25 mil + R$ 2.500/mês; o valor depende do número de itens no cadastro".
- **A e C:** o fator é definido com os sócios, junto com os preços (insumo 3).

Mostrar o preço filtra antes da conversa: quem chama já sabe a ordem de grandeza.

### Páginas de produto (A a D): mesma estrutura

1. A promessa: o resultado, para quem é, e o botão
2. O problema contado nas palavras do cliente
3. Como funciona, em 3 passos, com prazo
4. O que o cliente recebe
5. Prova
6. Preço
7. As 5 objeções mais ouvidas, com resposta (viram perguntas frequentes marcadas para o Google)
8. Botão final

Eu escrevo as objeções como hipótese; os três sócios que prospectam corrigem com o que ouvem de verdade.

### Home: distribui, não vende

1. A promessa da fábrica
2. Uma faixa sobre a reforma tributária, que fica no ar só até 31/12/2026
3. Os 4 produtos, cada um apresentado pelo problema que resolve (por exemplo, "Seus clientes perguntam 'e aí, como está?' no WhatsApp?") e com o preço de entrada
4. O bloco de sob medida, com os três tipos de cliente
5. Como vocês trabalham, em 3 passos
6. Quem faz: os 4 sócios
7. Perguntas frequentes
8. Botão final

### Promessas (rascunho, não aprovado; o texto final sai na implementação, com `conversion-copy`)

- **Home (topo aprovado como rascunho na conversa):**
  > **Tire o trabalho manual da sua empresa.**
  > Quatro produtos para problemas comuns e software sob medida para o resto, com o preço de entrada na página.
  > [Falar no WhatsApp]
- **A:** o cliente acompanha o serviço, baixa documentos e recebe aviso num portal com a marca da empresa, e a equipe para de responder "como está meu processo?" no WhatsApp.
- **B:** cadastro de produtos e serviços com NCM, NBS e cClassTrib conferidos item a item e pronto para importar de volta no ERP antes de janeiro de 2027.
- **C:** o dado que a equipe copia à mão entre sistemas passa a ir sozinho, e as horas de digitação somem da semana.
- **Sob medida:** sistema, app ou MVP feito para o processo da empresa, com preço e prazo combinados antes de começar.
- **D:** escrita depois da definição do produto (insumo 4).

### Prova, sem cases de cliente e sem produto pronto

- **A e D:** imagem do protótipo, com o selo "protótipo".
- **B:** um exemplo de relatório de divergências, com o selo "exemplo". Cada linha traz o item, o código atual, o código sugerido e o motivo. O contador parceiro revisa o exemplo, e o nome e o registro dele aparecem na página.
- **C:** um antes e depois, da planilha preenchida à mão toda sexta-feira ao dado indo sozinho, com a conta das horas economizadas.
- **Em todas as páginas:** os quatro sócios, com foto, nome e o que cada um já fez.
- **Nenhum número, logo ou depoimento inventado.** Nenhuma tela mostra A, B ou D como se já estivessem prontos.

### Três regras sem exceção

1. Toda afirmação fiscal (datas, rejeição de nota, multa), na página B ou nos artigos da etapa 2, é revisada pelo contador parceiro e cita a fonte (lei, nota técnica) antes de ir ao ar.
2. As vagas de cliente piloto do A só aparecem com um número real.
3. A faixa da reforma tributária sai do ar sozinha em 01/01/2027. Na prática, uma condição de data no build mais uma publicação agendada para esse dia.

### Medição da conversão

- **Dois registros de clique no GA4:** `whatsapp_clique` e `formulario_enviado`, cada um com a página de origem. Só contam visitantes que aceitaram cookies (seção 9).
- **Contato qualificado:** os sócios marcam à mão, lendo a mensagem que já diz de onde a pessoa veio.
- **Base de comparação:** o primeiro mês. Não há meta antes disso.

## 5. Marca e visual

### Marca (`logo-design`)

- **Formato:** o nome "nimblabs" desenhado como marca, em path e não digitado numa fonte do site, mais um símbolo para o ícone da aba e do celular. Com 8 letras, o nome é a parte principal; o símbolo só aparece onde o nome não cabe.
- **Ideia a testar:** fábrica é a mesma peça repetida. As letras do nome são montadas com uma peça padrão, e uma delas usa uma peça diferente, a sob medida. O desenho conta o modelo de negócio: produto é repetição, sob medida é a exceção. A quantidade de produtos fica fora do desenho de propósito: com um quinto produto, a marca ficaria errada.
- **Testes antes de mostrar:**
  - legível a 16 px, em uma cor só, sobre fundo claro e sobre fundo escuro;
  - olhando o print de 32 px, a forma pode ser nomeada em uma palavra;
  - teste "Acme": trocar o nome por outro. Se o desenho continuar servindo, a ideia não está nele, e o trabalho volta ao começo.
- **Apresentação:** a escolhida em 3 tamanhos, aplicada no topo do site e no ícone da aba, ao lado de 2 descartadas com o motivo de cada.
- **Entregáveis:**
  - componentes `Logo`, `Wordmark` e `Marca` (símbolo e nome juntos), com a geometria gerada por fórmula e fixada no componente, e a receita num comentário;
  - `icon.svg` com cor fixa e modo escuro dentro do próprio SVG;
  - `apple-touch-icon.png` de 180×180, sem transparência;
  - imagem de compartilhamento de 1200×630.

### Visual (`art-direction`)

- **O que o site não pode parecer:**
  1. Site de IA genérico: roxo, gradiente, vidro, estrela de quatro pontas.
  2. Agência de marketing: colorido e festivo. Ainda por cima, agência é o público do D.
  3. Software house de banco de imagem: azul corporativo, aperto de mão, "transformação digital".
- **Material próprio:** nota fiscal, tabela de cadastro com NCM e cClassTrib, telas do portal, dado passando de um sistema para outro. Isso pode ser o visual do site, no lugar de ilustração genérica. O cuidado é não repetir o visual de formulário e carimbo do e-NR1.
- **Gente:** os quatro sócios. As fotos precisam ter a mesma luz e o mesmo fundo; foto de celular serve, desde que as quatro sejam feitas juntas.
- **Limite de peso (faixa "marca" da `art-direction`):**
  - JavaScript adicionado: até 80 kb comprimido;
  - maior elemento da tela visível em até 2,5 s num celular 4G simulado com CPU 4× mais lenta;
  - resposta a clique em até 200 ms;
  - deslocamento de layout até 0,1.

  Esses valores ficam declarados no manifesto da direção, no bloco "Custo".

### Ordem, com uma aprovação do Jean em cada passo

1. Marca, como descrito acima.
2. Três direções visuais descritas em texto, uma delas tirada do material real. O Jean escolhe, e nada é construído antes. Na pesquisa, perguntar ao Jean se ele quer referências do próprio setor.
3. A home construída na direção escolhida, com os tokens restritos a ela. O Jean aprova vendo imagens em 3 larguras de tela, em várias posições de rolagem, com cursor sobre um elemento e com movimento reduzido.
4. A `design-systems` promove os tokens para o site todo, e as outras páginas recebem o mesmo visual.

## 6. Parte técnica

- **Astro, com saída estática.** Toda página é HTML pronto; nenhuma depende de JavaScript para aparecer. É o formato que abre mais rápido e o único que robô de IA lê.
- **Só o envio do formulário roda no servidor** (adaptador da Vercel, rota sob demanda).
  - O contato vai por e-mail pelo Brevo para o endereço do insumo 8, com "responder para" apontando para o e-mail do lead.
  - Contra spam, um campo oculto que só robô preenche; captcha só entra se o spam aparecer.
- **No navegador, JavaScript só para o menu** (botão com `aria-expanded`, fecha no Esc), **para o aviso de cookies e para o GA4** (que só carrega depois do aceite).
- **Produtos:** um só layout, com uma coleção de conteúdo de 4 arquivos. Cada arquivo guarda promessa, problema, passos, entregáveis, preço, objeções, mensagem do WhatsApp e prova. Mudar um preço é editar uma linha.
- **Fontes:** no máximo 2 famílias, servidas pelo próprio site: woff2, `font-display: swap`, pré-carregamento só da fonte do topo.
- **Imagens:** formato moderno e dimensões explícitas. A imagem do topo carrega com prioridade; as outras, só quando entram na tela.
- **Onde fica o código:**
  - `C:\dev\nimblabs`, fora do OneDrive, que já corrompeu `node_modules` e quebrou `vercel --prod` em outros projetos;
  - repositório novo e privado `JeanZorzetti/nimblabs-site`;
  - a pasta `ROI Labs\nimblabs` e o repositório `JeanZorzetti/nimblabs` antigos ficam intactos.
- **Acessibilidade (WCAG 2.2 AA):**
  - contraste de 4,5:1 no texto;
  - foco visível e tudo operável por teclado;
  - rótulo acima de cada campo, e erro ao lado do campo dizendo o que fazer;
  - `autocomplete` nos campos;
  - `prefers-reduced-motion` respeitado.
- **Responsivo:** funciona a partir de 360 px de largura, com alvos de toque de pelo menos 44 px.

## 7. Google e IA

- **`robots.txt`:** libera todos e libera explicitamente `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Perplexity-User`, `Google-Extended` e `GoogleOther`, com a linha do sitemap.
- **`llms.txt`:** cada página com uma linha factual sobre o que ela responde.
- **Dados estruturados:** um `<script type="application/ld+json">` por página, com um único `@graph` e `@id` absolutos.
  - Em todas as páginas: `Organization` (`https://nimblabs.com/#organization`), `WebSite` e `WebPage`. Em `/contato`, `ContactPage`.
  - Na home: `Person` para cada sócio, só com LinkedIn real, e `FAQPage`.
  - Nos produtos e em sob medida: `Service`, com `provider` apontando para a organização, `areaServed` Brasil e `offers` com o mesmo preço de entrada da página; mais `FAQPage`.
  - Dado que não existe (LinkedIn, CNPJ) fica fora do bloco, nunca com valor inventado.
- **Em cada página:**
  - `<title>` e descrição próprios;
  - um único `<h1>`;
  - canonical absoluto `https://nimblabs.com/<slug>`, sem barra no final;
  - entrada no `sitemap.xml`, gerado a cada publicação.
- **Busca-alvo:** a busca que cada página quer atrair (por exemplo, B: "saneamento de cadastro fiscal", "cClassTrib") é conferida com dado de volume antes de fechar título e `<h1>`.
- **Perguntas frequentes num formato que a IA consegue citar:** a pergunta é o título, e a primeira frase responde sozinha, em 40 a 60 palavras.

## 8. Publicação

- **Vercel:** projeto novo `nimblabs-site`, no time `jean-zorzettis-projects`, que está no **plano Hobby**.
  - As regras da Vercel proíbem uso comercial no Hobby ("Hobby teams are restricted to non-commercial personal use only"). O Jean decidiu em 22/09 ficar no Hobby e aceitar o risco de a Vercel pausar o projeto.
  - Até o lançamento, `main` publica só em `nimblabs-site.vercel.app`, que é onde o Jean aprova as telas. Enquanto a variável `PUBLIC_AMBIENTE` não for `producao`, toda página leva `<meta name="robots" content="noindex">` e os rascunhos aparecem com selo. No lançamento, essa variável muda, e é a única troca.
  - Depois do lançamento, `main` passa a ser o site no ar, e as mudanças vão por branch com endereço de prévia.
  - O domínio só entra no lançamento.
- **Situação conferida em 22/09:** `nimblabs.com` resolve para a Vercel (`216.198.79.65`) e mostra o site antigo. Já `https://www.nimblabs.com` dá erro de certificado.
- **Lançamento (06/10):**
  1. Antes de trocar o domínio, baixar o sitemap antigo e exportar do Search Console as páginas com impressão nos últimos 16 meses.
  2. Mapear as URLs antigas. As que têm página equivalente no site novo recebem redirecionamento permanente direto para ela, em `vercel.json`. As outras dão 404, e a página 404 leva às páginas principais. A resposta 410 foi descartada: na Vercel ela exige código extra, e o Google também tira do índice as páginas com 404.
  3. Tirar `nimblabs.com` e `www.nimblabs.com` do projeto antigo e colocar no novo. O domínio sem www é o principal; o www leva direto para ele, num salto só.
  4. Conferir no ar: o domínio principal responde 200; o www e cada URL antiga chegam ao destino num salto só; `robots.txt`, `sitemap.xml` e `llms.txt` estão publicados.
  5. No Search Console, enviar o sitemap e pedir a indexação da página B primeiro, depois das outras.
  6. Desligar os crons do cron-job.org que ainda chamam o site antigo.
  7. O projeto antigo fica na Vercel sem domínio, para voltar atrás em minutos se preciso. Apagá-lo é outra decisão.
- **Fora do escopo:** os subdomínios antigos (swarm, seoforecaster, cannibalscan, aftercare) ficam como estão.

## 9. Medição

- **Search Console:** impressão, posição e página no Google.
- **GA4 com aviso de consentimento** (decidido em 22/09, porque no Hobby a Vercel não tem registro de clique):
  - Nada do Google carrega antes de o visitante aceitar.
  - "Aceitar" e "Recusar" têm o mesmo peso, e um link no rodapé reabre a escolha.
  - O GA4 só roda no domínio `nimblabs.com`, nunca em prévia nem em localhost.
  - Visitas vindas de `chatgpt.com` e `perplexity.ai` aparecem na origem do tráfego, só entre quem aceitou.
- **Base de comparação das IAs:** na semana do lançamento, 5 perguntas que um cliente faria, feitas no ChatGPT, no Perplexity e no Gemini. Data e resposta ficam salvas em `Docs/Obsidian/90-medicao/`.

## 10. Quando uma página conta como pronta

- conferida em 360, 768 e 1440 px, navegável só pelo teclado e sem erro no console;
- maior elemento da tela visível em até 2,5 s num celular 4G, pela mediana de 3 medições no PageSpeed;
- conteúdo presente no HTML lido como robô de IA (`curl -A` com o identificador do ChatGPT e do Perplexity);
- dados estruturados validados no validator.schema.org e no teste de resultados avançados do Google;
- formulário testado de ponta a ponta (o e-mail chega) e WhatsApp abrindo com a mensagem certa;
- no lançamento, cada URL antiga chega ao destino num salto só.

## 11. Cronograma (alvo)

| Quando | Entrega | Quem decide |
|---|---|---|
| 23/09 (qua) | marca: a escolhida e 2 descartadas | Jean aprova |
| 24/09 (qui) | três direções visuais em texto | Jean escolhe |
| 28/09 (seg) | home construída, no endereço de prévia | Jean aprova |
| 29/09 (ter) | prazo dos insumos da seção 12 | sócios |
| 02/10 (sex) | demais páginas, no endereço de prévia | Jean aprova |
| 05/10 (seg) | verificação completa e mapa das URLs antigas | — |
| 06/10 (ter) | lançamento | Jean |

Cada aprovação precisa sair no mesmo dia; uma aprovação atrasada empurra o lançamento na mesma medida.
Página sem os insumos dela não trava as outras: fica fora do menu e do sitemap até ficar pronta.

## 12. Insumos (o que só os sócios têm)

| # | Insumo | O que trava |
|---|---|---|
| 1 | Sócios: nome, foto (mesma luz e fundo), uma linha sobre o que cada um já fez, LinkedIn | seção "quem faz" e `Person` nos dados estruturados |
| 2 | Número de WhatsApp que vai atender | o lançamento inteiro |
| 3 | Preços: confirmar os de A, B e C; definir o do D e o mínimo do sob medida; o que faz o valor subir em A e C | bloco de preço de cada página |
| 4 | D: o que o CRM faz e para que tamanho de agência | página D |
| 5 | C: os 2 ou 3 pares de sistemas que serão aceitos | página C |
| 6 | B: nome e registro do contador parceiro, a revisão dele das afirmações fiscais e 3 a 5 linhas reais para o exemplo de relatório | página B |
| 7 | A: número de vagas de cliente piloto e desconto | página A |
| 8 | E-mail que recebe os contatos do formulário | formulário |
| 9 | LinkedIn da empresa e CNPJ, se houver | nada; sem eles, os campos ficam fora dos dados estruturados |
| 10 | ID de medição do GA4 (`G-…`) de uma propriedade nova só para `nimblabs.com` | medição |
| 11 | Políticas para as perguntas frequentes da home: de quem é o código, manutenção depois da entrega, atendimento remoto, forma de pagamento | perguntas frequentes da home |
| 12 | Prazo de entrega de B e C (o do A é 90 dias, do documento) | passo "como funciona" de B e C |

Não trava nada, mas melhora as páginas: as objeções que os três sócios ouvem na prospecção.

## 13. Etapa 2 (outubro e novembro)

- **Blog em `/blog/…`** com artigos sobre a reforma tributária, para atrair busca para o B: cClassTrib, NBS, NCM, IBS e CBS. Vale a mesma regra fiscal: revisão do contador e fonte citada.
- **Sob medida em duas páginas,** MVP para startups e Sistemas internos e IA, dentro de `/software-sob-medida/…`. As URLs são definidas com dado de busca.

## 14. Riscos

- **Contador parceiro não fechado até 29/09:** a página B não vai ao ar, e a temporada fica em risco. É o insumo mais urgente.
- **D sem definição:** a página D fica fora do lançamento.
- **Aprovação atrasada:** o cronograma não tem folga.
- **Ideia da marca reprovada nos testes:** o trabalho volta ao começo da `logo-design`, o que custa cerca de um dia.
- **Hobby com uso comercial (risco aceito em 22/09):** a Vercel pode pausar o projeto, e o site sai do ar até a situação ser resolvida. A saída é assinar o Pro na hora, sem mudar código.
- **GA4 só conta quem aceita cookies:** os números de clique são uma amostra, não o total. O total de contatos continua sendo o que os sócios contam no WhatsApp e no e-mail.

## 15. Fora do escopo

- Construir os produtos A, B, C e D. O site vende; construir é outro projeto.
- Migrar conteúdo do blog antigo.
- Os subdomínios antigos e o destino deles.
- Anúncio pago.
- Versão em inglês.
- Página "Sobre" e busca interna, na etapa 1.
