// Testes unitários sem pacotes externos: node tests/test_state.mjs
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app.js', import.meta.url),'utf8');
const ctx={
  console, Date, Math, Promise, setTimeout, clearTimeout, Uint32Array,
  document:{addEventListener(){}},
  navigator:{},
  crypto:{getRandomValues(a){a[0]=12345;return a;}}
};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'app.js'});
const api=(code)=>vm.runInContext(code,ctx);
assert.equal(api('CHECKLIST_SCHEMA.length'),6);
assert.equal(api('CHECKLIST_SCHEMA.reduce((sum, section)=>sum+section.items.length,0)'),47);
assert.equal(api('Object.keys(createDefaultState().signatures).length'),2);
assert.match(api('createDefaultState().meta.id'),/^VST-\d{2}\d{7}-\d{5}$/);
assert.equal(api("formatPlateMask('abc-1d23')"),'ABC-1D23');
assert.equal(api("formatPlateMask('abc 1234')"),'ABC-1234');
assert.equal(api("formatKmMask('12000')"),'12.000');
const sample={
  meta:{id:'VST-260000001-12345',gps:{lat:-5.79,lng:-35.2}},
  vehicle:{placa:'ABC1D23',tipo:'Entrada',data:'2026-11-14',combustivel:'Cheio',modelo:'Modelo & Versão'},
  checklist:{doc_obrigatorios_0:{status:'nok',obs:'Quase & pronto',photo:null}},
  pins:[{id:101,x:50,y:55,type:'Risco',desc:'Porta esquerda'}],
  signatures:{'sig-vistoriador':null,'sig-motorista':null}
};
ctx.testSample=sample;
const normalized=api('normalizeState(testSample)');
assert.equal(normalized.vehicle.placa,'ABC1D23');
assert.equal(normalized.checklist.doc_obrigatorios_0.status,'nok');
assert.equal(Object.keys(normalized.checklist).length,47);
assert.equal(normalized.pins.length,1);
assert.equal(normalized.meta.gps.lat,-5.79);
assert.equal(api("safeText('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
ctx.badState={vehicle:{tipo:'INVALIDO',combustivel:'DESCONHECIDO'},pins:[{id:2,x:999,y:-200,type:'errado'}]};
const sanitized=api('normalizeState(badState)');
assert.equal(sanitized.vehicle.tipo,'Entrada');
assert.equal(sanitized.vehicle.combustivel,'1/2');
assert.equal(sanitized.pins[0].x,96);
assert.equal(sanitized.pins[0].y,6);
assert.equal(sanitized.pins[0].type,'Risco');
console.log('OK: schema (47 itens), máscaras, migração, validações de dados, segurança de HTML, croqui.');
