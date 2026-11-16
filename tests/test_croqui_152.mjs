import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html=read('index.html'), css=read('assets/print-and-custom.css'), js=read('assets/app.js');
for (const view of ['top','left','front','right','rear']) {
  assert.match(html, new RegExp(`data-view-card="${view}"`));
  assert.match(html, new RegExp(`data-croqui-view="${view}"`));
}
assert.match(css, /\.croqui-views-grid > \.croqui-view-card\s*\{display:none !important/);
assert.match(css, /\.croqui-view-card\.is-active-view\s*\{display:block !important/);
assert.match(css, /@media print\s*\{\s*\.croqui-views-grid > \.croqui-view-card\s*\{display:block !important/);
assert.match(js, /function stepCroquiView\(direction = 1\)/);
assert.match(js, /surface\.addEventListener\('pointerup'/);
assert.match(js, /const stage = surface\.querySelector\('\.croqui-zoom-stage'\)/);
assert.match(html, /name="mobile-web-app-capable"/);
assert.ok((html.match(/class="croqui-drawing/g)||[]).length === 9, 'nove vistas da prancha de referência');
assert.equal(JSON.parse(read('version.json')).version,'1.5.10');
console.log('OK: uma vista por vez, navegação gestual, nove vistas da prancha e todas as vistas no PDF.');
