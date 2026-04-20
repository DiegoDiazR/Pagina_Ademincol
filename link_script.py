import os, glob

base = r'c:\Users\Diego\Desktop\Pagina_Ademincol'
files = glob.glob(os.path.join(base, '*.html')) + glob.glob(os.path.join(base, 'Servicios', '*.html'))

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if script is already injected
    if 'market-data.js' not in content:
        # If file is in root, src is js/...
        # If file is in Servicios, src is ../js/...
        prefix = 'js/' if 'Servicios' not in f else '../js/'
        script_tag = f'<script src="{prefix}market-data.js"></script>\n</body>'
        content = content.replace('</body>', script_tag)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
print('Script linked successfully')
