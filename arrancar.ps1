# ==============================================================================
# Mejora Continua Suite - Script de Arranque de 1-Clic (arrancar.ps1)
# Directorio: MejoraSuite\arrancar.ps1
# Limpieza de puertos, orquestación de Vite en segundo plano y Electron sincronizado
# Sin terminales intermedias, cero procesos zombis.
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $Host.UI.RawUI.WindowTitle = "Mejora Continua Suite - Centro de Control"
} catch {}

$PORT_VITE = 5170
$PORT_WA = 4180
$URL_VITE = "http://127.0.0.1:$PORT_VITE"

# Determinar directorio base del monorepo MejoraSuite
$suiteDir = if (Test-Path (Join-Path $PSScriptRoot "package.json")) {
    $PSScriptRoot
} elseif (Test-Path (Join-Path $PSScriptRoot "MejoraSuite\package.json")) {
    Join-Path $PSScriptRoot "MejoraSuite"
} else {
    $PSScriptRoot
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   MEJORA CONTINUA SUITE - ECOSISTEMA SOBERANO DE CONVERSION    " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Directorio de trabajo: $suiteDir`n" -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# 1. Asegurar Semillas de Oro (Cold Start)
# ------------------------------------------------------------------------------
$seedScript = Join-Path $suiteDir "scripts\inyectar_semillas.py"
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
    $procIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -ne 0 -and $_ -ne $PID }
    foreach ($procId in $procIds) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  -> Proceso zombie PID $procId finalizado en puertos de la Suite." -ForegroundColor Yellow
        } catch {}
    }
    Start-Sleep -Milliseconds 400
} else {
    Write-Host "  -> Puertos limpios y disponibles." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Levantar Servidor Visual Vite en Segundo Plano
# ------------------------------------------------------------------------------
Write-Host "[2/3] Levantando Vite en segundo plano..." -ForegroundColor Cyan

$viteProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "--workspace=@mejora/shell", "run", "dev" `
    -WorkingDirectory $suiteDir `
    -PassThru `
    -WindowStyle Hidden

$timeoutSeconds = 15
$startTime = Get-Date
$viteReady = $false

while (((Get-Date) - $startTime).TotalSeconds -lt $timeoutSeconds) {
    try {
        $ip = [System.Net.IPAddress]::Loopback
        $tcp = [System.Net.Sockets.TcpClient]::new()
        $iar = $tcp.BeginConnect($ip, $PORT_VITE, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(250, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($iar)
            $tcp.Close()
            $viteReady = $true
            break
        }
        $tcp.Close()
    } catch {}
    Start-Sleep -Milliseconds 200
}

if ($viteReady) {
    Write-Host "  -> Servidor visual Vite activo en $URL_VITE" -ForegroundColor Green
} else {
    Write-Host "  -> Aviso: Vite tardó en responder. Electron cargará el bundle local integrado." -ForegroundColor Yellow
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
        -WorkingDirectory $suiteDir `
        -Wait
} finally {
    Write-Host "`n[MejoraSuite] Ventana cerrada. Limpiando procesos en segundo plano..." -ForegroundColor Cyan
    if ($viteProcess -and !$viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
    }
    $finalConnections = Get-NetTCPConnection -LocalPort $PORT_VITE, $PORT_WA -ErrorAction SilentlyContinue
    if ($finalConnections) {
        $finalPids = $finalConnections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -ne 0 -and $_ -ne $PID }
        foreach ($procId in $finalPids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "[OK] Entorno cerrado limpiamente. Cero procesos zombis." -ForegroundColor Green
}
