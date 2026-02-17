@echo off
setlocal EnableExtensions

set "PROJECT_ROOT=%~dp0"
set "COMPOSE_FILE=%PROJECT_ROOT%docker-compose.yml"
set "ENV_FILE=%PROJECT_ROOT%.env.local"

if not exist "%COMPOSE_FILE%" (
  echo docker-compose.yml not found: "%COMPOSE_FILE%"
  exit /b 1
)

if not exist "%ENV_FILE%" (
  echo .env.local not found: "%ENV_FILE%"
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo Docker Compose v2 not found. Install Docker Desktop or Docker Compose plugin.
  exit /b 1
)

pushd "%PROJECT_ROOT%"
docker compose --env-file .env.local -f docker-compose.yml up -d --build
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%
