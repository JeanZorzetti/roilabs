# Runner LOCAL do rank tracking — fallback do GitHub Actions (startup_failure por
# billing do Actions em repo privado, 2026-07-03). Agendado no Task Scheduler:
#   tarefa "roilabs-rank-tracking", toda segunda 09:00 (roda atrasado se a máquina
#   estava desligada). Remover quando o Actions voltar: Unregister-ScheduledTask roilabs-rank-tracking
# Requer SERPER_API_KEY como env var de usuário (setx SERPER_API_KEY <key>).
$ErrorActionPreference = 'Stop'
Start-Transcript -Path "$env:TEMP\roilabs-rank-tracking.log" -Append | Out-Null

$repo = Resolve-Path "$PSScriptRoot\..\..\.."
Set-Location $repo

git pull --rebase --autostash
node site-goiania/src/scripts/rank-tracking.mjs
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; exit 1 }

git add Docs/Obsidian/rank-tracking.csv Docs/Obsidian/rank-tracking.md
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "chore: weekly rank tracking $(Get-Date -Format yyyy-MM-dd)"
  git push
}
Stop-Transcript | Out-Null
