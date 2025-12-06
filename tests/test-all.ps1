# Kompleksowy test - wszystkie testy w jednym
# Autor: Oktawian Wybieralski

param(
    [switch]$SkipBasic,
    [switch]$SkipAdvanced,
    [switch]$SkipPerformance,
    [switch]$Fast
)

$totalTests = 0
$passedTests = 0
$failedTests = 0
$startTime = Get-Date

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   KOMPLEKSOWY TEST SYSTEMU" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Test 1: Podstawowe testy
if (-not $SkipBasic) {
    Write-Host "[SUITE 1/3] Uruchamianie testów podstawowych..." -ForegroundColor Magenta
    Write-Host ""
    
    $testBasicPath = Join-Path $PSScriptRoot "test-system.ps1"
    if (Test-Path $testBasicPath) {
        & $testBasicPath
        if ($LASTEXITCODE -eq 0) {
            $passedTests++
            Write-Host "[OK] Testy podstawowe zakończone sukcesem" -ForegroundColor Green
        } else {
            $failedTests++
            Write-Host "[ERROR] Testy podstawowe nie powiodły się" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Nie znaleziono test-system.ps1" -ForegroundColor Red
        $failedTests++
    }
    $totalTests++
    Write-Host ""
}

# Test 2: Zaawansowane testy funkcjonalności
if (-not $SkipAdvanced) {
    Write-Host "[SUITE 2/3] Uruchamianie testów zaawansowanych..." -ForegroundColor Magenta
    Write-Host ""
    
    $testAdvancedPath = Join-Path $PSScriptRoot "test-advanced.ps1"
    if (Test-Path $testAdvancedPath) {
        & $testAdvancedPath
        if ($LASTEXITCODE -eq 0) {
            $passedTests++
            Write-Host "[OK] Testy zaawansowane zakończone sukcesem" -ForegroundColor Green
        } else {
            $failedTests++
            Write-Host "[ERROR] Testy zaawansowane nie powiodły się" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Nie znaleziono test-advanced.ps1" -ForegroundColor Red
        $failedTests++
    }
    $totalTests++
    Write-Host ""
}

# Test 3: Testy wydajnościowe (opcjonalnie pomijane w trybie Fast)
if (-not $SkipPerformance -and -not $Fast) {
    Write-Host "[SUITE 3/3] Uruchamianie testów wydajnościowych..." -ForegroundColor Magenta
    Write-Host ""
    
    $testPerformancePath = Join-Path $PSScriptRoot "test-performance.ps1"
    if (Test-Path $testPerformancePath) {
        & $testPerformancePath
        if ($LASTEXITCODE -eq 0) {
            $passedTests++
            Write-Host "[OK] Testy wydajnościowe zakończone sukcesem" -ForegroundColor Green
        } else {
            $failedTests++
            Write-Host "[ERROR] Testy wydajnościowe nie powiodły się" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Nie znaleziono test-performance.ps1" -ForegroundColor Red
        $failedTests++
    }
    $totalTests++
    Write-Host ""
} elseif ($Fast) {
    Write-Host "[SUITE 3/3] Pominięto testy wydajnościowe (tryb Fast)" -ForegroundColor Yellow
    Write-Host ""
}

# Podsumowanie
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   PODSUMOWANIE TESTÓW" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Czas wykonania: $([math]::Round($duration, 2))s" -ForegroundColor Gray
Write-Host "Zakończono: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "Zestawy testów:" -ForegroundColor White
Write-Host "  Wszystkie: $totalTests" -ForegroundColor Cyan
Write-Host "  Zaliczone: $passedTests" -ForegroundColor Green
Write-Host "  Niezaliczone: $failedTests" -ForegroundColor Red
Write-Host ""

if ($failedTests -eq 0 -and $totalTests -gt 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[OK] WSZYSTKIE TESTY ZALICZONE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "System jest w pełni funkcjonalny i gotowy do użycia." -ForegroundColor White
    Write-Host ""
    exit 0
} elseif ($totalTests -eq 0) {
    Write-Host "[WARNING] Nie uruchomiono żadnych testów" -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "[ERROR] NIEKTÓRE TESTY NIE POWIODŁY SIĘ" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Sprawdź logi powyżej i stan kontenerów:" -ForegroundColor White
    Write-Host "  docker-compose ps" -ForegroundColor Gray
    Write-Host "  docker-compose logs <service-name>" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
