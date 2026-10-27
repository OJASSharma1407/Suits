# =================================================================
# SUITS - Root Docker Launcher
# Delegates to Docker(suits)\docker-start.ps1
# =================================================================

$targetScript = Join-Path $PSScriptRoot "Docker(suits)\docker-start.ps1"
if (Test-Path $targetScript) {
    & $targetScript
} else {
    Write-Host "❌ Docker directory Docker(suits) not found." -ForegroundColor Red
}
