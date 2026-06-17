# Despliegue en Windows con Cloudflare Tunnel — Ademincol

Guía para dejar el sitio corriendo **siempre** en un servidor Windows, expuesto a
internet mediante **Cloudflare Tunnel** (modo gestionado por dashboard), sin
necesidad de IP pública ni de abrir puertos, y **sin ninguna ventana de consola
abierta** (todo corre como Servicio de Windows).

## Arquitectura

```
Internet ──► Cloudflare (edge, SSL, CDN)
                │
                ▼  (túnel saliente, sin puertos entrantes)
        cloudflared  ── Servicio de Windows ──►  Node/Express (puerto 3001) ── Servicio de Windows
                                                    ├── sirve el sitio estático (dist/)
                                                    └── /api/*  → formularios + correo M365 + SQLite
```

Un solo proceso Node entrega el sitio **y** el API. El túnel apunta a `http://localhost:3001`.

---

## Requisitos previos

- **Node.js 22 o superior** (obligatorio: el backend usa `node:sqlite`). Descargar de nodejs.org.
- **NSSM** (Non-Sucking Service Manager) — para correr Node como servicio. Descargar de https://nssm.cc y dejar `nssm.exe` en una ruta fija (ej. `C:\nssm\nssm.exe`) o en el PATH.
- **cloudflared** — el conector de Cloudflare. Descargar de https://github.com/cloudflare/cloudflared/releases (el `.exe` de Windows) o vía `winget install --id Cloudflare.cloudflared`.
- Dominio `ademincol.com.co` **gestionado en Cloudflare** (nameservers apuntando a Cloudflare, con los registros MX/SPF/DKIM de Microsoft 365 ya replicados — el correo no se toca).

---

## 1. Clonar y compilar el frontend

```powershell
cd C:\sitios
git clone https://github.com/DiegoDiazR/Pagina_Ademincol.git ademincol
cd ademincol
npm install
npm run build      # genera la carpeta dist\ con el sitio estático
```

## 2. Preparar el backend

```powershell
cd C:\sitios\ademincol\backend
npm install
copy .env.example .env
notepad .env       # llena ADMIN_TOKEN y las credenciales SMTP de Microsoft 365
```

> ⚠️ **Microsoft 365:** confirma con quien administra el tenant que el buzón
> `no-reply@ademincol.com.co` tiene **SMTP AUTH habilitado** y una **App Password**.
> Sin eso, los formularios se guardan en la BD pero no envían correo.

Prueba rápida (en primer plano, solo para verificar — luego se cierra con Ctrl+C):

```powershell
node --env-file=.env server.js
# En otra ventana:  curl http://localhost:3001/api/health   →  {"ok":true,...}
```

## 3. Registrar el backend como Servicio de Windows

Opción automática (script incluido en el repo):

```powershell
# Ejecutar PowerShell como Administrador
cd C:\sitios\ademincol\scripts
.\install-windows-service.ps1 -ProjectPath "C:\sitios\ademincol" -NssmPath "C:\nssm\nssm.exe"
```

Esto crea el servicio **AdemincolWeb**, lo configura para arrancar con Windows,
reiniciarse si falla, escribir logs a `C:\sitios\ademincol\logs\`, y lo inicia.

Verificación:
```powershell
Get-Service AdemincolWeb
curl http://localhost:3001/api/health
```

## 4. Crear el túnel en Cloudflare (modo dashboard)

1. Entra a **Cloudflare → Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Tipo **Cloudflared**, nombre `ademincol`.
3. Copia el **token** que te muestra (cadena larga).
4. En el servidor, instala cloudflared como servicio con ese token:

   ```powershell
   cloudflared.exe service install <PEGA-AQUÍ-EL-TOKEN>
   ```

5. De vuelta en el dashboard, en **Public Hostnames** del túnel, agrega:
   - **Subdomain:** (vacío)  · **Domain:** `ademincol.com.co` · **Service:** `http://localhost:3001`
   - Repite para `www.ademincol.com.co` → `http://localhost:3001`

Cloudflare crea solo los registros DNS del sitio y pone el SSL automáticamente.

## 5. Verificación final

- `https://ademincol.com.co` carga con candado HTTPS ✅
- Enviar un formulario de prueba → llega el correo a `comercial1@` / `pqrsf@` ✅
- El correo corporativo entrante sigue funcionando (MX intactos) ✅

---

## Que el equipo esté SIEMPRE disponible (hardware)

Los servicios resuelven el software; el equipo debe resolver lo físico:

- **Energía → Alto rendimiento**; suspensión y apagar pantalla en **"Nunca"**.
- En la **BIOS**, activar *Restore on AC Power Loss* (que encienda solo tras corte de luz).
- **UPS** (batería) para microcortes.
- Los Servicios de Windows **no requieren sesión iniciada** → arrancan aunque nadie haya hecho login. ✅

---

## Actualizar el sitio en el futuro

```powershell
cd C:\sitios\ademincol
git pull
npm install
npm run build
cd backend; npm install     # solo si cambió el backend
Restart-Service AdemincolWeb
```
(`cloudflared` no necesita reiniciarse: sigue apuntando a localhost:3001.)

---

## Comandos útiles

```powershell
Get-Service AdemincolWeb, cloudflared      # estado de los servicios
Restart-Service AdemincolWeb               # reiniciar el backend
Get-Content C:\sitios\ademincol\logs\err.log -Tail 50   # ver errores recientes
```
