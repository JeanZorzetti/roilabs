# Contrato — mudanças da 018

## `POST /api/projecao/consultar` (delta sobre a 017)

### Requisição

```json
{ "termos": ["…"], "local": { "codigo": 1001552, "nome": "Goiania,State of Goias,Brazil" },
  "nicho": "clinicas", "paraQuem": "Karla Daniele · cursos" }
```

- `nicho`: id de `NICHOS`. Ausente ou desconhecido → **400** `entrada` ("Escolha um nicho da lista."), antes de pagar.
- `paraQuem`: opcional. Aparado; vazio = sem nome. Mais de 80 caracteres → **400** `entrada`.

### Resposta 200

A mesma da 017, com um campo a mais:

```json
{ "…": "…", "id": "cm1…" }
```

- `id`: a consulta guardada. `null` quando a gravação falhou: a projeção vale do mesmo jeito, e a tela avisa que
  ela não entrou no histórico. A falha vai para `log.error({ err, etapa: 'gravar' })`, sem termos.

## Leitura (sem rota de API)

- `/admin/projecao?consulta=<id>`: o server component lê a consulta e a entrega à tela. `id` inexistente → a tela
  mostra "consulta não encontrada". Banco fora → "não deu para ler o histórico". Nos dois casos, nada de projeção.
- `/admin/projecao/consultas`: as 200 mais recentes, `count` e `sum(custo_usd)` de todas.
