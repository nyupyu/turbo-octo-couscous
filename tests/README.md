# Skrypty testowe

Katalog zawiera wszystkie skrypty do testowania systemu rezerwacji sal konferencyjnych.

## Struktura

- `test-system.ps1` - Testy podstawowe (7 testów, ~10s)
- `test-advanced.ps1` - Testy zaawansowane (10 testów, ~30s)
- `test-performance.ps1` - Testy wydajnościowe (3 testy, ~60s)
- `test-all.ps1` - Orchestrator - uruchamia wszystkie testy
- `TEST_INSTRUCTIONS.md` - Pełna dokumentacja testowania

## Użycie

### Z katalogu głównego (zalecane)

```powershell
.\test.ps1          # Wszystkie testy
.\test.ps1 -Fast    # Bez testów wydajnościowych
```

### Z katalogu tests/

```powershell
.\test-system.ps1       # Tylko podstawowe
.\test-advanced.ps1     # Tylko zaawansowane
.\test-performance.ps1  # Tylko wydajnościowe
.\test-all.ps1          # Wszystkie
```

## Więcej informacji

Zobacz `TEST_INSTRUCTIONS.md` dla pełnej dokumentacji.
