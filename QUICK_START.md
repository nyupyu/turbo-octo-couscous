# Quick Start Guide

## Uruchomienie systemu

### 1. Pierwsza konfiguracja

```powershell
# Skopiuj plik konfiguracyjny
Copy-Item .env.example .env

# Edytuj .env jeśli potrzeba (opcjonalne)
# Domyślne ustawienia powinny działać
```

### 2. Uruchomienie

```powershell
# Zbuduj i uruchom wszystkie serwisy
docker-compose up --build

# Lub w tle (daemon mode)
docker-compose up --build -d
```

### 3. Dostęp do aplikacji

Otwórz przeglądarkę: http://localhost:5173

**Konta testowe:**

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

### 4. Zatrzymanie

```powershell
# Zatrzymaj kontenery
docker-compose down

# Zatrzymaj i usuń dane (pełny reset)
docker-compose down -v
```

## Debugging

### Podglądanie logów

```powershell
# Wszystkie serwisy
docker-compose logs -f

# Konkretny serwis
docker-compose logs -f auth-service
docker-compose logs -f crud-service
docker-compose logs -f logs-service
docker-compose logs -f api-gateway
docker-compose logs -f client
```

### Sprawdzanie statusu

```powershell
# Status kontenerów
docker-compose ps

# Health check
curl http://localhost:3000/health
```

### Wejście do kontenera

```powershell
# Auth service
docker exec -it auth-service sh

# CRUD service
docker exec -it crud-service sh

# Baza danych
docker exec -it auth-db psql -U authuser -d authdb
```

### Manualne operacje na bazie

```powershell
# Reset bazy danych (usuwa wszystkie dane!)
docker exec -it auth-service npx prisma migrate reset
docker exec -it crud-service npx prisma migrate reset
docker exec -it logs-service npx prisma migrate reset

# Seedowanie danymi testowymi
docker exec -it auth-service npm run seed
docker exec -it crud-service npm run seed
```

## Przydatne porty

- **5173** - Client (React)
- **3000** - API Gateway
- **3001** - Auth Service
- **3002** - CRUD Service
- **3003** - Logs Service
- **5432** - PostgreSQL databases (tylko wewnątrz sieci Docker)

## Problemy?

### Port już zajęty

Jeśli port jest zajęty, zmień go w `docker-compose.yml`:

```yaml
ports:
  - '5174:5173' # Zmień pierwszy numer
```

### Brak miejsca na dysku

```powershell
# Usuń nieużywane obrazy i kontenery
docker system prune -a
```

### Kontenery nie startują

```powershell
# Sprawdź logi konkretnego serwisu
docker-compose logs [nazwa-serwisu]

# Pełny restart
docker-compose down -v
docker-compose up --build
```

### Frontend nie łączy się z backendem

Sprawdź czy wszystkie serwisy są uruchomione:

```powershell
docker-compose ps
```

Wszystkie powinny mieć status "Up" i być "healthy".
