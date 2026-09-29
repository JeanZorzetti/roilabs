# Contract: `app.roilabs.com.br/c/<slug>`

- Sem login. Slug fora de `^[A-Za-z0-9_-]{8}$` ou inexistente → `not-found.tsx` ("Contrato não encontrado"), sem
  dizer se existiu.
- `robots: noindex, nofollow`. Título: `<titulo> · ROI Labs`.
- Lê só o `doc` congelado e as colunas de aceite. Não importa `NICHOS`, `simular()` nem a proposta.
- Ordem: capa (marca ROI Labs, "Contrato", título, partes resumidas, estado) → qualificação das partes → cláusulas
  numeradas → Anexo I (escopo por fase, também incluído, o que precisamos, não inclui) → bloco final.
- Bloco final, por estado:
  - **pendente**: aviso "Este contrato ainda está sendo preenchido pela ROI Labs. O aceite abre quando estiver
    completo." Sem formulário.
  - **aguardando aceite**: formulário `#aceite` com nome completo, CPF, caixa desmarcada "Li o contrato inteiro e
    concordo, em nome da CONTRATANTE", botão "Aceitar o contrato" e `hash` oculto. `?erro=` mostra a mensagem do campo
    em `role="alert"`, ligada ao campo por `aria-describedby`.
  - **aceito**: "Aceito em <data> às <hora> por <nome>." Sem formulário.
- Largura de 360 px sem rolagem lateral. O texto do contrato cabe na largura de leitura da `/p/` (44rem).
