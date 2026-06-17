"""
Pruebas de integración para la API de Ademincol.
Ejecutar con servidor backend corriendo en http://localhost:3001.

Uso:
    pip install pytest requests
    pytest prueba2.py -v

Requiere: pytest, requests
"""
import pytest
import requests

BASE = "http://localhost:3001"
ADMIN_TOKEN = "cambia-este-token"


# ──────────────────────────────────────────────
#  Health
# ──────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self):
        r = requests.get(f"{BASE}/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["service"] == "ademincol-forms"
        assert "time" in data


# ──────────────────────────────────────────────
#  /api/cotizacion
# ──────────────────────────────────────────────

COTIZACION_VALIDA = {
    "alcance": "Inspección de soldadura en tanques",
    "ubicacion": "Bogotá",
    "rut": "900123456-7",
    "correo": "cliente@ejemplo.com",
    "hse": "no",
    "otros": "Urgente",
}

class TestCotizacion:
    def test_cotizacion_valida(self):
        r = requests.post(f"{BASE}/api/cotizacion", json=COTIZACION_VALIDA)
        assert r.status_code == 201
        data = r.json()
        assert data["ok"] is True
        assert isinstance(data["id"], int)

    def test_cotizacion_sin_alcance(self):
        body = {**COTIZACION_VALIDA, "alcance": ""}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400
        assert "obligatorio" in r.json()["error"]

    def test_cotizacion_sin_ubicacion(self):
        body = {**COTIZACION_VALIDA, "ubicacion": ""}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400

    def test_cotizacion_sin_rut(self):
        body = {**COTIZACION_VALIDA, "rut": ""}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400

    def test_cotizacion_correo_invalido(self):
        body = {**COTIZACION_VALIDA, "correo": "no-es-un-email"}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400
        assert "inválido" in r.json()["error"].lower()

    def test_cotizacion_correo_vacio(self):
        body = {**COTIZACION_VALIDA, "correo": ""}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400

    def test_cotizacion_hse_invalido(self):
        body = {**COTIZACION_VALIDA, "hse": "talvez"}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 400
        assert "hse" in r.json()["error"].lower()

    def test_cotizacion_hse_vacio_ok(self):
        """hse es opcional, debe aceptar vacío"""
        body = {**COTIZACION_VALIDA, "hse": ""}
        r = requests.post(f"{BASE}/api/cotizacion", json=body)
        assert r.status_code == 201

    def test_cotizacion_cuerpo_vacio(self):
        r = requests.post(f"{BASE}/api/cotizacion", json={})
        assert r.status_code == 400

    def test_cotizacion_metodo_no_permitido(self):
        r = requests.get(f"{BASE}/api/cotizacion")
        assert r.status_code in (404, 405)


# ──────────────────────────────────────────────
#  /api/pqrsf
# ──────────────────────────────────────────────

PQRSF_VALIDA = {
    "tipo": "peticion",
    "nombre": "Carlos Pérez",
    "telefono": "3001234567",
    "correo": "carlos@ejemplo.com",
    "descripcion": "Solicito información sobre servicios de END.",
}

class TestPqrsf:
    def test_pqrsf_valida(self):
        r = requests.post(f"{BASE}/api/pqrsf", data=PQRSF_VALIDA)
        assert r.status_code == 201
        data = r.json()
        assert data["ok"] is True
        assert isinstance(data["id"], int)

    def test_pqrsf_sin_tipo(self):
        body = {**PQRSF_VALIDA, "tipo": ""}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400
        assert "inválido" in r.json()["error"].lower()

    def test_pqrsf_tipo_invalido(self):
        body = {**PQRSF_VALIDA, "tipo": "otro"}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400

    def test_pqrsf_sin_nombre(self):
        body = {**PQRSF_VALIDA, "nombre": ""}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400

    def test_pqrsf_sin_correo(self):
        body = {**PQRSF_VALIDA, "correo": ""}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400

    def test_pqrsf_sin_descripcion(self):
        body = {**PQRSF_VALIDA, "descripcion": ""}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400

    def test_pqrsf_correo_invalido(self):
        body = {**PQRSF_VALIDA, "correo": "correo-mal"}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 400

    @pytest.mark.parametrize("tipo", ["peticion", "queja", "reclamo", "sugerencia", "felicitacion"])
    def test_pqrsf_tipos_validos(self, tipo):
        body = {**PQRSF_VALIDA, "tipo": tipo}
        r = requests.post(f"{BASE}/api/pqrsf", data=body)
        assert r.status_code == 201

    def test_pqrsf_con_adjunto(self):
        archivo = ("documento.pdf", b"%PDF-1.4 mock content", "application/pdf")
        r = requests.post(
            f"{BASE}/api/pqrsf",
            data=PQRSF_VALIDA,
            files={"documentos": archivo},
        )
        assert r.status_code == 201
        data = r.json()
        assert data["adjuntos"] == 1

    def test_pqrsf_demasiados_archivos(self):
        files = [("documentos", (f"archivo{i}.pdf", b"data", "application/pdf")) for i in range(6)]
        r = requests.post(f"{BASE}/api/pqrsf", data=PQRSF_VALIDA, files=files)
        assert r.status_code == 413

    def test_pqrsf_archivo_demasiado_grande(self):
        grande = b"x" * (11 * 1024 * 1024)  # 11 MB
        r = requests.post(
            f"{BASE}/api/pqrsf",
            data=PQRSF_VALIDA,
            files={"documentos": ("grande.pdf", grande, "application/pdf")},
        )
        assert r.status_code == 413


# ──────────────────────────────────────────────
#  Endpoints Admin (requieren X-Admin-Token)
# ──────────────────────────────────────────────

class TestAdmin:
    def test_admin_cotizaciones_sin_token(self):
        r = requests.get(f"{BASE}/api/admin/cotizaciones")
        assert r.status_code == 401

    def test_admin_cotizaciones_token_invalido(self):
        r = requests.get(
            f"{BASE}/api/admin/cotizaciones",
            headers={"X-Admin-Token": "token-falso"},
        )
        assert r.status_code == 401

    def test_admin_cotizaciones_con_token(self):
        r = requests.get(
            f"{BASE}/api/admin/cotizaciones",
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert isinstance(data["items"], list)

    def test_admin_pqrsf_con_token(self):
        r = requests.get(
            f"{BASE}/api/admin/pqrsf",
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True

    def test_admin_pqrsf_sin_token(self):
        r = requests.get(f"{BASE}/api/admin/pqrsf")
        assert r.status_code == 401

    def test_admin_pqrsf_id_invalido(self):
        r = requests.get(
            f"{BASE}/api/admin/pqrsf/abc/adjuntos",
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 400

    def test_admin_adjunto_no_encontrado(self):
        r = requests.get(
            f"{BASE}/api/admin/adjunto/999999",
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 404


# ──────────────────────────────────────────────
#  Errores generales
# ──────────────────────────────────────────────

class TestErrores:
    def test_404_en_ruta_desconocida(self):
        r = requests.get(f"{BASE}/api/ruta-inexistente")
        assert r.status_code in (404, 200)  # 200 si es archivo estático

    def test_json_malformado(self):
        r = requests.post(
            f"{BASE}/api/cotizacion",
            data="esto-no-es-json",
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 400
