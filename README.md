# Conference Room Booking System

System mikroserwisów do zarządzania rezerwacjami sal konferencyjnych oparty na architekturze Docker Compose.

## 📋 Spis treści

- [Architektura](#architektura)
- [Wymagania](#wymagania)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Komponenty systemu](#komponenty-systemu)
- [API Endpoints](#api-endpoints)
- [Dane testowe](#dane-testowe)
- [Rozwój i testowanie](#rozwój-i-testowanie)

## 🏗️ Architektura

System składa się z następujących komponentów:

```
┌─────────────┐
│   Client    │ (React + TypeScript, port 5173)
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ API Gateway │ (Express.js, port 3000)
└──────┬──────┘
       │
       ├────────────────────────────────┐
       ↓                                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ CRUD Service │  │ Logs Service │
│  (port 3001) │  │  (port 3002) │  │  (port 3003) │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Auth DB    │  │   CRUD DB    │  │   Logs DB    │
│ (PostgreSQL) │  │ (PostgreSQL) │  │ (PostgreSQL) │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Mikroserwisy:

1. **Auth Service** - Autoryzacja i uwierzytelnianie (JWT)
2. **CRUD Service** - Zarządzanie salami i rezerwacjami
3. **Logs Service** - Centralne logowanie zdarzeń
4. **API Gateway** - Routing i proxy dla wszystkich żądań

## 📦 Wymagania

- Docker Engine 24.0+
- Docker Compose 2.20+
- Node.js 20 LTS (tylko do lokalnego developmentu)
- 4GB RAM minimum
- 10GB wolnego miejsca na dysku

## Instalacja i uruchomienie

### Szybki start (zalecane):

```powershell
# 1. Sklonuj repozytorium
git clone https://github.com/nyupyu/turbo-octo-couscous.git
cd turbo-octo-couscous

# 2. Skopiuj plik środowiskowy
Copy-Item .env.example .env

# 3. Deployment z automatycznymi testami (jedna komenda!)
.\deploy.ps1

# Lub szybciej (bez testów wydajnościowych):
.\deploy.ps1 -Fast
```

### Ręczne uruchomienie:

```powershell
# Zbuduj i uruchom wszystkie serwisy
docker-compose up --build -d

# Zaseeduj bazy danych
docker exec auth-service npm run seed
docker exec crud-service npm run seed
```

### Sprawdzanie statusu:

```powershell
# Status wszystkich kontenerów
docker-compose ps

# Logi wszystkich serwisów
docker-compose logs -f

# Logi konkretnego serwisu
docker-compose logs -f auth-service
```

### Zatrzymanie systemu:

```powershell
# Zatrzymanie kontenerów
docker-compose down

# Zatrzymanie z usunięciem wolumenów (kasuje dane z baz)
docker-compose down -v
```

## Komponenty systemu

### Auth Service (port 3001)

- Rejestracja użytkowników z walidacją
- Logowanie z generowaniem JWT
- Weryfikacja tokenów
- Hashowanie haseł (bcrypt, 12 rounds)
- Role: USER, ADMIN

### CRUD Service (port 3002)

- Zarządzanie salami konferencyjnymi (tylko ADMIN)
- Tworzenie i zarządzanie rezerwacjami
- Walidacja kolizji czasowych
- Kontrola dostępu oparta na rolach

### Logs Service (port 3003)

- Centralne rejestrowanie zdarzeń
- Filtrowanie logów (serwis, akcja, użytkownik, data)
- Statystyki i raporty

### API Gateway (port 3000)

- Routing żądań do odpowiednich serwisów
- CORS configuration
- Rate limiting
- Request logging
- Error handling

### Client (port 5173)

- Interfejs użytkownika React + TypeScript
- Logowanie/rejestracja
- Dashboard z listą sal
- Zarządzanie rezerwacjami
- Panel administracyjny (dla ADMIN)
- Panel logów (dla ADMIN)

## 📡 API Endpoints

### Authentication (`/api/auth`)

```
POST   /api/auth/register        - Rejestracja nowego użytkownika
POST   /api/auth/login           - Logowanie
POST   /api/auth/verify-token    - Weryfikacja JWT
POST   /api/auth/refresh-token   - Odświeżenie tokenu
```

### Rooms (`/api/rooms`)

```
GET    /api/rooms               - Lista wszystkich sal
GET    /api/rooms/:id           - Szczegóły sali
POST   /api/rooms               - Dodanie sali (ADMIN)
PUT    /api/rooms/:id           - Edycja sali (ADMIN)
DELETE /api/rooms/:id           - Usunięcie sali (ADMIN)
```

### Bookings (`/api/bookings`)

```
GET    /api/bookings            - Lista rezerwacji użytkownika
GET    /api/bookings/:id        - Szczegóły rezerwacji
POST   /api/bookings            - Utworzenie rezerwacji
PUT    /api/bookings/:id        - Edycja rezerwacji (właściciel/ADMIN)
DELETE /api/bookings/:id        - Anulowanie rezerwacji (właściciel/ADMIN)
```

### Logs (`/api/logs`)

```
GET    /api/logs                - Lista logów (ADMIN)
GET    /api/logs/stats          - Statystyki (ADMIN)
POST   /api/logs                - Dodanie logu (internal)
```

## 👤 Dane testowe

Po uruchomieniu systemu dostępne są następujące konta testowe:

### Administrator:

- Email: `admin@example.com`
- Hasło: `Admin123!`
- Uprawnienia: Pełny dostęp

### Użytkownik:

- Email: `user@example.com`
- Hasło: `User123!`
- Uprawnienia: Podstawowe

### Przykładowe sale:

- Sala A (20 osób) - Projektor, tablica
- Sala B (50 osób) - Projektor, nagłośnienie, klimatyzacja
- Sala C (10 osób) - Monitor, tablica
- Sala D (100 osób) - Kompletne wyposażenie konferencyjne
- Sala E (30 osób) - Projektor, tablica, klimatyzacja

## Rozwój i testowanie

### Uruchomienie w trybie deweloperskim:

```powershell
# Backend services z hot-reload
cd services/auth-service
npm install
npm run dev

# Frontend z hot-reload
cd client
npm install
npm run dev
```

### Migracje bazy danych:

```powershell
# Wejście do kontenera serwisu
docker exec -it auth-service sh

# Uruchomienie migracji
npx prisma migrate deploy

# Reset bazy danych (DEV ONLY!)
npx prisma migrate reset
```

### Przydatne komendy Docker:

```powershell
# Rebuild konkretnego serwisu
docker-compose up --build auth-service

# Restart serwisu
docker-compose restart auth-service

# Wejście do kontenera
docker exec -it auth-service sh

# Sprawdzenie logów z ostatniej godziny
docker-compose logs --since 1h

# Czyszczenie nieużywanych obrazów
docker system prune -a
```

## 🔒 Bezpieczeństwo

- Wszystkie hasła są hashowane (bcrypt, 12 rounds)
- JWT z automatyczną expiracją (15min access, 7d refresh)
- Walidacja wszystkich inputów (Zod)
- CORS skonfigurowany dla bezpieczeństwa
- Rate limiting na API Gateway
- SQL injection protection (Prisma ORM)
- Non-root users w kontenerach Docker

## Monitoring i logi

System automatycznie loguje następujące zdarzenia:

- `user.registered` - Rejestracja użytkownika
- `user.logged_in` - Logowanie
- `room.created/updated/deleted` - Operacje na salach
- `booking.created/updated/deleted` - Operacje na rezerwacjach
- `auth.token_verified` - Weryfikacja tokenu
- `auth.unauthorized_access` - Nieautoryzowany dostęp

## 🐛 Troubleshooting

### Porty już zajęte:

```powershell
# Zmień porty w docker-compose.yml
ports:
  - "3001:3000"  # zmień pierwszy numer
```

### Problemy z bazą danych:

```powershell
# Reset wszystkich danych
docker-compose down -v
docker-compose up --build
```

### Kontenery nie startują:

```powershell
# Sprawdź logi
docker-compose logs [service-name]

# Sprawdź zużycie zasobów
docker stats
```

## Licencja

MIT License - zobacz plik [LICENSE](LICENSE)

## 👥 Autor

**Oktawian Wybieralski**  
Nr albumu: 78573

Projekt stworzony na potrzeby przedmiotu Przetwarzanie Rozproszone - Laboratorium  
Rok akademicki: 2024/2025
