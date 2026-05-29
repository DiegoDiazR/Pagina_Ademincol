(function () {
	'use strict';

	var API_BASE = (window.ADEMINCOL_API_BASE || 'http://localhost:3001').replace(/\/$/, '');

	function setStatus(form, msg, type) {
		var el = form.querySelector('[data-status]');
		if (!el) return;
		el.textContent = msg || '';
		el.className = 'form-status' + (type ? ' form-status--' + type : '');
	}

	function setBusy(form, busy) {
		var btn = form.querySelector('button[type="submit"]');
		if (btn) btn.disabled = !!busy;
	}

	function bindCotizacion(form) {
		form.addEventListener('submit', function (ev) {
			ev.preventDefault();
			var alcance = (form.querySelector('[name="alcance"]') || {}).value || '';
			var ubicacion = (form.querySelector('[name="ubicacion"]') || {}).value || '';
			var rut = (form.querySelector('[name="rut"]') || {}).value || '';
			var correo = (form.querySelector('[name="correo"]') || {}).value || '';
			if (!alcance.trim() || !ubicacion.trim() || !rut.trim() || !correo.trim()) {
				setStatus(form, 'Alcance, ubicación, RUT y correo son obligatorios.', 'error');
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
				setStatus(form, 'El correo electrónico no es válido.', 'error');
				return;
			}
			setBusy(form, true);
			setStatus(form, 'Enviando…', 'info');

			var payload = {
				alcance: alcance,
				ubicacion: ubicacion,
				rut: rut,
				correo: correo,
				hse: (form.querySelector('[name="hse"]') || {}).value || '',
				otros: (form.querySelector('[name="otros"]') || {}).value || ''
			};

			fetch(API_BASE + '/api/cotizacion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})
				.then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
				.then(function (res) {
					if (res.ok && res.data.ok) {
						form.reset();
						setStatus(form, 'Cotización enviada correctamente. Le contactaremos pronto.', 'success');
					} else {
						setStatus(form, (res.data && res.data.error) || 'No se pudo enviar la solicitud.', 'error');
					}
				})
				.catch(function () {
					setStatus(form, 'Error de conexión con el servidor.', 'error');
				})
				.finally(function () { setBusy(form, false); });
		});
	}

	function bindPqrsf(form) {
		form.addEventListener('submit', function (ev) {
			ev.preventDefault();
			var nombre = (form.querySelector('[name="nombre"]') || {}).value || '';
			var correo = (form.querySelector('[name="correo"]') || {}).value || '';
			var descripcion = (form.querySelector('[name="descripcion"]') || {}).value || '';

			if (!nombre.trim() || !correo.trim() || !descripcion.trim()) {
				setStatus(form, 'Nombre, correo y descripción son obligatorios.', 'error');
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
				setStatus(form, 'El correo electrónico no es válido.', 'error');
				return;
			}

			setBusy(form, true);
			setStatus(form, 'Enviando…', 'info');

			var fd = new FormData(form);
			fetch(API_BASE + '/api/pqrsf', { method: 'POST', body: fd })
				.then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
				.then(function (res) {
					if (res.ok && res.data.ok) {
						form.reset();
						setStatus(
							form,
							'PQRSF #' + res.data.id + ' registrada correctamente. Recibirá respuesta en su correo.',
							'success'
						);
					} else {
						setStatus(form, (res.data && res.data.error) || 'No se pudo enviar la PQRSF.', 'error');
					}
				})
				.catch(function () {
					setStatus(form, 'Error de conexión con el servidor.', 'error');
				})
				.finally(function () { setBusy(form, false); });
		});
	}

	function init() {
		document.querySelectorAll('form[data-ademincol-form="cotizacion"], #form-cotizacion').forEach(bindCotizacion);
		document.querySelectorAll('form[data-ademincol-form="pqrsf"], #form-pqrsf').forEach(bindPqrsf);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.AdemincolForms = { bindCotizacion: bindCotizacion, bindPqrsf: bindPqrsf };
})();
