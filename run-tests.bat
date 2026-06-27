@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo API Automation Test Runner
echo ========================================
echo.

if not exist package.json (
  echo package.json was not found.
  echo Please run this file from the project root folder.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo node_modules folder was not found.
  echo Installing dependencies with npm ci...
  echo.
  call npm.cmd ci

  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    echo Please check your Node.js and npm setup.
    echo.
    pause
    exit /b 1
  )
)

echo Running API tests...
echo.
call npm.cmd test
set TEST_EXIT_CODE=%ERRORLEVEL%

echo.
if "%TEST_EXIT_CODE%"=="0" (
  echo Tests completed successfully.
) else (
  echo Tests failed. Exit code: %TEST_EXIT_CODE%
)

echo.
echo Press any key to close this window.
pause >nul

exit /b %TEST_EXIT_CODE%
