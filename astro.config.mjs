// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://ademincol.com.co',
	trailingSlash: 'ignore',
	build: {
		format: 'file', // genera nuestra-empresa.html (no nuestra-empresa/index.html)
	},
	server: {
		port: 4321,
	},
	integrations: [
		sitemap({
			// Reescribe URLs para que terminen en .html (excepto la home) y
			// asigna prioridades que replican el sitemap manual previo:
			//   /                                  → 1.0
			//   /Servicios/servicios.html          → 0.9
			//   /nuestra-empresa.html              → 0.8
			//   /sostenibilidad.html               → 0.8
			//   /contactenos.html                  → 0.8
			//   /Servicios/servicio-*.html         → 0.7
			//   resto                              → 0.5
			serialize(item) {
				const url = new URL(item.url);
				let path = url.pathname;

				// Astro genera el sitemap sin extensión; añadimos .html para que
				// coincida con los archivos servidos por nginx (build.format: 'file').
				const isHome = path === '/' || path === '/index' || path === '/index.html';
				if (!isHome && !path.endsWith('.html') && !path.endsWith('/')) {
					path = path + '.html';
					url.pathname = path;
					item.url = url.toString();
				}

				if (isHome) {
					item.priority = 1.0;
				} else if (path === '/Servicios/servicios.html') {
					item.priority = 0.9;
				} else if (path.startsWith('/Servicios/servicio-')) {
					item.priority = 0.7;
				} else if (
					path === '/nuestra-empresa.html' ||
					path === '/sostenibilidad.html' ||
					path === '/contactenos.html'
				) {
					item.priority = 0.8;
				} else {
					item.priority = 0.5;
				}
				item.changefreq = 'monthly';
				return item;
			},
		}),
	],
});
