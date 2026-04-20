import os, glob, re

base = r'c:\Users\Diego\Desktop\Pagina_Ademincol'
files = glob.glob(os.path.join(base, '*.html')) + glob.glob(os.path.join(base, 'Servicios', '*.html'))

pattern = re.compile(r'\s*<div class="social-icons">.*?</div>', re.DOTALL)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = re.sub(pattern, '', content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Removed icons from {os.path.basename(f)}")

print('All social icons removed from headers!')
