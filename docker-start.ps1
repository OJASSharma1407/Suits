# =================================================================
# SUITS - Production / Docker Deployment Launcher (PowerShell)
# =================================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Starting SUITS Docker Stack..." -ForegroundColor Cyan

# 1. Ensure .env exists
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } elseif (Test-Path "backend\.env") {
        Write-Host "Copying .env from backend/.env..." -ForegroundColor Yellow
        Copy-Item "backend\.env" ".env"
    }
}

# 2. Check Docker availability
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (!$dockerCmd) {
    if (Test-Path "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe") {
        $env:Path = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;" + $env:Path
    } elseif (Test-Path "C:\Program Files\Docker\Docker\resources\bin\docker.exe") {
        $env:Path = "C:\Program Files\Docker\Docker\resources\bin;" + $env:Path
    } else {
        Write-Host "Docker is not found in your PATH." -ForegroundColor Red
        exit 1
    }
}

# 3. Build & start containers
Write-Host "Building and launching PostgreSQL, Redis, Backend, and Frontend containers..." -ForegroundColor Green
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "SUITS is running in Docker containers!" -ForegroundColor Green
    Write-Host "   - Frontend UI:      http://localhost:5173" -ForegroundColor White
    Write-Host "   - Backend API:      http://localhost:8000" -ForegroundColor White
    Write-Host "   - Health Check:     http://localhost:8000/api/health" -ForegroundColor White
    Write-Host "   - Postgres DB:      localhost:5432" -ForegroundColor White
    Write-Host "   - Redis:            localhost:6379" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "To view real-time logs: docker compose logs -f" -ForegroundColor Gray
    Write-Host "To stop containers:     docker compose down" -ForegroundColor Gray
} else {
    Write-Host "Failed to start Docker containers." -ForegroundColor Red
}
