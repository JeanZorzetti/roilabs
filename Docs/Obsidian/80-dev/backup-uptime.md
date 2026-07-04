---
tipo: runbook
status: vivo
data: 2026-07-04
dono: Jean (dev)
---

# 🛡️ Backup do Postgres + uptime monitor

> [!info] Por que existe
> `roilabs_db` guarda pedidos pagos e leads reais com **zero backup**; checkout quebrado hoje = ninguém sabe. Este runbook fecha os dois buracos com custo zero. Código do ciclo 7: `/api/health` no app + `app/scripts/backup-postgres.sh`.

## 1. Backup diário (VPS, ~10 min de setup)

O script está versionado em `app/scripts/backup-postgres.sh` (dump `--format=custom`, retenção 14 dias).

1. Copiar o script pro VPS (host que alcança o Postgres):
   ```bash
   scp app/scripts/backup-postgres.sh root@VPS:/root/backup-postgres.sh
   chmod +x /root/backup-postgres.sh
   ```
2. Se o host não tiver `pg_dump`: `apt install postgresql-client` (versão ≥ do servidor) — **ou** rodar via container: `docker exec <container-postgres> pg_dump -U roilabs_db roilabs_db > ...` (adaptar o cron).
3. Testar 1× na mão:
   ```bash
   DATABASE_URL='postgres://roilabs_db:SENHA@127.0.0.1:5432/roilabs_db' /root/backup-postgres.sh
   ```
4. Agendar (03:10, todo dia):
   ```
   crontab -e
   10 3 * * * DATABASE_URL='postgres://...' /root/backup-postgres.sh >> /var/log/roilabs-backup.log 2>&1
   ```
5. **Cópia semanal fora do VPS** (o disco do VPS morrer é o cenário que o backup existe pra cobrir): baixar 1 dump por semana pro PC (`scp root@VPS:/root/backups/roilabs/roilabs_db-*.dump .`) ou automatizar com rclone pra um drive grátis.

### Teste de restore (fazer 1× de verdade — backup não testado não é backup)

```bash
createdb roilabs_restore_test
pg_restore --dbname=roilabs_restore_test --no-owner /root/backups/roilabs/roilabs_db-AAAA-MM-DD.dump
psql roilabs_restore_test -c 'select count(*) from pedidos;'  # deve bater com prod
dropdb roilabs_restore_test
```

## 2. Uptime monitor (cron-job.org, grátis — mesmo padrão do Compass)

Criar 3 monitores (intervalo 5–15 min, alerta por e-mail no free tier):

| URL | O que prova |
|---|---|
| `https://app.roilabs.com.br/api/health` | app + **DB** (rota nova do ciclo 7; 200 `{"ok":true}` / 503) |
| `https://goiania.roilabs.com.br/` | e-commerce no ar |
| `https://roilabs.com.br/` | institucional no ar |

Config: request timeout 30s, notificar após 1 falha, e-mail do Jean. O `/api/health` não expõe dado nenhum (só `{ok}`) — seguro sem auth.

## Pendências ops

- [ ] Instalar cron do backup no VPS + 1º dump verificado
- [ ] 1 teste de restore real (checklist acima)
- [ ] Definir a cópia semanal fora do VPS (manual ou rclone)
- [ ] Criar os 3 monitores no cron-job.org (⏳ `/api/health` vale após o redeploy automático do app)
