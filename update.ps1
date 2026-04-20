 = 'c:\Users\Diego\Desktop\Pagina_Ademincol'
 = Get-ChildItem -Path  -Recurse -Filter *.html

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Regular expression to match the service-cta-section and everything inside it
    $pattern = '(?s)\s*<section class="service-cta-section">.*?</section>'
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, '')
    
    # Replace "Contáctenos" with "Solicitar Cotización" in the footer button
    $content = $content -replace 'class="footer-cta-btn">Contáctenos</a>', 'class="footer-cta-btn">Solicitar Cotización</a>'
    
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
}
Write-Output 'Updates complete.'
