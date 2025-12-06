# Test wydajnościowy - sprawdzanie limitu requestów i obciążenia
# Autor: Oktawian Wybieralski

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST WYDAJNOŚCIOWY SYSTEMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Test rate limiting na API Gateway
Write-Host "[1/3] Test rate limiting..." -ForegroundColor Yellow
$successCount = 0
$limitedCount = 0
$errorCount = 0

for ($i = 1; $i -le 50; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -Method GET -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $successCount++
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $limitedCount++
        } else {
            $errorCount++
        }
    }
    
    # Pokaż postęp co 10 requestów
    if ($i % 10 -eq 0) {
        Write-Host "  Progress: $i/50 requests..." -ForegroundColor Gray
    }
}

Write-Host "  [OK] Test zakończony:" -ForegroundColor Green
Write-Host "    Sukces: $successCount" -ForegroundColor Cyan
Write-Host "    Rate limited (429): $limitedCount" -ForegroundColor Yellow
Write-Host "    Błędy: $errorCount" -ForegroundColor Red

if ($limitedCount -gt 0) {
    Write-Host "  [OK] Rate limiting działa poprawnie" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Rate limiting nie został wywołany (możliwy zbyt wysoki limit)" -ForegroundColor Yellow
}

Write-Host ""

# 2. Test równoczesnych requestów
Write-Host "[2/3] Test równoczesnych połączeń..." -ForegroundColor Yellow

$jobs = @()
$startTime = Get-Date

for ($i = 1; $i -le 10; $i++) {
    $jobs += Start-Job -ScriptBlock {
        try {
            $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -Method GET -UseBasicParsing
            return @{ Success = $true; StatusCode = $response.StatusCode }
        } catch {
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

# Czekaj na wszystkie joby
$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

$successfulRequests = ($results | Where-Object { $_.Success }).Count
$failedRequests = ($results | Where-Object { -not $_.Success }).Count

Write-Host "  [OK] Test zakończony w $([math]::Round($duration, 2))s" -ForegroundColor Green
Write-Host "    Sukces: $successfulRequests/10" -ForegroundColor Cyan
Write-Host "    Błędy: $failedRequests/10" -ForegroundColor $(if ($failedRequests -gt 0) { "Red" } else { "Gray" })

if ($successfulRequests -ge 8) {
    Write-Host "  [OK] System obsługuje równoczesne połączenia" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Problemy z obsługą równoczesnych połączeń" -ForegroundColor Yellow
}

Write-Host ""

# 3. Test czasu odpowiedzi
Write-Host "[3/3] Test czasu odpowiedzi..." -ForegroundColor Yellow

$responseTimes = @()

for ($i = 1; $i -le 10; $i++) {
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -Method GET -UseBasicParsing
        $end = Get-Date
        $responseTime = ($end - $start).TotalMilliseconds
        $responseTimes += $responseTime
    } catch {
        Write-Host "  [ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($responseTimes.Count -gt 0) {
    $avgTime = [math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
    $minTime = [math]::Round(($responseTimes | Measure-Object -Minimum).Minimum, 2)
    $maxTime = [math]::Round(($responseTimes | Measure-Object -Maximum).Maximum, 2)

    Write-Host "  [OK] Czasy odpowiedzi:" -ForegroundColor Green
    Write-Host "    Średni: ${avgTime}ms" -ForegroundColor Cyan
    Write-Host "    Min: ${minTime}ms" -ForegroundColor Cyan
    Write-Host "    Max: ${maxTime}ms" -ForegroundColor Cyan

    if ($avgTime -lt 100) {
        Write-Host "  [OK] Doskonały czas odpowiedzi (<100ms)" -ForegroundColor Green
    } elseif ($avgTime -lt 500) {
        Write-Host "  [OK] Dobry czas odpowiedzi (<500ms)" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Wolny czas odpowiedzi (>500ms)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] Brak danych o czasach odpowiedzi" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] TEST WYDAJNOŚCIOWY ZAKOŃCZONY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
exit 0
