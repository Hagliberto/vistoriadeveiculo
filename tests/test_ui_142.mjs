import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/print-and-custom.css', import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../assets/app.js', import.meta.url),'utf8');
const pos=id=>html.indexOf(`id="${id}"`);
assert.ok(pos('exp-identificacao') < pos('exp-croqui'));
assert.ok(pos('exp-croqui') < pos('checklist-sections'));
assert.ok(pos('checklist-sections') < pos('exp-assinaturas'));
for(const kind of ['sidebar-link','dock-btn']) {
  const first=html.indexOf(`class="${kind}`);
  const last=kind==='sidebar-link'?html.indexOf('</nav>',first):html.indexOf('</nav>',first);
  const section=html.slice(first,last);
  assert.ok(section.indexOf('data-go="exp-identificacao"') < section.indexOf('data-go="exp-croqui"'));
  assert.ok(section.indexOf('data-go="exp-croqui"') < section.indexOf('data-go="checklist-sections"'));
}
assert.ok(html.includes('sidebar-group-heading'));
assert.ok(js.includes('function syncWorkspaceNavigation()'));
assert.ok(js.includes("opened.closest('#checklist-sections')"));
assert.ok(css.includes('body.sidebar-expanded .sidebar-group-heading'));
assert.ok(css.includes('@media print'));
console.log('OK: ordem Dados → Croqui → Checklist, sidebar contextual, navegação sincronizada.');
