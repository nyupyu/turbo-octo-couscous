# Skrypt do czystego wdrożenia systemu od zera
# Autor: Oktawian Wybieralski

param(
    [switch]$SkipTests,
    [switch]$FastTests
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CZYSTY DEPLOYMENT SYSTEMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Zatrzymanie i usunięcie wszystkiego
Write-Host "[1/4] Zatrzymywanie i czyszczenie Docker..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Błąd podczas zatrzymywania kontenerów" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Docker wyczyszczony" -ForegroundColor Green
Write-Host ""

# 2. Budowanie i uruchamianie
Write-Host "[2/4] Budowanie i uruchamianie kontenerów..." -ForegroundColor Yellow
docker-compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Błąd podczas budowania kontenerów" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Kontenery uruchomione" -ForegroundColor Green
Write-Host ""

# 3. Czekanie na healthy status
Write-Host "[3/4] Oczekiwanie na uruchomienie serwisów (max 60s)..." -ForegroundColor Yellow
$timeout = 60
$elapsed = 0
$allHealthy = $false

while ($elapsed -lt $timeout -and -not $allHealthy) {
    Start-Sleep -Seconds 5
    $elapsed += 5
    
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $allHealthy = $true
    
    foreach ($container in $containers) {
        $status = $container.State
        $health = $container.Health
        
        if ($status -ne "running" -or ($health -and $health -ne "healthy")) {
            $allHealthy = $false
            break
        }
    }
    
    if (-not $allHealthy) {
        Write-Host "  [WAIT] Oczekiwanie... ($elapsed s)" -ForegroundColor Gray
    }
}

if (-not $allHealthy) {
    Write-Host "  [ERROR] Timeout: Kontenery nie są gotowe po $timeout sekundach" -ForegroundColor Red
    docker-compose ps
    exit 1
}

Write-Host "  [OK] Wszystkie kontenery są gotowe" -ForegroundColor Green
Write-Host ""

# 4. Seedowanie baz danych
Write-Host "[4/4] Seedowanie baz danych..." -ForegroundColor Yellow

Write-Host "  • Auth Service..." -ForegroundColor Gray
docker exec auth-service npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Błąd seedowania Auth Service" -ForegroundColor Red
    exit 1
}

Write-Host "  • CRUD Service..." -ForegroundColor Gray
docker exec crud-service npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Błąd seedowania CRUD Service" -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Bazy danych zaseedowane" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] DEPLOYMENT ZAKOŃCZONY SUKCESEM!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 5. Opcjonalne uruchomienie testów
if (-not $SkipTests) {
    Write-Host "[5/5] Uruchamianie testów weryfikacyjnych..." -ForegroundColor Yellow
    Write-Host ""
    
    $testScript = Join-Path (Split-Path $PSScriptRoot -Parent) "tests\test-all.ps1"
    
    if (Test-Path $testScript) {
        if ($FastTests) {
            & $testScript -Fast
        } else {
            & $testScript
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "[OK] DEPLOYMENT I TESTY ZAKOŃCZONE!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "System jest w pełni gotowy do użycia:" -ForegroundColor White
            Write-Host "  • Client: http://localhost:5173" -ForegroundColor Cyan
            Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor Cyan
            Write-Host "  • Admin: admin@example.com / Admin123!" -ForegroundColor Cyan
            Write-Host "  • User: user@example.com / User123!" -ForegroundColor Cyan
            Write-Host ""
            exit 0
        } else {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "[ERROR] TESTY NIE POWIODŁY SIĘ" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
            Write-Host ""
            Write-Host "Deployment zakończony, ale testy wykryły problemy." -ForegroundColor Yellow
            Write-Host "Sprawdź logi powyżej." -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }
    } else {
        Write-Host "  [WARNING] Nie znaleziono skryptu testowego" -ForegroundColor Yellow
        Write-Host "  Szukano: $testScript" -ForegroundColor Gray
    }
} else {
    Write-Host "Testy pominięte (użyj -SkipTests aby pominąć)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Aby uruchomić testy ręcznie:" -ForegroundColor White
    Write-Host "  .\test.ps1" -ForegroundColor Cyan
    Write-Host "  .\test.ps1 -Fast" -ForegroundColor Cyan
    Write-Host ""
}

exit 0
