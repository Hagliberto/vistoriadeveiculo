"""Verificações estruturais sem bibliotecas extras: python tests/test_static.py"""
import json
import re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class HTMLAudit(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[];self.files=[];self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('script','link'):
            if a.get('src'): self.files.append(a['src'])
            if a.get('href'): self.files.append(a['href'])
        if tag=='img' and a.get('src'): self.images.append(a['src'])
parser=HTMLAudit()
html=(ROOT/'index.html').read_text(encoding='utf-8')
js=(ROOT/'assets/app.js').read_text(encoding='utf-8')
css=(ROOT/'assets/print-and-custom.css').read_text(encoding='utf-8')
parser.feed(html)
assert len(parser.ids)==len(set(parser.ids)), 'IDs duplicados no HTML'
assert '<html lang="pt-BR">' in html
assert 'maximum-scale=1.0' not in html, 'Zoom mobile bloqueado'
assert 'https://' not in html and 'http://' not in html.replace('http://www.w3.org/2000/svg',''), 'Há CDN externa no HTML'
assert 'cdn.' not in js
assert 'window.alert(' not in js and 'window.confirm(' not in js
for src in parser.files:
    if src and not src.startswith(('data:','http')) and not src.startswith('#'):
        assert (ROOT/src).exists(), f'Recurso inexistente: {src}'
manifest=json.loads((ROOT/'manifest.webmanifest').read_text())
for icon in manifest['icons']: assert (ROOT/icon['src']).exists()
assert manifest['display']=='standalone'
sw=(ROOT/'service-worker.js').read_text()
for name in ('index.html','assets/app.css','assets/icons.js','assets/app.js','assets/print-and-custom.css','manifest.webmanifest'):
    assert name in sw, f'Recurso PWA não cacheado: {name}'
assert re.search(r'@page\s*\{[^}]*size:\s*A4 portrait',css)
for selector in ('.expander-header','#exp-croqui','#exp-assinaturas','#print-official-header','[id^="row-"]','.sig-print-img','print-photo-card'):
    assert selector in css, f'Regra de impressão ausente: {selector}'
for key in ('vistoria_veicular_pwa_v2','vistoria_veicular_pwa_v3','indexedDB','prepareAndPrint','normalizeState','getAllAttachedPhotos'):
    assert key in js, f'Compatibilidade ausente: {key}'
assert len(set(re.findall(r'(?<=id=")[^\"]+(?=")',html))) == len(re.findall(r'(?<=id=")[^\"]+(?=")',html))
# Regressões de layout e de histórico corrigidas na versão 1.2.
assert 'id="appbar-actions"' in html and html.index('id="appbar-actions"') < html.index('</header>')
assert 'bg-white p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl' not in html, 'A antiga barra em minicard voltou'
assert 'id="history-total-count"' in html
assert all(key in js for key in ('markCategoryAsConforme','generateHistoryEntryId','normalizeHistoryEntry','enqueueHistoryMutation','syncModalLayers'))
assert 'category-mark-ok' in js and 'category-mark-ok' in css
assert '#confirm-modal { z-index: 110' in css, 'Confirmação deve ficar acima dos outros diálogos'
assert 'history.inert = confirmationVisible' in js
assert 'Each clique' not in html
print('OK: HTML sem IDs duplicados, recursos locais, PWA, A4, acessibilidade, migração e layout 1.2.')
