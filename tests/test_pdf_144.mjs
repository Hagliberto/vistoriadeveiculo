import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/export.js'),'utf8');
assert.ok(js.includes('async function generatePDF()'));
assert.ok(js.includes('async function generatePNG()'));
assert.ok(js.includes('const scale=Math.min(2'));
assert.ok(js.includes("new File([await encodeImagePDF(images)],filename('pdf'),{type:'application/pdf'})"));
assert.ok(js.includes('prebuiltPdf')&&js.includes('prebuiltPng'));
assert.ok(js.includes('await navigator.share({files:[file]'));
assert.ok(js.includes("if(error.name==='AbortError')"));
assert.ok(js.includes("const pageWidth=595.28, pageHeight=841.89"));
const begin=js.indexOf('    async function encodeImagePDF(images) {');
const end=js.indexOf('    async function execute(kind) {',begin);
const encode=vm.runInNewContext(`${js.slice(begin,end)}\n encodeImagePDF`,{TextEncoder,Uint8Array,Blob});
// JPEG mínimo válido de 1x1 pixel: teste do formato PDF multi-página e dos offsets.
const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUGB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAf8A/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9k=', 'base64');
const blob=await encode([{jpeg:new Blob([jpeg]),width:1,height:1},{jpeg:new Blob([jpeg]),width:1,height:1}]);
const pdf=Buffer.from(await blob.arrayBuffer());
assert.ok(pdf.subarray(0,8).toString().startsWith('%PDF-1.4'));
assert.ok(pdf.includes(Buffer.from('/Count 2')));
assert.ok(pdf.includes(Buffer.from('/Filter /DCTDecode')));
assert.ok(pdf.includes(Buffer.from('%%EOF')));
// Offsets no xref devem apontar exatamente para os objetos.
const content=pdf.toString('latin1');
const xrefStart=Number(content.match(/startxref\n(\d+)\n%%EOF/)[1]);
assert.equal(content.slice(xrefStart,xrefStart+4),'xref');
const xrefLines=content.slice(xrefStart).split('\n');
assert.equal(xrefLines[1],'0 9');
for(let i=1;i<9;i++) {
    const off=Number(xrefLines[i+2].slice(0,10));
    assert.ok(content.slice(off).startsWith(`${i} 0 obj`),`xref do objeto ${i}`);
}
console.log('OK: exportação 1.4.4, PDF A4 multi-página, JPEG incorporado e offsets xref.');
