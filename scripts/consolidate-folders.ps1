# =====================================================================
# OPEN-IMMO-AKQUISE — Folder-Konsolidierung
# =====================================================================
#
# Verschiebt:
#   C:\Users\offic\Dropbox\Aquise-app          -> open-immo-akquise\web
#   C:\Users\offic\Dropbox\Aquise-app-android  -> open-immo-akquise\android
#   C:\Users\offic\Dropbox\Aquise-app-intern   -> open-immo-akquise\intern
#
# Anforderungen:
#   - In einem FRISCHEN PowerShell-Fenster ausführen (nicht aus Claude/Worktree heraus!)
#   - Dropbox vorher pausieren (Tray → Pause Sync) — empfohlen aber nicht zwingend
#   - Keine offenen Editoren/Terminals in den Quellverzeichnissen
#
# Usage:
#   pwsh -File scripts\consolidate-folders.ps1            # dry-run (zeigt Plan)
#   pwsh -File scripts\consolidate-folders.ps1 -Execute   # tatsächlich ausführen
# =====================================================================

[CmdletBinding()]
param(
    [switch]$Execute
)

$ErrorActionPreference = 'Stop'
$DROPBOX = 'C:\Users\offic\Dropbox'
$NEW_PARENT = Join-Path $DROPBOX 'open-immo-akquise'

$moves = @(
    @{ From = Join-Path $DROPBOX 'Aquise-app';         To = Join-Path $NEW_PARENT 'web'    }
    @{ From = Join-Path $DROPBOX 'Aquise-app-android'; To = Join-Path $NEW_PARENT 'android' }
    @{ From = Join-Path $DROPBOX 'Aquise-app-intern';  To = Join-Path $NEW_PARENT 'intern'  }
)

Write-Host '=== OPEN-IMMO-AKQUISE Folder-Konsolidierung ===' -ForegroundColor Cyan
Write-Host ''

# 0. Pre-checks
Write-Host '0) Pre-Checks' -ForegroundColor Yellow

if (Test-Path $NEW_PARENT) {
    Write-Host "   ✗ Ziel-Ordner existiert bereits: $NEW_PARENT" -ForegroundColor Red
    Write-Host '     Lösche ihn zuerst oder benenne ihn um, dann nochmal versuchen.'
    exit 1
}

foreach ($m in $moves) {
    if (Test-Path $m.From) {
        Write-Host "   ✓ Quelle existiert: $($m.From)"
    } else {
        Write-Host "   - Quelle fehlt (skip): $($m.From)" -ForegroundColor Yellow
    }
}

# 1. Worktrees prüfen
Write-Host ''
Write-Host '1) Aktive Git-Worktrees in den Quellverzeichnissen?' -ForegroundColor Yellow
foreach ($m in $moves) {
    if (-not (Test-Path $m.From)) { continue }
    $gitDir = Join-Path $m.From '.git'
    if (-not (Test-Path $gitDir)) { continue }
    Push-Location $m.From
    try {
        $worktrees = git worktree list --porcelain 2>$null | Select-String '^worktree '
        if ($worktrees.Count -gt 1) {
            Write-Host "   ⚠ $($m.From) hat $($worktrees.Count) Worktrees:" -ForegroundColor Yellow
            $worktrees | ForEach-Object { Write-Host "       $_" }
            Write-Host '     → diese müssen entfernt werden mit: git worktree remove <path>'
        }
    } finally { Pop-Location }
}

# 2. Plan zeigen
Write-Host ''
Write-Host '2) Plan' -ForegroundColor Yellow
Write-Host "   New parent: $NEW_PARENT"
foreach ($m in $moves) {
    if (Test-Path $m.From) {
        Write-Host "   $($m.From)"
        Write-Host "     -> $($m.To)"
    }
}

if (-not $Execute) {
    Write-Host ''
    Write-Host 'Dry-run beendet. Mit -Execute ausführen, um tatsächlich zu verschieben.' -ForegroundColor Cyan
    exit 0
}

# 3. Dropbox-Hinweis
Write-Host ''
Write-Host '3) Dropbox-Sync' -ForegroundColor Yellow
Write-Host '   Hast du Dropbox pausiert? (Tray → Pause Syncing)'
$ans = Read-Host '   [j/n]'
if ($ans -notmatch '^[jJyY]') {
    Write-Host '   Abbruch — bitte Dropbox pausieren und nochmal starten.' -ForegroundColor Red
    exit 1
}

# 4. Move
Write-Host ''
Write-Host '4) Verschiebe Ordner...' -ForegroundColor Yellow
New-Item -ItemType Directory -Path $NEW_PARENT -Force | Out-Null
foreach ($m in $moves) {
    if (-not (Test-Path $m.From)) { continue }
    Write-Host "   → $($m.From)  ->  $($m.To)"
    Move-Item -Path $m.From -Destination $m.To
}

# 5. PROJECT_IDENTITY.ts updaten
Write-Host ''
Write-Host '5) PROJECT_IDENTITY.ts pfad-Konstanten updaten' -ForegroundColor Yellow
$pidFile = Join-Path $NEW_PARENT 'web\PROJECT_IDENTITY.ts'
if (Test-Path $pidFile) {
    $content = Get-Content $pidFile -Raw
    $content = $content -replace [regex]::Escape("'C:\\Users\\offic\\Dropbox\\Aquise-app'"), "'C:\\Users\\offic\\Dropbox\\open-immo-akquise\\web'"
    Set-Content -Path $pidFile -Value $content -NoNewline
    Write-Host "   ✓ $pidFile aktualisiert"
} else {
    Write-Host "   - $pidFile nicht gefunden (skip)" -ForegroundColor Yellow
}

# 6. memory/DATENBANK_WARNUNG.md aktualisieren (Pfad-Hinweis)
$memFile = Join-Path $NEW_PARENT 'web\memory\DATENBANK_WARNUNG.md'
if (Test-Path $memFile) {
    Write-Host "   ℹ memory/DATENBANK_WARNUNG.md erinnert noch an alten Pfad — manuell prüfen."
}

# 7. Done
Write-Host ''
Write-Host '✓ Konsolidierung abgeschlossen!' -ForegroundColor Green
Write-Host ''
Write-Host 'Neue Struktur:'
Write-Host "  $NEW_PARENT"
Write-Host '    ├ web\          (Next.js, GitHub: Open-Immo-Akquise public)'
Write-Host '    ├ android\      (Capacitor, GitHub: Open-Immo-Akquise-APP)'
Write-Host '    └ intern\       (GitHub: Open-Immo-Akquise-intern)'
Write-Host ''
Write-Host 'Nächste Schritte:'
Write-Host '  1. Dropbox wieder starten (Tray → Resume Syncing)'
Write-Host '  2. cd C:\Users\offic\Dropbox\open-immo-akquise\web'
Write-Host '  3. git status → sollte "nothing to commit" zeigen'
Write-Host '  4. git add PROJECT_IDENTITY.ts && git commit -m "chore: update path to consolidated folder"'
Write-Host '  5. git push origin main'
