import assert from 'node:assert/strict';
import fs from 'node:fs';
const r = file => fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const html=r('index.html'), css=r('assets/print-and-custom.css'), js=r('assets/app.js');
assert.match(html,/id="croqui-360-console" class="croqui-toolbar no-print"/);
assert.match(html,/id="btn-croqui-prev-view"/);
assert.match(html,/id="btn-croqui-next-view"/);
assert.match(html,/id="croqui-active-view-label"/);
assert.match(html,/id="croqui-zoom-toolbar"/);
assert.ok(!html.includes('Zoom do croqui</span>'),'zoom deve ter apenas ícones');
assert.ok(!html.includes('<span class="sr-only">Visão'),'rótulos de navegação sobrepostos removidos');
assert.match(css,/#croqui-360-nav\.croqui-hidden-dots \{display:none !important\}/);
assert.match(css,/\.croqui-toolbar \.croqui-view-center/);
assert.match(css,/\.croqui-views-grid > \.croqui-view-card\.is-active-view\s*\{display:block !important/);
assert.match(css,/@media print\s*\{\s*\.croqui-views-grid > \.croqui-view-card\s*\{display:block !important/);
assert.match(js,/function stepCroquiView\(direction = 1\)/);
for (const view of ['front','front-left','left','rear-left','rear','rear-right','right','front-right','top']) {
  const block=html.match(new RegExp(`data-view-card="${view}"[\\s\\S]*?assets/croqui/${view}\\.webp`));
  assert.ok(block,`vista ${view} deve conter recorte técnico da prancha`);
}
assert.equal(JSON.parse(r('version.json')).version,'1.5.6');
assert.match(r('service-worker.js'),/shell-v1\.5\.6/);
console.log('OK: interface mínima, nove vistas técnicas, navegabilidade e impressão v1.5.6.');
