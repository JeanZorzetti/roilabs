# Research: Contrato da cadeira

## D1. Onde o contrato mora

- **Decision**: tabela própria `contratos_cadeira` (Prisma, `public`).
- **Rationale**: `vertice.contracts.client_id` é `not null` e aponta para `vertice.clients`. O site da Vértice serve
  `/c/<slug>` lendo essa tabela, com a marca e as cláusulas de agência dela. A proposta de cadeira já mora fora da
  Vértice (019, D1), e o contrato segue a proposta.
- **Alternatives**: reaproveitar `vertice.contracts` com um cliente fantasma (recusado: marca errada e cláusulas
  erradas no link); guardar o contrato dentro do `doc` da proposta (recusado: a proposta é congelada, e o aceite
  precisa de colunas próprias).

## D2. Trava de exclusão

- **Decision**: FK `proposta_id` com `ON DELETE RESTRICT` e `UNIQUE`.
- **Rationale**: uma regra, no lugar em que todo caminho passa. `UNIQUE` também garante um contrato por proposta.
- **Alternatives**: checar na action (recusado como única trava: aba velha ou chamada direta passam).

## D3. Aceite sem JS

- **Decision**: `<form action={aceitar}>` com server action que termina em `redirect()`. O erro volta como
  `?erro=nome|cpf|caixa|mudou|travado`.
- **Rationale**: nenhum componente cliente, funciona com JS desligado e com conexão ruim. O formulário tem 3 campos:
  perder o que foi digitado num erro custa segundos.
- **Alternatives**: `useActionState` (recusado: um componente cliente a mais só para manter 2 campos preenchidos).

## D4. Prova do texto aceito

- **Decision**: SHA-256 (`node:crypto`) do `doc` serializado com as chaves ordenadas. O formulário leva o hash do texto
  renderizado. A action recalcula o hash do `doc` atual e recusa se diferir. O hash é gravado em `aceito_hash`.
- **Rationale**: o `jsonb` não guarda a ordem das chaves, então `JSON.stringify` direto do objeto relido pode mudar
  de ordem. Com as chaves ordenadas, qualquer um recalcula o hash do `doc` gravado e confere com o do aceite.
  [LEI MP 2.200-2/2001 art. 10 §2º]: o registro de autoria (nome, CPF, IP, navegador, data) mais a integridade do
  texto é a prova do clickwrap.
- **Alternatives**: guardar uma cópia do texto no aceite (recusado: o `doc` já é imutável depois do aceite, FR-018);
  assinatura por provedor (fora da v1, ver Assumptions da spec).

## D5. Corrida entre aceite e edição

- **Decision**: o aceite usa `updateMany({ where: { id, aceitoEm: null, editadoEm: lido.editadoEm } })`, e a edição
  usa `updateMany({ where: { id, aceitoEm: null } })`, que também grava `editadoEm = now()`. `count === 0` = perdeu a
  corrida.
- **Rationale**: sem transação explícita, e sem janela entre ler e gravar.

## D6. IP do aceite

- **Decision**: primeiro item de `x-forwarded-for`, senão `x-real-ip`, senão vazio. `user-agent` cortado em 500
  caracteres.
- **Rationale**: o app roda atrás do proxy da EasyPanel (Traefik), que acrescenta o IP do cliente.
- **Ceiling**: o cabeçalho pode ser forjado por quem chama direto o container, mas o container não é exposto.

## D7. Conteúdo das cláusulas

- **Decision**: cláusulas novas em `montarContratoCadeira()`, na ordem do FR-008. O texto é minuta [PRÁTICA]:
  paritário de Código Civil para PJ [LEI CC 421-A]; com PF, sem limite de responsabilidade e foro do domicílio dela
  [LEI CDC 25, 51 I, 101 I]; reajuste pelo IPCA só na renovação anual [LEI Lei 10.192/2001 art. 2º §1º]; foro com
  pertinência ao domicílio de uma das partes [LEI CPC 63 §1º]; "não cria representação comercial" dito expressamente,
  com o ponto levado ao advogado (spec, Assumptions).
- **Rationale**: a remuneração variável exige a métrica, a fonte do número e a janela escritas, ou vira litígio
  (saas-legal, contratos). Venda originada é definida por modelo de nicho (pedido, assinatura, consulta).
- **Alternatives**: adaptar o contrato-quadro do vault (recusado: é do marketplace de porcelanato, em que a ROI Labs é
  a vendedora); só colar as `condicoes` da proposta (recusado: sem objeto, saída, domínio e dados, não é contrato).
