$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$MobileDir = Join-Path $ProjectRoot "apps\mobile"
$Node = "C:\Users\maxpo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$ToolsBin = "C:\Users\maxpo\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"

$env:Path = "$(Split-Path $Node);$ToolsBin;$env:Path"
$env:EXPO_HOME = Join-Path $ProjectRoot ".expo-home"
$env:EXPO_NO_TELEMETRY = "1"

New-Item -ItemType Directory -Force -Path $env:EXPO_HOME | Out-Null
Set-Location -LiteralPath $MobileDir

Write-Host "Starting Expo for iPhone on LAN, port 8082 ..." -ForegroundColor Green
Write-Host "Scan the QR code with Expo Go on your iPhone." -ForegroundColor Yellow
& $Node ".\node_modules\expo\bin\cli" start --lan --port 8082 --clear
