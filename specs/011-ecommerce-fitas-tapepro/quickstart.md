# Quickstart — Validação da 011 (e-commerce de fitas)

**Constituição II**: build e typecheck locais são **não-confiáveis** neste repo (OneDrive corrompe `node_modules`). Nada aqui é declarado "funcionando" sem output de ambiente real — Docker/EasyPanel ou navegador em produção.

Ordem obrigatória: **env vars → self-checks puros → sandbox → produção → SEO**.

---

## 0. Pré-requisitos (Constituição I — env vars primeiro)

Antes de qualquer teste, confirmar no EasyPanel (`/app`):

| Var | Como validar |
|---|---|
| `MELHOR_ENVIO_TOKEN` | Cotação de teste responde `ok: true` |
| `MELHOR_ENVIO_BASE_URL` | Aponta para sandbox **ou** produção, conforme a fase |
| `MELHOR_ENVIO_CEP_ORIGEM` | CEP de despacho real do Tapepro |
| `DATABASE_URL` | `roilabs_db` — o mesmo da 010 |

> **Se a cotação falhar, este é o primeiro lugar a olhar — não o código.** É literalmente o modo de falha que o FR-035 existe para pegar.

**Dados de catálogo**: ✅ **preços existem** — tabela oficial em `site-goiania/docs/Imagens/`, transcrita no [data-model](./data-model.md#5-tabela-oficial). Não é mais bloqueio.

**Bloqueio restante** (não impede testar o fluxo; impede cotar frete de verdade):
- **peso e dimensões da embalagem** por rolo — pendente do Tapepro. Sem isso a cotação não roda.

Para validar antes: usar peso/dimensão plausíveis e **conferir a cotação contra o real** antes de publicar.

---

## 1. Self-checks puros (rodam local, sem rede)

```bash
cd app
node --test test/frete-fitas.test.mjs      # contingência: cep_nao_atendido vs falha_tecnica
node --test test/cupons.test.mjs           # escopo por vertical + todos os casos antigos
node --test test/success-fee.test.mjs      # 010 — deve continuar verde, intocado

cd ../site-goiania
node src/scripts/check-cart-math.mjs       # math de rolos E de caixas
node src/scripts/check-matrix.mjs          # asserção de fatos fitas.ts ↔ institucional
```

**Esperado**: tudo verde. `check-cart-math.mjs` **só passa a rodar nesta feature** — hoje é órfão (research D7). Se ele nunca rodou antes, a primeira execução pode revelar dívida pré-existente de porcelanato; corrigir antes de seguir.

**Gate**: `success-fee.test.mjs` verde sem alteração é a prova de que a 010 não foi afetada.

---

## 2. Migração de banco (MANUAL, de máquina que alcança o host)

```bash
cd app
# Preview seguro — mostra o SQL sem aplicar (aprendizado da 010)
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script

npx prisma db push
node scripts/migrate-011-backfill.mjs
```

**Conferir depois do backfill:**
```sql
SELECT escopo, COUNT(*) FROM cupons GROUP BY escopo;        -- tudo 'porcelanato'
SELECT vertical, COUNT(*) FROM pedidos GROUP BY vertical;   -- tudo 'porcelanato'
```

> ⚠️ **`db push` + backfill ANTES do push do código.** Invertido, o código novo consulta coluna inexistente e derruba produção.

---

## 3. Cotação de frete no sandbox

Com `MELHOR_ENVIO_BASE_URL` no sandbox:

```bash
curl -X POST https://app.roilabs.com.br/api/frete/cotar \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'cep=01310100' \
  --data-urlencode 'itens=[{"slug":"fita-transparente-personalizada","rolos":20}]'
```

| Cenário | Como forçar | Esperado |
|---|---|---|
| Cotação normal | CEP de capital | `ok: true`, valor e prazo |
| CEP não atendido | CEP inexistente/remoto | `motivo: "cep_nao_atendido"` |
| Falha técnica | Token inválido temporário | `motivo: "falha_tecnica"` |
| Timeout | `BASE_URL` para host que não responde | `falha_tecnica` em ~4s |

**Gate crítico**: as duas causas **têm** de sair distintas. Se ambas voltarem iguais, o FR-034 não foi implementado e a perda silenciosa de receita continua possível.

---

## 4. E2E de dinheiro em produção (NÃO-NEGOCIÁVEL)

Um **pedido pago de verdade** — padrão das specs 002/003/010. Valor baixo, reembolsável.

1. Abrir `/fitas/`, escolher SKU com preço público (**comum** ou **gomada** — a personalizada é só-orçamento). A vitrine já indica a modalidade de cada um (FR-041) e a página mostra a **tabela de faixas** (FR-039).
2. Adicionar **abaixo** do mínimo → bloqueia informando o mínimo (FR-029).
3. Ajustar para o mínimo → carrinho mostra **rolos**, nunca "caixas" ou "m²".
3b. **Subir a quantidade cruzando uma faixa** (ex.: 100 → 101 na gomada) → o unitário cai de R$ 37,20 para R$ 32,20 e o subtotal acompanha (FR-038).
3c. Abrir a **personalizada** → CTA de orçamento, **sem botão de compra**. Forçar seu slug no carrinho → checkout rejeita com `?erro=item_orcamento` (FR-009/FR-040).
4. **Adicionar um porcelanato** → aviso de pedidos separados; **os dois carrinhos sobrevivem** (FR-028).
5. CEP de outro estado → frete e prazo aparecem antes de pagar.
6. Enviar **sem CPF/CNPJ** → bloqueia (FR-007).
7. CNPJ válido → pagar de verdade.
8. Conferir no admin: `vertical='fitas'`, itens em `itens_pedido_fita`, `precoRolo` gravado, `total` = servidor.
9. Repassar ao Tapepro → `NegocioOriginado` com taxa **congelada**, classificado pelo documento (15% aquisição).
10. Repetir com o **mesmo CNPJ** → segundo negócio classificado como **recorrência (10%)**.

**Gates**: nenhum item descartado em silêncio (SC-006) · valor cobrado = recalculado (SC-005) · taxa correta (SC-008).

---

## 5. Contingência e alerta em produção

1. Pedido com CEP não atendido → pedido criado, `frete=null`, `freteMotivo='cep_nao_atendido'`, comprador avisado antes de pagar, cobrado só o produto.
2. Invalidar `MELHOR_ENVIO_TOKEN` e fazer **3 pedidos** → `freteMotivo='falha_tecnica'` nos três e **e-mail de alerta chega** (FR-035).
3. Restaurar o token.

> Este é o teste mais importante da feature. Sem ele, uma credencial errada faria 100% dos pedidos saírem sem frete cobrado, com o sistema **aparentando funcionar conforme especificado**.

---

## 6. SEO — o ativo que não pode quebrar

```bash
# Toda URL de porcelanato responde igual (FR-019) — esperado: 200 em todas
curl -o /dev/null -s -w "%{http_code} %{url_effective}\n" \
  https://goiania.roilabs.com.br/porcelanato/

# Barra final (FR-021) — esperado: 301 para https:// COM barra, nunca http://
curl -sI https://goiania.roilabs.com.br/fitas | grep -i location

# 404 real (FR-022) — esperado: HTTP/1.1 404, nunca 200
curl -sI https://goiania.roilabs.com.br/fitas/nao-existe/ | head -1
```

**Os 4 índices (FR-023)** — o erro recorrente deste repo é esquecer um:

| Índice | Verificação |
|---|---|
| `sitemap.xml` | URLs de fitas presentes, todas com barra final |
| `llms.txt` | Vertical de fitas listado |
| `busca-index.json` | SKUs de fita buscáveis |
| Rodapé | Link para `/fitas/` |

**Feed (FR-024)**: `feed.xml` contém só SKUs com preço público; SKU só-orçamento ausente **e o build não quebra** — exclusão por design, não por acidente.

**Home (FR-025/FR-031)**: `<title>`, `<h1>` e JSON-LD identificam loja de **fitas**; porcelanato como vertical secundário com link. Nenhuma menção a "Goiânia" em título, `h1` ou `areaServed` das páginas de fitas.

**Baseline no GSC — fazer ANTES de publicar**: registrar posição e impressões da home e das 41 páginas. Sem baseline não há como saber se o reposicionamento funcionou.

> ⚠️ **Não ler o GSC nos primeiros dias.** Crawl Stats é média de 90 dias — leitura precoce engana, e este repo já caiu nessa (o falso "40,6% OK"). Reavaliar em ~30 dias.

---

## Checklist de fechamento

- [ ] Self-checks verdes, incluindo `success-fee.test.mjs` intocado
- [ ] `check-cart-math.mjs` **wired no `prebuild`** e passando
- [ ] `db push` + backfill aplicados **antes** do push do código
- [ ] Pedido pago real com repasse e taxa correta
- [ ] Contingência testada nas **duas** causas + alerta recebido
- [ ] 41 URLs de porcelanato respondendo igual
- [ ] 4 índices atualizados · feed sem a personalizada (só-orçamento) · 404 real
- [ ] Baseline do GSC registrado
- [ ] Linha 'fitas adesivas' do Centro de Custo **ativa**, com os SKUs vinculados (FR-012)
- [ ] Pendência FR-033b (link institucional → e-commerce, repo Tapepro) registrada no handoff
- [ ] `handoff.md` co-localizado + commit + push (Constituição V)
