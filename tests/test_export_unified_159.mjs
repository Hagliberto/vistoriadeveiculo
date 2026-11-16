import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const html = read('index.html'), exp = read('assets/export.js');
const actions = [...html.matchAll(/data-export-format="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(actions, ['pdf']);
assert.match(html, /Gerar PDF \/ Imprimir/);
assert.match(html, /Salvar como PDF ou sua impressora/);
assert.ok(!html.includes('data-export-format="png"'));
assert.ok(!html.includes('data-export-format="print"'));
assert.ok(exp.includes('applyPrintSelection()'));
assert.ok(exp.includes('validateAndPrint()'));
assert.ok(exp.includes('exportButton?.addEventListener'));
for (const id of ['export-include-croqui', 'export-include-checklist', 'export-include-photos', 'export-include-signatures', 'export-only-checked']) {
  assert.ok(html.includes(`id="${id}"`), id);
}
assert.equal(JSON.parse(read('version.json')).version, '1.5.10');
console.log('OK: botão único de PDF/impressão, seleções preservadas e versão v1.5.10.');
