@echo off
cls
echo ========================================
echo   ABD RAG Plataform System - Startup
echo ========================================
echo.

REM Verificar que existe .env.local
if not exist ".env.local" (
    echo [ERROR] No se encontro .env.local
    echo.
    echo Por favor crea el archivo .env.local con:
    echo   MONGODB_URI=tu_connection_string
    echo   GEMINI_API_KEY=tu_api_key
    echo   NEXTAUTH_URL=http://localhost:3000
    echo   NEXTAUTH_SECRET=tu_secret_generado
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias
        echo Presiona cualquier tecla para salir...
        pause >nul
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente
    echo.
)

echo [INFO] Iniciando servidor de desarrollo...
echo.
echo Servidor disponible en: http://localhost:3000
echo.
echo Usuarios de prueba:
echo   - Admin:      admin@abd.com / admin123
echo   - Tecnico:    tecnico@abd.com / tecnico123
echo   - Ingenieria: ingenieria@abd.com / ingenieria123
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

REM Usar call para que no se cierre la ventana si hay error
call npm run dev

REM Si npm run dev termina (por error o Ctrl+C), pausar antes de cerrar
echo.
echo.
echo El servidor se ha detenido.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
