import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/print-and-custom.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const version = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));

assert.equal(version.version, '1.5.10');
assert.match(sw, /shell-v1\.5\.10/);
assert.match(html, /class="header-brand /);
assert.match(html, /id="save-status-text"/);
assert.match(html, /id="badge-identificacao"/);
assert.match(html, /id="badge-croqui"/);
assert.match(html, /id="badge-assinaturas"/);
assert.match(css, /v1\.5\.10 — mobile/);
assert.match(css, /@media screen and \(max-width: 767px\)/);
assert.match(css, /\.header-inner\s*\{\s*display: grid !important/);
assert.match(css, /\.header-status\s*\{\s*grid-column: 1 \/ -1 !important/);
assert.match(css, /\.header-brand h1\s*\{[^}]*white-space: normal !important/s);
assert.match(css, /#checklist-sections \.category-header h2\s*,\s*#checklist-sections \.category-subtitle\s*\{[^}]*white-space: normal !important/s);
assert.match(css, /\.category-header-status span\[id\^="badge-sec-"\]\s*\{[^}]*grid-row: 2/s);
assert.match(css, /#checklist-sections \.category-mark-ok\s*\{[^}]*width: 44px/s);
assert.match(css, /@media screen and \(max-width: 370px\)/);
console.log('OK: mobile 1.5.10 — cabeçalhos legíveis, appbar em duas faixas, pills e ações sem cortes.');
