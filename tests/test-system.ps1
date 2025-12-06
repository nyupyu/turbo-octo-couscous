# Automatyczny test systemu rezerwacji sal konferencyjnych
# Autor: Oktawian Wybieralski

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SYSTEMU REZERWACJI SAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Sprawdzenie statusu kontenerów
Write-Host "[1/7] Sprawdzanie statusu kontenerów..." -ForegroundColor Yellow
$containers = docker-compose ps --format json | ConvertFrom-Json
$allHealthy = $true

foreach ($container in $containers) {
    $status = $container.State
    $health = $container.Health
    $name = $container.Service
    
    if ($status -ne "running" -or ($health -and $health -ne "healthy")) {
        Write-Host "  [ERROR] $name - Status: $status, Health: $health" -ForegroundColor Red
        $allHealthy = $false
    } else {
        Write-Host "  [OK] $name - Running and Healthy" -ForegroundColor Green
    }
}

if (-not $allHealthy) {
    Write-Host ""
    Write-Host "BŁĄD: Nie wszystkie kontenery są zdrowe!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Test API Gateway Health Check
Write-Host "[2/7] Test API Gateway health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [OK] API Gateway odpowiada (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] API Gateway zwrócił status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd połączenia z API Gateway: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Test logowania Admin
Write-Host "[3/7] Test logowania administratora..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "Admin123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' `
        -Method POST `
        -Body $loginBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.accessToken -and $loginData.user.role -eq "ADMIN") {
        Write-Host "  [OK] Login administratora zakończony sukcesem" -ForegroundColor Green
        Write-Host "    User ID: $($loginData.user.id)" -ForegroundColor Gray
        Write-Host "    Email: $($loginData.user.email)" -ForegroundColor Gray
        Write-Host "    Role: $($loginData.user.role)" -ForegroundColor Gray
        $adminToken = $loginData.accessToken
    } else {
        Write-Host "  [ERROR] Login nie zwrócił poprawnych danych" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd logowania: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Test pobierania listy sal (bez autoryzacji - powinno działać)
Write-Host "[4/7] Test pobierania listy sal..." -ForegroundColor Yellow
try {
    $roomsResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/rooms' `
        -Method GET `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $rooms = $roomsResponse.Content | ConvertFrom-Json
    
    if ($rooms.Count -gt 0) {
        Write-Host "  [OK] Pobrano $($rooms.Count) sal" -ForegroundColor Green
        foreach ($room in $rooms | Select-Object -First 3) {
            Write-Host "    - $($room.name) (pojemność: $($room.capacity))" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [WARNING] Brak sal w systemie (należy uruchomić seed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Błąd pobierania sal: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5. Test logowania zwykłego użytkownika
Write-Host "[5/7] Test logowania zwykłego użytkownika..." -ForegroundColor Yellow
try {
    $userLoginBody = @{
        email = "user@example.com"
        password = "User123!"
    } | ConvertTo-Json

    $userLoginResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' `
        -Method POST `
        -Body $userLoginBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $userLoginData = $userLoginResponse.Content | ConvertFrom-Json
    
    if ($userLoginData.accessToken -and $userLoginData.user.role -eq "USER") {
        Write-Host "  [OK] Login użytkownika zakończony sukcesem" -ForegroundColor Green
        Write-Host "    Email: $($userLoginData.user.email)" -ForegroundColor Gray
        Write-Host "    Role: $($userLoginData.user.role)" -ForegroundColor Gray
        $userToken = $userLoginData.accessToken
    } else {
        Write-Host "  [ERROR] Login nie zwrócił poprawnych danych" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd logowania: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 6. Test dostępu do React Client
Write-Host "[6/7] Test dostępu do React Client..." -ForegroundColor Yellow
try {
    $clientResponse = Invoke-WebRequest -Uri 'http://localhost:5173' -Method GET -UseBasicParsing
    if ($clientResponse.StatusCode -eq 200) {
        Write-Host "  [OK] Client dostępny na http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Client zwrócił status: $($clientResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd połączenia z Client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 7. Test weryfikacji tokenu (Auth Service)
Write-Host "[7/7] Test weryfikacji tokenu JWT..." -ForegroundColor Yellow
try {
    $verifyBody = @{
        token = $adminToken
    } | ConvertTo-Json

    $verifyResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/verify-token' `
        -Method POST `
        -Body $verifyBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    
    if ($verifyData.user.userId) {
        Write-Host "  [OK] Token JWT poprawnie zweryfikowany" -ForegroundColor Green
        Write-Host "    User ID: $($verifyData.user.userId)" -ForegroundColor Gray
        Write-Host "    Email: $($verifyData.user.email)" -ForegroundColor Gray
    } else {
        Write-Host "  [ERROR] Weryfikacja tokenu nie powiodła się" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd weryfikacji tokenu: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] WSZYSTKIE TESTY ZAKOŃCZONE SUKCESEM!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "System jest gotowy do użycia:" -ForegroundColor White
Write-Host "  • Client: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Admin: admin@example.com / Admin123!" -ForegroundColor Cyan
Write-Host "  • User: user@example.com / User123!" -ForegroundColor Cyan
Write-Host ""
