# Skrypty deploymentu

Katalog zawiera skrypty do wdrażania systemu rezerwacji sal konferencyjnych.

## Struktura

- `deploy-fresh.ps1` - Czysty deployment od zera z automatycznymi testami

## Użycie

### Z katalogu głównego (zalecane)

```powershell
# Deployment + wszystkie testy (ZALECANE)
.\deploy.ps1

# Deployment + testy szybkie (bez wydajnościowych)
.\deploy.ps1 -Fast

# Tylko deployment (bez testów)
.\deploy.ps1 -SkipTests
```

### Z katalogu scripts/

```powershell
# Deployment + wszystkie testy (domyślnie)
.\deploy-fresh.ps1

# Deployment + testy szybkie
.\deploy-fresh.ps1 -FastTests

# Tylko deployment
.\deploy-fresh.ps1 -SkipTests
```

## Co robi deploy-fresh.ps1

1. **Clean** - Zatrzymuje i usuwa wszystkie kontenery i volumeny (`docker-compose down -v`)
2. **Build** - Buduje wszystkie obrazy od zera (`docker-compose up --build -d`)
3. **Health** - Czeka na uruchomienie wszystkich serwisów (max 60s)
4. **Seed** - Seeduje bazy danych testowymi danymi
5. **Test** - Automatycznie uruchamia testy weryfikacyjne (można pominąć z `-SkipTests`)

Czas wykonania:

- Z testami: ~190 sekund (pełne) lub ~130 sekund (szybkie)
- Bez testów: ~90 sekund
