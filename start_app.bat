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

echo [INFO] Verificando infraestructura local...
echo.

REM 1. Verificar Redis (Docker)
docker ps >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Docker detectado.
    docker inspect -f {{.State.Running}} abd-redis >nul 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] Creando contenedor Redis 'abd-redis'...
        docker run -d --name abd-redis -p 6379:6379 redis:alpine >nul
    ) else (
        echo [INFO] Iniciando contenedor 'abd-redis'...
        docker start abd-redis >nul
    )
    echo [OK] Redis esta activo en el puerto 6379.
) else (
    echo [WARN] Docker no esta en ejecucion o no esta instalado.
    echo        Los Async Jobs podrian fallar si no hay un Redis local.
)
echo.

REM 2. Iniciar Worker en ventana separada
echo [INFO] Iniciando Background Worker en ventana independiente...
start "ABD Worker" cmd /c "npm run worker"

echo.
echo [OK] Todo listo. Iniciando frontend...
echo.
echo Servidor disponible en: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

REM Usar call para que no se cierre la ventana si hay error
call npm run dev

REM Si npm run dev termina (por error o Ctrl+C), pausar antes de cerrar
echo.
echo.
echo El servidor se ha detenido. Un momento mientras cerramos los servicios...
docker stop abd-redis >nul 2>nul
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
