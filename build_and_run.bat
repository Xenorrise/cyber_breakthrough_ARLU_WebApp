@echo off
setlocal EnableExtensions

set "PROJECT_ROOT=%~dp0"
set "COMPOSE_FILE=%PROJECT_ROOT%docker-compose.yml"
set "ENV_FILE_ARGS="

if exist "%PROJECT_ROOT%.env.local" (
  set "ENV_FILE_ARGS=--env-file ""%PROJECT_ROOT%.env.local"""
  echo Using env file: "%PROJECT_ROOT%.env.local"
) else if exist "%PROJECT_ROOT%.env" (
  set "ENV_FILE_ARGS=--env-file ""%PROJECT_ROOT%.env"""
  echo Using env file: "%PROJECT_ROOT%.env"
)

if "%ENV_FILE_ARGS%"=="" (
  echo No .env.local/.env found, using defaults from docker-compose.yml
)

if not exist "%COMPOSE_FILE%" (
  echo docker-compose.yml not found: "%COMPOSE_FILE%"
  exit /b 1
)

set "ACTION=build"
set "TARGET=all"
set "NO_CACHE="

if "%~1"=="" goto :RUN
if /I "%~1"=="help" goto :USAGE
if /I "%~1"=="--help" goto :USAGE
if /I "%~1"=="-h" goto :USAGE

if /I "%~1"=="rebuild" (
  set "ACTION=build"
  set "TARGET=all"
  set "NO_CACHE=--no-cache"
  goto :RUN
)

if /I "%~1"=="build" (
  if not "%~2"=="" set "TARGET=%~2"
  if /I "%~3"=="rebuild" set "NO_CACHE=--no-cache"
  goto :RUN
)

if /I "%~1"=="back" (
  set "TARGET=back"
  if /I "%~2"=="rebuild" set "NO_CACHE=--no-cache"
  goto :RUN
)

if /I "%~1"=="front" (
  set "TARGET=front"
  if /I "%~2"=="rebuild" set "NO_CACHE=--no-cache"
  goto :RUN
)

if /I "%~1"=="all" (
  set "TARGET=all"
  if /I "%~2"=="rebuild" set "NO_CACHE=--no-cache"
  goto :RUN
)

echo Unknown command: %~1
goto :USAGE

:RUN
docker compose version >nul 2>&1
if errorlevel 1 (
  echo Docker Compose v2 not found. Install Docker Desktop or Docker Compose plugin.
  exit /b 1
)

if /I "%TARGET%"=="back" (
  echo Building backend image...
  docker compose %ENV_FILE_ARGS% -f "%COMPOSE_FILE%" build %NO_CACHE% backend
  exit /b %errorlevel%
)

if /I "%TARGET%"=="front" (
  echo Building frontend image...
  docker compose %ENV_FILE_ARGS% -f "%COMPOSE_FILE%" build %NO_CACHE% frontend
  exit /b %errorlevel%
)

if /I "%TARGET%"=="all" (
  echo Building all images...
  docker compose %ENV_FILE_ARGS% -f "%COMPOSE_FILE%" build %NO_CACHE%
  exit /b %errorlevel%
)

echo Unknown target: %TARGET%
goto :USAGE

:USAGE
echo.
echo Usage:
echo   build_and_run.bat
echo   build_and_run.bat rebuild
echo   build_and_run.bat build ^<back^|front^|all^> [rebuild]
echo   build_and_run.bat ^<back^|front^|all^> [rebuild]
echo.
echo Optional env files (auto-detected near this .bat):
echo   .env.local (preferred) or .env
echo.
exit /b 1
