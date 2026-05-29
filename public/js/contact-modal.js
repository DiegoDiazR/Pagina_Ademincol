(function () {
	if (window.__contactModalInit) return;
	window.__contactModalInit = true;

	var modalHTML = [
		'<div id="contact-modal" class="modal">',
		'	<div class="modal-content">',
		'		<span class="close" onclick="closeContactModal()">&times;</span>',
		'		<h2>Cont\u00e1ctenos</h2>',
		'		<form id="contact-form" enctype="multipart/form-data">',
		'			<div class="form-group">',
		'				<label for="categoria">Categor\u00eda:</label>',
		'				<select id="categoria" name="categoria" onchange="changeFormFields()">',
		'					<option value="cotizacion">Cotizaci\u00f3n</option>',
		'					<option value="pqrs">PQRS</option>',
		'				</select>',
		'			</div>',
		'			<div id="cotizacion-fields" class="form-fields">',
		'				<div class="form-group">',
		'					<label for="alcance">Alcance del servicio *</label>',
		'					<input type="text" id="alcance" name="alcance" required>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="ubicacion">Ubicaci\u00f3n *</label>',
		'					<input type="text" id="ubicacion" name="ubicacion" required>',
		'				</div>',

		'				<div class="form-group">',
		'					<label for="rut">RUT *</label>',
		'					<input type="text" id="rut" name="rut" required>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="cot-correo">Correo electr\u00f3nico *</label>',
		'					<input type="email" id="cot-correo" name="correo" required>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="hse">\u00bfRequieren apoyo HSE?</label>',
		'					<select id="hse" name="hse">',
		'						<option value="no">No</option>',
		'						<option value="si">S\u00ed</option>',
		'					</select>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="otros">Otros requerimientos:</label>',
		'					<textarea id="otros" name="otros"></textarea>',
		'				</div>',
		'			</div>',
		'			<div id="pqrs-fields" class="form-fields" style="display:none;">',
		'				<div class="form-group">',
		'					<label for="pqrs-tipo">Tipo de solicitud:</label>',
		'					<select id="pqrs-tipo" name="tipo">',
		'						<option value="peticion">Petici\u00f3n</option>',
		'						<option value="queja">Queja</option>',
		'						<option value="reclamo">Reclamo</option>',
		'						<option value="sugerencia">Sugerencia</option>',
		'						<option value="felicitacion">Felicitaci\u00f3n</option>',
		'					</select>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="nombre">Nombre completo:</label>',
		'					<input type="text" id="nombre" name="nombre">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="telefono">N\u00famero de tel\u00e9fono:</label>',
		'					<input type="tel" id="telefono" name="telefono">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="correo">Correo electr\u00f3nico:</label>',
		'					<input type="email" id="correo" name="correo">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="descripcion">Descripci\u00f3n:</label>',
		'					<textarea id="descripcion" name="descripcion"></textarea>',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="documentos">Documentos adjuntos:</label>',
		'					<input type="file" id="documentos" name="documentos" multiple>',
		'				</div>',
		'			</div>',
		'			<button type="submit">Enviar</button>',
		'			<p class="form-status" data-status></p>',
		'		</form>',
		'	</div>',
		'</div>'
	].join('\n');

	var API_BASE = (window.ADEMINCOL_API_BASE || 'http://localhost:3001').replace(/\/$/, '');

	function setStatus(form, msg, type) {
		var el = form.querySelector('[data-status]');
		if (!el) return;
		el.textContent = msg || '';
		el.style.color = type === 'success' ? '#1e7a3b'
			: type === 'error' ? '#b30000'
			: type === 'info' ? '#1E3056'
			: '';
		el.style.marginTop = '10px';
		el.style.fontSize = '14px';
	}

	function setBusy(form, busy) {
		var btn = form.querySelector('button[type="submit"]');
		if (btn) btn.disabled = !!busy;
	}

	function submitCotizacion(form) {
		var payload = {
			alcance: (form.querySelector('#alcance') || {}).value || '',
			ubicacion: (form.querySelector('#ubicacion') || {}).value || '',
			rut: (form.querySelector('#rut') || {}).value || '',
			correo: (form.querySelector('#cot-correo') || {}).value || '',
			hse: (form.querySelector('#hse') || {}).value || '',
			otros: (form.querySelector('#otros') || {}).value || ''
		};
		if (!payload.alcance.trim() || !payload.ubicacion.trim() || !payload.rut.trim() || !payload.correo.trim()) {
			setStatus(form, 'Alcance, ubicación, RUT y correo son obligatorios.', 'error');
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo.trim())) {
			setStatus(form, 'El correo electrónico no es válido.', 'error');
			return;
		}
		setBusy(form, true);
		setStatus(form, 'Enviando…', 'info');
		fetch(API_BASE + '/api/cotizacion', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
			.then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
			.then(function (res) {
				if (res.ok && res.data.ok) {
					form.reset();
					setStatus(form, 'Cotización enviada. Le contactaremos pronto.', 'success');
				} else {
					setStatus(form, (res.data && res.data.error) || 'No se pudo enviar la solicitud.', 'error');
				}
			})
			.catch(function () { setStatus(form, 'Error de conexión con el servidor.', 'error'); })
			.finally(function () { setBusy(form, false); });
	}

	function submitPqrsf(form) {
		var nombre = (form.querySelector('#nombre') || {}).value || '';
		var correo = (form.querySelector('#correo') || {}).value || '';
		var descripcion = (form.querySelector('#descripcion') || {}).value || '';
		if (!nombre.trim() || !correo.trim() || !descripcion.trim()) {
			setStatus(form, 'Nombre, correo y descripción son obligatorios.', 'error');
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
			setStatus(form, 'El correo electrónico no es válido.', 'error');
			return;
		}
		var fd = new FormData();
		fd.append('tipo', (form.querySelector('#pqrs-tipo') || {}).value || '');
		fd.append('nombre', nombre);
		fd.append('telefono', (form.querySelector('#telefono') || {}).value || '');
		fd.append('correo', correo);
		fd.append('descripcion', descripcion);
		var fileInput = form.querySelector('#documentos');
		if (fileInput && fileInput.files) {
			for (var i = 0; i < fileInput.files.length; i++) {
				fd.append('documentos', fileInput.files[i]);
			}
		}
		setBusy(form, true);
		setStatus(form, 'Enviando…', 'info');
		fetch(API_BASE + '/api/pqrsf', { method: 'POST', body: fd })
			.then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
			.then(function (res) {
				if (res.ok && res.data.ok) {
					form.reset();
					setStatus(form, 'PQRSF #' + res.data.id + ' registrada. Recibirá respuesta por correo.', 'success');
				} else {
					setStatus(form, (res.data && res.data.error) || 'No se pudo enviar la PQRSF.', 'error');
				}
			})
			.catch(function () { setStatus(form, 'Error de conexión con el servidor.', 'error'); })
			.finally(function () { setBusy(form, false); });
	}

	function handleSubmit(ev) {
		ev.preventDefault();
		var form = ev.target;
		var cat = (form.querySelector('#categoria') || {}).value || 'cotizacion';
		if (cat === 'cotizacion') submitCotizacion(form);
		else submitPqrsf(form);
	}

	document.addEventListener('DOMContentLoaded', function () {
		if (!document.getElementById('contact-modal')) {
			document.body.insertAdjacentHTML('beforeend', modalHTML);
		}
		var form = document.getElementById('contact-form');
		if (form && !form.dataset.bound) {
			form.addEventListener('submit', handleSubmit);
			form.dataset.bound = '1';
		}
	});

	window.openContactModal = function () {
		document.getElementById('contact-modal').style.display = 'block';
	};

	window.closeContactModal = function () {
		document.getElementById('contact-modal').style.display = 'none';
	};

	window.changeFormFields = function () {
		var cat = document.getElementById('categoria').value;
		document.getElementById('cotizacion-fields').style.display = cat === 'cotizacion' ? 'block' : 'none';
		document.getElementById('pqrs-fields').style.display = cat === 'pqrs' ? 'block' : 'none';
	};

	window.addEventListener('click', function (event) {
		var modal = document.getElementById('contact-modal');
		if (modal && event.target === modal) {
			modal.style.display = 'none';
		}
	});
})();
