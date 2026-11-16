import fs from 'node:fs';
import assert from 'node:assert/strict';
const r=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=r('index.html'), js=r('assets/export.js'), css=r('assets/print-and-custom.css');
for(const id of ['export-include-croqui','export-include-checklist','export-include-photos','export-include-signatures','export-only-checked','export-checklist-categories']) {
  assert.ok(html.includes(`id="${id}"`),`${id} ausente`);
}
assert.match(html,/Identificação do veículo e observações gerais serão sempre incluídas/);
assert.ok(!html.includes('data-export-format="png"'));
for(const section of ['croqui','checklist','signatures','photos']) {
 assert.ok(js.includes(`print-omit-${section}`));
 assert.ok(css.includes(`print-omit-${section}`));
}
for(const token of ['print-exclude-category','print-exclude-row','exp-sec-','row-','onlyChecked','[\'ok\',\'nok\',\'na\']']) assert.ok(js.includes(token),`falta ${token}`);
assert.ok(!js.includes('appState.checklist[') || !/appState\.checklist\[[^\]]+\]\s*=/.test(js));
assert.match(css,/#content-exp-assinaturas > \.grid/);
assert.equal(JSON.parse(r('version.json')).version,'1.5.9');
console.log('OK: seções opcionais, observações obrigatórias, checklist individual, sem PNG.');
