@echo off
setlocal

set "ROOT=%~dp0"
set "CODEX_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"

if exist "%CODEX_BIN%\pnpm.cmd" goto use_codex
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 goto use_system
goto missing_pnpm

:use_codex
set "PATH=%CODEX_NODE%;%CODEX_BIN%;%PATH%"
cd /d "%ROOT%"
call "%CODEX_BIN%\pnpm.cmd" build:web
goto end

:use_system
cd /d "%ROOT%"
call pnpm build:web
goto end

:missing_pnpm
echo pnpm was not found.
echo Install Node.js LTS from https://nodejs.org/
echo Then run:
echo corepack enable
echo corepack prepare pnpm@11.7.0 --activate

:end
endlocal
