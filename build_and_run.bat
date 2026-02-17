@echo off
setlocal EnableExtensions EnableDelayedExpansion
echo on

REM =========================
REM Config
REM =========================
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%src\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%src\frontend"
set "BACKEND_CSPROJ=%BACKEND_DIR%\LongLifeModels\LongLifeModels.csproj"

set "BACKEND_IMAGE=arlu-back:latest"
set "FRONTEND_IMAGE=arlu-front:latest"

set "BACKEND_CONTAINER=arlu-back"
set "FRONTEND_CONTAINER=arlu-front"

set "BACKEND_PORT_HOST=8080"
set "BACKEND_PORT_CONTAINER=8080"

set "FRONTEND_PORT_HOST=3000"
set "FRONTEND_PORT_CONTAINER=3000"

set "BACKEND_ARCHIVE=arlu-back_latest.tar"
set "FRONTEND_ARCHIVE=arlu-front_latest.tar"

set "SECRETS_ENV_FILE=%PROJECT_ROOT%.env.local"
set "OPENAI_API_KEY="
set "QDRANT_API_KEY="

REM where to put local build artifacts when Docker is not available
set "ARTIFACTS_DIR=%PROJECT_ROOT%artifacts"
set "BACKEND_PUBLISH_DIR=%ARTIFACTS_DIR%\backend"
set "FRONTEND_BUILD_DIR=%ARTIFACTS_DIR%\frontend"

set "MODE=%~1"
set "TARGET=%~2"
set "ARG3=%~3"
set "ARG4=%~4"

if "%MODE%"=="" goto :FULL
if /I "%MODE%"=="help" goto :USAGE
if /I "%MODE%"=="rebuild" goto :FULL_REBUILD
if /I "%MODE%"=="build" goto :BUILD_MODE
if /I "%MODE%"=="export" goto :EXPORT_MODE

echo Unknown mode: %MODE%
goto :USAGE


REM =========================
REM Docker detection (NO hard fail)
REM =========================
:DETECT_DOCKER
set "DOCKER_OK=0"
docker version >nul 2>&1 && set "DOCKER_OK=1"
exit /b 0

:REQUIRE_DOCKER
call :DETECT_DOCKER
if "%DOCKER_OK%"=="0" (
  echo Docker is not running or not installed.
  echo This command requires Docker Engine (docker build/run/save).
  exit /b 1
)
exit /b 0


REM =========================
REM Secrets
REM =========================
:LOAD_SECRETS
set "OPENAI_API_KEY="
set "QDRANT_API_KEY="

if not exist "%SECRETS_ENV_FILE%" exit /b 0

for /f "usebackq eol=# tokens=1* delims==" %%A in ("%SECRETS_ENV_FILE%") do (
  if /I "%%~A"=="OpenAI__ApiKey" set "OPENAI_API_KEY=%%~B"
  if /I "%%~A"=="Qdrant__ApiKey" set "QDRANT_API_KEY=%%~B"
)

if defined OPENAI_API_KEY set "OpenAI__ApiKey=%OPENAI_API_KEY%"
if defined QDRANT_API_KEY set "Qdrant__ApiKey=%QDRANT_API_KEY%"
exit /b 0


REM =========================
REM Backend build (always possible)
REM =========================
:BUILD_BACKEND_PUBLISH
if not exist "%BACKEND_CSPROJ%" (
  echo Backend csproj not found: "%BACKEND_CSPROJ%"
  exit /b 1
)
if not exist "%ARTIFACTS_DIR%" mkdir "%ARTIFACTS_DIR%" >nul 2>&1
if not exist "%BACKEND_PUBLISH_DIR%" mkdir "%BACKEND_PUBLISH_DIR%" >nul 2>&1

echo Building backend: dotnet publish -^> "%BACKEND_PUBLISH_DIR%"
dotnet publish "%BACKEND_CSPROJ%" -c Release -o "%BACKEND_PUBLISH_DIR%" || exit /b 1
exit /b 0

:BUILD_BACKEND_DOCKER
call :BUILD_BACKEND_PUBLISH || exit /b 1
echo Docker build backend image
docker build %NO_CACHE% -t %BACKEND_IMAGE% -f "%BACKEND_DIR%\Dockerfile" "%BACKEND_DIR%" || exit /b 1
exit /b 0


REM =========================
REM Frontend build (local fallback)
REM =========================
:BUILD_FRONTEND_LOCAL
if not exist "%FRONTEND_DIR%\package.json" (
  echo Frontend package.json not found: "%FRONTEND_DIR%\package.json"
  exit /b 1
)

if not exist "%ARTIFACTS_DIR%" mkdir "%ARTIFACTS_DIR%" >nul 2>&1
if exist "%FRONTEND_BUILD_DIR%" rmdir /s /q "%FRONTEND_BUILD_DIR%" >nul 2>&1
mkdir "%FRONTEND_BUILD_DIR%" >nul 2>&1

pushd "%FRONTEND_DIR%" || exit /b 1

echo Installing frontend deps...
if exist "package-lock.json" (
  call npm ci || (popd & exit /b 1)
) else (
  call npm install || (popd & exit /b 1)
)

echo Building frontend (npm run build)...
call npm run build || (popd & exit /b 1)

REM Try to copy common build output folders (adjust if your project differs)
if exist ".next" (
  echo Copy .next -> "%FRONTEND_BUILD_DIR%\next"
  xcopy /e /i /y ".next" "%FRONTEND_BUILD_DIR%\next\" >nul || (popd & exit /b 1)
  if exist "public" (
    echo Copy public -> "%FRONTEND_BUILD_DIR%\public"
    xcopy /e /i /y "public" "%FRONTEND_BUILD_DIR%\public\" >nul || (popd & exit /b 1)
  )
) else if exist "dist" (
  echo Copy dist -> "%FRONTEND_BUILD_DIR%"
  xcopy /e /i /y "dist" "%FRONTEND_BUILD_DIR%\" >nul || (popd & exit /b 1)
) else if exist "build" (
  echo Copy build -> "%FRONTEND_BUILD_DIR%"
  xcopy /e /i /y "build" "%FRONTEND_BUILD_DIR%\" >nul || (popd & exit /b 1)
) else (
  echo.
  echo WARNING: can't find dist/ or build/ folder after build.
  echo Please check your frontend build output folder.
)

popd
exit /b 0

:BUILD_FRONTEND_DOCKER
echo Docker build frontend image
docker build %NO_CACHE% -t %FRONTEND_IMAGE% -f "%FRONTEND_DIR%\Dockerfile" "%FRONTEND_DIR%" || exit /b 1
exit /b 0


REM =========================
REM Docker run/export helpers
REM =========================
:STOP_OLD
docker rm -f %BACKEND_CONTAINER% >nul 2>&1
docker rm -f %FRONTEND_CONTAINER% >nul 2>&1
exit /b 0

:CLEAN_IMAGES
docker rmi %BACKEND_IMAGE% >nul 2>&1
docker rmi %FRONTEND_IMAGE% >nul 2>&1
exit /b 0

:RUN_BACKEND
set "BACKEND_ENV_ARGS="
if defined OPENAI_API_KEY set "BACKEND_ENV_ARGS=!BACKEND_ENV_ARGS! -e OpenAI__ApiKey=!OPENAI_API_KEY!"
if defined QDRANT_API_KEY set "BACKEND_ENV_ARGS=!BACKEND_ENV_ARGS! -e Qdrant__ApiKey=!QDRANT_API_KEY!"
docker run -d --name %BACKEND_CONTAINER% -p %BACKEND_PORT_HOST%:%BACKEND_PORT_CONTAINER% !BACKEND_ENV_ARGS! %BACKEND_IMAGE% || exit /b 1
exit /b 0

:RUN_FRONTEND
docker run -d --name %FRONTEND_CONTAINER% -p %FRONTEND_PORT_HOST%:%FRONTEND_PORT_CONTAINER% %FRONTEND_IMAGE% || exit /b 1
exit /b 0

:EXPORT_BACKEND
echo Saving backend image to "%OUT_DIR%\%BACKEND_ARCHIVE%"
docker save -o "%OUT_DIR%\%BACKEND_ARCHIVE%" %BACKEND_IMAGE% || exit /b 1
exit /b 0

:EXPORT_FRONTEND
echo Saving frontend image to "%OUT_DIR%\%FRONTEND_ARCHIVE%"
docker save -o "%OUT_DIR%\%FRONTEND_ARCHIVE%" %FRONTEND_IMAGE% || exit /b 1
exit /b 0


REM =========================
REM FULL / REBUILD (require Docker because run)
REM =========================
:FULL
set "NO_CACHE="
call :REQUIRE_DOCKER || exit /b 1
call :LOAD_SECRETS
call :STOP_OLD
call :BUILD_BACKEND_DOCKER || exit /b 1
call :BUILD_FRONTEND_DOCKER || exit /b 1
call :RUN_BACKEND || exit /b 1
call :RUN_FRONTEND || exit /b 1
echo Done.
echo Backend:  http://localhost:%BACKEND_PORT_HOST%
echo Frontend: http://localhost:%FRONTEND_PORT_HOST%
exit /b 0

:FULL_REBUILD
set "NO_CACHE=--no-cache"
call :REQUIRE_DOCKER || exit /b 1
call :LOAD_SECRETS
call :STOP_OLD
call :CLEAN_IMAGES
call :BUILD_BACKEND_DOCKER || exit /b 1
call :BUILD_FRONTEND_DOCKER || exit /b 1
call :RUN_BACKEND || exit /b 1
call :RUN_FRONTEND || exit /b 1
echo Done (rebuild).
echo Backend:  http://localhost:%BACKEND_PORT_HOST%
echo Frontend: http://localhost:%FRONTEND_PORT_HOST%
exit /b 0


REM =========================
REM BUILD mode: Docker if available, else local artifacts
REM =========================
:BUILD_MODE
if "%TARGET%"=="" set "TARGET=all"
set "NO_CACHE="
if /I "%ARG3%"=="rebuild" set "NO_CACHE=--no-cache"

call :DETECT_DOCKER
call :LOAD_SECRETS

if "%DOCKER_OK%"=="1" (
  if /I "%ARG3%"=="rebuild" call :CLEAN_IMAGES

  if /I "%TARGET%"=="back" (
    call :BUILD_BACKEND_DOCKER || exit /b 1
    echo Built docker: %BACKEND_IMAGE%
    exit /b 0
  )
  if /I "%TARGET%"=="front" (
    call :BUILD_FRONTEND_DOCKER || exit /b 1
    echo Built docker: %FRONTEND_IMAGE%
    exit /b 0
  )
  if /I "%TARGET%"=="all" (
    call :BUILD_BACKEND_DOCKER || exit /b 1
    call :BUILD_FRONTEND_DOCKER || exit /b 1
    echo Built docker: %BACKEND_IMAGE%, %FRONTEND_IMAGE%
    exit /b 0
  )
) else (
  echo Docker not available - building LOCAL artifacts instead...
  if /I "%TARGET%"=="back" (
    call :BUILD_BACKEND_PUBLISH || exit /b 1
    echo Built local: "%BACKEND_PUBLISH_DIR%"
    exit /b 0
  )
  if /I "%TARGET%"=="front" (
    call :BUILD_FRONTEND_LOCAL || exit /b 1
    echo Built local: "%FRONTEND_BUILD_DIR%"
    exit /b 0
  )
  if /I "%TARGET%"=="all" (
    call :BUILD_BACKEND_PUBLISH || exit /b 1
    call :BUILD_FRONTEND_LOCAL || exit /b 1
    echo Built local: "%BACKEND_PUBLISH_DIR%" and "%FRONTEND_BUILD_DIR%"
    exit /b 0
  )
)

echo Unknown target: %TARGET%
goto :USAGE


REM =========================
REM EXPORT mode: requires Docker (docker save)
REM =========================
:EXPORT_MODE
if "%TARGET%"=="" set "TARGET=all"
set "OUT_DIR=%ARG3%"
if "%OUT_DIR%"=="" set "OUT_DIR=%PROJECT_ROOT%docker-images"
set "NO_CACHE="
if /I "%ARG4%"=="rebuild" set "NO_CACHE=--no-cache"

call :REQUIRE_DOCKER || exit /b 1
call :LOAD_SECRETS
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
if /I "%ARG4%"=="rebuild" call :CLEAN_IMAGES

if /I "%TARGET%"=="back" (
  call :BUILD_BACKEND_DOCKER || exit /b 1
  call :EXPORT_BACKEND || exit /b 1
  echo Exported backend archive to: "%OUT_DIR%"
  exit /b 0
)
if /I "%TARGET%"=="front" (
  call :BUILD_FRONTEND_DOCKER || exit /b 1
  call :EXPORT_FRONTEND || exit /b 1
  echo Exported frontend archive to: "%OUT_DIR%"
  exit /b 0
)
if /I "%TARGET%"=="all" (
  call :BUILD_BACKEND_DOCKER || exit /b 1
  call :BUILD_FRONTEND_DOCKER || exit /b 1
  call :EXPORT_BACKEND || exit /b 1
  call :EXPORT_FRONTEND || exit /b 1
  echo Exported archives to: "%OUT_DIR%"
  exit /b 0
)

echo Unknown target: %TARGET%
goto :USAGE


:USAGE
echo.
echo Usage:
echo   build_and_run.bat
echo   build_and_run.bat rebuild
echo   build_and_run.bat build ^<back^|front^|all^> [rebuild]
echo   build_and_run.bat export ^<back^|front^|all^> [output_folder] [rebuild]
echo.
echo Notes:
echo - If Docker is not available: build back/front/all will produce local artifacts in "%ARTIFACTS_DIR%"
echo - run/export require Docker Engine.
echo.
exit /b 1
