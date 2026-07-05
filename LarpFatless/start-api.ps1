$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeBin = "C:\Users\maxpo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$ToolsBin = "C:\Users\maxpo\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"
$Pnpm = Join-Path $ToolsBin "pnpm.cmd"

$env:Path = "$NodeBin;$ToolsBin;$env:Path"

Set-Location -LiteralPath $ProjectRoot

Write-Host "Starting LarpFatless API on http://localhost:4000 ..." -ForegroundColor Green
& $Pnpm dev:api
