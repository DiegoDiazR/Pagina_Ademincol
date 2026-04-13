(function () {
	if (window.__contactModalInit) return;
	window.__contactModalInit = true;

	var modalHTML = [
		'<div id="contact-modal" class="modal">',
		'	<div class="modal-content">',
		'		<span class="close" onclick="closeContactModal()">&times;</span>',
		'		<h2>Cont\u00e1ctenos</h2>',
		'		<form id="contact-form">',
		'			<div class="form-group">',
		'				<label for="categoria">Categor\u00eda:</label>',
		'				<select id="categoria" onchange="changeFormFields()">',
		'					<option value="cotizacion">Cotizaci\u00f3n</option>',
		'					<option value="pqrs">PQRS</option>',
		'				</select>',
		'			</div>',
		'			<div id="cotizacion-fields" class="form-fields">',
		'				<div class="form-group">',
		'					<label for="alcance">Alcance del servicio:</label>',
		'					<input type="text" id="alcance" name="alcance">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="ubicacion">Ubicaci\u00f3n:</label>',
		'					<input type="text" id="ubicacion" name="ubicacion">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="tag">TAG del equipo (Si aplica):</label>',
		'					<input type="text" id="tag" name="tag">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="codigo">C\u00f3digo de evaluaci\u00f3n:</label>',
		'					<input type="text" id="codigo" name="codigo">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="tipo">Tipo de entregable:</label>',
		'					<input type="text" id="tipo" name="tipo">',
		'				</div>',
		'				<div class="form-group">',
		'					<label for="rut">RUT:</label>',
		'					<input type="text" id="rut" name="rut">',
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
		'					<select id="pqrs-tipo" name="pqrs-tipo">',
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
		'		</form>',
		'	</div>',
		'</div>'
	].join('\n');

	document.addEventListener('DOMContentLoaded', function () {
		if (!document.getElementById('contact-modal')) {
			document.body.insertAdjacentHTML('beforeend', modalHTML);
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
