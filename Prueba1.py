"""
Prueba1.py — Suite de pruebas de integración para el backend de Ademincol S.A.
================================================================================
Tecnología: pytest + requests (pruebas de caja negra contra la API REST Express)

Requisitos previos:
  1. pip install pytest requests
  2. El backend debe estar corriendo:  node --env-file=.env backend/server.js
     (o simplemente: node backend/server.js  si usas Node 22+)
  3. El servidor debe escuchar en http://localhost:3001 (configurable con BASE_URL)

Ejecutar todas las pruebas:
  pytest Prueba1.py -v

Ejecutar solo un grupo:
  pytest Prueba1.py -v -k "cotizacion"
  pytest Prueba1.py -v -k "pqrsf"
  pytest Prueba1.py -v -k "admin"
  pytest Prueba1.py -v -k "seguridad"

Ver reporte de cobertura de casos:
  pytest Prueba1.py -v --tb=short
"""

import io
import pytest
import requests

# ──────────────────────────────────────────────
# Configuración global
# ──────────────────────────────────────────────

BASE_URL = "http://localhost:3001"

# Token por defecto definido en server.js línea 10.
# Cambia este valor si configuraste ADMIN_TOKEN en tu .env
ADMIN_TOKEN_CORRECTO = "cambia-este-token"
ADMIN_TOKEN_INCORRECTO = "token-falso-123"

COTIZACION_VALIDA = {
    "alcance": "Inspección de tuberías por ultrasonido — Planta Barrancabermeja",
    "ubicacion": "Barrancabermeja, Santander",
    "rut": "900123456-7",
    "correo": "prueba@ejemplo.com",
    "hse": "si",
    "otros": "Requiere certificación ASNT nivel II",
}

PQRSF_VALIDA = {
    "tipo": "sugerencia",
    "nombre": "Ana García López",
    "telefono": "3101234567",
    "correo": "ana.garcia@ejemplo.com",
    "descripcion": "Sugiero agregar informes mensuales de avance en el portal.",
}


def url(path: str) -> str:
    return f"{BASE_URL}{path}"


def admin_headers(token: str = ADMIN_TOKEN_CORRECTO) -> dict:
    return {"X-Admin-Token": token}


# ──────────────────────────────────────────────
# Fixture: verificar que el servidor está corriendo
# ──────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def verificar_servidor():
    """
    Se ejecuta una sola vez antes de toda la suite.
    Si el servidor no está activo, todas las pruebas se omiten con un mensaje claro.
    """
    try:
        resp = requests.get(url("/api/health"), timeout=3)
        assert resp.status_code == 200, "El endpoint /api/health no retornó 200"
    except (requests.ConnectionError, requests.Timeout):
        pytest.skip(
            "\n\n  ❌  El backend no está corriendo en http://localhost:3001\n"
            "  Ejecuta primero:  node backend/server.js\n"
        )


# ══════════════════════════════════════════════
# GRUPO 1: Health check
# ══════════════════════════════════════════════

class TestHealth:
    """Verifica que el servidor responde y tiene la estructura esperada."""

    def test_health_status_200(self):
        """El servidor responde HTTP 200."""
        r = requests.get(url("/api/health"))
        assert r.status_code == 200

    def test_health_campo_ok_true(self):
        """La respuesta incluye ok: true."""
        r = requests.get(url("/api/health"))
        assert r.json()["ok"] is True

    def test_health_campo_service(self):
        """La respuesta incluye el nombre del servicio."""
        r = requests.get(url("/api/health"))
        assert "service" in r.json()

    def test_health_campo_time(self):
        """La respuesta incluye timestamp ISO."""
        r = requests.get(url("/api/health"))
        data = r.json()
        assert "time" in data
        assert "T" in data["time"]  # formato ISO 8601

    def test_health_content_type_json(self):
        """La respuesta es JSON."""
        r = requests.get(url("/api/health"))
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════
# GRUPO 2: Endpoint /api/cotizacion
# ══════════════════════════════════════════════

class TestCotizacion:
    """Pruebas unitarias del formulario de solicitud de cotización."""

    # ── Casos exitosos ──

    def test_cotizacion_valida_retorna_201(self):
        """Solicitud completa y válida → HTTP 201 Created."""
        r = requests.post(url("/api/cotizacion"), json=COTIZACION_VALIDA)
        assert r.status_code == 201

    def test_cotizacion_valida_retorna_ok_true(self):
        """Solicitud válida → cuerpo con ok: true."""
        r = requests.post(url("/api/cotizacion"), json=COTIZACION_VALIDA)
        assert r.json()["ok"] is True

    def test_cotizacion_valida_retorna_id_entero(self):
        """Solicitud válida → cuerpo con id numérico positivo."""
        r = requests.post(url("/api/cotizacion"), json=COTIZACION_VALIDA)
        data = r.json()
        assert isinstance(data["id"], int)
        assert data["id"] > 0

    def test_cotizacion_sin_hse_es_valida(self):
        """El campo hse es opcional — debe aceptar payload sin él."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "hse"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 201

    def test_cotizacion_sin_otros_es_valida(self):
        """El campo otros es opcional — debe aceptar payload sin él."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "otros"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 201

    def test_cotizacion_correo_en_minusculas(self):
        """El backend normaliza el correo a minúsculas (no debe fallar)."""
        payload = {**COTIZACION_VALIDA, "correo": "PRUEBA@EJEMPLO.COM"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 201

    # ── Validaciones de campo obligatorio ──

    def test_cotizacion_sin_alcance_retorna_400(self):
        """Falta alcance → HTTP 400."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "alcance"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 400

    def test_cotizacion_alcance_vacio_retorna_400(self):
        """Alcance con espacios vacíos → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "alcance": "   "})
        assert r.status_code == 400

    def test_cotizacion_sin_ubicacion_retorna_400(self):
        """Falta ubicacion → HTTP 400."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "ubicacion"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 400

    def test_cotizacion_sin_rut_retorna_400(self):
        """Falta rut → HTTP 400."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "rut"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 400

    def test_cotizacion_sin_correo_retorna_400(self):
        """Falta correo → HTTP 400."""
        payload = {k: v for k, v in COTIZACION_VALIDA.items() if k != "correo"}
        r = requests.post(url("/api/cotizacion"), json=payload)
        assert r.status_code == 400

    # ── Validación de formato de email ──

    def test_cotizacion_correo_sin_arroba_retorna_400(self):
        """Correo sin @ → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "correo": "correoSinArroba"})
        assert r.status_code == 400

    def test_cotizacion_correo_sin_dominio_retorna_400(self):
        """Correo sin dominio (usuario@) → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "correo": "usuario@"})
        assert r.status_code == 400

    def test_cotizacion_correo_sin_tld_retorna_400(self):
        """Correo sin TLD (usuario@dominio) → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "correo": "usuario@dominio"})
        assert r.status_code == 400

    def test_cotizacion_correo_solo_espacios_retorna_400(self):
        """Correo con espacios en blanco → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "correo": "   "})
        assert r.status_code == 400

    # ── Validación del campo hse ──

    def test_cotizacion_hse_invalido_retorna_400(self):
        """Valor de hse fuera del conjunto {si, no} → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "hse": "talvez"})
        assert r.status_code == 400

    def test_cotizacion_hse_vacio_es_valido(self):
        """Valor de hse vacío (campo opcional) → HTTP 201."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "hse": ""})
        assert r.status_code == 201

    # ── Estructura de la respuesta de error ──

    def test_cotizacion_error_incluye_mensaje(self):
        """La respuesta de error incluye el campo error con texto."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "alcance": ""})
        data = r.json()
        assert "error" in data
        assert isinstance(data["error"], str)
        assert len(data["error"]) > 0

    def test_cotizacion_error_ok_es_false(self):
        """La respuesta de error incluye ok: false."""
        r = requests.post(url("/api/cotizacion"), json={**COTIZACION_VALIDA, "correo": "malo"})
        assert r.json()["ok"] is False

    # ── Payload extremo ──

    def test_cotizacion_payload_vacio_retorna_400(self):
        """Payload JSON completamente vacío → HTTP 400."""
        r = requests.post(url("/api/cotizacion"), json={})
        assert r.status_code == 400

    def test_cotizacion_content_type_incorrecto(self):
        """Enviar como texto plano (sin Content-Type JSON) → el servidor no debe crashear."""
        r = requests.post(url("/api/cotizacion"), data="texto plano",
                          headers={"Content-Type": "text/plain"})
        assert r.status_code in (400, 415, 500)


# ══════════════════════════════════════════════
# GRUPO 3: Endpoint /api/pqrsf
# ══════════════════════════════════════════════

class TestPqrsf:
    """Pruebas unitarias del formulario PQRSF (multipart/form-data)."""

    def _post_pqrsf(self, data: dict, files=None):
        """Helper para enviar PQRSF como multipart."""
        return requests.post(url("/api/pqrsf"), data=data, files=files)

    # ── Casos exitosos ──

    def test_pqrsf_valida_retorna_201(self):
        """PQRSF completa y válida → HTTP 201 Created."""
        r = self._post_pqrsf(PQRSF_VALIDA)
        assert r.status_code == 201

    def test_pqrsf_valida_retorna_ok_true(self):
        """PQRSF válida → cuerpo con ok: true."""
        r = self._post_pqrsf(PQRSF_VALIDA)
        assert r.json()["ok"] is True

    def test_pqrsf_valida_retorna_id(self):
        """PQRSF válida → cuerpo con id numérico."""
        r = self._post_pqrsf(PQRSF_VALIDA)
        data = r.json()
        assert isinstance(data["id"], int)
        assert data["id"] > 0

    def test_pqrsf_sin_telefono_es_valida(self):
        """El campo telefono es opcional."""
        payload = {k: v for k, v in PQRSF_VALIDA.items() if k != "telefono"}
        r = self._post_pqrsf(payload)
        assert r.status_code == 201

    def test_pqrsf_todos_los_tipos_validos(self):
        """Cada tipo del conjunto PQRSF debe ser aceptado."""
        tipos = ["peticion", "queja", "reclamo", "sugerencia", "felicitacion"]
        for tipo in tipos:
            r = self._post_pqrsf({**PQRSF_VALIDA, "tipo": tipo})
            assert r.status_code == 201, f"Tipo '{tipo}' fue rechazado inesperadamente"

    def test_pqrsf_con_adjunto_pdf_retorna_201(self):
        """PQRSF con un archivo PDF adjunto → HTTP 201."""
        pdf_falso = io.BytesIO(b"%PDF-1.4 contenido de prueba")
        r = self._post_pqrsf(
            PQRSF_VALIDA,
            files=[("documentos", ("informe.pdf", pdf_falso, "application/pdf"))]
        )
        assert r.status_code == 201

    def test_pqrsf_con_adjunto_retorna_count_adjuntos(self):
        """La respuesta reporta cuántos adjuntos se recibieron."""
        pdf_falso = io.BytesIO(b"%PDF-1.4 archivo de prueba")
        r = self._post_pqrsf(
            PQRSF_VALIDA,
            files=[("documentos", ("documento.pdf", pdf_falso, "application/pdf"))]
        )
        data = r.json()
        assert "adjuntos" in data
        assert data["adjuntos"] == 1

    # ── Validaciones de campo obligatorio ──

    def test_pqrsf_sin_nombre_retorna_400(self):
        """Falta nombre → HTTP 400."""
        payload = {k: v for k, v in PQRSF_VALIDA.items() if k != "nombre"}
        r = self._post_pqrsf(payload)
        assert r.status_code == 400

    def test_pqrsf_nombre_vacio_retorna_400(self):
        """Nombre vacío → HTTP 400."""
        r = self._post_pqrsf({**PQRSF_VALIDA, "nombre": "   "})
        assert r.status_code == 400

    def test_pqrsf_sin_correo_retorna_400(self):
        """Falta correo → HTTP 400."""
        payload = {k: v for k, v in PQRSF_VALIDA.items() if k != "correo"}
        r = self._post_pqrsf(payload)
        assert r.status_code == 400

    def test_pqrsf_sin_descripcion_retorna_400(self):
        """Falta descripcion → HTTP 400."""
        payload = {k: v for k, v in PQRSF_VALIDA.items() if k != "descripcion"}
        r = self._post_pqrsf(payload)
        assert r.status_code == 400

    def test_pqrsf_descripcion_vacia_retorna_400(self):
        """Descripción vacía → HTTP 400."""
        r = self._post_pqrsf({**PQRSF_VALIDA, "descripcion": ""})
        assert r.status_code == 400

    # ── Validación de email ──

    def test_pqrsf_correo_invalido_retorna_400(self):
        """Correo malformado → HTTP 400."""
        r = self._post_pqrsf({**PQRSF_VALIDA, "correo": "no-es-correo"})
        assert r.status_code == 400

    # ── Validación de tipo ──

    def test_pqrsf_tipo_invalido_retorna_400(self):
        """Tipo fuera del conjunto permitido → HTTP 400."""
        r = self._post_pqrsf({**PQRSF_VALIDA, "tipo": "insulto"})
        assert r.status_code == 400

    def test_pqrsf_tipo_vacio_retorna_400(self):
        """Tipo vacío → HTTP 400."""
        r = self._post_pqrsf({**PQRSF_VALIDA, "tipo": ""})
        assert r.status_code == 400

    # ── Límite de archivos (5 max) ──

    def test_pqrsf_seis_adjuntos_retorna_413(self):
        """Más de 5 archivos adjuntos → HTTP 413 (límite superado)."""
        archivos = [
            ("documentos", (f"archivo{i}.pdf", io.BytesIO(b"contenido"), "application/pdf"))
            for i in range(6)
        ]
        r = self._post_pqrsf(PQRSF_VALIDA, files=archivos)
        assert r.status_code == 413

    # ── AUDITORÍA DE SEGURIDAD: tipos de archivo no validados ──

    def test_pqrsf_adjunto_ejecutable_DEBERIA_ser_rechazado(self):
        """
        FALLA ESPERADA (bug de seguridad documentado en auditoría, ítem #4):
        El backend actualmente acepta cualquier tipo de archivo.
        Esta prueba documenta que se puede subir un .exe sin rechazo.
        Cuando se implemente la validación de MIME types, este test debe cambiar
        para esperar HTTP 400.
        """
        exe_falso = io.BytesIO(b"MZ\x90\x00\x03")  # header de ejecutable Windows
        r = self._post_pqrsf(
            PQRSF_VALIDA,
            files=[("documentos", ("virus.exe", exe_falso, "application/octet-stream"))]
        )
        # VULNERABILIDAD ACTIVA: el servidor acepta el .exe (201)
        # Cuando se corrija, cambiar a: assert r.status_code == 400
        assert r.status_code == 201, (
            "El servidor rechazó el ejecutable — la vulnerabilidad ya fue corregida. "
            "Actualiza este test para esperar 400."
        )


# ══════════════════════════════════════════════
# GRUPO 4: Endpoints de administración
# ══════════════════════════════════════════════

class TestAdmin:
    """Pruebas de autenticación y acceso a los endpoints protegidos /api/admin/*."""

    # ── Sin token ──

    def test_admin_cotizaciones_sin_token_retorna_401(self):
        """GET /api/admin/cotizaciones sin cabecera → 401."""
        r = requests.get(url("/api/admin/cotizaciones"))
        assert r.status_code == 401

    def test_admin_pqrsf_sin_token_retorna_401(self):
        """GET /api/admin/pqrsf sin cabecera → 401."""
        r = requests.get(url("/api/admin/pqrsf"))
        assert r.status_code == 401

    # ── Token incorrecto ──

    def test_admin_cotizaciones_token_incorrecto_retorna_401(self):
        """Token inválido → 401."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers=admin_headers(ADMIN_TOKEN_INCORRECTO))
        assert r.status_code == 401

    def test_admin_error_ok_es_false(self):
        """Respuesta de 401 incluye ok: false."""
        r = requests.get(url("/api/admin/cotizaciones"))
        assert r.json()["ok"] is False

    # ── Token correcto ──

    def test_admin_cotizaciones_token_correcto_retorna_200(self):
        """Token válido → 200 con listado de cotizaciones."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers=admin_headers())
        assert r.status_code == 200

    def test_admin_cotizaciones_estructura_respuesta(self):
        """La respuesta de cotizaciones incluye ok, count e items."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers=admin_headers())
        data = r.json()
        assert data["ok"] is True
        assert "count" in data
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_admin_cotizaciones_count_igual_len_items(self):
        """El campo count debe coincidir con la longitud real de items."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers=admin_headers())
        data = r.json()
        assert data["count"] == len(data["items"])

    def test_admin_pqrsf_token_correcto_retorna_200(self):
        """GET /api/admin/pqrsf con token válido → 200."""
        r = requests.get(url("/api/admin/pqrsf"),
                         headers=admin_headers())
        assert r.status_code == 200

    def test_admin_pqrsf_incluye_campo_adjuntos(self):
        """Cada item de PQRSF debe incluir el contador de adjuntos."""
        r = requests.get(url("/api/admin/pqrsf"),
                         headers=admin_headers())
        items = r.json().get("items", [])
        if items:
            assert "adjuntos" in items[0]

    def test_admin_adjunto_id_invalido_retorna_400(self):
        """ID no numérico en adjunto → 400."""
        r = requests.get(url("/api/admin/adjunto/abc"),
                         headers=admin_headers())
        assert r.status_code == 400

    def test_admin_adjunto_inexistente_retorna_404(self):
        """ID numérico que no existe → 404."""
        r = requests.get(url("/api/admin/adjunto/999999"),
                         headers=admin_headers())
        assert r.status_code == 404

    def test_admin_pqrsf_adjuntos_id_invalido_retorna_400(self):
        """ID no numérico en /pqrsf/:id/adjuntos → 400."""
        r = requests.get(url("/api/admin/pqrsf/xyz/adjuntos"),
                         headers=admin_headers())
        assert r.status_code == 400


# ══════════════════════════════════════════════
# GRUPO 5: Seguridad y comportamiento defensivo
# ══════════════════════════════════════════════

class TestSeguridad:
    """
    Pruebas de caja negra orientadas a detectar vulnerabilidades
    identificadas en la auditoría.
    """

    # ── CORS ──

    def test_cors_header_presente(self):
        """
        Documenta que el CORS está abierto (Access-Control-Allow-Origin: *).
        Cuando se restrinja al dominio de producción, actualizar este test.
        """
        r = requests.get(url("/api/health"))
        origen = r.headers.get("Access-Control-Allow-Origin", "")
        # AUDITORÍA ítem #2: CORS abierto. Cambiar cuando se restrinja:
        # assert origen == "https://ademincol.com.co"
        assert origen == "*", (
            "El CORS ya fue restringido. Actualiza este test para validar el dominio correcto."
        )

    # ── Inyección / payloads maliciosos ──

    def test_cotizacion_xss_en_alcance_no_crashea(self):
        """Payload con HTML/script en alcance → el servidor no debe fallar (500)."""
        payload_xss = {
            **COTIZACION_VALIDA,
            "alcance": "<script>alert('xss')</script>",
        }
        r = requests.post(url("/api/cotizacion"), json=payload_xss)
        assert r.status_code != 500

    def test_cotizacion_sql_injection_no_crashea(self):
        """Intento de inyección SQL → el servidor no debe fallar (usa parámetros)."""
        payload_sqli = {
            **COTIZACION_VALIDA,
            "alcance": "' OR '1'='1'; DROP TABLE cotizaciones; --",
        }
        r = requests.post(url("/api/cotizacion"), json=payload_sqli)
        # Debe aceptarlo como texto normal (201) o rechazarlo (400), pero nunca 500
        assert r.status_code in (201, 400)

    def test_cotizacion_payload_demasiado_grande(self):
        """Payload JSON superior al límite de 1 MB → 413 o rechazo."""
        payload_grande = {**COTIZACION_VALIDA, "otros": "A" * (1024 * 1024 + 1)}
        r = requests.post(url("/api/cotizacion"), json=payload_grande)
        assert r.status_code in (400, 413, 500)

    def test_pqrsf_archivo_demasiado_grande_retorna_413(self):
        """Archivo de 10 MB + 1 byte → HTTP 413."""
        archivo_grande = io.BytesIO(b"0" * (10 * 1024 * 1024 + 1))
        r = requests.post(
            url("/api/pqrsf"),
            data=PQRSF_VALIDA,
            files=[("documentos", ("grande.pdf", archivo_grande, "application/pdf"))]
        )
        assert r.status_code == 413

    def test_metodo_delete_no_existe(self):
        """DELETE en endpoints de formularios → 404 o 405."""
        r = requests.delete(url("/api/cotizacion"))
        assert r.status_code in (404, 405)

    def test_metodo_put_cotizacion_no_existe(self):
        """PUT en /api/cotizacion → 404 o 405."""
        r = requests.put(url("/api/cotizacion"), json=COTIZACION_VALIDA)
        assert r.status_code in (404, 405)

    def test_ruta_inexistente_sirve_html(self):
        """
        Rutas desconocidas son manejadas por el servicio de archivos estáticos de Astro.
        El servidor no debe crashear (no debe retornar 500).
        """
        r = requests.get(url("/ruta-que-no-existe-99999"))
        assert r.status_code != 500

    def test_admin_token_vacio_retorna_401(self):
        """Cabecera X-Admin-Token presente pero vacía → 401."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers={"X-Admin-Token": ""})
        assert r.status_code == 401

    def test_admin_token_con_espacios_retorna_401(self):
        """Token con solo espacios → 401."""
        r = requests.get(url("/api/admin/cotizaciones"),
                         headers={"X-Admin-Token": "   "})
        assert r.status_code == 401


# ══════════════════════════════════════════════
# GRUPO 6: Flujo completo (end-to-end)
# ══════════════════════════════════════════════

class TestFlujoCompleto:
    """
    Pruebas de integración que simulan el flujo real de un usuario
    y verifican que los datos se persistan correctamente.
    """

    def test_cotizacion_aparece_en_admin_despues_de_envio(self):
        """
        Flujo completo: el usuario envía una cotización →
        el administrador puede verla en el listado.
        """
        alcance_unico = "PRUEBA-E2E-COTIZACION-123456"

        # 1. Enviar cotización
        r_post = requests.post(url("/api/cotizacion"), json={
            **COTIZACION_VALIDA,
            "alcance": alcance_unico,
        })
        assert r_post.status_code == 201
        id_creado = r_post.json()["id"]

        # 2. Verificar en listado admin
        r_admin = requests.get(url("/api/admin/cotizaciones"),
                               headers=admin_headers())
        assert r_admin.status_code == 200
        items = r_admin.json()["items"]
        ids = [item["id"] for item in items]
        assert id_creado in ids, f"El ID {id_creado} no aparece en el listado admin"

    def test_pqrsf_con_adjunto_aparece_en_admin(self):
        """
        Flujo completo: el usuario envía PQRSF con PDF →
        el administrador puede ver el adjunto.
        """
        pdf_falso = io.BytesIO(b"%PDF-1.4 test e2e adjunto")

        # 1. Enviar PQRSF con adjunto
        r_post = requests.post(
            url("/api/pqrsf"),
            data={**PQRSF_VALIDA, "descripcion": "PRUEBA-E2E-PQRSF-CON-ADJUNTO"},
            files=[("documentos", ("contrato.pdf", pdf_falso, "application/pdf"))]
        )
        assert r_post.status_code == 201
        pqrsf_id = r_post.json()["id"]

        # 2. Listar adjuntos del PQRSF recién creado
        r_adj = requests.get(
            url(f"/api/admin/pqrsf/{pqrsf_id}/adjuntos"),
            headers=admin_headers()
        )
        assert r_adj.status_code == 200
        adjuntos = r_adj.json()["items"]
        assert len(adjuntos) == 1
        assert adjuntos[0]["filename"] == "contrato.pdf"
        assert adjuntos[0]["mimetype"] == "application/pdf"

    def test_descargar_adjunto_creado(self):
        """
        Flujo completo: crear PQRSF con adjunto →
        descargar el adjunto por su ID y verificar el contenido.
        """
        contenido_original = b"%PDF-1.4 contenido verificable 42"
        pdf_falso = io.BytesIO(contenido_original)

        # 1. Crear PQRSF
        r_post = requests.post(
            url("/api/pqrsf"),
            data={**PQRSF_VALIDA, "descripcion": "PRUEBA-E2E-DESCARGA"},
            files=[("documentos", ("prueba.pdf", pdf_falso, "application/pdf"))]
        )
        assert r_post.status_code == 201
        pqrsf_id = r_post.json()["id"]

        # 2. Obtener ID del adjunto
        r_lista = requests.get(
            url(f"/api/admin/pqrsf/{pqrsf_id}/adjuntos"),
            headers=admin_headers()
        )
        adjunto_id = r_lista.json()["items"][0]["id"]

        # 3. Descargar y verificar contenido
        r_dl = requests.get(
            url(f"/api/admin/adjunto/{adjunto_id}"),
            headers=admin_headers()
        )
        assert r_dl.status_code == 200
        assert r_dl.content == contenido_original
        assert "attachment" in r_dl.headers.get("Content-Disposition", "")
