@echo off
echo ================================
echo  Sistema de Gestion de Puentes
echo  MANT-309
echo ================================
echo.
echo Iniciando Backend (puerto 3001)...
start "Puentes - Backend" cmd /k "cd /d %~dp0backend && node node_modules/ts-node/dist/bin.js --transpile-only src/index.ts"
timeout /t 3 /nobreak > nul
echo Iniciando Frontend (puerto 5173)...
start "Puentes - Frontend" cmd /k "cd /d %~dp0frontend && node node_modules/vite/bin/vite.js"
timeout /t 4 /nobreak > nul
echo.
echo Abriendo navegador...
start http://localhost:5173
echo.
echo Aplicacion iniciada!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause
