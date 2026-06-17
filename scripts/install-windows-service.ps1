<#
.SYNOPSIS
    Registra el backend de Ademincol (Node/Express que sirve el sitio + /api)
    como Servicio de Windows usando NSSM, con arranque automático y reinicio
    ante fallos. No necesita ninguna ventana de consola abierta.

.DESCRIPTION
    Ejecutar en PowerShell COMO ADMINISTRADOR.
    Requiere: Node 22+, NSSM (https://nssm.cc), y el sitio ya compilado (npm run build).
    El servicio arranca el backend con:  node --env-file=.env server.js

.EXAMPLE
    .\install-windows-service.ps1 -ProjectPath "C:\sitios\ademincol" -NssmPath "C:\nssm\nssm.exe"
#>

param(
    # Ruta raíz del proyecto (la que contiene backend\ y dist\)
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,

    # Ruta a nssm.exe (si está en el PATH, basta con "nssm.exe")
    [string]$NssmPath = "nssm.exe",

    # Nombre del servicio de Windows
    [string]$ServiceName = "AdemincolWeb"
)

$ErrorActionPreference = "Stop"

# --- Resolver rutas ---
$backendDir = Join-Path $ProjectPath "backend"
$serverJs   = Join-Path $backendDir "server.js"
$envFile    = Join-Path $backendDir ".env"
$distDir    = Join-Path $ProjectPath "dist"
$logsDir    = Join-Path $ProjectPath "logs"

# --- Validaciones ---
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) { throw "No se encontró 'node' en el PATH. Instala Node.js 22+." }

$nodeMajor = [int]((& $nodeExe -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 22) { throw "Node $nodeMajor detectado. Se requiere Node 22 o superior (node:sqlite)." }

if (-not (Test-Path $serverJs)) { throw "No existe $serverJs. ¿Es correcta la -ProjectPath?" }
if (-not (Test-Path $distDir))  { throw "No existe $distDir. Ejecuta 'npm run build' antes de instalar el servicio." }
if (-not (Test-Path $envFile))  { Write-Warning "No existe $envFile. Cópialo de .env.example y llénalo (el servicio fallará sin él)." }

if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# --- Si el servicio ya existe, lo detiene y lo reemplaza ---
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "El servicio '$ServiceName' ya existe. Deteniéndolo y reconfigurándolo..."
    & $NssmPath stop $ServiceName 2>$null
    & $NssmPath remove $ServiceName confirm
}

# --- Instalar el servicio ---
Write-Host "Instalando servicio '$ServiceName'..."
& $NssmPath install $ServiceName $nodeExe "--env-file=.env server.js"
& $NssmPath set $ServiceName AppDirectory $backendDir
& $NssmPath set $ServiceName DisplayName "Ademincol - Sitio web y API de formularios"
& $NssmPath set $ServiceName Description "Sirve el sitio (dist/) y el API de formularios (Cotizacion/PQRSF) con correo M365."
& $NssmPath set $ServiceName Start SERVICE_AUTO_START

# Reinicio automático ante fallos
& $NssmPath set $ServiceName AppExit Default Restart
& $NssmPath set $ServiceName AppRestartDelay 3000

# Logs (rotación a ~5 MB)
& $NssmPath set $ServiceName AppStdout (Join-Path $logsDir "out.log")
& $NssmPath set $ServiceName AppStderr (Join-Path $logsDir "err.log")
& $NssmPath set $ServiceName AppRotateFiles 1
& $NssmPath set $ServiceName AppRotateBytes 5242880

# --- Iniciar ---
Write-Host "Iniciando servicio..."
& $NssmPath start $ServiceName

Start-Sleep -Seconds 2
$svc = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "Servicio '$ServiceName' => estado: $($svc.Status)" -ForegroundColor Green
Write-Host "Verifica:  curl http://localhost:3001/api/health"
Write-Host "Logs:      $logsDir"
