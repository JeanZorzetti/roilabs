# Quickstart — Verificar os centros de custo editáveis

Roteiro de verificação em **ambiente real** (Constituição II — build local não conta:
OneDrive corrompe `node_modules`). Pré-requisito: schema aplicado no `roilabs_db`.

## 0. Pré-requisitos

- Máquina que alcança `2.24.207.200` (rede do `roilabs_db`).
- `app/.env` com `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PASSWORD`.

## 1. Schema + seed (manual, no host real)

```bash
cd app
npm install
npx prisma db push      # cria parametro_centro_custo, sku_config; ADD COLUMN snapshot em itens_pedido
npm run db:seed         # upsert idempotente do global (defaults dos docs)
```
✅ Esperado: `db push` sem erro; seed cria/atualiza 1 linha global sem duplicar ao re-rodar.
⚠️ NÃO confiar no runner standalone para o schema — `db push` é manual (memória `sofia_next_db_push_runner_fails`).

## 2. Self-check da lógica (sem DB)

```bash
npm test                # session + centros-custo
```
✅ Esperado: `centros-custo.test.mjs: all assertions passed`, cobrindo:
- precedência `SKU > linha > global` e herança de campo nulo;
- âncora 9.100/7.000 com defaults → interm. líq. ≈ R$2.700, WL líq. ≈ R$1.535;
- snapshot estável: editar parâmetro não muda a apuração de um item já com snapshot;
- SKU sem modalidade-alvo → Intermediação.

## 3. Edição sem deploy (navegador em prod, `app.roilabs.com.br`)

1. Login em `/login` (`ADMIN_PASSWORD`). Abrir `/admin/centros-de-custo`.
2. **Global:** mudar markup 30% → 25%, salvar. ✅ a tabela do catálogo recalcula o atacado
   e os líquidos **na hora**, sem redeploy (SC-001).
3. **Faixa inválida:** tentar comissão 150% → ✅ recusado com mensagem, parâmetros
   anteriores intactos (FR-003).
4. **Piso por SKU:** num SKU de varejo R$129/m², cadastrar piso R$95 → ✅ o item passa a
   "real" e usa 95 (não 129÷1,30); remover o piso → volta a "estimado".
5. **Cenário:** aplicar preset "Conservador" → ✅ alíquotas viram 6,0%/4,6%; ajustar uma à
   mão → ✅ prevalece e cenário marca "ajustado".

## 4. Linha e modalidade-alvo

1. Criar linha `premium` com markup 50%; associar 3 SKUs. ✅ só esses 3 usam 50%; um
   override de SKU vence sobre a linha.
2. Marcar 1 SKU como `wl` (premium). ✅ na leitura **real** do agregado ele soma no Centro
   WL; um SKU sem marca soma em Intermediação.

## 5. Snapshot / auditoria (precisa de pedido pago)

1. Anotar o agregado real com markup atual.
2. Marcar um pedido como **pago** (fluxo de pagamento de teste) → snapshot grava no item.
3. Mudar o markup global. ✅ a **simulação do catálogo** reflete o novo markup; o **pedido
   pago mantém** a margem apurada com o markup da época (FR-011 / SC-005).
4. Conferir que o agregado mostra **duas leituras rotuladas** (real por modalidade oficial
   + referência hipotética) e que a soma da leitura real bate item a item (SC-007).

## Sinais de regressão (parar e investigar)

- `npm test` vermelho, ou a âncora não reproduz com defaults.
- Editar um parâmetro **muda** a margem de um pedido já pago (snapshot furado).
- Página quebra com banco sem `global` (fallback a `PARAMS` falhou — FR-004).
