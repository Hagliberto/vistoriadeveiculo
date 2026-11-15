import fs from 'node:fs';
import assert from 'node:assert/strict';
const exp=fs.readFileSync(new URL('../assets/export.js',import.meta.url),'utf8');
assert.ok(!exp.includes('generatePNG()'));
assert.ok(!exp.includes('generatePDF()'));
assert.ok(!exp.includes('encodeImagePDF('));
assert.ok(exp.includes('validateAndPrint()'));
console.log('OK: PDF canônico, sem PNG nem PDF raster alternativo.');
