# Zaawansowane testy funkcjonalności systemu
# Autor: Oktawian Wybieralski

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ZAAWANSOWANE TESTY FUNKCJONALNOŚCI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Zmienne globalne
$adminToken = ""
$userToken = ""
$testRoomId = ""
$testBookingId = ""

# 1. Logowanie administratora
Write-Host "[1/10] Logowanie administratora..." -ForegroundColor Yellow
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
    $adminToken = $loginData.accessToken
    Write-Host "  [OK] Token administratora uzyskany" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Błąd logowania administratora: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Logowanie użytkownika
Write-Host "[2/10] Logowanie użytkownika..." -ForegroundColor Yellow
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
    $userToken = $userLoginData.accessToken
    Write-Host "  [OK] Token użytkownika uzyskany" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Błąd logowania użytkownika: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Test tworzenia sali (tylko admin)
Write-Host "[3/10] Test tworzenia nowej sali (ADMIN)..." -ForegroundColor Yellow
try {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $roomBody = @{
        name = "Sala Test $timestamp"
        capacity = 15
        description = "Sala stworzona przez test automatyczny"
        equipment = @("Projektor", "Tablica")
    } | ConvertTo-Json

    $roomResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/rooms' `
        -Method POST `
        -Body $roomBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $roomData = $roomResponse.Content | ConvertFrom-Json
    $testRoomId = $roomData.id
    Write-Host "  [OK] Sala utworzona (ID: $testRoomId)" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Błąd tworzenia sali: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Test próby utworzenia sali przez zwykłego użytkownika (powinno się nie udać)
Write-Host "[4/10] Test odmowy tworzenia sali (USER)..." -ForegroundColor Yellow
try {
    $roomBody = @{
        name = "Sala Nieautoryzowana"
        capacity = 10
    } | ConvertTo-Json

    $roomResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/rooms' `
        -Method POST `
        -Body $roomBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "  [ERROR] Użytkownik mógł utworzyć salę (nie powinien)" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "  [OK] Poprawnie odmówiono dostępu (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Nieoczekiwany błąd: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 5. Test aktualizacji sali
Write-Host "[5/10] Test aktualizacji sali..." -ForegroundColor Yellow
try {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $updateBody = @{
        name = "Sala Test $timestamp (Upd)"
        capacity = 20
        description = "Zaktualizowany opis"
    } | ConvertTo-Json

    $updateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/rooms/$testRoomId" `
        -Method PUT `
        -Body $updateBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $updatedRoom = $updateResponse.Content | ConvertFrom-Json
    if ($updatedRoom.capacity -eq 20) {
        Write-Host "  [OK] Sala zaktualizowana (pojemność: $($updatedRoom.capacity))" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Aktualizacja nie powiodła się" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  [ERROR] Błąd aktualizacji sali: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 6. Test tworzenia rezerwacji
Write-Host "[6/10] Test tworzenia rezerwacji..." -ForegroundColor Yellow
try {
    # Rezerwacja na jutro od 10:00 do 12:00
    $tomorrow = (Get-Date).AddDays(1)
    $startTime = Get-Date -Year $tomorrow.Year -Month $tomorrow.Month -Day $tomorrow.Day -Hour 10 -Minute 0 -Second 0
    $endTime = Get-Date -Year $tomorrow.Year -Month $tomorrow.Month -Day $tomorrow.Day -Hour 12 -Minute 0 -Second 0

    $bookingBody = @{
        roomId = $testRoomId
        startTime = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endTime = $endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        purpose = "Test automatyczny - spotkanie testowe"
    } | ConvertTo-Json

    $bookingResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/bookings' `
        -Method POST `
        -Body $bookingBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -UseBasicParsing
    
    $bookingData = $bookingResponse.Content | ConvertFrom-Json
    $testBookingId = $bookingData.id
    Write-Host "  [OK] Rezerwacja utworzona (ID: $testBookingId)" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Błąd tworzenia rezerwacji: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Gray
    }
    exit 1
}

Write-Host ""

# 7. Test konfliktu rezerwacji (ta sama sala, ten sam czas)
Write-Host "[7/10] Test wykrywania konfliktu rezerwacji..." -ForegroundColor Yellow
try {
    $tomorrow = (Get-Date).AddDays(1)
    $startTime = Get-Date -Year $tomorrow.Year -Month $tomorrow.Month -Day $tomorrow.Day -Hour 10 -Minute 0 -Second 0
    $endTime = Get-Date -Year $tomorrow.Year -Month $tomorrow.Month -Day $tomorrow.Day -Hour 12 -Minute 0 -Second 0

    $conflictBody = @{
        roomId = $testRoomId
        startTime = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endTime = $endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        purpose = "Konfliktowa rezerwacja"
    } | ConvertTo-Json

    $conflictResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/bookings' `
        -Method POST `
        -Body $conflictBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "  [ERROR] Konflikt nie został wykryty" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  [OK] Konflikt poprawnie wykryty (400/409)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Nieoczekiwany błąd: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 8. Test pobierania własnych rezerwacji
Write-Host "[8/10] Test pobierania własnych rezerwacji..." -ForegroundColor Yellow
try {
    $myBookingsResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/bookings' `
        -Method GET `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -UseBasicParsing
    
    $myBookings = $myBookingsResponse.Content | ConvertFrom-Json
    if ($myBookings.Count -gt 0) {
        Write-Host "  [OK] Pobrano $($myBookings.Count) rezerwacji użytkownika" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Brak rezerwacji użytkownika" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Błąd pobierania rezerwacji: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 9. Test logowania zdarzeń (admin może odczytać logi)
Write-Host "[9/10] Test dostępu do logów (ADMIN)..." -ForegroundColor Yellow
try {
    $logsResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/logs?limit=10' `
        -Method GET `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $logs = $logsResponse.Content | ConvertFrom-Json
    if ($logs.logs.Count -gt 0) {
        Write-Host "  [OK] Pobrano $($logs.logs.Count) wpisów logów" -ForegroundColor Green
        Write-Host "    Ostatnia akcja: $($logs.logs[0].action)" -ForegroundColor Gray
    } else {
        Write-Host "  [WARNING] Brak logów w systemie" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Błąd pobierania logów: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 10. Test czyszczenia - usunięcie testowej rezerwacji i sali
Write-Host "[10/10] Czyszczenie danych testowych..." -ForegroundColor Yellow
try {
    # Usuń rezerwację
    $deleteBookingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings/$testBookingId" `
        -Method DELETE `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -UseBasicParsing
    Write-Host "  [OK] Rezerwacja usunięta" -ForegroundColor Green

    # Usuń salę
    $deleteRoomResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/rooms/$testRoomId" `
        -Method DELETE `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    Write-Host "  [OK] Sala usunięta" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Błąd czyszczenia: $($_.Exception.Message)" -ForegroundColor Red
    # Nie przerywamy - to ostatni test
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] WSZYSTKIE TESTY ZAAWANSOWANE ZAKOŃCZONE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Podsumowanie testów:" -ForegroundColor White
Write-Host "  [OK] Autoryzacja i tokeny JWT" -ForegroundColor Cyan
Write-Host "  [OK] RBAC (kontrola dostępu)" -ForegroundColor Cyan
Write-Host "  [OK] CRUD operacje na salach" -ForegroundColor Cyan
Write-Host "  [OK] Tworzenie rezerwacji" -ForegroundColor Cyan
Write-Host "  [OK] Wykrywanie konfliktów" -ForegroundColor Cyan
Write-Host "  [OK] Logowanie zdarzeń" -ForegroundColor Cyan
Write-Host ""
