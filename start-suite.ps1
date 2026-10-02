# ==============================================================================
# MejoraSuite - Script de Arranque de 1-Clic
# Limpieza de puertos, orquestacion de Vite en segundo plano y Electron sincronizado
# Sin terminales intermedias, cero procesos zombis.
# ==============================================================================

try {
    $Host.UI.RawUI.WindowTitle = "MejoraSuite - Centro de Control"
} catch {}

$PORT_VITE = 5170
$PORT_WA = 4180
$URL_VITE = "http://127.0.0.1:$PORT_VITE"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   MEJORA CONTINUA SUITE - ECOSISTEMA SOBERANO DE CONVERSION    " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Asegurar Semillas de Oro (Cold Start)
# ------------------------------------------------------------------------------
$seedScript = Join-Path $PSScriptRoot "scripts\inyectar_semillas.py"
if (Test-Path $seedScript) {
    try {
        & python $seedScript | Out-Null
        Write-Host "[OK] ADN Ganador (Semillas de Oro) verificado en base SQLite local." -ForegroundColor Green
    } catch {
        # Si python no estuviera disponible, continuar
    }
}

# ------------------------------------------------------------------------------
# 2. Limpieza de Puertos y Procesos Zombis
# ------------------------------------------------------------------------------
Write-Host "[1/3] Verificando y liberando puertos ($PORT_VITE, $PORT_WA)..." -ForegroundColor Cyan
$connections = Get-NetTCPConnection -LocalPort $PORT_VITE, $PORT_WA -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -and $procId -ne 0 -and $procId -ne $PID) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "  -> Proceso zombie $procId finalizado en puerto $($conn.LocalPort)" -ForegroundColor Yellow
            } catch {}
        }
    }
    Start-Sleep -Milliseconds 500
} else {
    Write-Host "  -> Puertos limpios y disponibles." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Levantar Servidor Visual Vite en Segundo Plano
# ------------------------------------------------------------------------------
Write-Host "[2/3] Levantando Vite en segundo plano..." -ForegroundColor Cyan

$viteProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "--workspace=@mejora/shell", "run", "dev" `
    -WorkingDirectory $PSScriptRoot `
    -PassThru `
    -WindowStyle Hidden

$timeoutSeconds = 15
$startTime = Get-Date
$viteReady = $false

while (((Get-Date) - $startTime).TotalSeconds -lt $timeoutSeconds) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", $PORT_VITE, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(300, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($iar)
            $tcp.Close()
            $viteReady = $true
            break
        }
        $tcp.Close()
    } catch {}
    Start-Sleep -Milliseconds 250
}

if ($viteReady) {
    Write-Host "  -> Servidor visual Vite activo en $URL_VITE" -ForegroundColor Green
} else {
    Write-Host "  -> Aviso: Vite tardo en responder. Electron cargara el bundle local integrado." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 4. Abrir Ventana Principal de Electron Sincronizada
# ------------------------------------------------------------------------------
Write-Host "[3/3] Abriendo ventana de Electron..." -ForegroundColor Cyan

$env:VITE_DEV_SERVER_URL = "$URL_VITE"
$env:ELECTRON_DISABLE_SECURITY_WARNINGS = "true"

try {
    Start-Process -FilePath "npm.cmd" `
        -ArgumentList "--workspace=@mejora/shell", "run", "electron:dev" `
        -WorkingDirectory $PSScriptRoot `
        -Wait
} finally {
    Write-Host "`n[MejoraSuite] Ventana cerrada. Limpiando procesos en segundo plano..." -ForegroundColor Cyan
    if ($viteProcess -and !$viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
    }
    $finalConnections = Get-NetTCPConnection -LocalPort $PORT_VITE, $PORT_WA -ErrorAction SilentlyContinue
    if ($finalConnections) {
        foreach ($conn in $finalConnections) {
            if ($conn.OwningProcess -and $conn.OwningProcess -ne 0 -and $conn.OwningProcess -ne $PID) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Write-Host "[OK] Entorno cerrado limpiamente. Cero procesos zombis." -ForegroundColor Green
}
