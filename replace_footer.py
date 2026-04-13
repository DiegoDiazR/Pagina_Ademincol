import sys
import os

def replace_footer():
    target_file = 'index.html'
    with open(target_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    start_idx = -1
    end_idx = -1
    
    # Identify the Elementor footer block
    for i, line in enumerate(lines):
        if 'data-elementor-type="footer"' in line:
            start_idx = i
        if 'elementor-section-da43597' in line and start_idx != -1:
            # Reached the end of the footer sections
            # We want to catch the closing tags of the footer container
            for j in range(i, len(lines)):
                if '</div>' in lines[j]:
                    # Need to close two divs (elementor-section-wrap and elementor elementor-116)
                    end_idx = j + 3 # Adjusting to be safe
                    break
            break

    if start_idx == -1:
        print("Could not find footer block")
        return

    new_footer = [
        '\t<!-- MODERN COLORLIB FOOTER -->\n',
        '\t<footer class="footer-main">\n',
        '\t\t<!-- CTA Card Pill -->\n',
        '\t\t<div class="cta-card">\n',
        '\t\t\t<div class="cta-card-content">\n',
        '\t\t\t\t<h3>¿Listo para su próximo proyecto?</h3>\n',
        '\t\t\t\t<p>Garantizamos la integridad de sus activos con tecnología de punta.</p>\n',
        '\t\t\t</div>\n',
        '\t\t\t<a href="contactenos.html" class="cta-btn">Cotizar Servicio</a>\n',
        '\t\t</div>\n',
        '\n',
        '\t\t<div class="footer-grid">\n',
        '\t\t\t<!-- Column 1: Brand -->\n',
        '\t\t\t<div class="footer-col" style="margin-top: 20px;">\n',
        '\t\t\t\t<h4 style="color: #fff; font-size: 1.5rem; letter-spacing: 2px;">ADEMINCOL</h4>\n',
        '\t\t\t\t<p style="margin-top: 15px;">Líderes en inspección industrial y mantenimiento predictivo. Soluciones integrales para la seguridad y eficiencia de sus operaciones.</p>\n',
        '\t\t\t\t<div class="footer-social" style="margin-top: 25px;">\n',
        '\t\t\t\t\t<a href="https://www.linkedin.com/company/ademincol-sa/" target="_blank" class="social-circle"><i class="fab fa-linkedin-in"></i></a>\n',
        '\t\t\t\t\t<a href="https://www.facebook.com/ademincol2017" target="_blank" class="social-circle"><i class="fab fa-facebook-f"></i></a>\n',
        '\t\t\t\t\t<a href="https://api.whatsapp.com/send?phone=573203271240" target="_blank" class="social-circle"><i class="fab fa-whatsapp"></i></a>\n',
        '\t\t\t\t</div>\n',
        '\t\t\t</div>\n',
        '\n',
        '\t\t\t<!-- Column 2: Servicios -->\n',
        '\t\t\t<div class="footer-col">\n',
        '\t\t\t\t<h4>Servicios</h4>\n',
        '\t\t\t\t<ul class="footer-links" style="list-style: none; padding: 0;">\n',
        '\t\t\t\t\t<li><a href="servicios.html">Ensayos No Destructivos</a></li>\n',
        '\t\t\t\t\t<li><a href="servicios.html">Mantenimiento Predictivo</a></li>\n',
        '\t\t\t\t\t<li><a href="servicios.html">Integridad de Activos</a></li>\n',
        '\t\t\t\t\t<li><a href="servicios.html">Ingeniería y Consultoría</a></li>\n',
        '\t\t\t\t</ul>\n',
        '\t\t\t</div>\n',
        '\n',
        '\t\t\t<!-- Column 3: Empresa -->\n',
        '\t\t\t<div class="footer-col">\n',
        '\t\t\t\t<h4>Empresa</h4>\n',
        '\t\t\t\t<ul class="footer-links" style="list-style: none; padding: 0;">\n',
        '\t\t\t\t\t<li><a href="index.html">Inicio</a></li>\n',
        '\t\t\t\t\t<li><a href="nuestra-empresa.html">Nuestra Empresa</a></li>\n',
        '\t\t\t\t\t<li><a href="contactenos.html">Sostenibilidad</a></li>\n',
        '\t\t\t\t\t<li><a href="contactenos.html">Preguntas Frecuentes</a></li>\n',
        '\t\t\t\t</ul>\n',
        '\t\t\t</div>\n',
        '\n',
        '\t\t\t<!-- Column 4: Contacto Fast-Form -->\n',
        '\t\t\t<div class="footer-col">\n',
        '\t\t\t\t<h4>Contacto Rápido</h4>\n',
        '\t\t\t\t<form class="footer-mini-form" style="display: flex; flex-direction: column; gap: 10px;">\n',
        '\t\t\t\t\t<input type="text" placeholder="Nombre" style="background: #222; border: 1px solid #333; padding: 10px; color: #fff; border-radius: 4px;">\n',
        '\t\t\t\t\t<input type="email" placeholder="Correo" style="background: #222; border: 1px solid #333; padding: 10px; color: #fff; border-radius: 4px;">\n',
        '\t\t\t\t\t<button type="submit" style="background: #cf2e2e; color: #fff; border: none; padding: 10px; font-weight: 700; cursor: pointer; border-radius: 4px;">ENVIAR</button>\n',
        '\t\t\t\t</form>\n',
        '\t\t\t\t<p style="font-size: 0.9rem; margin-top: 15px;"><i class="fas fa-phone-alt" style="margin-right: 5px; color: #cf2e2e;"></i> +57 320 327 1240</p>\n',
        '\t\t\t</div>\n',
        '\n',
        '\t\t</div>\n',
        '\n',
        '\t\t<div class="footer-bottom">\n',
        '\t\t\t<div class="copyright">\n',
        '\t\t\t\t<p>Copyright ©2024 Todos los derechos reservados | ADEMINCOL S.A.</p>\n',
        '\t\t\t</div>\n',
        '\t\t\t<div class="footer-bottom-links">\n',
        '\t\t\t\t<a href="#">Términos y Condiciones</a>\n',
        '\t\t\t\t<a href="#">Sitemap</a>\n',
        '\t\t\t</div>\n',
        '\t\t</div>\n',
        '\t</footer>\n'
    ]

    final_content = lines[:start_idx] + new_footer + lines[end_idx:]
    with open(target_file, 'w', encoding='utf-8') as f:
        f.writelines(final_content)
    print("Footer replaced successfully")

if __name__ == '__main__':
    replace_footer()
