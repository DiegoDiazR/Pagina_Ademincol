(function () {
	'use strict';
	if (window.__adWhatsAppInit) return;
	window.__adWhatsAppInit = true;

	var PHONE = '573114850295';
	var MSG = 'Hola, me gustaría más información sobre los servicios de Ademincol.';
	var HREF = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(MSG);

	var css = [
		'.ad-wa-btn{',
		'  position:fixed;bottom:24px;right:24px;z-index:9999;',
		'  display:inline-flex;align-items:center;',
		'  height:56px;width:56px;',
		'  background:#25D366;color:#fff;',
		'  border-radius:28px;text-decoration:none;',
		'  box-shadow:0 6px 20px rgba(0,0,0,.18);',
		'  overflow:hidden;font-family:inherit;',
		'  transition:width .35s cubic-bezier(.2,.7,.2,1),background-color .25s,box-shadow .25s;',
		'}',
		'.ad-wa-btn:hover,.ad-wa-btn:focus-visible{',
		'  width:235px;background:#128C7E;',
		'  box-shadow:0 8px 24px rgba(0,0,0,.28);outline:none;',
		'}',
		'.ad-wa-icon{',
		'  flex:0 0 56px;width:56px;height:56px;',
		'  display:flex;align-items:center;justify-content:center;',
		'  font-size:30px;line-height:1;',
		'}',
		'.ad-wa-label{',
		'  white-space:nowrap;font-weight:600;font-size:15px;',
		'  padding-right:22px;color:#fff;',
		'  opacity:0;transform:translateX(-8px);',
		'  transition:opacity .25s ease .05s,transform .25s ease .05s;',
		'}',
		'.ad-wa-btn:hover .ad-wa-label,',
		'.ad-wa-btn:focus-visible .ad-wa-label{opacity:1;transform:translateX(0)}',
		'.ad-wa-btn:active{transform:scale(.97)}',
		'@media (max-width:720px){',
		'  .ad-wa-btn{bottom:16px;right:16px}',
		'  .ad-wa-btn:hover,.ad-wa-btn:focus-visible{width:56px;background:#25D366}',
		'  .ad-wa-btn:hover .ad-wa-label,',
		'  .ad-wa-btn:focus-visible .ad-wa-label{opacity:0}',
		'}',
		'@media (prefers-reduced-motion:reduce){',
		'  .ad-wa-btn,.ad-wa-label{transition:none}',
		'}'
	].join('');

	function inject() {
		if (document.getElementById('ad-wa-floating-btn')) return;

		var style = document.createElement('style');
		style.id = 'ad-wa-floating-styles';
		style.textContent = css;
		document.head.appendChild(style);

		var a = document.createElement('a');
		a.id = 'ad-wa-floating-btn';
		a.className = 'ad-wa-btn';
		a.href = HREF;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.setAttribute('aria-label', 'Chatear por WhatsApp con Ademincol');
		a.innerHTML =
			'<span class="ad-wa-icon" aria-hidden="true"><i class="fab fa-whatsapp"></i></span>' +
			'<span class="ad-wa-label">Chatea con nosotros</span>';
		document.body.appendChild(a);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', inject);
	} else {
		inject();
	}
})();
