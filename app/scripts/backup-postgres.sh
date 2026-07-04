#!/bin/sh
# Daily Postgres backup for roilabs_db — run ON THE VPS via cron (needs pg_dump
# and a DATABASE_URL that reaches the DB from there; see the runbook in the
# vault: Docs/Obsidian/80-dev/backup-uptime.md).
#
#   crontab -e →  10 3 * * *  DATABASE_URL='postgres://...' /root/backup-postgres.sh
#
# ponytail: 14 daily dumps on the same disk; the weekly off-VPS copy is a
# manual/ops step in the runbook — automate with rclone if it ever hurts.
set -eu

DIR="${1:-/root/backups/roilabs}"
mkdir -p "$DIR"
STAMP=$(date +%F)
OUT="$DIR/roilabs_db-$STAMP.dump"

pg_dump "$DATABASE_URL" --format=custom --file="$OUT"

# Retention: 14 days of dailies.
find "$DIR" -name 'roilabs_db-*.dump' -mtime +14 -delete

echo "backup ok: $OUT ($(du -h "$OUT" | cut -f1))"
