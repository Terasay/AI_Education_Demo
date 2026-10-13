from pathlib import Path
import zipfile
import base64
import json

root = Path(__file__).resolve().parent
src = root / 'src'
html = (src / 'index.html').read_text(encoding='utf-8')
for style in ['app.css', 'orbit.css']:
    css = (src / style).read_text(encoding='utf-8')
    if style == 'orbit.css':
        font = base64.b64encode((src / 'assets/Onest.ttf').read_bytes()).decode('ascii')
        css = css.replace('assets/Onest.ttf', 'data:font/ttf;base64,' + font)
    html = html.replace(f'<link rel="stylesheet" href="{style}">', '<style>\n' + css + '\n</style>')
for script in ['home.js', 'motion.js', 'app.js']:
    js = (src / script).read_text(encoding='utf-8')
    html = html.replace(f'<script src="{script}"></script>', '<script>\n' + js.replace('</script', '<\\/script') + '\n</script>')
license_text = (src / 'assets/OFL-Onest.txt').read_text(encoding='utf-8')
license_data = json.dumps({'font': 'Onest', 'license': license_text}, ensure_ascii=False).replace('<', '\\u003c')
html = html.replace('<head>', '<head>\n<script type="application/json" id="font-license">' + license_data + '</script>')
(root / 'index.html').write_text(html, encoding='utf-8')
with zipfile.ZipFile(root / 'ORBIT-demo.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(root / 'index.html', 'ORBIT-demo/index.html')
    archive.write(src / 'assets/OFL-Onest.txt', 'ORBIT-demo/OFL-Onest.txt')
print(f'Portable HTML: {(root / "index.html").stat().st_size:,} bytes')
print(f'ZIP: {(root / "ORBIT-demo.zip").stat().st_size:,} bytes')
