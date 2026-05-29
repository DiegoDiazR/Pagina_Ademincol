# Backend de formularios — Ademincol SA

Backend mínimo en Node.js + Express + SQLite que recibe los envíos de los dos
formularios del sitio (Cotización y PQRSF) y los guarda en una base de datos
SQLite local. Los archivos adjuntos del PQRSF se almacenan como BLOB en la
misma base de datos.

Usa el módulo SQLite integrado de Node (`node:sqlite`), por lo que **no
requiere compilar dependencias nativas** — basta con `npm install`.

## Requisitos
- Node.js **22 o superior** (incluye `node:sqlite` estable)

## Instalación
```bash
cd backend
npm install
```

## Ejecutar
```bash
npm start          # producción
npm run dev        # con auto-reload
```

Por defecto escucha en `http://localhost:3001`. La base de datos se crea
automáticamente en `backend/data.db` la primera vez que arranca.

## Variables de entorno (opcionales)

### Servidor
| Variable      | Default                | Uso                                          |
|---------------|------------------------|----------------------------------------------|
| `PORT`        | `3001`                 | Puerto HTTP                                  |
| `DB_PATH`     | `backend/data.db`      | Ruta del archivo SQLite                      |
| `ADMIN_TOKEN` | `cambia-este-token`    | Token requerido por los endpoints `/api/admin/*` (header `X-Admin-Token`) |

### Envío de correo (SMTP)
Si no llenas estas variables, el backend funciona igual pero **no envía
correos** (los formularios se guardan en BD y se loguea `[mailer] omitido`).

| Variable               | Default                              | Uso                                              |
|------------------------|--------------------------------------|--------------------------------------------------|
| `MAIL_ENABLED`         | `true`                               | Pon `false` para desactivar el envío (modo dev)  |
| `SMTP_HOST`            | *(vacío)*                            | Host del servidor SMTP, ej. `smtp.gmail.com`     |
| `SMTP_PORT`            | `587`                                | 587 (STARTTLS) o 465 (SSL)                       |
| `SMTP_SECURE`          | `false`                              | `true` solo si usas puerto 465                   |
| `SMTP_USER`            | *(vacío)*                            | Usuario / dirección de envío                     |
| `SMTP_PASS`            | *(vacío)*                            | Password o App Password                          |
| `MAIL_FROM`            | `Ademincol <no-reply@ademincol.com.co>` | Cabecera `From:`                              |
| `MAIL_TO_COTIZACION`   | `comercial1@ademincol.com.co`        | Buzón al que llegan las cotizaciones             |
| `MAIL_TO_PQRSF`        | `pqrsf@ademincol.com.co`             | Buzón al que llegan las PQRSF                    |
| `MAIL_BCC`             | *(vacío)*                            | Copia oculta opcional (ej. gerencia)             |

#### Ejemplo Gmail / Google Workspace
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@ademincol.com.co
SMTP_PASS=xxxx-xxxx-xxxx-xxxx        # App Password (no la del usuario)
MAIL_FROM="Ademincol <no-reply@ademincol.com.co>"
```

#### Ejemplo Office 365 / Outlook
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=no-reply@ademincol.com.co
SMTP_PASS=********
```

**Patrón de envío:** las respuestas a los usuarios se confirman en cuanto se
guarda la BD; el envío de correo se dispara en segundo plano (fire-and-forget).
Si el SMTP falla, el formulario igual queda persistido en SQLite y el usuario
recibe respuesta exitosa — solo se loguea el error en consola.

Correos que envía el backend:
- **Nueva cotización** → `MAIL_TO_COTIZACION` (HTML + texto plano)
- **Nueva PQRSF** → `MAIL_TO_PQRSF` (HTML + texto + adjuntos del usuario)
- **Acuse de recibo** → correo del usuario que envió la PQRSF

## Endpoints públicos

### `POST /api/cotizacion`
Body `application/json` o `application/x-www-form-urlencoded`:
- `alcance` (obligatorio)
- `ubicacion`, `rut`, `hse` (`si`/`no`), `otros`

### `POST /api/pqrsf`
Body `multipart/form-data`:
- `tipo` (obligatorio: `peticion`, `queja`, `reclamo`, `sugerencia`, `felicitacion`)
- `nombre` (obligatorio)
- `correo` (obligatorio)
- `telefono`, `descripcion` (obligatorio)
- `documentos[]` (hasta 5 archivos, máx. 10 MB c/u)

### `GET /api/health`
Liveness check.

## Endpoints de administración
Requieren header `X-Admin-Token: <ADMIN_TOKEN>`.

- `GET /api/admin/cotizaciones` — últimas 500 cotizaciones
- `GET /api/admin/pqrsf` — últimas 500 PQRSF
- `GET /api/admin/pqrsf/:id/adjuntos` — metadata de adjuntos de una PQRSF
- `GET /api/admin/adjunto/:id` — descarga binaria del adjunto

## Portabilidad
Todo el estado vive en `backend/data.db`. Para mover el backend a otro equipo
o servidor basta con copiar la carpeta `backend/` completa (sin `node_modules`)
y volver a ejecutar `npm install`.
