# Handoff — Feature 004: Centros de custo editáveis e auditáveis

**Data**: 2026-06-30 | **Status**: CÓDIGO COMPLETO — aguardando `prisma db push` + seed manual em prod

---

## Feito

- **Schema** (`app/prisma/schema.prisma`): 2 novas tabelas `parametro_centro_custo` + `sku_config`; 5 colunas snapshot nullable em `itens_pedido`.
- **Seed** (`app/prisma/seed.ts`): upsert idempotente do global com defaults dos docs (markup 0.30, comissão 0.10, alíq. 10.2%/6.2%, cenário base).
- **Lib** (`app/src/lib/centros-custo.ts`): resolvers puros `resolverParametros`, `resolverPiso`, `resolverModalidade` com precedência `SKU > linha > global > PARAMS` campo a campo; mapa `CENARIOS` (conservador/base/otimista). Fórmulas `calcIntermediacao`/`calcWL` intactas (FR-016).
- **Rotas API**:
  - `GET/PATCH /api/centros-custo/parametros` — lê + grava global/linha com auth + validação de faixa.
  - `PATCH /api/centros-custo/sku/[slug]` — grava piso/modalidade/linha/overrides por SKU; retorna `prejuizo:true` quando piso > varejo.
- **UI** (`app/src/app/admin/centros-de-custo/`):
  - `parametros-form.tsx` (client island): edita global, cria/edita linhas, aplica presets de cenário, valida faixas no cliente.
  - `sku-row.tsx` (client island): edita piso (input livre), marca modalidade-alvo (select), associa linha (select), exibe real/estimado e aviso de prejuízo.
  - `page.tsx`: carrega todas as camadas do DB, resolve por SKU, exibe catálogo editável + duas leituras rotuladas do agregado (referência hipotética e real por modalidade oficial), aviso de itens sem snapshot.
- **Webhook** (`app/src/app/api/pagamentos/webhook/route.ts`): ao virar `pago`, congela snapshot por item (`piso`, `modalidade`, `comissao`, `aliqIntermediacao`, `aliqWL`) na mesma transação idempotente.
- **Testes** (`app/test/centros-custo.test.mjs`): cobrem âncora 9.100/7.000, precedência `SKU > linha > global`, herança de campo nulo, piso real/estimado, modalidade default Intermediação, estabilidade do snapshot. **Verde**: `node --import tsx test/centros-custo.test.mjs`.

---

## Decisões chave

- `findFirst` + `create/update` (não `upsert` com compound unique) no seed e nas rotas, por limitação do Prisma com `chave: null` no compound unique — ver ponytail comment no seed.
- Snapshot por item grava o `piso já resolvido` (não o markup), para que o markup não precise ser snapshotted separadamente.
- `cenario='ajustado'` é setado automaticamente quando uma alíquota é editada manualmente sem passar por um preset.
- A leitura "real" do agregado usa `modalidade_snapshot` (se existir) ou o `modalidadeAlvo` atual do SkuConfig; SKU sem nenhuma marca = Intermediação.
- T001 (confirmar DB alcançável) permanece pendência manual — não executável do host de desenvolvimento (OneDrive/Constituição II).

---

## Próximos passos obrigatórios (ops)

1. **`prisma db push` manual** no host que alcança `2.24.207.200`: cria `parametro_centro_custo`, `sku_config` e 5 colunas ADD COLUMN em `itens_pedido`.
2. **`npm run db:seed`** no mesmo host: cria a linha global com os defaults dos docs.
3. **Verificação prod** conforme `quickstart.md`: editar markup, testar faixa inválida, cadastrar piso real, aplicar preset cenário, conferir duas leituras rotuladas.

---

## Pendências / gotchas

- **T024** (verificação real) não executada — depende do `prisma db push` manual acima.
- O `npm test` valida a lógica pura (sem DB). Testes de integração (persistência + snapshot) são validados manualmente via quickstart.
- Se o build standalone falhar no runner do EasyPanel: verificar `prisma generate` antes do `next build` (padrão do projeto — já está no Dockerfile provavelmente; checar).
- Slug órfão em `sku_config` (slug sumiu do catálogo): a página mostra os dados do catálogo atual; o registro fica inerte mas não quebra. Limpeza manual quando necessário.
- `cenario` é salvo apenas no global; linhas não têm campo cenário (não há presets por linha — YAGNI).
