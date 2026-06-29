---
tipo: dashboard
status: vivo
---

# 📊 Dashboard — O que revisar

> Requer o plugin **Dataview** (já instalado). Atualiza sozinho. Veja o ciclo de vida dos nós em [[INDEX]].

## ⚠️ Nós desatualizados (`stale`)

A lista do que revisitar. Se estiver vazia, nenhum upstream mudou — está tudo em dia.

```dataview
TABLE WITHOUT ID file.link AS "Nó", depends_on AS "Depende de"
FROM "" WHERE status = "stale"
```

## Estado de todos os nós

```dataview
TABLE WITHOUT ID file.link AS "Nó", status, depends_on AS "Depende de"
WHERE depends_on AND file.name != "_template"
SORT status ASC
```
