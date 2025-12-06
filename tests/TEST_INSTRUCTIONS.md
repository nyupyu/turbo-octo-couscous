# Instrukcje testowania systemu

## Szybkie uruchomienie (z katalogu głównego)

### Deployment z automatycznymi testami (ZALECANE)

```powershell
# Deployment + wszystkie testy
.\deploy.ps1

# Deployment + testy szybkie (bez wydajnościowych)
.\deploy.ps1 -Fast

# Tylko deployment (bez testów)
.\deploy.ps1 -SkipTests
```

### Tylko testy (bez deploymentu)

```powershell
# Wszystkie testy
.\test.ps1

# Tryb szybki (bez wydajnościowych)
.\test.ps1 -Fast
```

## Szczegółowe testy (z katalogu tests/)

### 1. Czysty deployment od zera

```powershell
.\scripts\deploy-fresh.ps1
```

Ten skrypt:

- Zatrzymuje i usuwa wszystkie kontenery i volumeny
- Buduje wszystkie obrazy Docker od zera
- Uruchamia wszystkie serwisy
- Czeka na uruchomienie (health checks)
- Seeduje bazy danych testowymi danymi

### 2. Testy podstawowe

```powershell
.\tests\test-system.ps1
```

Ten skrypt testuje:

1. Status wszystkich kontenerów (running + healthy)
2. API Gateway health check
3. Logowanie administratora (admin@example.com)
4. Pobieranie listy sal
5. Logowanie zwykłego użytkownika (user@example.com)
6. Dostępność React Client
7. Weryfikacja tokenów JWT

### 3. Testy zaawansowane

```powershell
.\tests\test-advanced.ps1
```

Ten skrypt testuje:

1. Logowanie administratora i użytkownika
2. Tworzenie nowej sali (tylko admin)
3. Odmowę tworzenia sali przez użytkownika (RBAC)
4. Aktualizację sali
5. Tworzenie rezerwacji
6. Wykrywanie konfliktów rezerwacji
7. Pobieranie własnych rezerwacji
8. Dostęp do logów (tylko admin)
9. Usuwanie rezerwacji i sal
10. Czyszczenie danych testowych

### 4. Testy wydajnościowe

```powershell
.\tests\test-performance.ps1
```

Ten skrypt testuje:

1. Rate limiting (50 requestów)
2. Równoczesne połączenia (10 jednocześnie)
3. Czasy odpowiedzi (średni, min, max)

### 5. Wszystkie testy naraz

```powershell
# Wszystkie testy (podstawowe + zaawansowane + wydajnościowe)
.\tests\test-all.ps1

# Tryb szybki (bez testów wydajnościowych)
.\tests\test-all.ps1 -Fast

# Pomijanie konkretnych zestawów
.\tests\test-all.ps1 -SkipPerformance
.\tests\test-all.ps1 -SkipAdvanced
.\tests\test-all.ps1 -SkipBasic
```

## Manualne testy

### Test 1: Logowanie przez API

```powershell
$body = '{"email":"admin@example.com","password":"Admin123!"}'
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-List
```

Oczekiwany wynik: accessToken, refreshToken, user (z role: ADMIN)

### Test 2: Lista sal

```powershell
# Najpierw pobierz token z testu 1
$token = "WKLEJ_TOKEN_TUTAJ"
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/rooms' -Method GET -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-Table
```

Oczekiwany wynik: 5 sal (Sala A, B, C, D, E)

### Test 3: Tworzenie rezerwacji

```powershell
$token = "WKLEJ_TOKEN_TUTAJ"
$roomId = "WKLEJ_ID_SALI"
$body = @{
    roomId = $roomId
    startTime = "2025-12-10T10:00:00.000Z"
    endTime = "2025-12-10T12:00:00.000Z"
    purpose = "Test meeting"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/bookings' -Method POST -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$response.Content | ConvertFrom-Json | Format-List
```

Oczekiwany wynik: Utworzona rezerwacja z status: ACTIVE

### Test 4: Logs (tylko ADMIN)

```powershell
$adminToken = "WKLEJ_ADMIN_TOKEN"
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/logs' -Method GET -Headers @{ Authorization = "Bearer $adminToken" } -UseBasicParsing
$logs = $response.Content | ConvertFrom-Json
$logs.logs | Select-Object -First 10 | Format-Table serviceName, action, timestamp
```

Oczekiwany wynik: Lista logów z akcji systemowych

## Testy w przeglądarce

1. Otwórz http://localhost:5173
2. Zaloguj się jako admin@example.com / Admin123!
3. Sprawdź wszystkie strony:

   - Dashboard - lista sal
   - Moje rezerwacje - powinno być puste
   - Zarządzanie salami (ADMIN) - lista 5 sal
   - Logi (ADMIN) - lista zdarzeń systemowych

4. Przetestuj funkcjonalności:

   - Dodaj nową salę (ADMIN)
   - Utwórz rezerwację
   - Edytuj rezerwację
   - Anuluj rezerwację
   - Wyloguj się

5. Zaloguj się jako user@example.com / User123!
6. Sprawdź, że:
   - Nie widzisz "Zarządzanie salami"
   - Nie widzisz "Logi"
   - Możesz tworzyć własne rezerwacje
   - Nie możesz edytować cudzych rezerwacji

## Sprawdzanie logów

### Wszystkie logi z serwisu

```powershell
docker-compose logs -f auth-service
docker-compose logs -f crud-service
docker-compose logs -f logs-service
docker-compose logs -f api-gateway
```

### Ostatnie 50 linii

```powershell
docker-compose logs --tail=50 auth-service
```

## Czyszczenie i restart

### Restart wszystkiego

```powershell
docker-compose restart
```

### Restart pojedynczego serwisu

```powershell
docker-compose restart auth-service
```

### Pełne wyczyszczenie

```powershell
docker-compose down -v --remove-orphans
docker system prune -a -f --volumes
```

## Troubleshooting

### Problem: Kontenery nie startują

```powershell
docker-compose logs
docker-compose ps
```

### Problem: Baza danych nie działa

```powershell
docker exec -it auth-db psql -U authuser -d authdb
# Sprawdź tabele: \dt
# Sprawdź użytkowników: SELECT * FROM "User";
```

### Problem: Migracje nie zaaplikowały się

```powershell
docker exec -it auth-service npx prisma migrate status
docker exec -it auth-service npx prisma migrate deploy
```

### Problem: Seed nie zadziałał

```powershell
docker exec -it auth-service npm run seed
docker exec -it crud-service npm run seed
```

## Wymagane porty

Upewnij się, że porty są wolne:

- 3000 - API Gateway
- 3001 - Auth Service (wewnętrzny)
- 3002 - CRUD Service (wewnętrzny)
- 3003 - Logs Service (wewnętrzny)
- 5173 - React Client

Sprawdź zajęte porty:

```powershell
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5173"
```

## Zalecana kolejność testowania

### Dla nowego deploymentu (od zera):

```powershell
# Z katalogu głównego (NAJPROSTSZE - deployment + automatyczne testy)
.\deploy.ps1

# Szybciej (bez testów wydajnościowych)
.\deploy.ps1 -Fast

# Lub ręcznie bez automatycznych testów:
.\scripts\deploy-fresh.ps1 -SkipTests
.\tests\test-all.ps1
```

### Dla istniejącego systemu:

```powershell
# Z katalogu głównego
.\test.ps1

# Lub szczegółowo z tests/
.\tests\test-system.ps1         # Tylko podstawowe
.\tests\test-advanced.ps1       # Tylko zaawansowane
.\tests\test-all.ps1            # Wszystko
```

### Po zmianach w kodzie:

```powershell
# Rebuild konkretnego serwisu
docker-compose up --build -d auth-service

# Test podstawowy
.\tests\test-system.ps1

# Testy zaawansowane jeśli zmiany w logice biznesowej
.\tests\test-advanced.ps1
```

## Dostępne skrypty testowe

### Skrypty główne (katalog główny)

| Skrypt                  | Czas  | Opis                                    |
| ----------------------- | ----- | --------------------------------------- |
| `deploy.ps1`            | ~190s | Deployment + wszystkie testy (ZALECANE) |
| `deploy.ps1 -Fast`      | ~130s | Deployment + testy bez wydajnościowych  |
| `deploy.ps1 -SkipTests` | ~90s  | Tylko deployment bez testów             |
| `test.ps1`              | ~100s | Wszystkie testy (bez deploymentu)       |
| `test.ps1 -Fast`        | ~40s  | Testy bez wydajnościowych               |

### Skrypty szczegółowe (katalog tests/)

| Skrypt                 | Czas  | Testy             | Zalecane użycie               |
| ---------------------- | ----- | ----------------- | ----------------------------- |
| `test-system.ps1`      | ~10s  | 7 podstawowych    | Szybkie sprawdzenie działania |
| `test-advanced.ps1`    | ~30s  | 10 funkcjonalnych | Test CRUD i autoryzacji       |
| `test-performance.ps1` | ~60s  | 3 wydajnościowe   | Rate limiting, obciążenie     |
| `test-all.ps1`         | ~100s | Wszystkie         | Kompletna weryfikacja         |

### Skrypty deploymentu (katalog scripts/)

| Skrypt                        | Czas  | Opis                                 |
| ----------------------------- | ----- | ------------------------------------ |
| `deploy-fresh.ps1`            | ~190s | Deploy + wszystkie testy (domyślnie) |
| `deploy-fresh.ps1 -FastTests` | ~130s | Deploy + testy bez wydajnościowych   |
| `deploy-fresh.ps1 -SkipTests` | ~90s  | Tylko deploy (bez testów)            |
