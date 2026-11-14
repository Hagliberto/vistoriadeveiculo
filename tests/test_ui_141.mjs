import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/print-and-custom.css', import.meta.url),'utf8');
assert.ok(!html.includes('class="dock-credit-pill"'));
assert.ok(html.includes('class="settings-developer-pill"'));
assert.match(css, /@media screen and \(max-width: 599px\) \{\s*#workspace-heading \{ display: none !important;/);
assert.ok(html.includes('id="workspace-heading"'));
console.log('OK: creditos apenas nas configuracoes e card oculto no mobile.');
