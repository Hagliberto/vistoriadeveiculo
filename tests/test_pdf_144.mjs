import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const exp=read('assets/export.js');
assert.ok(exp.includes('async function generatePNG()'), 'PNG deve permanecer');
assert.ok(!exp.includes('async function generatePDF()'), 'não pode haver gerador PDF alternativo');
assert.ok(!exp.includes('encodeImagePDF('), 'PDF raster não deve existir');
console.log('OK: PNG independente e PDF rasterizado alternativo removido.');
