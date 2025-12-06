# Wrapper script - deployment od zera
# Użycie: 
#   .\deploy.ps1              # Deployment + wszystkie testy
#   .\deploy.ps1 -Fast        # Deployment + testy bez wydajnościowych
#   .\deploy.ps1 -SkipTests   # Tylko deployment

param(
    [switch]$SkipTests,
    [switch]$Fast
)

$deployPath = Join-Path $PSScriptRoot "scripts\deploy-fresh.ps1"

if ($SkipTests) {
    & $deployPath -SkipTests
} elseif ($Fast) {
    & $deployPath -FastTests
} else {
    & $deployPath
}

exit $LASTEXITCODE
