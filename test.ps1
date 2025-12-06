# Wrapper script - uruchamia wszystkie testy
# Użycie: .\test.ps1 [-Fast] [-SkipBasic] [-SkipAdvanced] [-SkipPerformance]

param(
    [switch]$Fast,
    [switch]$SkipBasic,
    [switch]$SkipAdvanced,
    [switch]$SkipPerformance
)

$testsPath = Join-Path $PSScriptRoot "tests\test-all.ps1"

if ($Fast) {
    & $testsPath -Fast
} elseif ($SkipBasic -or $SkipAdvanced -or $SkipPerformance) {
    & $testsPath -SkipBasic:$SkipBasic -SkipAdvanced:$SkipAdvanced -SkipPerformance:$SkipPerformance
} else {
    & $testsPath
}

exit $LASTEXITCODE
