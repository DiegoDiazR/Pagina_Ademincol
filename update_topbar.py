import os, glob, re
base = r'c:\Users\Diego\Desktop\Pagina_Ademincol'
files = glob.glob(os.path.join(base, '*.html')) + glob.glob(os.path.join(base, 'Servicios', '*.html'))

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We will use regex to find the .social-icons div block and inject the market-data right after it
    pattern = r'(<div class="social-icons">.*?</div>)'
    replacement = r'\1\n\t\t\t<div class="market-data">\n\t\t\t\t<span id="market-usd" title="TRM Dólar a COP"><i class="fas fa-dollar-sign"></i> USD: <strong id="val-usd">---</strong></span>\n\t\t\t\t<span id="market-oil" title="Petróleo BRENT"><i class="fas fa-gas-pump"></i> BRENT: <strong id="val-oil">---</strong></span>\n\t\t\t</div>'
    
    if 'class="market-data"' not in content:
        content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
print('HTML updated!')
